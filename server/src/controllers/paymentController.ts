import { Response } from 'express';
import { User, UserRole } from '../models/User';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../types';
import { notifyPaymentReceived, notifySubscriptionChange } from '../services/notificationService';
import {
  sendSubscriptionUpgradeEmail,
  sendPayPalReceiptEmail,
} from '../services/emailService';

/**
 * Payment Controller
 * Handles subscription upgrades with PayPal integration and mock mode for development
 */

// Plan configuration from environment
const PLANS = {
  free: {
    tier: UserRole.FREE,
    price: 0,
    credits: parseInt(process.env.FREE_PLAN_CREDITS || '100'),
  },
  standard: {
    tier: UserRole.STANDARD,
    price: parseFloat(process.env.STANDARD_PLAN_PRICE || '25'),
    credits: parseInt(process.env.STANDARD_PLAN_CREDITS || '500'),
  },
  premium: {
    tier: UserRole.PREMIUM,
    price: parseFloat(process.env.PREMIUM_PLAN_PRICE || '65'),
    credits: parseInt(process.env.PREMIUM_PLAN_CREDITS || '-1'),
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

    // DEVELOPMENT MODE: Mock payment
    if (process.env.NODE_ENV === 'development') {
      const mockOrderId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`💳 [MOCK MODE] Created order for ${planType} plan ($${planDetails.price})`);
      console.log(`💳 [MOCK ORDER ID] ${mockOrderId}`);

      // Create pending transaction
      const transaction = new Transaction({
        userId: user._id,
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

      await transaction.save();

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
    // TODO: Implement PayPal order creation when ready for production
    res.status(501).json({
      success: false,
      error: 'PayPal integration not yet implemented. Use development mode for testing.',
    });
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
    if (transaction.userId.toString() !== req.user.id) {
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

    // DEVELOPMENT MODE: Mock capture
    if (process.env.NODE_ENV === 'development') {
      console.log(`💳 [MOCK MODE] Capturing order ${orderId}`);

      const planDetails = PLANS[transaction.plan as 'standard' | 'premium'];
      const previousPlan = user.role;
      const previousCredits = user.credits;

      // Update user subscription
      user.role = planDetails.tier;
      user.credits = planDetails.credits === -1 ? 999999 : planDetails.credits;

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      user.subscription = {
        tier: planDetails.tier,
        price: planDetails.price,
        credits: planDetails.credits,
        startDate: now,
        endDate: endDate,
        isActive: true,
        autoRenew: true,
      };

      await user.save();

      // Update transaction status
      transaction.status = 'completed';
      transaction.paypalCaptureId = `MOCK-CAPTURE-${Date.now()}`;
      transaction.metadata = {
        ...transaction.metadata,
        previousPlan,
        previousCredits,
        newPlan: user.role,
        newCredits: user.credits,
        capturedAt: now,
      };
      await transaction.save();

      console.log(`✅ [MOCK MODE] Order captured successfully`);
      console.log(`✅ User upgraded: ${previousPlan} → ${user.role}`);
      console.log(`✅ Credits updated: ${previousCredits} → ${user.credits}`);

      // Send payment and subscription notifications (async, don't wait)
      const planLabel = transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1);
      const isUpgrade = previousPlan === UserRole.FREE ||
        (previousPlan === UserRole.STANDARD && transaction.plan === 'premium');

      const userId = (req as any).user?.id || user._id.toString();
      notifyPaymentReceived(
        userId,
        transaction.amount,
        'USD',
        transaction.orderId,
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
        transaction.orderId,
        `שדרוג לחבילת ${planLabel}`,
        transaction.amount,
        'USD'
      ).catch((err) => console.error('Failed to send receipt email:', err));

      res.status(200).json({
        success: true,
        message: 'Payment captured successfully (Mock Mode)',
        data: {
          transaction: {
            id: transaction._id,
            orderId: transaction.orderId,
            amount: transaction.amount,
            plan: transaction.plan,
            status: transaction.status,
          },
          user: {
            id: user._id,
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
    // TODO: Implement PayPal order capture when ready for production
    res.status(501).json({
      success: false,
      error: 'PayPal integration not yet implemented. Use development mode for testing.',
    });
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

    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v')
      .lean();

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
