import { Router } from 'express';
import {
  getPlans,
  upgradeSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { subscriptionChangeLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Subscription Routes
 * Section 3: User Roles & Pricing
 */

// GET /api/subscription/plans - Get all subscription plans (public)
router.get('/plans', getPlans as any);

// POST /api/subscription/upgrade - Upgrade subscription (authenticated)
// Rate limited: 5 subscription changes per user per day
router.post('/upgrade', authenticate as any, subscriptionChangeLimiter, upgradeSubscription as any);

// POST /api/subscription/cancel - Cancel subscription (authenticated)
// Rate limited: 5 subscription changes per user per day
router.post('/cancel', authenticate as any, subscriptionChangeLimiter, cancelSubscription as any);

export default router;
