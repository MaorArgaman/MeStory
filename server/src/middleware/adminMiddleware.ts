import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Admin Middleware
 * Verifies that the authenticated user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
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
