/**
 * Invoice Routes
 * Handles invoice listing, downloading, and emailing
 */

import { Router } from 'express';
import {
  getInvoices,
  downloadInvoice,
  sendInvoiceEmail,
  getAllInvoices,
} from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Invoice Routes
 * All routes require authentication
 */

// GET /api/invoices - List user's invoices
router.get(
  '/',
  authenticate as any,
  apiLimiter,
  getInvoices as any
);

// GET /api/invoices/admin/all - Admin: List all invoices
router.get(
  '/admin/all',
  authenticate as any,
  apiLimiter,
  getAllInvoices as any
);

// GET /api/invoices/:transactionId - Download invoice PDF
// Query params: ?language=en|he
router.get(
  '/:transactionId',
  authenticate as any,
  apiLimiter,
  downloadInvoice as any
);

// POST /api/invoices/:transactionId/send - Email invoice to user
// Body: { email?: string, language?: 'en' | 'he' }
router.post(
  '/:transactionId/send',
  authenticate as any,
  apiLimiter,
  sendInvoiceEmail as any
);

export default router;
