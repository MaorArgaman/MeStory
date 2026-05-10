import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserRole, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../services/emailService';
import { Coupon } from '../models/Coupon';

// 1 hour reset window. Long enough for users to find the email in
// promotions/spam folders, short enough that a leaked email link
// becomes useless quickly.
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Register a new user
 * Section 17.1: Password hashing with bcrypt (12 rounds)
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, couponCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
      return;
    }

    // Hash password with bcrypt (12 rounds as per Section 17.1)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Create new user with free tier defaults
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.FREE,
      credits: 100, // Free tier starts with 100 credits
      subscription: {
        tier: 'free',
        price: 0,
        credits: 100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        isActive: true,
      },
      emailVerification: {
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
      },
    });

    // Send verification email (async, don't block)
    sendVerificationEmail(user.email, user.name, verificationCode).catch((err) =>
      console.error('Failed to send verification email:', err)
    );

    // Apply coupon code if provided
    let couponApplied = false;
    let couponMessage = '';
    if (couponCode) {
      try {
        const validation = await Coupon.validate(couponCode);
        if (validation.valid && validation.coupon) {
          const coupon = validation.coupon;
          const redemption = await Coupon.redeem(coupon.id, user.id);
          const plan = coupon.plan.toUpperCase() as keyof typeof UserRole;
          const role = UserRole[plan] || UserRole.PREMIUM;
          const credits = role === UserRole.PREMIUM ? 999999 : 500;
          await User.findByIdAndUpdate(user.id, {
            role,
            credits,
            subscription: {
              tier: coupon.plan,
              price: 0,
              credits,
              startDate: new Date().toISOString(),
              endDate: redemption.access_expires_at,
              isActive: true,
              autoRenew: false,
            },
          });
          user.role = role;
          user.credits = credits;
          couponApplied = true;
          couponMessage = `${coupon.duration_days} days of ${coupon.plan} access activated!`;
        }
      } catch (err) {
        // Coupon failed but registration succeeded - don't fail the whole request
      }
    }

    // Generate JWT token (60-day expiry as per Section 17.1)
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (excluding password)
    res.status(201).json({
      success: true,
      message: couponApplied
        ? `User registered successfully. ${couponMessage}`
        : 'User registered successfully. Please check your email for verification code.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          subscription: user.subscription,
          emailVerification: {
            isVerified: false,
          },
        },
        token,
        requiresVerification: true,
        couponApplied,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }, true);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (excluding password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          subscription: user.subscription,
          profile: user.profile,
          emailVerification: {
            isVerified: user.emailVerification?.isVerified || false,
          },
        },
        token,
        requiresVerification: !user.emailVerification?.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
    });
  }
};

// BUG-033: Track verification attempts per user
const verificationAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCKOUT_MINUTES = 30;

/**
 * Verify email with code
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
      return;
    }

    // BUG-033: Check verification attempt limits
    const userId = req.user.id;
    const attemptData = verificationAttempts.get(userId);
    const now = new Date();

    if (attemptData) {
      const timeSinceLastAttempt = now.getTime() - attemptData.lastAttempt.getTime();
      const lockoutMs = VERIFICATION_LOCKOUT_MINUTES * 60 * 1000;

      // Reset attempts if lockout period has passed
      if (timeSinceLastAttempt > lockoutMs) {
        verificationAttempts.delete(userId);
      } else if (attemptData.count >= MAX_VERIFICATION_ATTEMPTS) {
        const remainingMinutes = Math.ceil((lockoutMs - timeSinceLastAttempt) / 60000);
        res.status(429).json({
          success: false,
          error: `Too many verification attempts. Please try again in ${remainingMinutes} minutes.`,
        });
        return;
      }
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if already verified
    if (user.emailVerification?.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
      return;
    }

    // Check if code is valid
    if (user.emailVerification?.verificationCode !== code) {
      // BUG-033: Increment failed attempt counter
      const currentAttempts = verificationAttempts.get(userId);
      verificationAttempts.set(userId, {
        count: (currentAttempts?.count || 0) + 1,
        lastAttempt: now,
      });

      const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - ((currentAttempts?.count || 0) + 1);
      res.status(400).json({
        success: false,
        error: `Invalid verification code. ${attemptsLeft > 0 ? `${attemptsLeft} attempts remaining.` : 'Account temporarily locked.'}`,
      });
      return;
    }

    // Check if code has expired
    if (
      user.emailVerification?.verificationCodeExpires &&
      new Date(user.emailVerification.verificationCodeExpires) < new Date()
    ) {
      res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.',
      });
      return;
    }

    // Mark email as verified
    const verifiedAt = new Date().toISOString();
    await User.findByIdAndUpdate(user.id, {
      emailVerification: {
        isVerified: true,
        verifiedAt,
        verificationCode: undefined,
        verificationCodeExpires: undefined,
      },
    });

    // BUG-033: Clear verification attempts on successful verification
    verificationAttempts.delete(userId);

    // Send welcome email (async)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error('Failed to send welcome email:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. Welcome to MeStory!',
      data: {
        emailVerification: {
          isVerified: true,
          verifiedAt,
        },
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email. Please try again.',
    });
  }
};

/**
 * Resend verification code
 * POST /api/auth/resend-verification
 */
export const resendVerificationCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if already verified
    if (user.emailVerification?.isVerified) {
      res.status(400).json({
        success: false,
        error: 'Email is already verified',
      });
      return;
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await User.findByIdAndUpdate(user.id, {
      emailVerification: {
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
      },
    });

    // Send verification email
    const sent = await sendVerificationEmail(user.email, user.name, verificationCode);

    if (!sent) {
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification code. Please try again.',
    });
  }
};

/**
 * Get current user data
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Find user by ID (password not included by default)
    let user;
    try {
      user = await User.findById(req.user.id);
    } catch (dbError: any) {
      // Database unavailable - return basic info from JWT token
      console.warn('Database unavailable for getMe, returning JWT data:', dbError.message);
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            // Indicate that this is partial data due to DB unavailability
            _partial: true,
            _dbError: 'Database temporarily unavailable',
          },
        },
      });
      return;
    }

    if (!user) {
      // User not found could mean DB returned null due to connection issues
      // Return partial data from JWT instead of 404
      console.warn('User not found in DB, returning JWT data for:', req.user.id);
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            _partial: true,
            _dbError: 'User data temporarily unavailable',
          },
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          subscription: user.subscription,
          profile: user.profile,
          paypal: user.paypal,
          emailVerification: {
            isVerified: user.emailVerification?.isVerified || false,
            verifiedAt: user.emailVerification?.verifiedAt,
          },
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user data',
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { name, bio, avatar } = req.body;

    // SEC-005 FIX: Validate input fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
        res.status(400).json({
          success: false,
          error: 'Name must be between 2 and 100 characters',
        });
        return;
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        res.status(400).json({
          success: false,
          error: 'Bio must be 500 characters or less',
        });
        return;
      }
    }

    if (avatar !== undefined && avatar !== '') {
      try {
        const url = new URL(avatar);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        res.status(400).json({
          success: false,
          error: 'Avatar must be a valid URL',
        });
        return;
      }
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Build update object
    const updateData: Partial<IUser> = {};
    if (name) updateData.name = name.trim();

    // Update profile fields
    const updatedProfile = { ...user.profile };
    if (bio !== undefined) updatedProfile.bio = bio;
    if (avatar !== undefined) updatedProfile.avatar = avatar;
    updateData.profile = updatedProfile;

    const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser?.id,
          name: updatedUser?.name,
          email: updatedUser?.email,
          role: updatedUser?.role,
          credits: updatedUser?.credits,
          profile: updatedUser?.profile,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

/**
 * Initiate password reset - email a one-time link.
 * POST /api/auth/forgot-password
 *
 * Always returns 200 with a generic success message regardless of whether
 * the email exists in the DB. Revealing 'no such user' here would leak
 * which emails are registered (account-enumeration vulnerability).
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const lang: 'en' | 'he' = req.body.lang === 'he' ? 'he' : 'en';

  // Generic success response. Used both for success and 'user not found'
  // so attackers can't enumerate accounts from response timing/content.
  const genericResponse = {
    success: true,
    message:
      lang === 'he'
        ? 'אם החשבון קיים, נשלח אליו מייל עם קישור איפוס.'
        : 'If the account exists, a reset link has been sent.',
  };

  try {
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    console.log(`[forgotPassword] start email=${email.toLowerCase()}`);

    const user = await User.findByEmail(email.toLowerCase());

    // Always respond the same way to prevent enumeration. Only do real
    // work when the user actually exists.
    if (!user) {
      console.log(`[forgotPassword] no user with email=${email.toLowerCase()} - returning generic success`);
      res.status(200).json(genericResponse);
      return;
    }

    console.log(`[forgotPassword] found user id=${user.id} - generating token`);

    // Step-by-step logging to find which call freezes the serverless
    // function. Each step is timed so we can spot a hang vs a crash.
    const stepStart = Date.now();

    // Generate the raw token (sent in email) and store only its hash
    // in the DB. If the DB leaks, attackers can't replay the link.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    console.log(`[forgotPassword] token generated in ${Date.now() - stepStart}ms`);

    const ok = await User.setPasswordResetToken(user.id, tokenHash, expiresAt);
    console.log(`[forgotPassword] setPasswordResetToken returned ${ok} after ${Date.now() - stepStart}ms`);
    if (!ok) {
      console.error('[forgotPassword] failed to persist token for', user.email);
      res.status(200).json(genericResponse);
      return;
    }

    const resetUrl = `${process.env.CLIENT_URL || 'https://mestory-ai.com'}/reset-password?token=${rawToken}`;
    console.log(`[forgotPassword] about to send email via configured provider (RESEND_API_KEY ${process.env.RESEND_API_KEY ? 'present' : 'MISSING'}, EMAIL_FROM=${process.env.EMAIL_FROM || 'default'})`);

    // Await the send. Vercel serverless terminates the function as soon
    // as res.json() returns, so a fire-and-forget here would orphan the
    // SMTP/Resend call mid-flight - the very behavior we just spent an
    // hour debugging. Log the result either way; the user-facing response
    // stays identical (anti-enumeration).
    try {
      const ok = await sendPasswordResetEmail(user.email, user.name, resetUrl, lang);
      if (ok) {
        console.log(`[forgotPassword] reset email queued for ${user.email}`);
      } else {
        console.error(`[forgotPassword] email send returned false for ${user.email}`);
      }
    } catch (err: any) {
      console.error('[forgotPassword] email send threw:', err?.message || err);
    }

    res.status(200).json(genericResponse);
  } catch (error: any) {
    console.error('[forgotPassword] error:', error);
    // Even on internal error, return generic success to keep enumeration
    // surface closed. The error is logged for ops to investigate.
    res.status(200).json(genericResponse);
  }
};

/**
 * Confirm password reset.
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Reset token is required' });
      return;
    }
    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Password is required' });
      return;
    }

    // Same strength rules as registration. Mirrored here because users
    // shouldn't be able to bypass them by going through reset flow.
    const passwordStrong =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!passwordStrong) {
      res.status(400).json({
        success: false,
        error:
          'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
      });
      return;
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findByPasswordResetTokenHash(tokenHash);

    // Token unknown OR no active reset on this user.
    if (!user || !user.password_reset || user.password_reset.tokenHash !== tokenHash) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      });
      return;
    }

    // Expiry check.
    const expiresAt = new Date(user.password_reset.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      });
      return;
    }

    // Hash and persist the new password. The token is cleared in the same
    // update so a leaked link can't be replayed.
    const hashedPassword = await bcrypt.hash(password, 12);
    const updated = await User.resetPasswordAndClearToken(user.id, hashedPassword);
    if (!updated) {
      res.status(500).json({
        success: false,
        error: 'Failed to update password. Please try again.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password updated. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[resetPassword] error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};
