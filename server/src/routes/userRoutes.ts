import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getEarnings,
  updateProfile,
  changePassword,
  requestWithdrawal,
  getUserProfile,
  followUser,
  updateLanguage,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// BUG-032: Rate limiter for password change endpoint
const passwordChangeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many password change attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// PUT /api/user/language - Update language preference
router.put('/language', updateLanguage as any);

// PUT /api/user/password - Change password
// BUG-032: Apply rate limiting to prevent brute force attacks
router.put('/password', passwordChangeRateLimiter, changePassword as any);

// POST /api/user/withdraw - Request withdrawal
router.post('/withdraw', requestWithdrawal as any);

// POST /api/user/:id/follow - Follow/unfollow a user
router.post('/:id/follow', followUser as any);

export default router;
