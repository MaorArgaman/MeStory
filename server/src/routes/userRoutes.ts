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
  updateCurrency,
  exportUserData,
  uploadAvatar,
  searchUsers,
  getUserLibrary,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { uploadImage, handleUploadError } from '../middleware/uploadMiddleware';

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

// GET /api/user/:id/library - Get user's public library (books they wrote)
router.get('/:id/library', getUserLibrary as any);

// GET /api/user/search - Search users by name
router.get('/search', searchUsers as any);

// All remaining routes require authentication
router.use(authenticate as any);

// GET /api/user/earnings - Get earnings data
router.get('/earnings', getEarnings as any);

// GET /api/user/export-data - Export all user data (GDPR compliance)
// BUG-009: GDPR data export functionality
router.get('/export-data', exportUserData as any);

// PUT /api/user/profile - Update user profile
router.put('/profile', updateProfile as any);

// POST /api/user/avatar - Upload user avatar
router.post('/avatar', uploadImage.single('avatar'), handleUploadError as any, uploadAvatar as any);

// PUT /api/user/language - Update language preference
router.put('/language', updateLanguage as any);

// PUT /api/user/currency - Update currency preference
router.put('/currency', updateCurrency as any);

// PUT /api/user/password - Change password
// BUG-032: Apply rate limiting to prevent brute force attacks
router.put('/password', passwordChangeRateLimiter, changePassword as any);

// POST /api/user/withdraw - Request withdrawal
router.post('/withdraw', requestWithdrawal as any);

// POST /api/user/:id/follow - Follow/unfollow a user
router.post('/:id/follow', followUser as any);

export default router;
