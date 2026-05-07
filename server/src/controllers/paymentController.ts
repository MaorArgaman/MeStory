import { Response } from 'express';
import axios from 'axios';
import { User, UserRole } from '../models/User';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { notifyPaymentReceived, notifySubscriptionChange } from '../services/notificationService';
import {
  sendSubscriptionUpgradeEmail,
  sendPayPalReceiptEmail,
} from '../services/emailService';
import { supabaseAdmin } from '../config/supabase';
import { PLANS as PLAN_CONFIG, PlanId } from '../config/plans';
import { getPayPalConfigStatus } from '../config/validateEnv';

// PayPal API Configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Token cache for PayPal access tokens
let cachedToken: { token: string; expiresAt: Date } | null = null;

/**
 * Get PayPal access token (with caching)
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Cache token with expiration (60s buffer)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in - 60);
    cachedToken = {
      token: response.data.access_token,
      expiresAt,
    };

    return response.data.access_token;
  } catch (error: any) {
    console.error('PayPal token error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
}

/**
 * Check if PayPal is configured for production use
 */
function isPayPalConfigured(): boolean {
  return !!(
    PAYPAL_CLIENT_ID &&
    PAYPAL_CLIENT_SECRET &&
    PAYPAL_CLIENT_ID !== 'your-paypal-client-id' &&
    PAYPAL_CLIENT_SECRET !== 'your-paypal-client-secret'
  );
}

/**
 * Payment Controller
 * Handles subscription upgrades with PayPal integration and mock mode for development
 */

// Plan config sourced from server/src/config/plans.ts. Never duplicate
// pricing/credit values in this file. Adapter shape kept compact so the
// rest of the controller can read .tier/.price/.credits as before.
const PLANS = {
  free: {
    tier: PLAN_CONFIG.free.tier,
    price: PLAN_CONFIG.free.priceUSD,
    credits: PLAN_CONFIG.free.monthlyCredits,
  },
  standard: {
    tier: PLAN_CONFIG.standard.tier,
    price: PLAN_CONFIG.standard.priceUSD,
    credits: PLAN_CONFIG.standard.monthlyCredits,
  },
  premium: {
    tier: PLAN_CONFIG.premium.tier,
    price: PLAN_CONFIG.premium.priceUSD,
    credits: PLAN_CONFIG.premium.monthlyCredits,
  },
} as const;

/**
 * Create a payment order
 * POST /api/payments/create-order
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { plan } = req.body;

    // Validate plan
    if (!plan || !['standard', 'premium'].includes(plan.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be "standard" or "premium"',
      });
      return;
    }

    const planType = plan.toLowerCase() as 'standard' | 'premium';
    const planDetails = PLANS[planType];

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if user is already on this plan or higher
    if (
      (planType === 'standard' && (user.role === UserRole.STANDARD || user.role === UserRole.PREMIUM)) ||
      (planType === 'premium' && user.role === UserRole.PREMIUM)
    ) {
      res.status(400).json({
        success: false,
        error: `You are already on the ${planType} plan or higher`,
      });
      return;
    }

    // SEC-001 FIX: Mock payment only when explicitly enabled AND not in production
    const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isMockEnabled && !isProduction) {
      const mockOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`💳 [MOCK MODE] Created order for ${planType} plan ($${planDetails.price})`);
      console.log(`💳 [MOCK ORDER ID] ${mockOrderId}`);

      // Create pending transaction
      const transaction = await Transaction.create({
        userId: user.id,
        amount: planDetails.price,
        currency: 'USD',
        plan: planType,
        status: 'pending',
        paymentMethod: 'mock',
        orderId: mockOrderId,
        description: `Mock ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Upgrade`,
        metadata: {
          previousPlan: user.role,
          creditsToAdd: planDetails.credits,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          orderId: mockOrderId,
          amount: planDetails.price,
          currency: 'USD',
          plan: planType,
          mockMode: true,
        },
      });
      return;
    }

    // PRODUCTION MODE: Real PayPal integration
    if (!isPayPalConfigured()) {
      const status = getPayPalConfigStatus();
      console.error('[PayPal] Not configured. Reasons:', status.reasons.join('; '));
      res.status(503).json({
        success: false,
        error: 'Payment service is not configured. Please contact support.',
        // Include actionable detail in non-production for the developer.
        ...(process.env.NODE_ENV !== 'production' && {
          debug: {
            reasons: status.reasons,
            hint: 'Set PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_MODE in .env. Or set ENABLE_MOCK_PAYMENTS=true with NODE_ENV=development to use mock mode.',
          },
        }),
      });
      return;
    }

    try {
      const accessToken = await getAccessToken();

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `subscription-${planType}`,
            description: `MeStory ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Subscription`,
            custom_id: JSON.stringify({
              userId: user.id,
              plan: planType,
              previousPlan: user.role,
            }),
            amount: {
              currency_code: 'USD',
              value: planDetails.price.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'MeStory',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${process.env.CLIENT_URL}/payment/success`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
        },
      };

      const response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders`,
        orderPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const paypalOrderId = response.data.id;

      // Create pending transaction
      await Transaction.create({
        userId: user.id,
        amount: planDetails.price,
        currency: 'USD',
        plan: planType,
        status: 'pending',
        paymentMethod: 'paypal',
        orderId: paypalOrderId,
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Upgrade`,
        metadata: {
          previousPlan: user.role,
          creditsToAdd: planDetails.credits,
          paypalOrderStatus: response.data.status,
        },
      });

      // Find approval URL
      const approvalLink = response.data.links?.find((link: any) => link.rel === 'approve');

      console.log(`[PayPal] Created order ${paypalOrderId} for ${planType} plan ($${planDetails.price})`);

      res.status(200).json({
        success: true,
        data: {
          orderId: paypalOrderId,
          amount: planDetails.price,
          currency: 'USD',
          plan: planType,
          approvalUrl: approvalLink?.href,
        },
      });
    } catch (paypalError: any) {
      console.error('PayPal create order error:', paypalError.response?.data || paypalError.message);

      // Parse PayPal error for user-friendly message
      const paypalErrorDetails = paypalError.response?.data?.details?.[0];
      const errorMessage = paypalErrorDetails?.description ||
                          paypalError.response?.data?.message ||
                          'Failed to create PayPal order. Please try again.';

      res.status(502).json({
        success: false,
        error: errorMessage,
        code: paypalError.response?.data?.name || 'PAYPAL_ERROR',
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
    });
  }
};

/**
 * Capture/complete a payment order
 * POST /api/payments/capture-order
 */
export const captureOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
      return;
    }

    // Find the transaction
    const transaction = await Transaction.findOne({ orderId });
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
      return;
    }

    // Verify transaction belongs to user
    if (transaction.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized access to this transaction',
      });
      return;
    }

    // Check if already processed
    if (transaction.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Transaction already completed',
      });
      return;
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // SEC-001 FIX: Mock capture only when explicitly enabled AND not in production
    const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isMockEnabled && !isProduction) {
      console.log(`💳 [MOCK MODE] Capturing order ${orderId}`);

      const planDetails = PLANS[transaction.plan as 'standard' | 'premium'];
      const previousPlan = user.role;
      const previousCredits = user.credits;

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const newRole = planDetails.tier;
      const newCredits = planDetails.credits === -1 ? 999999 : planDetails.credits;

      // BUG-002 FIX: Use database transaction for atomicity
      // Wrap user update and transaction update in a single transaction

      try {
        // Start transaction using Supabase RPC or manual rollback pattern
        // Since Supabase JS client doesn't support native transactions,
        // we use a try-catch pattern with manual rollback on failure

        // First, update the transaction status
        const transactionUpdateData = {
          status: 'completed',
          paypal_capture_id: `MOCK-CAPTURE-${Date.now()}`,
          metadata: {
            ...transaction.metadata,
            previousPlan,
            previousCredits,
            newPlan: newRole,
            newCredits: newCredits,
            capturedAt: now.toISOString(),
          },
          updated_at: now.toISOString(),
        };

        const { data: txData, error: txError } = await supabaseAdmin
          .from('transactions')
          .update(transactionUpdateData)
          .eq('id', transaction.id)
          .select()
          .single();

        if (txError) {
          throw new Error(`Transaction update failed: ${txError.message}`);
        }
        // Transaction updated successfully

        // Then, update the user subscription
        const userUpdateData = {
          role: newRole,
          credits: newCredits,
          subscription: {
            tier: planDetails.tier,
            price: planDetails.price,
            credits: planDetails.credits,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            autoRenew: true,
          },
          updated_at: now.toISOString(),
        };

        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', user.id)
          .select()
          .single();

        if (userError) {
          // Rollback: revert transaction status to pending
          await supabaseAdmin
            .from('transactions')
            .update({
              status: 'pending',
              paypal_capture_id: null,
              metadata: transaction.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          throw new Error(`User update failed: ${userError.message}`);
        }
        // User updated successfully

      } catch (atomicError: any) {
        console.error('Payment capture atomic operation failed:', atomicError);
        res.status(500).json({
          success: false,
          error: 'Payment capture failed. Please try again.',
        });
        return;
      }

      console.log(`✅ [MOCK MODE] Order captured successfully`);
      console.log(`✅ User upgraded: ${previousPlan} → ${newRole}`);
      console.log(`✅ Credits updated: ${previousCredits} → ${newCredits}`);

      // Send payment and subscription notifications (async, don't wait)
      const planLabel = transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1);
      const isUpgrade = previousPlan === UserRole.FREE ||
        (previousPlan === UserRole.STANDARD && transaction.plan === 'premium');

      const userId = (req as any).user?.id || user.id;
      notifyPaymentReceived(
        userId,
        transaction.amount,
        'USD',
        transaction.orderId || transaction.id,
        `שדרוג לחבילת ${planLabel}`
      ).catch((err) => console.error('Failed to send payment notification:', err));

      notifySubscriptionChange(userId, planLabel, isUpgrade).catch((err) =>
        console.error('Failed to send subscription notification:', err)
      );

      // Send emails (async, don't wait)
      const planFeatures = transaction.plan === 'premium'
        ? [
            'קרדיטים ללא הגבלה',
            'עיבוד AI מועדף',
            'ניתוח מתקדם',
            'מיתוג מותאם אישית',
            'גישה מוקדמת לתכונות חדשות',
            'תמיכה מועדפת',
          ]
        : [
            'עוזר כתיבה AI מלא',
            'ציון איכות לספרים',
            '500 קרדיטים לחודש',
            'פרסום בשוק',
            'ייצוא מתקדם',
            'סטודיו לעיצוב עטיפות',
          ];

      sendSubscriptionUpgradeEmail(
        user.email,
        user.name,
        planLabel,
        transaction.amount,
        'USD',
        planFeatures
      ).catch((err) => console.error('Failed to send upgrade email:', err));

      sendPayPalReceiptEmail(
        user.email,
        user.name,
        transaction.orderId || transaction.id,
        `שדרוג לחבילת ${planLabel}`,
        transaction.amount,
        'USD'
      ).catch((err) => console.error('Failed to send receipt email:', err));

      res.status(200).json({
        success: true,
        message: 'Payment captured successfully (Mock Mode)',
        data: {
          transaction: {
            id: transaction.id,
            orderId: transaction.orderId,
            amount: transaction.amount,
            plan: transaction.plan,
            status: transaction.status,
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            credits: user.credits,
            subscription: user.subscription,
          },
          mockMode: true,
        },
      });
      return;
    }

    // PRODUCTION MODE: Real PayPal capture
    if (!isPayPalConfigured()) {
      const status = getPayPalConfigStatus();
      console.error('[PayPal capture] Not configured. Reasons:', status.reasons.join('; '));
      res.status(503).json({
        success: false,
        error: 'Payment service is not configured. Please contact support.',
        ...(process.env.NODE_ENV !== 'production' && {
          debug: { reasons: status.reasons },
        }),
      });
      return;
    }

    try {
      const accessToken = await getAccessToken();

      // Capture the PayPal order
      const captureResponse = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Check if capture was successful
      if (captureResponse.data.status !== 'COMPLETED') {
        console.error('PayPal capture not completed:', captureResponse.data);
        res.status(400).json({
          success: false,
          error: `Payment capture failed. Status: ${captureResponse.data.status}`,
          code: 'CAPTURE_INCOMPLETE',
        });
        return;
      }

      // Extract capture details
      const captureId = captureResponse.data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const capturedAmount = captureResponse.data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;

      console.log(`[PayPal] Captured order ${orderId}, capture ID: ${captureId}`);

      // Process subscription upgrade
      const planDetails = PLANS[transaction.plan as 'standard' | 'premium'];
      const previousPlan = user.role;
      const previousCredits = user.credits;

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const newRole = planDetails.tier;
      const newCredits = planDetails.credits === -1 ? 999999 : planDetails.credits;

      // Update transaction and user atomically
      try {
        // First, update the transaction status
        const transactionUpdateData = {
          status: 'completed',
          paypal_capture_id: captureId,
          metadata: {
            ...transaction.metadata,
            previousPlan,
            previousCredits,
            newPlan: newRole,
            newCredits: newCredits,
            capturedAt: now.toISOString(),
            paypalCaptureResponse: {
              status: captureResponse.data.status,
              captureId,
              capturedAmount,
            },
          },
          updated_at: now.toISOString(),
        };

        const { error: txError } = await supabaseAdmin
          .from('transactions')
          .update(transactionUpdateData)
          .eq('id', transaction.id);

        if (txError) {
          throw new Error(`Transaction update failed: ${txError.message}`);
        }

        // Then, update the user subscription
        const userUpdateData = {
          role: newRole,
          credits: newCredits,
          subscription: {
            tier: planDetails.tier,
            price: planDetails.price,
            credits: planDetails.credits,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            autoRenew: true,
          },
          updated_at: now.toISOString(),
        };

        const { error: userError } = await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', user.id);

        if (userError) {
          // Rollback: revert transaction status to pending
          await supabaseAdmin
            .from('transactions')
            .update({
              status: 'pending',
              paypal_capture_id: null,
              metadata: transaction.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          throw new Error(`User update failed: ${userError.message}`);
        }

      } catch (atomicError: any) {
        console.error('Payment capture atomic operation failed:', atomicError);
        // Note: PayPal payment was captured but our DB update failed
        // This needs manual reconciliation
        res.status(500).json({
          success: false,
          error: 'Payment was captured but subscription update failed. Please contact support.',
          code: 'SUBSCRIPTION_UPDATE_FAILED',
          paypalCaptureId: captureId,
        });
        return;
      }

      console.log(`[PayPal] Order captured successfully`);
      console.log(`[PayPal] User upgraded: ${previousPlan} -> ${newRole}`);
      console.log(`[PayPal] Credits updated: ${previousCredits} -> ${newCredits}`);

      // Send payment and subscription notifications (async, don't wait)
      const planLabel = transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1);
      const isUpgrade = previousPlan === UserRole.FREE ||
        (previousPlan === UserRole.STANDARD && transaction.plan === 'premium');

      const userId = (req as any).user?.id || user.id;
      notifyPaymentReceived(
        userId,
        transaction.amount,
        'USD',
        transaction.orderId || transaction.id,
        `שדרוג לחבילת ${planLabel}`
      ).catch((err) => console.error('Failed to send payment notification:', err));

      notifySubscriptionChange(userId, planLabel, isUpgrade).catch((err) =>
        console.error('Failed to send subscription notification:', err)
      );

      // Send emails (async, don't wait)
      const planFeatures = transaction.plan === 'premium'
        ? [
            'קרדיטים ללא הגבלה',
            'עיבוד AI מועדף',
            'ניתוח מתקדם',
            'מיתוג מותאם אישית',
            'גישה מוקדמת לתכונות חדשות',
            'תמיכה מועדפת',
          ]
        : [
            'עוזר כתיבה AI מלא',
            'ציון איכות לספרים',
            '500 קרדיטים לחודש',
            'פרסום בשוק',
            'ייצוא מתקדם',
            'סטודיו לעיצוב עטיפות',
          ];

      sendSubscriptionUpgradeEmail(
        user.email,
        user.name,
        planLabel,
        transaction.amount,
        'USD',
        planFeatures
      ).catch((err) => console.error('Failed to send upgrade email:', err));

      sendPayPalReceiptEmail(
        user.email,
        user.name,
        transaction.orderId || transaction.id,
        `שדרוג לחבילת ${planLabel}`,
        transaction.amount,
        'USD'
      ).catch((err) => console.error('Failed to send receipt email:', err));

      // Refresh user data for response
      const updatedUser = await User.findById(user.id);

      res.status(200).json({
        success: true,
        message: 'Payment captured successfully',
        data: {
          transaction: {
            id: transaction.id,
            orderId: transaction.orderId,
            amount: transaction.amount,
            plan: transaction.plan,
            status: 'completed',
            captureId,
          },
          user: {
            id: updatedUser?.id || user.id,
            name: updatedUser?.name || user.name,
            email: updatedUser?.email || user.email,
            role: newRole,
            credits: newCredits,
            subscription: {
              tier: planDetails.tier,
              price: planDetails.price,
              credits: planDetails.credits,
              startDate: now.toISOString(),
              endDate: endDate.toISOString(),
              isActive: true,
            },
          },
        },
      });

    } catch (paypalError: any) {
      console.error('PayPal capture error:', paypalError.response?.data || paypalError.message);

      // Handle specific PayPal errors
      const paypalErrorName = paypalError.response?.data?.name;
      const paypalErrorDetails = paypalError.response?.data?.details?.[0];

      let errorMessage = 'Failed to capture PayPal payment. Please try again.';
      let statusCode = 502;

      if (paypalErrorName === 'ORDER_NOT_APPROVED') {
        errorMessage = 'Payment was not approved. Please complete the PayPal checkout.';
        statusCode = 400;
      } else if (paypalErrorName === 'ORDER_ALREADY_CAPTURED') {
        errorMessage = 'This payment has already been processed.';
        statusCode = 400;
      } else if (paypalErrorName === 'INVALID_RESOURCE_ID') {
        errorMessage = 'Invalid order. Please try again.';
        statusCode = 400;
      } else if (paypalErrorDetails?.description) {
        errorMessage = paypalErrorDetails.description;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: paypalErrorName || 'PAYPAL_CAPTURE_ERROR',
      });
    }
  } catch (error) {
    console.error('Capture order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture payment order',
    });
  }
};

/**
 * Get user's transaction history
 * GET /api/payments/history
 */
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    let transactions = await Transaction.find({ userId: req.user.id });

    // Sort by createdAt descending and limit to 50
    // Supabase already returns plain objects, no need for .lean()
    transactions = transactions
      .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
      .slice(0, 50);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transaction history',
    });
  }
};
