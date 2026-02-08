import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../types';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches user data to request object
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid or expired token',
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate, but doesn't require authentication
 * If token is provided and valid, attaches user to request
 * If no token or invalid token, continues without user
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
    // Continue regardless of authentication status
    next();
  } catch {
    // Invalid token - continue without user
    next();
  }
};

// Alias for backward compatibility
export const auth = authenticate;

/**
 * Role-based authorization middleware
 * Restricts access to specific user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions to access this resource',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

/**
 * Check if user has sufficient credits
 */
export const checkCredits = (requiredCredits: number) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get user from database
      const user = await User.findById(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Premium and admin users have unlimited credits
      if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // Check if user has enough credits
      if (user.credits < requiredCredits) {
        res.status(403).json({
          success: false,
          error: 'Insufficient credits',
          data: {
            required: requiredCredits,
            available: user.credits,
          },
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check credits',
      });
    }
  };
};
