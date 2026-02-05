import { Router } from 'express';
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getFlaggedBooks,
  unpublishBook,
} from '../controllers/adminController';
import {
  getPlatformMetrics,
  getChurnedUsers,
  getInactiveNewUsers,
  getTopAuthors,
  getGenreAnalytics,
  getTopBooks,
  getActivityTrends,
  getBooksNeedingEvaluation,
  getEngagementFunnel,
  getRetentionCohorts,
  getUserLTV,
  getLTVSegments,
  getPredictedChurn,
  getRealTimeActivity,
  getRevenueAnalytics,
  getSocialEngagement,
  getMostEngagedUsers,
  getTopEngagedBooks,
  getSocialTrends,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

/**
 * Admin Routes
 * All routes require authentication + admin role
 */

// Apply authentication and admin check to all routes
router.use(authenticate as any);
router.use(requireAdmin as any);

// ==================== ADMIN MANAGEMENT ====================

// GET /api/admin/stats - Get platform statistics
router.get('/stats', getStats as any);

// GET /api/admin/users - Get all users with filters
router.get('/users', getUsers as any);

// PUT /api/admin/users/:id - Update user (role, credits, ban)
router.put('/users/:id', updateUser as any);

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', deleteUser as any);

// GET /api/admin/books/flagged - Get low quality books
router.get('/books/flagged', getFlaggedBooks as any);

// PUT /api/admin/books/:id/unpublish - Unpublish a book
router.put('/books/:id/unpublish', unpublishBook as any);

// ==================== ANALYTICS ====================

// GET /api/admin/analytics/metrics - Platform overview
router.get('/analytics/metrics', getPlatformMetrics as any);

// GET /api/admin/analytics/real-time - Real-time activity snapshot
router.get('/analytics/real-time', getRealTimeActivity as any);

// GET /api/admin/analytics/churned-users - Churned users analysis
router.get('/analytics/churned-users', getChurnedUsers as any);

// GET /api/admin/analytics/predicted-churn - Predicted churn users
router.get('/analytics/predicted-churn', getPredictedChurn as any);

// GET /api/admin/analytics/inactive-new-users - New users without engagement
router.get('/analytics/inactive-new-users', getInactiveNewUsers as any);

// GET /api/admin/analytics/retention-cohorts - Retention cohort analysis
router.get('/analytics/retention-cohorts', getRetentionCohorts as any);

// GET /api/admin/analytics/user-ltv/:userId - User lifetime value
router.get('/analytics/user-ltv/:userId', getUserLTV as any);

// GET /api/admin/analytics/ltv-segments - LTV by segment
router.get('/analytics/ltv-segments', getLTVSegments as any);

// GET /api/admin/analytics/engagement-funnel - Engagement funnel
router.get('/analytics/engagement-funnel', getEngagementFunnel as any);

// GET /api/admin/analytics/top-books - Top performing books
router.get('/analytics/top-books', getTopBooks as any);

// GET /api/admin/analytics/top-authors - Top performing authors
router.get('/analytics/top-authors', getTopAuthors as any);

// GET /api/admin/analytics/genres - Genre analytics
router.get('/analytics/genres', getGenreAnalytics as any);

// GET /api/admin/analytics/books-need-evaluation - Books needing evaluation
router.get('/analytics/books-need-evaluation', getBooksNeedingEvaluation as any);

// GET /api/admin/analytics/activity-trends - Daily activity trends
router.get('/analytics/activity-trends', getActivityTrends as any);

// GET /api/admin/analytics/revenue - Revenue analytics
router.get('/analytics/revenue', getRevenueAnalytics as any);

// ==================== SOCIAL ENGAGEMENT ANALYTICS ====================

// GET /api/admin/analytics/social-engagement - Social engagement overview
router.get('/analytics/social-engagement', getSocialEngagement as any);

// GET /api/admin/analytics/engaged-users - Most engaged users
router.get('/analytics/engaged-users', getMostEngagedUsers as any);

// GET /api/admin/analytics/engaged-books - Top engaged books
router.get('/analytics/engaged-books', getTopEngagedBooks as any);

// GET /api/admin/analytics/social-trends - Social engagement trends
router.get('/analytics/social-trends', getSocialTrends as any);

export default router;
