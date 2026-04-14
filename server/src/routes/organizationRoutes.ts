import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminMiddleware';
import {
  // Admin endpoints
  getAllOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  // Coupon management
  createCoupon,
  updateCoupon,
  deleteCoupon,
  // Member management
  getOrganizationMembers,
  addOrganizationMember,
  removeOrganizationMember,
  // Public endpoints
  validateCoupon,
  applyCoupon,
} from '../controllers/organizationController';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Validate coupon code (no auth required)
router.get('/coupon/:code/validate', validateCoupon);

// Apply coupon (requires auth)
router.post('/coupon/:code/apply', authenticate, applyCoupon);

// ==================== ADMIN ROUTES ====================

// Organization CRUD
router.get('/', authenticate, requireAdmin, getAllOrganizations);
router.get('/:id', authenticate, requireAdmin, getOrganization);
router.post('/', authenticate, requireAdmin, createOrganization);
router.put('/:id', authenticate, requireAdmin, updateOrganization);
router.delete('/:id', authenticate, requireAdmin, deleteOrganization);

// Coupon management
router.post('/:id/coupons', authenticate, requireAdmin, createCoupon);
router.put('/:id/coupons/:couponId', authenticate, requireAdmin, updateCoupon);
router.delete('/:id/coupons/:couponId', authenticate, requireAdmin, deleteCoupon);

// Member management
router.get('/:id/members', authenticate, requireAdmin, getOrganizationMembers);
router.post('/:id/members', authenticate, requireAdmin, addOrganizationMember);
router.delete('/:id/members/:userId', authenticate, requireAdmin, removeOrganizationMember);

export default router;
