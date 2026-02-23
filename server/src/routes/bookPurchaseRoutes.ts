/**
 * Book Purchase Routes
 * Handles book purchasing, library access, and author payouts
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
 */

// POST /api/book-purchases/:id/create-order - Create purchase order
router.post(
  '/:id/create-order',
  runValidation(mongoIdValidation),
  createPurchaseOrder as any
);

// POST /api/book-purchases/capture - Capture payment after approval
router.post('/capture', capturePayment as any);

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
router.post('/request-payout', requestPayout as any);

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
