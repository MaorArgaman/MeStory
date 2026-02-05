/**
 * Notification API Service
 * Handles notification-related API calls
 */

import api from './api';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'share'
  | 'purchase'
  | 'new_message'
  | 'new_follower'
  | 'book_published'
  | 'payment'
  | 'subscription'
  | 'quality_score'
  | 'mention'
  | 'system'
  | 'promotion';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    bookId?: string;
    bookTitle?: string;
    conversationId?: string;
    paymentId?: string;
    amount?: number;
    currency?: string;
    subscriptionPlan?: string;
    qualityScore?: number;
    link?: string;
  };
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationSummary {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

/**
 * Get user notifications
 */
export const getNotifications = async (
  page = 1,
  limit = 20,
  options?: {
    type?: NotificationType;
    unreadOnly?: boolean;
    includeArchived?: boolean;
  }
): Promise<NotificationsResponse> => {
  const params: any = { page, limit };
  if (options?.type) params.type = options.type;
  if (options?.unreadOnly) params.unreadOnly = 'true';
  if (options?.includeArchived) params.includeArchived = 'true';

  const response = await api.get('/notifications', { params });
  return response.data.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.data.unreadCount;
};

/**
 * Get notification summary
 */
export const getNotificationSummary = async (): Promise<NotificationSummary> => {
  const response = await api.get('/notifications/summary');
  return response.data.data;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<number> => {
  const response = await api.put('/notifications/read-all');
  return response.data.data.markedCount;
};

/**
 * Archive notification
 */
export const archiveNotification = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/archive`);
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
