import { Response } from 'express';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../types';
import { notifySubscriptionChange } from '../services/notificationService';

// Plan details as per Section 3.1
const PLANS = {
  free: {
    tier: UserRole.FREE,
    price: 0,
    priceILS: 0,
    credits: 100,
    features: [
      'Basic writing tools',
      'Limited AI assistance',
      '100 credits/month',
      'Export to PDF',
      'Single book writing',
    ],
  },
  standard: {
    tier: UserRole.STANDARD,
    price: 25,
    priceILS: 99,
    credits: 500,
    features: [
      'Full AI writing assistant',
      'Quality scoring',
      '500 credits/month',
      'Publish to marketplace',
      'Advanced exports',
      'Cover design studio',
      'Unlimited books',
    ],
  },
  premium: {
    tier: UserRole.PREMIUM,
    price: 65,
    priceILS: 250,
    credits: -1, // Unlimited
    features: [
      'Everything in Standard',
      'Unlimited AI credits',
      'Priority AI processing',
      'Advanced analytics',
      'Custom branding',
      'Early access to features',
      'Priority support',
    ],
  },
};

/**
 * Get all subscription plans
 * GET /api/subscription/plans
 */
export const getPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        plans: [
          { id: 'free', ...PLANS.free },
          { id: 'standard', ...PLANS.standard },
          { id: 'premium', ...PLANS.premium },
        ],
      },
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription plans',
    });
  }
};

/**
 * Upgrade user subscription
 * POST /api/subscription/upgrade
 * Section 3: User Roles & Pricing
 */
export const upgradeSubscription = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { plan } = req.body;

    if (!plan || !['free', 'standard', 'premium'].includes(plan)) {
      res.status(400).json({
        success: false,
        error: 'Invalid plan selected',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const planDetails = PLANS[plan as keyof typeof PLANS];
    const previousRole = user.role;

    // Update user role and credits
    user.role = planDetails.tier;
    user.credits = planDetails.credits === -1 ? 999999 : planDetails.credits;

    // Update subscription details
    const now = new Date();
    const endDate = new Date();
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

    // Determine if this is an upgrade or downgrade
    const planLevels: Record<string, number> = {
      [UserRole.FREE]: 0,
      [UserRole.STANDARD]: 1,
      [UserRole.PREMIUM]: 2,
    };
    const isUpgrade = planLevels[planDetails.tier] > planLevels[previousRole];

    // Send subscription change notification (async, don't wait)
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    notifySubscriptionChange(req.user!.id, planLabel, isUpgrade).catch((err) =>
      console.error('Failed to send subscription notification:', err)
    );

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          subscription: user.subscription,
        },
        plan: {
          name: plan,
          ...planDetails,
        },
      },
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription',
    });
  }
};

/**
 * Cancel subscription
 * POST /api/subscription/cancel
 */
export const cancelSubscription = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (!user.subscription || !user.subscription.isActive) {
      res.status(400).json({
        success: false,
        error: 'No active subscription to cancel',
      });
      return;
    }

    // Don't immediately cancel - set autoRenew to false
    user.subscription.autoRenew = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription will not renew after current period ends',
      data: {
        subscription: user.subscription,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
    });
  }
};
