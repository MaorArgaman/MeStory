/**
 * Notification Routes
 * API endpoints for user notifications
 */

import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  getNotificationSummary,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate as any);

/**
 * GET /api/notifications
 * Get user notifications with pagination and filters
 * Query: page, limit, type, unreadOnly, includeArchived
 */
router.get('/', getNotifications as any);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', getUnreadCount as any);

/**
 * GET /api/notifications/summary
 * Get notification summary (counts by type)
 */
router.get('/summary', getNotificationSummary as any);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', markAllAsRead as any);

/**
 * PUT /api/notifications/:id/read
 * Mark specific notification as read
 */
router.put('/:id/read', markAsRead as any);

/**
 * PUT /api/notifications/:id/archive
 * Archive a notification
 */
router.put('/:id/archive', archiveNotification as any);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', deleteNotification as any);

export default router;
