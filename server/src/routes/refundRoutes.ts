/**
 * Refund Routes
 * Handles user refund requests and admin refund management
 */

import { Router } from 'express';
import {
  requestRefund,
  getUserRefunds,
  getAdminRefunds,
  approveRefund,
  rejectRefund,
} from '../controllers/refundController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

// ==================== USER ROUTES ====================
// All user routes require authentication

/**
 * POST /api/refunds/request
 * Request a refund for a book purchase
 * Body: { transactionId: string, reason: string }
 */
router.post('/request', authenticate as any, requestRefund as any);

/**
 * GET /api/refunds
 * Get user's refund requests
 */
router.get('/', authenticate as any, getUserRefunds as any);

// ==================== ADMIN ROUTES ====================
// Admin routes require authentication + admin role

/**
 * GET /api/refunds/admin
 * Get all refund requests (admin only)
 * Query params: status (optional) - 'pending' | 'approved' | 'rejected'
 */
router.get('/admin', authenticate as any, requireAdmin as any, getAdminRefunds as any);

/**
 * PUT /api/refunds/admin/:id/approve
 * Approve a refund request (admin only)
 * Body: { adminNotes?: string }
 */
router.put('/admin/:id/approve', authenticate as any, requireAdmin as any, approveRefund as any);

/**
 * PUT /api/refunds/admin/:id/reject
 * Reject a refund request (admin only)
 * Body: { adminNotes: string } (required)
 */
router.put('/admin/:id/reject', authenticate as any, requireAdmin as any, rejectRefund as any);

export default router;
