import { Router } from 'express';
import {
  createOrder,
  captureOrder,
  getTransactionHistory,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Payment Routes
 * All routes require authentication
 */

// POST /api/payments/create-order - Create a new payment order
router.post(
  '/create-order',
  authenticate as any,
  apiLimiter,
  createOrder as any
);

// POST /api/payments/capture-order - Capture/complete payment
router.post(
  '/capture-order',
  authenticate as any,
  apiLimiter,
  captureOrder as any
);

// GET /api/payments/history - Get user's transaction history
router.get(
  '/history',
  authenticate as any,
  apiLimiter,
  getTransactionHistory as any
);

export default router;
