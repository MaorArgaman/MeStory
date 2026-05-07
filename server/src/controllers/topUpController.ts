/**
 * Top-up Controller - one-time credit purchases. Uses the same PayPal
 * order flow as subscription upgrades, but credits the user's balance
 * (no role/subscription change).
 */

import { Response } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { supabaseAdmin } from '../config/supabase';
import { TOP_UP_PACKAGES, getTopUpById } from '../config/plans';
import { getPayPalConfigStatus } from '../config/validateEnv';
import { grantCredits } from '../services/creditService';

const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

let cachedToken: { token: string; expiresAt: Date } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > new Date()) return cachedToken.token;
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in - 60);
  cachedToken = { token: response.data.access_token, expiresAt };
  return response.data.access_token;
}

/**
 * GET /api/payments/topup/packages
 * List available top-up packages.
 */
export const listTopUpPackages = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ success: true, data: { packages: TOP_UP_PACKAGES } });
};

/**
 * POST /api/payments/topup/create-order
 * Body: { packageId: 'topup-200' | 'topup-600' | 'topup-1500' }
 */
export const createTopUpOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { packageId } = req.body;
  const pkg = getTopUpById(packageId);
  if (!pkg) {
    res.status(400).json({ success: false, error: 'Unknown top-up package' });
    return;
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Mock mode for local dev
  if (isMockEnabled && !isProduction) {
    const mockOrderId = `MOCK-TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await Transaction.create({
      userId: user.id,
      amount: pkg.priceUSD,
      currency: 'USD',
      plan: 'topup',
      status: 'pending',
      paymentMethod: 'mock',
      orderId: mockOrderId,
      description: `Top-up ${pkg.credits} credits`,
      metadata: { packageId: pkg.id, creditsToAdd: pkg.credits, kind: 'topup' },
    });
    res.status(200).json({
      success: true,
      data: {
        orderId: mockOrderId,
        amount: pkg.priceUSD,
        currency: 'USD',
        credits: pkg.credits,
        mockMode: true,
      },
    });
    return;
  }

  // Real PayPal
  const status = getPayPalConfigStatus();
  if (!status.configured) {
    res.status(503).json({
      success: false,
      error: 'Payment service is not configured. Please contact support.',
      ...(process.env.NODE_ENV !== 'production' && { debug: { reasons: status.reasons } }),
    });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: pkg.id,
          description: `MeStory Top-up - ${pkg.credits} credits`,
          custom_id: JSON.stringify({ userId: user.id, packageId: pkg.id, kind: 'topup' }),
          amount: { currency_code: 'USD', value: pkg.priceUSD.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: 'MeStory',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_URL}/payment/success?type=topup`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      },
    };

    const response = await axios.post(`${PAYPAL_BASE_URL}/v2/checkout/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    const paypalOrderId = response.data.id;
    await Transaction.create({
      userId: user.id,
      amount: pkg.priceUSD,
      currency: 'USD',
      plan: 'topup',
      status: 'pending',
      paymentMethod: 'paypal',
      orderId: paypalOrderId,
      description: `Top-up ${pkg.credits} credits`,
      metadata: {
        packageId: pkg.id,
        creditsToAdd: pkg.credits,
        kind: 'topup',
        paypalOrderStatus: response.data.status,
      },
    });

    const approvalLink = response.data.links?.find((l: any) => l.rel === 'approve');
    res.status(200).json({
      success: true,
      data: {
        orderId: paypalOrderId,
        amount: pkg.priceUSD,
        currency: 'USD',
        credits: pkg.credits,
        approvalUrl: approvalLink?.href,
      },
    });
  } catch (err: any) {
    console.error('[TopUp] create order error:', err.response?.data || err.message);
    res.status(502).json({ success: false, error: 'Failed to create top-up order' });
  }
};

/**
 * POST /api/payments/topup/capture-order
 * Body: { orderId }
 */
export const captureTopUpOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required' });
    return;
  }

  const transaction = await Transaction.findOne({ orderId });
  if (!transaction) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  if (transaction.userId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }
  if (transaction.status === 'completed') {
    res.status(400).json({ success: false, error: 'Already captured' });
    return;
  }
  if (transaction.metadata?.kind !== 'topup') {
    res.status(400).json({ success: false, error: 'Not a top-up transaction' });
    return;
  }

  const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const credits = transaction.metadata?.creditsToAdd || 0;

  if (isMockEnabled && !isProduction) {
    await grantCredits({
      userId: req.user.id,
      amount: credits,
      reason: 'topup-mock',
      metadata: { orderId, packageId: transaction.metadata?.packageId },
    });
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'completed',
        paypal_capture_id: `MOCK-TOPUP-${Date.now()}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    const updatedUser = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Top-up complete (mock mode)',
      data: {
        orderId,
        creditsAdded: credits,
        newBalance: updatedUser?.credits ?? 0,
        mockMode: true,
      },
    });
    return;
  }

  // Real PayPal capture
  const status = getPayPalConfigStatus();
  if (!status.configured) {
    res.status(503).json({ success: false, error: 'Payment service not configured' });
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const captureResponse = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    if (captureResponse.data.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: `Capture failed with status ${captureResponse.data.status}`,
      });
      return;
    }

    const captureId =
      captureResponse.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    await grantCredits({
      userId: req.user.id,
      amount: credits,
      reason: 'topup',
      metadata: { orderId, captureId, packageId: transaction.metadata?.packageId },
    });

    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'completed',
        paypal_capture_id: captureId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    const updatedUser = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Top-up complete',
      data: {
        orderId,
        captureId,
        creditsAdded: credits,
        newBalance: updatedUser?.credits ?? 0,
      },
    });
  } catch (err: any) {
    console.error('[TopUp] capture error:', err.response?.data || err.message);
    res.status(502).json({ success: false, error: 'Failed to capture top-up' });
  }
};
