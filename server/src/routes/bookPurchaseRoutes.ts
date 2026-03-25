/**
 * Book Purchase Routes
 * Handles book purchasing, library access, and author payouts
 * Payment endpoints support idempotency keys via X-Idempotency-Key header
 */

import { Router } from 'express';
import {
  createPurchaseOrder,
  capturePayment,
  checkAccess,
  getEarnings,
  requestPayout,
  connectPayPal,
  getLibrary,
  getBookForReading,
  updateReadingProgress,
} from '../controllers/bookPurchaseController';
import { authenticate } from '../middleware/auth';
import { runValidation } from '../middleware/validate';
import { mongoIdValidation } from '../middleware/validators';
import { paymentIdempotency } from '../middleware/idempotencyMiddleware';
import { paymentAttemptLimiter, payoutRequestLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

/**
 * Library Routes
 */

// GET /api/book-purchases/library - Get user's purchased books library
router.get('/library', getLibrary as any);

// GET /api/book-purchases/earnings - Get author earnings dashboard
router.get('/earnings', getEarnings as any);

/**
 * Payment Routes
 * These endpoints support idempotency keys to prevent duplicate purchases
 */

// POST /api/book-purchases/:id/create-order - Create purchase order
// Supports idempotency key to prevent duplicate order creation
// Rate limited: 10 payment attempts per user per hour
router.post(
  '/:id/create-order',
  paymentAttemptLimiter,
  runValidation(mongoIdValidation),
  paymentIdempotency,
  createPurchaseOrder as any
);

// POST /api/book-purchases/capture - Capture payment after approval
// Supports idempotency key to prevent duplicate captures
// Rate limited: 10 payment attempts per user per hour
router.post('/capture', paymentAttemptLimiter, paymentIdempotency, capturePayment as any);

// GET /api/book-purchases/:id/check-access - Check if user can access a book
router.get(
  '/:id/check-access',
  runValidation(mongoIdValidation),
  checkAccess as any
);

/**
 * Author Payout Routes
 */

// POST /api/book-purchases/request-payout - Request payout to PayPal
// Rate limited: 3 payout requests per user per day
router.post('/request-payout', payoutRequestLimiter, requestPayout as any);

// POST /api/book-purchases/connect-paypal - Connect PayPal account
router.post('/connect-paypal', connectPayPal as any);

/**
 * Reading Routes
 */

// GET /api/book-purchases/:id/read - Get full book for reading (with access check)
router.get(
  '/:id/read',
  runValidation(mongoIdValidation),
  getBookForReading as any
);

// PUT /api/book-purchases/:id/progress - Update reading progress
router.put(
  '/:id/progress',
  runValidation(mongoIdValidation),
  updateReadingProgress as any
);

export default router;
