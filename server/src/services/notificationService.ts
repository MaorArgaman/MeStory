/**
 * Notification Service
 * Handles creating and managing notifications for all user events
 */

import { Notification, INotification, NotificationType } from '../models/Notification';
import { NotificationPreferences, INotificationPreferences, DEFAULT_PREFERENCES } from '../models/NotificationPreferences';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { sendNotificationToUser, emitUnreadCountUpdate } from './socketService';

// Supported languages
type Language = 'en' | 'he';

// Translation map for notification messages
const translations = {
  qualityScore: {
    en: {
      title: (score: number) => `Quality score for your book: ${score}/100`,
      message: (bookTitle: string, ratingLabel: string, score: number) =>
        `Your book "${bookTitle}" received a quality score: ${ratingLabel} (${score}/100)`
    },
    he: {
      title: (score: number) => `ציון איכות לספר שלך: ${score}/100 ⭐`,
      message: (bookTitle: string, ratingLabel: string, score: number) =>
        `הספר "${bookTitle}" קיבל ציון איכות: ${ratingLabel} (${score}/100)`
    }
  },
  bookLike: {
    en: {
      title: 'New like on your book!',
      message: (likerName: string, bookTitle: string) => `${likerName} liked your book "${bookTitle}"`
    },
    he: {
      title: 'לייק חדש על הספר שלך!',
      message: (likerName: string, bookTitle: string) => `${likerName} אהב את הספר שלך "${bookTitle}"`
    }
  },
  bookComment: {
    en: {
      title: 'New comment on your book!',
      message: (commenterName: string, bookTitle: string, ratingText: string) =>
        `${commenterName} commented on "${bookTitle}"${ratingText}`
    },
    he: {
      title: 'תגובה חדשה על הספר שלך!',
      message: (commenterName: string, bookTitle: string, ratingText: string) =>
        `${commenterName} הגיב על "${bookTitle}"${ratingText}`
    }
  },
  bookShare: {
    en: {
      title: 'Your book was shared!',
      message: (sharerName: string, bookTitle: string, platformText: string) =>
        `${sharerName} shared your book "${bookTitle}"${platformText}`
    },
    he: {
      title: 'הספר שלך שותף!',
      message: (sharerName: string, bookTitle: string, platformText: string) =>
        `${sharerName} שיתף את הספר שלך "${bookTitle}"${platformText}`
    }
  },
  bookPurchase: {
    en: {
      title: 'New sale!',
      message: (buyerName: string, bookTitle: string, amount: number, currency: string) =>
        `${buyerName} purchased your book "${bookTitle}" for ${amount} ${currency}`
    },
    he: {
      title: 'מכירה חדשה!',
      message: (buyerName: string, bookTitle: string, amount: number, currency: string) =>
        `${buyerName} רכש את הספר שלך "${bookTitle}" תמורת ${amount} ${currency}`
    }
  },
  newMessage: {
    en: {
      title: (senderName: string) => `New message from ${senderName}`,
    },
    he: {
      title: (senderName: string) => `הודעה חדשה מ-${senderName}`,
    }
  },
  paymentReceived: {
    en: {
      title: 'Payment received!',
      message: (amount: number, currency: string, description: string) =>
        `Payment of ${amount} ${currency} received - ${description}`
    },
    he: {
      title: 'התקבל תשלום!',
      message: (amount: number, currency: string, description: string) =>
        `התקבל תשלום של ${amount} ${currency} - ${description}`
    }
  },
  subscriptionChange: {
    en: {
      titleUpgrade: (plan: string) => `Upgraded to ${plan}!`,
      titleDowngrade: (plan: string) => `Your plan changed to ${plan}`,
      messageUpgrade: (plan: string) => `Congratulations! You now have access to all advanced features of the ${plan} plan`,
      messageDowngrade: (plan: string) => `Your plan has been successfully updated to ${plan}`
    },
    he: {
      titleUpgrade: (plan: string) => `שודרגת ל-${plan}!`,
      titleDowngrade: (plan: string) => `התוכנית שלך שונתה ל-${plan}`,
      messageUpgrade: (plan: string) => `מזל טוב! כעת יש לך גישה לכל התכונות המתקדמות של תוכנית ${plan}`,
      messageDowngrade: (plan: string) => `התוכנית שלך עודכנה בהצלחה ל-${plan}`
    }
  },
  bookPublished: {
    en: {
      title: 'Your book is published!',
      message: (bookTitle: string) => `Your book "${bookTitle}" has been published and is now available for reading`
    },
    he: {
      title: 'הספר שלך פורסם!',
      message: (bookTitle: string) => `הספר שלך "${bookTitle}" פורסם וכעת זמין לקריאה`
    }
  },
  bookPromotion: {
    en: {
      typeText: {
        FEATURED: 'is now featured',
        TRENDING: 'is trending',
        RISING_STAR: 'is a rising star',
        EDITOR_PICK: 'was selected as editor\'s pick',
        default: 'promoted'
      },
      title: (typeText: string) => `Your book ${typeText}!`,
      message: (bookTitle: string, typeText: string) => `Your book "${bookTitle}" ${typeText} and will receive additional exposure`
    },
    he: {
      typeText: {
        FEATURED: 'מוצג עכשיו',
        TRENDING: 'במגמת עלייה',
        RISING_STAR: 'כוכב עולה',
        EDITOR_PICK: 'נבחר כבחירת העורך',
        default: 'קודם'
      },
      title: (typeText: string) => `הספר שלך ${typeText}!`,
      message: (bookTitle: string, typeText: string) => `הספר שלך "${bookTitle}" ${typeText} ויקבל חשיפה נוספת`
    }
  }
};

/**
 * Get user's preferred language
 */
async function getUserLanguage(userId: string): Promise<Language> {
  try {
    const user = await User.findById(userId);
    return (user?.profile?.language as Language) || 'en';
  } catch {
    return 'en';
  }
}

// UUID validation helper
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ==================== PREFERENCE CHECKING ====================

/**
 * Map notification type to in-app preference key
 */
function getInAppPreferenceKey(type: NotificationType): keyof INotificationPreferences['inAppNotifications'] | null {
  const mapping: Record<NotificationType, keyof INotificationPreferences['inAppNotifications'] | null> = {
    'like': 'likes',
    'comment': 'comments',
    'share': 'shares',
    'purchase': 'purchases',
    'new_message': 'messages',
    'new_follower': 'newFollowers',
    'book_published': 'bookUpdates',
    'payment': 'payments',
    'subscription': 'subscriptions',
    'quality_score': 'qualityScore',
    'mention': 'mentions',
    'system': 'system',
    'promotion': 'promotions',
  };
  return mapping[type] || null;
}

/**
 * Check if user is in quiet hours
 */
function isInQuietHours(prefs: INotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const start = prefs.quietHoursStart;
  const end = prefs.quietHoursEnd;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  } else {
    return currentTime >= start && currentTime < end;
  }
}

/**
 * Check if notification should be sent based on user preferences
 */
async function shouldSendInAppNotification(
  recipientId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const prefs = await NotificationPreferences.findByUserId(recipientId);

    // If no preferences exist, use defaults (all enabled)
    if (!prefs) {
      return true;
    }

    // Check quiet hours first
    if (isInQuietHours(prefs)) {
      // During quiet hours, only allow system notifications
      if (type !== 'system') {
        return false;
      }
    }

    // Check specific notification type preference
    const prefKey = getInAppPreferenceKey(type);
    if (prefKey && prefs.inAppNotifications) {
      return prefs.inAppNotifications[prefKey] !== false;
    }

    // Default to allowing notification
    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // On error, allow notification
    return true;
  }
}

/**
 * Get user preferences (for external use)
 */
export async function getUserPreferences(userId: string): Promise<INotificationPreferences | null> {
  return NotificationPreferences.findByUserId(userId);
}

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
 * Checks user preferences before creating/sending
 */
export async function createNotification(params: CreateNotificationParams): Promise<INotification | null> {
  // Check if notification should be sent based on user preferences
  const shouldSend = await shouldSendInAppNotification(params.recipientId, params.type);

  if (!shouldSend) {
    console.log(`Notification of type ${params.type} suppressed for user ${params.recipientId} due to preferences`);
    return null;
  }

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

  const [liker, book, lang] = await Promise.all([
    User.findById(likerId),
    Book.findById(bookId),
    getUserLanguage(authorId),
  ]);

  if (!liker || !book) return null;

  const t = translations.bookLike[lang];

  return createNotification({
    recipientId: authorId,
    senderId: likerId,
    type: 'like',
    title: t.title,
    message: t.message(liker.name, book.title),
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

  const [commenter, book, lang] = await Promise.all([
    User.findById(commenterId),
    Book.findById(bookId),
    getUserLanguage(authorId),
  ]);

  if (!commenter || !book) return null;

  const ratingText = rating ? (lang === 'he' ? ` (${rating} כוכבים)` : ` (${rating} stars)`) : '';
  const t = translations.bookComment[lang];

  return createNotification({
    recipientId: authorId,
    senderId: commenterId,
    type: 'comment',
    title: t.title,
    message: t.message(commenter.name, book.title, ratingText),
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

  const [sharer, book, lang] = await Promise.all([
    User.findById(sharerId),
    Book.findById(bookId),
    getUserLanguage(authorId),
  ]);

  if (!sharer || !book) return null;

  const platformText = platform ? (lang === 'he' ? ` ב-${platform}` : ` on ${platform}`) : '';
  const t = translations.bookShare[lang];

  return createNotification({
    recipientId: authorId,
    senderId: sharerId,
    type: 'share',
    title: t.title,
    message: t.message(sharer.name, book.title, platformText),
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

  const [buyer, book, lang] = await Promise.all([
    User.findById(buyerId),
    Book.findById(bookId),
    getUserLanguage(authorId),
  ]);

  if (!buyer || !book) return null;

  const t = translations.bookPurchase[lang];

  return createNotification({
    recipientId: authorId,
    senderId: buyerId,
    type: 'purchase',
    title: t.title,
    message: t.message(buyer.name, book.title, amount, currency),
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
  const [sender, lang] = await Promise.all([
    User.findById(senderId),
    getUserLanguage(recipientId),
  ]);
  if (!sender) return null;

  const bookContext = bookTitle
    ? (lang === 'he' ? ` (על "${bookTitle}")` : ` (about "${bookTitle}")`)
    : '';
  const t = translations.newMessage[lang];

  return createNotification({
    recipientId,
    senderId,
    type: 'new_message',
    title: t.title(sender.name),
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
  const lang = await getUserLanguage(userId);
  const t = translations.paymentReceived[lang];

  return createNotification({
    recipientId: userId,
    type: 'payment',
    title: t.title,
    message: t.message(amount, currency, description),
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
  const lang = await getUserLanguage(userId);
  const t = translations.subscriptionChange[lang];

  const title = isUpgrade
    ? t.titleUpgrade(newPlan)
    : t.titleDowngrade(newPlan);

  const message = isUpgrade
    ? t.messageUpgrade(newPlan)
    : t.messageDowngrade(newPlan);

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
  const lang = await getUserLanguage(authorId);
  const t = translations.bookPublished[lang];

  return createNotification({
    recipientId: authorId,
    type: 'book_published',
    title: t.title,
    message: t.message(bookTitle),
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
  const lang = await getUserLanguage(authorId);
  const t = translations.qualityScore[lang];

  return createNotification({
    recipientId: authorId,
    type: 'quality_score',
    title: t.title(score),
    message: t.message(bookTitle, ratingLabel, score),
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
  const lang = await getUserLanguage(authorId);
  const t = translations.bookPromotion[lang];

  const typeTextMap = t.typeText as Record<string, string>;
  const typeText = typeTextMap[promotionType] || typeTextMap.default;

  return createNotification({
    recipientId: authorId,
    type: 'promotion',
    title: t.title(typeText),
    message: t.message(bookTitle, typeText),
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
