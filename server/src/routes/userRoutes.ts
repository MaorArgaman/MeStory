import { Router } from 'express';
import {
  getEarnings,
  updateProfile,
  changePassword,
  requestWithdrawal,
  getUserProfile,
  followUser,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * User Routes
 */

// Public routes
// GET /api/user/profile/:id - Get user profile (public)
router.get('/profile/:id', getUserProfile as any);

// All remaining routes require authentication
router.use(authenticate as any);

// GET /api/user/earnings - Get earnings data
router.get('/earnings', getEarnings as any);

// PUT /api/user/profile - Update user profile
router.put('/profile', updateProfile as any);

// PUT /api/user/password - Change password
router.put('/password', changePassword as any);

// POST /api/user/withdraw - Request withdrawal
router.post('/withdraw', requestWithdrawal as any);

// POST /api/user/:id/follow - Follow/unfollow a user
router.post('/:id/follow', followUser as any);

export default router;
