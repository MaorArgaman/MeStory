import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Email notification types
export interface IEmailNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  marketing: boolean;
}

// Push notification types
export interface IPushNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  mentions: boolean;
}

// In-app notification types
export interface IInAppNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  mentions: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  newFollowers: boolean;
  messages: boolean;
  payments: boolean;
  qualityScore: boolean;
  promotions: boolean;
  system: boolean;
}

// Email digest frequency
export type EmailDigestFrequency = 'none' | 'daily' | 'weekly';

// Notification Preferences interface
export interface INotificationPreferences {
  id: string;
  _id?: string;
  userId: string;
  emailNotifications: IEmailNotifications;
  pushNotifications: IPushNotifications;
  inAppNotifications: IInAppNotifications;
  emailDigest: EmailDigestFrequency;
  quietHoursStart: string | null; // e.g., "22:00"
  quietHoursEnd: string | null; // e.g., "08:00"
  quietHoursEnabled: boolean;
  created_at: string;
  updated_at: string;
}

// Database row type
interface NotificationPreferencesRow {
  id: string;
  user_id: string;
  email_notifications: IEmailNotifications;
  push_notifications: IPushNotifications;
  in_app_notifications: IInAppNotifications;
  email_digest: EmailDigestFrequency;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Default preferences - all enabled, no quiet hours
export const DEFAULT_PREFERENCES: Omit<INotificationPreferences, 'id' | '_id' | 'userId' | 'created_at' | 'updated_at'> = {
  emailNotifications: {
    purchases: true,
    subscriptions: true,
    bookUpdates: true,
    marketing: false,
  },
  pushNotifications: {
    purchases: true,
    subscriptions: true,
    bookUpdates: true,
    mentions: true,
  },
  inAppNotifications: {
    purchases: true,
    subscriptions: true,
    bookUpdates: true,
    mentions: true,
    likes: true,
    comments: true,
    shares: true,
    newFollowers: true,
    messages: true,
    payments: true,
    qualityScore: true,
    promotions: true,
    system: true,
  },
  emailDigest: 'weekly',
  quietHoursStart: null,
  quietHoursEnd: null,
  quietHoursEnabled: false,
};

// Transform function
function rowToPreferences(row: NotificationPreferencesRow): INotificationPreferences {
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    emailNotifications: row.email_notifications,
    pushNotifications: row.push_notifications,
    inAppNotifications: row.in_app_notifications,
    emailDigest: row.email_digest,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    quietHoursEnabled: row.quiet_hours_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// NotificationPreferences Model class
export class NotificationPreferences {
  static async findById(id: string): Promise<INotificationPreferences | null> {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToPreferences(data as NotificationPreferencesRow);
  }

  static async findByUserId(userId: string): Promise<INotificationPreferences | null> {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return rowToPreferences(data as NotificationPreferencesRow);
  }

  static async findOne(query: Record<string, any>): Promise<INotificationPreferences | null> {
    let queryBuilder = supabaseAdmin.from('notification_preferences').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToPreferences(data as NotificationPreferencesRow);
  }

  static async create(prefsData: Partial<INotificationPreferences> & { userId: string }): Promise<INotificationPreferences> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      user_id: prefsData.userId,
      email_notifications: prefsData.emailNotifications || DEFAULT_PREFERENCES.emailNotifications,
      push_notifications: prefsData.pushNotifications || DEFAULT_PREFERENCES.pushNotifications,
      in_app_notifications: prefsData.inAppNotifications || DEFAULT_PREFERENCES.inAppNotifications,
      email_digest: prefsData.emailDigest || DEFAULT_PREFERENCES.emailDigest,
      quiet_hours_start: prefsData.quietHoursStart || null,
      quiet_hours_end: prefsData.quietHoursEnd || null,
      quiet_hours_enabled: prefsData.quietHoursEnabled || false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification preferences:', error);
      throw new Error(error.message);
    }

    return rowToPreferences(data as NotificationPreferencesRow);
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<INotificationPreferences>
  ): Promise<INotificationPreferences | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (update.emailNotifications !== undefined) {
      updateData.email_notifications = update.emailNotifications;
    }
    if (update.pushNotifications !== undefined) {
      updateData.push_notifications = update.pushNotifications;
    }
    if (update.inAppNotifications !== undefined) {
      updateData.in_app_notifications = update.inAppNotifications;
    }
    if (update.emailDigest !== undefined) {
      updateData.email_digest = update.emailDigest;
    }
    if (update.quietHoursStart !== undefined) {
      updateData.quiet_hours_start = update.quietHoursStart;
    }
    if (update.quietHoursEnd !== undefined) {
      updateData.quiet_hours_end = update.quietHoursEnd;
    }
    if (update.quietHoursEnabled !== undefined) {
      updateData.quiet_hours_enabled = update.quietHoursEnabled;
    }

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToPreferences(data as NotificationPreferencesRow);
  }

  static async upsert(
    userId: string,
    update: Partial<INotificationPreferences>
  ): Promise<INotificationPreferences> {
    // Try to find existing preferences
    const existing = await this.findByUserId(userId);

    if (existing) {
      // Update existing
      const result = await this.findByIdAndUpdate(existing.id, update);
      if (!result) throw new Error('Failed to update notification preferences');
      return result;
    } else {
      // Create new with defaults merged with update
      return this.create({
        userId,
        emailNotifications: update.emailNotifications || DEFAULT_PREFERENCES.emailNotifications,
        pushNotifications: update.pushNotifications || DEFAULT_PREFERENCES.pushNotifications,
        inAppNotifications: update.inAppNotifications || DEFAULT_PREFERENCES.inAppNotifications,
        emailDigest: update.emailDigest || DEFAULT_PREFERENCES.emailDigest,
        quietHoursStart: update.quietHoursStart || null,
        quietHoursEnd: update.quietHoursEnd || null,
        quietHoursEnabled: update.quietHoursEnabled || false,
      });
    }
  }

  static async getOrCreateForUser(userId: string): Promise<INotificationPreferences> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    return this.create({ userId });
  }

  static async findByIdAndDelete(id: string): Promise<INotificationPreferences | null> {
    const prefs = await this.findById(id);
    if (!prefs) return null;

    const { error } = await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('id', id);

    if (error) return null;
    return prefs;
  }
}

export default NotificationPreferences;
