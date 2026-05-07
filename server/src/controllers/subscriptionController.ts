import { Response } from 'express';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../types';
import { notifySubscriptionChange } from '../services/notificationService';
import { PLANS as PLAN_CONFIG } from '../config/plans';

// Plan details adapter - real source of truth lives in
// server/src/config/plans.ts. Do not duplicate pricing here.
const buildPlan = (id: 'free' | 'standard' | 'premium', lang: 'en' | 'he') => {
  const cfg = PLAN_CONFIG[id];
  return {
    tier: cfg.tier,
    price: cfg.priceUSD,
    priceILS: cfg.priceILS,
    credits: cfg.monthlyCredits,
    features: lang === 'he' ? cfg.featuresHebrew : cfg.features,
  };
};

const PLANS = {
  free: buildPlan('free', 'en'),
  standard: buildPlan('standard', 'en'),
  premium: buildPlan('premium', 'en'),
};

/**
 * Get all subscription plans
 * GET /api/subscription/plans?lang=he|en
 */
export const getPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lang: 'en' | 'he' = req.query.lang === 'he' ? 'he' : 'en';
    res.status(200).json({
      success: true,
      data: {
        plans: [
          { id: 'free', ...buildPlan('free', lang) },
          { id: 'standard', ...buildPlan('standard', lang) },
          { id: 'premium', ...buildPlan('premium', lang) },
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

    // Update subscription details
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = {
      tier: planDetails.tier,
      price: planDetails.price,
      credits: planDetails.credits,
      startDate: now,
      endDate: endDate,
      isActive: true,
      autoRenew: true,
    };

    // Update user with new subscription data
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      role: planDetails.tier,
      credits: planDetails.credits === -1 ? 999999 : planDetails.credits,
      subscription,
    });

    // BUG-007: Verify subscription update succeeded
    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription. Please try again.',
      });
      return;
    }

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
          id: updatedUser?.id || user.id,
          name: updatedUser?.name || user.name,
          email: updatedUser?.email || user.email,
          role: planDetails.tier,
          credits: planDetails.credits === -1 ? 999999 : planDetails.credits,
          subscription,
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
    const updatedSubscription = {
      ...user.subscription,
      autoRenew: false,
    };

    await User.findByIdAndUpdate(req.user.id, {
      subscription: updatedSubscription,
    });

    res.status(200).json({
      success: true,
      message: 'Subscription will not renew after current period ends',
      data: {
        subscription: updatedSubscription,
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
