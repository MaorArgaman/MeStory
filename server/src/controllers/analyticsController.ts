import { Response } from 'express';
import { AuthRequest } from '../types';
import * as analyticsService from '../services/analyticsService';

/**
 * Check if user is admin
 */
const isAdmin = (req: AuthRequest): boolean => {
  return req.user?.role === 'admin';
};

/**
 * Get platform metrics overview
 * GET /api/admin/analytics/metrics
 */
export const getPlatformMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const metrics = await analyticsService.getPlatformMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get platform metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform metrics',
    });
  }
};

/**
 * Get churned users analysis
 * GET /api/admin/analytics/churned-users
 */
export const getChurnedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const daysInactive = parseInt(req.query.days as string) || 30;
    const limit = parseInt(req.query.limit as string) || 50;

    const churnedUsers = await analyticsService.getChurnedUsers(daysInactive, limit);

    res.status(200).json({
      success: true,
      data: { users: churnedUsers },
    });
  } catch (error) {
    console.error('Get churned users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get churned users',
    });
  }
};

/**
 * Get new users without engagement
 * GET /api/admin/analytics/inactive-new-users
 */
export const getInactiveNewUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;
    const limit = parseInt(req.query.limit as string) || 50;

    const users = await analyticsService.getNewUsersWithoutEngagement(days, limit);

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Get inactive new users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get inactive new users',
    });
  }
};

/**
 * Get top performing authors
 * GET /api/admin/analytics/top-authors
 */
export const getTopAuthors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const authors = await analyticsService.getTopAuthors(limit);

    res.status(200).json({
      success: true,
      data: { authors },
    });
  } catch (error) {
    console.error('Get top authors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top authors',
    });
  }
};

/**
 * Get genre analytics
 * GET /api/admin/analytics/genres
 */
export const getGenreAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const genreStats = await analyticsService.getGenreAnalytics();

    res.status(200).json({
      success: true,
      data: { genres: genreStats },
    });
  } catch (error) {
    console.error('Get genre analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get genre analytics',
    });
  }
};

/**
 * Get top performing books
 * GET /api/admin/analytics/top-books
 */
export const getTopBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'views';

    const books = await analyticsService.getTopBooks(
      limit,
      sortBy as 'views' | 'purchases' | 'quality' | 'revenue'
    );

    res.status(200).json({
      success: true,
      data: { books },
    });
  } catch (error) {
    console.error('Get top books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top books',
    });
  }
};

/**
 * Get daily activity trends
 * GET /api/admin/analytics/activity-trends
 */
export const getActivityTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;

    const trends = await analyticsService.getDailyActivityTrends(days);

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    console.error('Get activity trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity trends',
    });
  }
};

/**
 * Get books needing quality evaluation
 * GET /api/admin/analytics/books-need-evaluation
 */
export const getBooksNeedingEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const books = await analyticsService.getBooksNeedingEvaluation(limit);

    res.status(200).json({
      success: true,
      data: { books },
    });
  } catch (error) {
    console.error('Get books needing evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get books needing evaluation',
    });
  }
};

/**
 * Get user engagement funnel
 * GET /api/admin/analytics/engagement-funnel
 */
export const getEngagementFunnel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const funnel = await analyticsService.getEngagementFunnel();

    res.status(200).json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('Get engagement funnel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engagement funnel',
    });
  }
};

// ==================== NEW ANALYTICS ENDPOINTS ====================

/**
 * Get retention cohort analysis
 * GET /api/admin/analytics/retention-cohorts
 */
export const getRetentionCohorts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const monthsBack = parseInt(req.query.months as string) || 6;

    const cohorts = await analyticsService.getRetentionCohorts(monthsBack);

    res.status(200).json({
      success: true,
      data: { cohorts },
    });
  } catch (error) {
    console.error('Get retention cohorts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retention cohorts',
    });
  }
};

/**
 * Get user lifetime value
 * GET /api/admin/analytics/user-ltv/:userId
 */
export const getUserLTV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const { userId } = req.params;

    const ltv = await analyticsService.calculateUserLTV(userId);

    if (!ltv) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ltv,
    });
  } catch (error) {
    console.error('Get user LTV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user LTV',
    });
  }
};

/**
 * Get average LTV by segment
 * GET /api/admin/analytics/ltv-segments
 */
export const getLTVSegments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const segments = await analyticsService.getAverageLTVBySegment();

    res.status(200).json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Get LTV segments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get LTV segments',
    });
  }
};

/**
 * Get predicted churn users
 * GET /api/admin/analytics/predicted-churn
 */
export const getPredictedChurn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const threshold = parseFloat(req.query.threshold as string) || 0.5;
    const limit = parseInt(req.query.limit as string) || 50;

    const predictions = await analyticsService.getPredictedChurnUsers(threshold, limit);

    res.status(200).json({
      success: true,
      data: { users: predictions },
    });
  } catch (error) {
    console.error('Get predicted churn error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predicted churn users',
    });
  }
};

/**
 * Get real-time activity snapshot
 * GET /api/admin/analytics/real-time
 */
export const getRealTimeActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const activity = await analyticsService.getRealTimeActivity();

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Get real-time activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get real-time activity',
    });
  }
};

/**
 * Get revenue analytics
 * GET /api/admin/analytics/revenue
 */
export const getRevenueAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const period = (req.query.period as string) || 'month';

    const revenue = await analyticsService.getRevenueAnalytics(
      period as 'day' | 'week' | 'month'
    );

    res.status(200).json({
      success: true,
      data: revenue,
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue analytics',
    });
  }
};

// ==================== SOCIAL ENGAGEMENT ANALYTICS ====================

/**
 * Get social engagement overview
 * GET /api/admin/analytics/social-engagement
 */
export const getSocialEngagement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const overview = await analyticsService.getSocialEngagementOverview();

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Get social engagement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get social engagement metrics',
    });
  }
};

/**
 * Get most engaged users
 * GET /api/admin/analytics/engaged-users
 */
export const getMostEngagedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const users = await analyticsService.getMostEngagedUsers(limit);

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Get most engaged users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engaged users',
    });
  }
};

/**
 * Get top engaged books by social metrics
 * GET /api/admin/analytics/engaged-books
 */
export const getTopEngagedBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const books = await analyticsService.getTopEngagedBooks(limit);

    res.status(200).json({
      success: true,
      data: { books },
    });
  } catch (error) {
    console.error('Get top engaged books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engaged books',
    });
  }
};

/**
 * Get social engagement trends over time
 * GET /api/admin/analytics/social-trends
 */
export const getSocialTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const trends = await analyticsService.getSocialEngagementTrends(days);

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    console.error('Get social trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get social trends',
    });
  }
};
