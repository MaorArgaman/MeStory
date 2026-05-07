import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import {
  register,
  login,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
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

// POST /api/auth/forgot-password - Email a one-time reset link.
// Rate limited tightly because this both costs us (SMTP) and is a
// vector for abusers to spam victims with reset emails.
router.post(
  '/forgot-password',
  authLimiter,
  forgotPassword
);

// POST /api/auth/reset-password - Confirm reset with the emailed token.
router.post(
  '/reset-password',
  authLimiter,
  resetPassword
);

/**
 * Section 14.2: Google OAuth Routes
 */

// GET /api/auth/token - Get token from HTTP-only cookie (for OAuth flow)
router.get('/token', (req: Request, res: Response) => {
  const token = req.cookies?.auth_token;
  if (token) {
    // Clear the cookie after reading
    res.clearCookie('auth_token', { path: '/' });
    res.json({ success: true, token });
  } else {
    // Return 200 with success: false to avoid console errors
    res.json({ success: false, error: 'No token found' });
  }
});

// GET /api/auth/google/status - Check if Google OAuth is available
router.get('/google/status', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  res.json({
    success: true,
    enabled: isGoogleOAuthEnabled(),
    debug: {
      hasClientId: !!clientId && clientId !== 'your-google-client-id',
      hasClientSecret: !!clientSecret,
      hasCallbackUrl: !!callbackUrl,
      callbackUrl: callbackUrl || 'using default',
      clientIdPrefix: clientId ? clientId.substring(0, 15) + '...' : 'NOT SET',
    }
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

      // Generate JWT token (use user.id for Supabase, fallback to _id for compatibility)
      const token = generateToken({
        id: (user.id || user._id).toString(),
        email: user.email,
        role: user.role,
      });

      // SEC-002 FIX: Set token in HTTP-only cookie instead of URL
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
        path: '/',
      });

      // Redirect to client with token in URL (cross-domain cookies don't work reliably)
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-success?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_error`);
    }
  }
);

export default router;
