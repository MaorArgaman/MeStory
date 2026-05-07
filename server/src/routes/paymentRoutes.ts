import { Router } from 'express';
import {
  createOrder,
  captureOrder,
  getTransactionHistory,
} from '../controllers/paymentController';
import {
  listTopUpPackages,
  createTopUpOrder,
  captureTopUpOrder,
} from '../controllers/topUpController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';
import { paymentIdempotency } from '../middleware/idempotencyMiddleware';

const router = Router();

/**
 * Payment Routes
 * All routes require authentication
 * Payment endpoints support idempotency keys via X-Idempotency-Key header
 */

// POST /api/payments/create-order - Create a new payment order
// Supports idempotency key to prevent duplicate order creation
router.post(
  '/create-order',
  authenticate as any,
  apiLimiter,
  paymentIdempotency,
  createOrder as any
);

// POST /api/payments/capture-order - Capture/complete payment
// Supports idempotency key to prevent duplicate captures
router.post(
  '/capture-order',
  authenticate as any,
  apiLimiter,
  paymentIdempotency,
  captureOrder as any
);

// GET /api/payments/history - Get user's transaction history
router.get(
  '/history',
  authenticate as any,
  apiLimiter,
  getTransactionHistory as any
);

// ----- Top-up (one-time credit purchase) -------------------------------
// GET /api/payments/topup/packages - list available top-up packages
router.get('/topup/packages', listTopUpPackages as any);

// POST /api/payments/topup/create-order
router.post(
  '/topup/create-order',
  authenticate as any,
  apiLimiter,
  paymentIdempotency,
  createTopUpOrder as any
);

// POST /api/payments/topup/capture-order
router.post(
  '/topup/capture-order',
  authenticate as any,
  apiLimiter,
  paymentIdempotency,
  captureTopUpOrder as any
);

export default router;
