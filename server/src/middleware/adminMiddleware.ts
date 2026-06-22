import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';

/**
 * Admin Middleware
 * Verifies that the authenticated user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Re-verify the role against the DB rather than trusting the JWT claim.
    // JWTs here live up to 60 days, so a demoted/banned admin would otherwise
    // keep admin access until their token expires. Source of truth = the DB.
    const current = await User.findById(req.user.id);
    if (!current || current.role?.toUpperCase() !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // User is admin, proceed to next middleware
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
