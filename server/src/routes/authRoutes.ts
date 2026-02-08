import { Router, Request, Response, NextFunction } from 'express';
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
import { isGoogleOAuthEnabled } from '../config/passport';

/**
 * Middleware to check if Google OAuth is configured
 * Returns error if not available (e.g., missing env vars in Vercel)
 */
const checkGoogleOAuth = (_req: Request, res: Response, next: NextFunction): void => {
  if (!isGoogleOAuthEnabled()) {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured. Please use email/password login.',
      code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
    });
    return;
  }
  next();
};

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

// GET /api/auth/google/status - Check if Google OAuth is available
router.get('/google/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    enabled: isGoogleOAuthEnabled(),
  });
});

// GET /api/auth/google - Initiate Google OAuth flow
router.get(
  '/google',
  checkGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get(
  '/google/callback',
  checkGoogleOAuth,
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
