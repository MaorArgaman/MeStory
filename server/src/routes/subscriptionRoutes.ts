import { Router } from 'express';
import {
  getPlans,
  upgradeSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Subscription Routes
 * Section 3: User Roles & Pricing
 */

// GET /api/subscription/plans - Get all subscription plans (public)
router.get('/plans', getPlans as any);

// POST /api/subscription/upgrade - Upgrade subscription (authenticated)
router.post('/upgrade', authenticate as any, upgradeSubscription as any);

// POST /api/subscription/cancel - Cancel subscription (authenticated)
router.post('/cancel', authenticate as any, cancelSubscription as any);

export default router;
