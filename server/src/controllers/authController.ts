import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../models/User';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../services/emailService';

/**
 * Register a new user
 * Section 17.1: Password hashing with bcrypt (12 rounds)
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

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
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create new user with free tier defaults
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.FREE,
      credits: 100, // Free tier starts with 100 credits
      subscription: {
        tier: UserRole.FREE,
        price: 0,
        credits: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
      },
      emailVerification: {
        isVerified: false,
        verificationCode,
        verificationCodeExpires,
      },
    });

    await user.save();

    // Send verification email (async, don't block)
    sendVerificationEmail(user.email, user.name, verificationCode).catch((err) =>
      console.error('Failed to send verification email:', err)
    );

    // Generate JWT token (60-day expiry as per Section 17.1)
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user data (excluding password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification code.',
      data: {
        user: {
          id: user._id,
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
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

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
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user data (excluding password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
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
      res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      });
      return;
    }

    // Check if code has expired
    if (
      user.emailVerification?.verificationCodeExpires &&
      user.emailVerification.verificationCodeExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.',
      });
      return;
    }

    // Mark email as verified
    user.emailVerification = {
      isVerified: true,
      verifiedAt: new Date(),
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    };

    await user.save();

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
          verifiedAt: user.emailVerification.verifiedAt,
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
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.emailVerification = {
      ...user.emailVerification,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    };

    await user.save();

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

    // Find user by ID (exclude password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Update basic fields
    if (name) user.name = name;

    // Update profile fields
    if (!user.profile) {
      user.profile = {};
    }
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar !== undefined) user.profile.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          credits: user.credits,
          profile: user.profile,
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
