/**
 * Notification Controller
 * Handles notification API endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notificationService';
import { NotificationType } from '../models/Notification';
import { NotificationPreferences, INotificationPreferences } from '../models/NotificationPreferences';

// UUID validation regex for Supabase
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as NotificationType | undefined;
    const unreadOnly = req.query.unreadOnly === 'true';
    const includeArchived = req.query.includeArchived === 'true';

    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      limit,
      type,
      unreadOnly,
      includeArchived,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications',
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count',
    });
  }
};

/**
 * Get notification summary
 * GET /api/notifications/summary
 */
export const getNotificationSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const summary = await notificationService.getNotificationSummary(req.user.id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Get notification summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notification summary',
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    const success = await notificationService.markAsRead(id, req.user.id);

    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const count = await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { markedCount: count },
    });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notifications as read',
    });
  }
};

/**
 * Archive notification
 * PUT /api/notifications/:id/archive
 */
export const archiveNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    const success = await notificationService.archiveNotification(id, req.user.id);

    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification archived',
    });
  } catch (error: any) {
    console.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to archive notification',
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      res.status(400).json({ success: false, error: 'Invalid notification ID' });
      return;
    }

    const success = await notificationService.deleteNotification(id, req.user.id);

    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete notification',
    });
  }
};

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get or create default preferences for user
    const preferences = await NotificationPreferences.getOrCreateForUser(req.user.id);

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notification preferences',
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const {
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      emailDigest,
      quietHoursStart,
      quietHoursEnd,
      quietHoursEnabled,
    } = req.body;

    // Validate emailDigest if provided
    if (emailDigest && !['none', 'daily', 'weekly'].includes(emailDigest)) {
      res.status(400).json({
        success: false,
        error: 'Invalid emailDigest value. Must be "none", "daily", or "weekly"',
      });
      return;
    }

    // Validate quiet hours format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (quietHoursStart && !timeRegex.test(quietHoursStart)) {
      res.status(400).json({
        success: false,
        error: 'Invalid quietHoursStart format. Use HH:MM (e.g., "22:00")',
      });
      return;
    }
    if (quietHoursEnd && !timeRegex.test(quietHoursEnd)) {
      res.status(400).json({
        success: false,
        error: 'Invalid quietHoursEnd format. Use HH:MM (e.g., "08:00")',
      });
      return;
    }

    // Build update object with only provided fields
    const updateData: Partial<INotificationPreferences> = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (inAppNotifications !== undefined) updateData.inAppNotifications = inAppNotifications;
    if (emailDigest !== undefined) updateData.emailDigest = emailDigest;
    if (quietHoursStart !== undefined) updateData.quietHoursStart = quietHoursStart;
    if (quietHoursEnd !== undefined) updateData.quietHoursEnd = quietHoursEnd;
    if (quietHoursEnabled !== undefined) updateData.quietHoursEnabled = quietHoursEnabled;

    // Upsert preferences (create if not exists, update if exists)
    const preferences = await NotificationPreferences.upsert(req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: preferences,
    });
  } catch (error: any) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update notification preferences',
    });
  }
};
