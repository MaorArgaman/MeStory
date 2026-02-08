/**
 * Notification Service
 * Handles creating and managing notifications for all user events
 */

import mongoose from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { Book } from '../models/Book';

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
  const notification = new Notification({
    recipient: new mongoose.Types.ObjectId(params.recipientId),
    sender: params.senderId ? new mongoose.Types.ObjectId(params.senderId) : null,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data,
  });

  await notification.save();
  return notification;
}

/**
 * Create multiple notifications (batch)
 */
export async function createBatchNotifications(
  notifications: CreateNotificationParams[]
): Promise<INotification[]> {
  const docs = notifications.map((n) => ({
    recipient: new mongoose.Types.ObjectId(n.recipientId),
    sender: n.senderId ? new mongoose.Types.ObjectId(n.senderId) : null,
    type: n.type,
    title: n.title,
    message: n.message,
    data: n.data,
  }));

  return await Notification.insertMany(docs) as unknown as INotification[];
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
    User.findById(likerId).select('name'),
    Book.findById(bookId).select('title'),
  ]);

  if (!liker || !book) return null;

  return createNotification({
    recipientId: authorId,
    senderId: likerId,
    type: 'like',
    title: 'לייק חדש על הספר שלך! ❤️',
    message: `${liker.name} אהב/ה את הספר "${book.title}"`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
    User.findById(commenterId).select('name'),
    Book.findById(bookId).select('title'),
  ]);

  if (!commenter || !book) return null;

  const ratingText = rating ? ` (${rating} כוכבים)` : '';

  return createNotification({
    recipientId: authorId,
    senderId: commenterId,
    type: 'comment',
    title: 'תגובה חדשה על הספר שלך! 💬',
    message: `${commenter.name} כתב/ה תגובה על "${book.title}"${ratingText}`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
    User.findById(sharerId).select('name'),
    Book.findById(bookId).select('title'),
  ]);

  if (!sharer || !book) return null;

  const platformText = platform ? ` ב-${platform}` : '';

  return createNotification({
    recipientId: authorId,
    senderId: sharerId,
    type: 'share',
    title: 'הספר שלך שותף! 🔗',
    message: `${sharer.name} שיתף/ה את הספר "${book.title}"${platformText}`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
    User.findById(buyerId).select('name'),
    Book.findById(bookId).select('title'),
  ]);

  if (!buyer || !book) return null;

  return createNotification({
    recipientId: authorId,
    senderId: buyerId,
    type: 'purchase',
    title: 'מכירה חדשה! 🎉',
    message: `${buyer.name} רכש/ה את הספר "${book.title}" תמורת ${amount} ${currency}`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
  const sender = await User.findById(senderId).select('name');
  if (!sender) return null;

  const bookContext = bookTitle ? ` (בנוגע ל"${bookTitle}")` : '';

  return createNotification({
    recipientId,
    senderId,
    type: 'new_message',
    title: `הודעה חדשה מ-${sender.name}`,
    message: `${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}${bookContext}`,
    data: {
      conversationId: new mongoose.Types.ObjectId(conversationId),
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
    title: 'תשלום התקבל בהצלחה! ✅',
    message: `התקבל תשלום בסך ${amount} ${currency} - ${description}`,
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
    ? `שודרגת לחבילת ${newPlan}! 🚀`
    : `החבילה שלך עודכנה ל-${newPlan}`;

  const message = isUpgrade
    ? `מזל טוב! עכשיו יש לך גישה לכל התכונות המתקדמות של חבילת ${newPlan}`
    : `החבילה שלך עודכנה בהצלחה לחבילת ${newPlan}`;

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
    title: 'הספר שלך פורסם! 📚',
    message: `הספר "${bookTitle}" פורסם בהצלחה ועכשיו זמין לקריאה`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
      bookId: new mongoose.Types.ObjectId(bookId),
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
    FEATURED: 'נבחר להיות ספר מומלץ',
    TRENDING: 'עולה במגמות',
    RISING_STAR: 'זוהה ככוכב עולה',
    EDITOR_PICK: 'נבחר על ידי העורכים',
  }[promotionType] || 'קודם';

  return createNotification({
    recipientId: authorId,
    type: 'promotion',
    title: `הספר שלך ${typeText}! 🌟`,
    message: `הספר "${bookTitle}" ${typeText} ויקבל חשיפה נוספת`,
    data: {
      bookId: new mongoose.Types.ObjectId(bookId),
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
  const skip = (page - 1) * limit;

  const query: any = { recipient: userId };
  if (type) query.type = type;
  if (unreadOnly) query.isRead = false;
  if (!includeArchived) query.isArchived = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isArchived: false,
    }),
  ]);

  return { notifications: notifications as unknown as INotification[], total, unreadCount };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  const result = await Notification.updateOne(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() }
  );
  return result.modifiedCount > 0;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result.modifiedCount;
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string, userId: string): Promise<boolean> {
  const result = await Notification.updateOne(
    { _id: notificationId, recipient: userId },
    { isArchived: true }
  );
  return result.modifiedCount > 0;
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  const result = await Notification.deleteOne({
    _id: notificationId,
    recipient: userId,
  });
  return result.deletedCount > 0;
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
  const [total, unread, byTypeResult] = await Promise.all([
    Notification.countDocuments({ recipient: userId, isArchived: false }),
    Notification.countDocuments({ recipient: userId, isRead: false, isArchived: false }),
    Notification.aggregate([
      { $match: { recipient: new mongoose.Types.ObjectId(userId), isArchived: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  const byType: Record<string, number> = {};
  byTypeResult.forEach((r: any) => {
    byType[r._id] = r.count;
  });

  return { total, unread, byType: byType as Record<NotificationType, number> };
}
