import { Router, Request, Response } from 'express';
import passport from 'passport';
import {
  register,
  login,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerificationCode,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { runValidation } from '../middleware/validate';
import {
  registerValidation,
  loginValidation,
} from '../middleware/validators';
import { generateToken } from '../utils/jwt';

const router = Router();

/**
 * Section 14.1: Auth API Endpoints
 */

// POST /api/auth/register - Create account
router.post(
  '/register',
  authLimiter, // Rate limit: 5 attempts per 15 minutes
  runValidation(registerValidation),
  register
);

// POST /api/auth/login - Authenticate
router.post(
  '/login',
  authLimiter, // Rate limit: 5 attempts per 15 minutes
  runValidation(loginValidation),
  login
);

// GET /api/auth/me - Get current user
router.get(
  '/me',
  authenticate as any, // Requires authentication
  getMe as any
);

// PUT /api/auth/profile - Update user profile
router.put(
  '/profile',
  authenticate as any, // Requires authentication
  updateProfile as any
);

// POST /api/auth/verify-email - Verify email with code
router.post(
  '/verify-email',
  authenticate as any, // Requires authentication
  verifyEmail as any
);

// POST /api/auth/resend-verification - Resend verification code
router.post(
  '/resend-verification',
  authLimiter, // Rate limit to prevent abuse
  authenticate as any, // Requires authentication
  resendVerificationCode as any
);

/**
 * Section 14.2: Google OAuth Routes
 */

// GET /api/auth/google - Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false
  }),
  (req: Request, res: Response) => {
    try {
      // User is attached to req.user by passport
      const user = req.user as any;

      // Generate JWT token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Redirect to client with token in URL
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_error`);
    }
  }
);

export default router;
