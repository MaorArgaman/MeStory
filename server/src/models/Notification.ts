import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Notification types
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

// Notification interface
export interface INotification {
  id: string;
  _id?: string;
  recipient: string;
  sender?: string;
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
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface NotificationRow {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// Transform function
function rowToNotification(row: NotificationRow): INotification {
  return {
    id: row.id,
    _id: row.id,
    recipient: row.recipient_id,
    sender: row.sender_id || undefined,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    data: row.data || undefined,
    isRead: row.is_read,
    readAt: row.read_at || undefined,
    isArchived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Notification Model class
export class Notification {
  static async findById(id: string): Promise<INotification | null> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToNotification(data as NotificationRow);
  }

  static async findOne(query: Record<string, any>): Promise<INotification | null> {
    let queryBuilder = supabaseAdmin.from('notifications').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.recipient) {
      queryBuilder = queryBuilder.eq('recipient_id', query.recipient);
    }
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToNotification(data as NotificationRow);
  }

  static async create(notificationData: Partial<INotification>): Promise<INotification> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      recipient_id: notificationData.recipient,
      sender_id: notificationData.sender || null,
      type: notificationData.type || 'system',
      title: notificationData.title || '',
      message: notificationData.message || '',
      data: notificationData.data || null,
      is_read: notificationData.isRead || false,
      read_at: notificationData.readAt || null,
      is_archived: notificationData.isArchived || false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error(error.message);
    }

    return rowToNotification(data as NotificationRow);
  }

  static async find(query: Record<string, any> = {}): Promise<INotification[]> {
    let queryBuilder = supabaseAdmin.from('notifications').select('*');

    if (query.recipient) {
      queryBuilder = queryBuilder.eq('recipient_id', query.recipient);
    }
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }
    if (query.isRead !== undefined) {
      queryBuilder = queryBuilder.eq('is_read', query.isRead);
    }
    if (query.isArchived !== undefined) {
      queryBuilder = queryBuilder.eq('is_archived', query.isArchived);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    if (query._limit) {
      queryBuilder = queryBuilder.limit(query._limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding notifications:', error);
      return [];
    }

    return (data || []).map(row => rowToNotification(row as NotificationRow));
  }

  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true });

    if (query.recipient) {
      queryBuilder = queryBuilder.eq('recipient_id', query.recipient);
    }
    if (query.isRead !== undefined) {
      queryBuilder = queryBuilder.eq('is_read', query.isRead);
    }
    if (query.isArchived !== undefined) {
      queryBuilder = queryBuilder.eq('is_archived', query.isArchived);
    }

    const { count, error } = await queryBuilder;

    if (error) return 0;
    return count || 0;
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<INotification> | { $set?: any }
  ): Promise<INotification | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const setData = '$set' in update ? update.$set : update;

    if (setData.isRead !== undefined) {
      updateData.is_read = setData.isRead;
      if (setData.isRead) {
        updateData.read_at = new Date().toISOString();
      }
    }
    if (setData.isArchived !== undefined) {
      updateData.is_archived = setData.isArchived;
    }
    if (setData.title !== undefined) {
      updateData.title = setData.title;
    }
    if (setData.message !== undefined) {
      updateData.message = setData.message;
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToNotification(data as NotificationRow);
  }

  static async findByIdAndDelete(id: string): Promise<INotification | null> {
    const notification = await this.findById(id);
    if (!notification) return null;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) return null;
    return notification;
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(recipientId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('recipient_id', recipientId)
      .eq('is_read', false)
      .select();

    if (error) return 0;
    return data?.length || 0;
  }

  // Update many notifications
  static async updateMany(
    query: Record<string, any>,
    update: Partial<INotification>
  ): Promise<number> {
    let queryBuilder = supabaseAdmin.from('notifications').update({
      ...update,
      updated_at: new Date().toISOString(),
    });

    if (query.recipient) {
      queryBuilder = queryBuilder.eq('recipient_id', query.recipient);
    }
    if (query.isRead !== undefined) {
      queryBuilder = queryBuilder.eq('is_read', query.isRead);
    }

    const { data, error } = await queryBuilder.select();

    if (error) return 0;
    return data?.length || 0;
  }
}

export default Notification;
