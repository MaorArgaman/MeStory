/**
 * Notification Service
 * Handles creating and managing notifications for all user events
 */

import { Notification, INotification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { sendNotificationToUser, emitUnreadCountUpdate } from './socketService';

// UUID validation helper
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ==================== NOTIFICATION CREATION ====================

interface CreateNotificationParams {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: INotification['data'];
}

/**
 * Create a notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<INotification> {
  const notification = await Notification.create({
    recipient: params.recipientId,
    sender: params.senderId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data,
  });

  // Emit real-time notification via Socket.IO
  sendNotificationToUser(params.recipientId, {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    sender: params.senderId ? await User.findById(params.senderId) : null,
  });

  // Also update the unread count
  const unreadCount = await getUnreadCount(params.recipientId);
  emitUnreadCountUpdate(params.recipientId, unreadCount);

  return notification;
}

/**
 * Create multiple notifications (batch)
 */
export async function createBatchNotifications(
  notifications: CreateNotificationParams[]
): Promise<INotification[]> {
  // Create notifications one by one since Supabase model doesn't have insertMany
  const results: INotification[] = [];
  for (const n of notifications) {
    const notification = await Notification.create({
      recipient: n.recipientId,
      sender: n.senderId || undefined,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
    });
    results.push(notification);
  }
  return results;
}

// ==================== SPECIFIC NOTIFICATION TYPES ====================

/**
 * Notify author when someone likes their book
 */
export async function notifyBookLike(
  bookId: string,
  likerId: string,
  authorId: string
): Promise<INotification | null> {
  // Don't notify if liking own book
  if (likerId === authorId) return null;

  const [liker, book] = await Promise.all([
    User.findById(likerId),
    Book.findById(bookId),
  ]);

  if (!liker || !book) return null;

  return createNotification({
    recipientId: authorId,
    senderId: likerId,
    type: 'like',
    title: 'New like on your book!',
    message: `${liker.name} liked your book "${book.title}"`,
    data: {
      bookId: bookId,
      bookTitle: book.title,
      link: `/reader/${bookId}`,
    },
  });
}

/**
 * Notify author when someone comments/reviews their book
 */
export async function notifyBookComment(
  bookId: string,
  commenterId: string,
  authorId: string,
  rating?: number
): Promise<INotification | null> {
  if (commenterId === authorId) return null;

  const [commenter, book] = await Promise.all([
    User.findById(commenterId),
    Book.findById(bookId),
  ]);

  if (!commenter || !book) return null;

  const ratingText = rating ? ` (${rating} stars)` : '';

  return createNotification({
    recipientId: authorId,
    senderId: commenterId,
    type: 'comment',
    title: 'New comment on your book!',
    message: `${commenter.name} commented on "${book.title}"${ratingText}`,
    data: {
      bookId: bookId,
      bookTitle: book.title,
      link: `/reader/${bookId}`,
    },
  });
}

/**
 * Notify author when someone shares their book
 */
export async function notifyBookShare(
  bookId: string,
  sharerId: string,
  authorId: string,
  platform?: string
): Promise<INotification | null> {
  if (sharerId === authorId) return null;

  const [sharer, book] = await Promise.all([
    User.findById(sharerId),
    Book.findById(bookId),
  ]);

  if (!sharer || !book) return null;

  const platformText = platform ? ` on ${platform}` : '';

  return createNotification({
    recipientId: authorId,
    senderId: sharerId,
    type: 'share',
    title: 'Your book was shared!',
    message: `${sharer.name} shared your book "${book.title}"${platformText}`,
    data: {
      bookId: bookId,
      bookTitle: book.title,
      link: `/reader/${bookId}`,
    },
  });
}

/**
 * Notify author when someone purchases their book
 */
export async function notifyBookPurchase(
  bookId: string,
  buyerId: string,
  authorId: string,
  amount: number,
  currency: string = 'ILS'
): Promise<INotification | null> {
  if (buyerId === authorId) return null;

  const [buyer, book] = await Promise.all([
    User.findById(buyerId),
    Book.findById(bookId),
  ]);

  if (!buyer || !book) return null;

  return createNotification({
    recipientId: authorId,
    senderId: buyerId,
    type: 'purchase',
    title: 'New sale!',
    message: `${buyer.name} purchased your book "${book.title}" for ${amount} ${currency}`,
    data: {
      bookId: bookId,
      bookTitle: book.title,
      amount,
      currency,
      link: `/dashboard`,
    },
  });
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messagePreview: string,
  bookTitle?: string
): Promise<INotification | null> {
  const sender = await User.findById(senderId);
  if (!sender) return null;

  const bookContext = bookTitle ? ` (about "${bookTitle}")` : '';

  return createNotification({
    recipientId,
    senderId,
    type: 'new_message',
    title: `New message from ${sender.name}`,
    message: `${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}${bookContext}`,
    data: {
      conversationId: conversationId,
      bookTitle,
      link: `/messages/${conversationId}`,
    },
  });
}

/**
 * Notify user about payment received
 */
export async function notifyPaymentReceived(
  userId: string,
  amount: number,
  currency: string,
  paymentId: string,
  description: string
): Promise<INotification> {
  return createNotification({
    recipientId: userId,
    type: 'payment',
    title: 'Payment received!',
    message: `Payment of ${amount} ${currency} received - ${description}`,
    data: {
      paymentId,
      amount,
      currency,
      link: `/settings/payments`,
    },
  });
}

/**
 * Notify user about subscription change
 */
export async function notifySubscriptionChange(
  userId: string,
  newPlan: string,
  isUpgrade: boolean
): Promise<INotification> {
  const title = isUpgrade
    ? `Upgraded to ${newPlan}!`
    : `Your plan changed to ${newPlan}`;

  const message = isUpgrade
    ? `Congratulations! You now have access to all advanced features of the ${newPlan} plan`
    : `Your plan has been successfully updated to ${newPlan}`;

  return createNotification({
    recipientId: userId,
    type: 'subscription',
    title,
    message,
    data: {
      subscriptionPlan: newPlan,
      link: `/subscription`,
    },
  });
}

/**
 * Notify author when book is published
 */
export async function notifyBookPublished(
  authorId: string,
  bookId: string,
  bookTitle: string
): Promise<INotification> {
  return createNotification({
    recipientId: authorId,
    type: 'book_published',
    title: 'Your book is published!',
    message: `Your book "${bookTitle}" has been published and is now available for reading`,
    data: {
      bookId: bookId,
      bookTitle,
      link: `/reader/${bookId}`,
    },
  });
}

/**
 * Notify author when book gets quality score
 */
export async function notifyQualityScore(
  authorId: string,
  bookId: string,
  bookTitle: string,
  score: number,
  ratingLabel: string
): Promise<INotification> {
  return createNotification({
    recipientId: authorId,
    type: 'quality_score',
    title: `ציון איכות לספר שלך: ${score}/100 ⭐`,
    message: `הספר "${bookTitle}" קיבל ציון איכות: ${ratingLabel} (${score}/100)`,
    data: {
      bookId: bookId,
      bookTitle,
      qualityScore: score,
      link: `/book/${bookId}/layout`,
    },
  });
}

/**
 * Notify author when book is promoted/featured
 */
export async function notifyBookPromotion(
  authorId: string,
  bookId: string,
  bookTitle: string,
  promotionType: string
): Promise<INotification> {
  const typeText = {
    FEATURED: 'is now featured',
    TRENDING: 'is trending',
    RISING_STAR: 'is a rising star',
    EDITOR_PICK: 'was selected as editor\'s pick',
  }[promotionType] || 'promoted';

  return createNotification({
    recipientId: authorId,
    type: 'promotion',
    title: `Your book ${typeText}!`,
    message: `Your book "${bookTitle}" ${typeText} and will receive additional exposure`,
    data: {
      bookId: bookId,
      bookTitle,
      link: `/marketplace`,
    },
  });
}

/**
 * Send system notification to user
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<INotification> {
  return createNotification({
    recipientId: userId,
    type: 'system',
    title,
    message,
    data: link ? { link } : undefined,
  });
}

// ==================== NOTIFICATION MANAGEMENT ====================

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    unreadOnly?: boolean;
    includeArchived?: boolean;
  } = {}
): Promise<{
  notifications: INotification[];
  total: number;
  unreadCount: number;
}> {
  const { page = 1, limit = 20, type, unreadOnly = false, includeArchived = false } = options;

  const query: any = { recipient: userId, _limit: limit };
  if (type) query.type = type;
  if (unreadOnly) query.isRead = false;
  if (!includeArchived) query.isArchived = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query),
    Notification.countDocuments({ recipient: userId, isArchived: includeArchived ? undefined : false }),
    Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isArchived: false,
    }),
  ]);

  // Paginate in memory if needed
  const startIndex = (page - 1) * limit;
  const paginatedNotifications = notifications.slice(startIndex, startIndex + limit);

  return { notifications: paginatedNotifications, total, unreadCount };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  // First verify the notification belongs to this user
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.recipient !== userId) return false;

  const result = await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  return result !== null;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await Notification.markAllAsRead(userId);
  return result;
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string, userId: string): Promise<boolean> {
  // First verify the notification belongs to this user
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.recipient !== userId) return false;

  const result = await Notification.findByIdAndUpdate(notificationId, { isArchived: true });
  return result !== null;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  // First verify the notification belongs to this user
  const notification = await Notification.findById(notificationId);
  if (!notification || notification.recipient !== userId) return false;

  const result = await Notification.findByIdAndDelete(notificationId);
  return result !== null;
}

/**
 * Get unread count for user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false,
  });
}

/**
 * Get notification summary (counts by type)
 */
export async function getNotificationSummary(userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}> {
  // Get all notifications for user to calculate summary
  const notifications = await Notification.find({ recipient: userId, isArchived: false });

  const total = notifications.length;
  const unread = notifications.filter(n => !n.isRead).length;

  // Group by type
  const byType: Record<string, number> = {};
  for (const n of notifications) {
    byType[n.type] = (byType[n.type] || 0) + 1;
  }

  return { total, unread, byType: byType as Record<NotificationType, number> };
}
