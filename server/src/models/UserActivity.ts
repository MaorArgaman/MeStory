import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

// Reading Progress interface
export interface IReadingProgress {
  bookId: string;
  lastChapterRead: number;
  percentageComplete: number;
  totalReadingTime: number;
  lastReadAt: string;
  isCompleted: boolean;
  rating?: number;
}

// Writing Progress interface
export interface IWritingProgress {
  bookId: string;
  lastEditedAt: string;
  isCompleted: boolean;
  totalWritingTime: number;
}

// Genre Preference interface
export interface IGenrePreference {
  genre: string;
  weight: number;
  readCount: number;
  writtenCount: number;
  lastInteraction: string;
}

// Author Preference interface
export interface IAuthorPreference {
  authorId: string;
  authorName: string;
  booksRead: number;
  averageRating: number;
  isFollowing: boolean;
  lastInteraction: string;
}

// Interaction Event interface
export interface IInteractionEvent {
  type: 'view' | 'read' | 'complete' | 'purchase' | 'like' | 'share' | 'review' | 'abandon';
  bookId: string;
  genre: string;
  authorId: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// User Activity interface
export interface IUserActivity {
  id: string;
  _id?: string;
  userId: string;
  readingHistory: IReadingProgress[];
  currentlyReading: string[];
  completedBooks: string[];
  abandonedBooks: string[];
  writingProgress: IWritingProgress[];
  currentlyWriting: string[];
  completedWriting: string[];
  abandonedWriting: string[];
  genrePreferences: IGenrePreference[];
  authorPreferences: IAuthorPreference[];
  preferredLanguages: string[];
  preferredReadingLength: 'short' | 'medium' | 'long' | 'any';
  interactionEvents: IInteractionEvent[];
  totalBooksRead: number;
  totalBooksWritten: number;
  totalReadingTime: number;
  totalWritingTime: number;
  averageSessionDuration: number;
  lastActiveAt: string;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate?: string;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

// Database row type
interface UserActivityRow {
  id: string;
  user_id: string;
  reading_history: IReadingProgress[];
  currently_reading: string[];
  completed_books: string[];
  abandoned_books: string[];
  writing_progress: IWritingProgress[];
  currently_writing: string[];
  completed_writing: string[];
  abandoned_writing: string[];
  genre_preferences: IGenrePreference[];
  author_preferences: IAuthorPreference[];
  preferred_languages: string[];
  preferred_reading_length: string;
  interaction_events: IInteractionEvent[];
  total_books_read: number;
  total_books_written: number;
  total_reading_time: number;
  total_writing_time: number;
  average_session_duration: number;
  last_active_at: string | null;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  created_at: string;
  updated_at: string;
}

// Transform function
function rowToUserActivity(row: UserActivityRow): IUserActivity {
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    readingHistory: row.reading_history || [],
    currentlyReading: row.currently_reading || [],
    completedBooks: row.completed_books || [],
    abandonedBooks: row.abandoned_books || [],
    writingProgress: row.writing_progress || [],
    currentlyWriting: row.currently_writing || [],
    completedWriting: row.completed_writing || [],
    abandonedWriting: row.abandoned_writing || [],
    genrePreferences: row.genre_preferences || [],
    authorPreferences: row.author_preferences || [],
    preferredLanguages: row.preferred_languages || ['en', 'he'],
    preferredReadingLength: (row.preferred_reading_length as IUserActivity['preferredReadingLength']) || 'any',
    interactionEvents: row.interaction_events || [],
    totalBooksRead: row.total_books_read || 0,
    totalBooksWritten: row.total_books_written || 0,
    totalReadingTime: row.total_reading_time || 0,
    totalWritingTime: row.total_writing_time || 0,
    averageSessionDuration: row.average_session_duration || 0,
    lastActiveAt: row.last_active_at || new Date().toISOString(),
    currentStreak: row.current_streak || 0,
    longestStreak: row.longest_streak || 0,
    lastStreakDate: row.last_streak_date || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// UserActivity Model class
export class UserActivity {
  static async findById(id: string): Promise<IUserActivity | null> {
    const { data, error } = await supabaseAdmin
      .from('user_activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToUserActivity(data as UserActivityRow);
  }

  static async findOne(query: Record<string, any>): Promise<IUserActivity | null> {
    let queryBuilder = supabaseAdmin.from('user_activities').select('*');

    if (query._id || query.id) {
      queryBuilder = queryBuilder.eq('id', query._id || query.id);
    }
    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }

    const { data, error } = await queryBuilder.limit(1).single();

    if (error || !data) return null;
    return rowToUserActivity(data as UserActivityRow);
  }

  static async findByUserId(userId: string): Promise<IUserActivity | null> {
    return this.findOne({ userId });
  }

  static async create(activityData: Partial<IUserActivity>): Promise<IUserActivity> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      user_id: activityData.userId,
      reading_history: activityData.readingHistory || [],
      currently_reading: activityData.currentlyReading || [],
      completed_books: activityData.completedBooks || [],
      abandoned_books: activityData.abandonedBooks || [],
      writing_progress: activityData.writingProgress || [],
      currently_writing: activityData.currentlyWriting || [],
      completed_writing: activityData.completedWriting || [],
      abandoned_writing: activityData.abandonedWriting || [],
      genre_preferences: activityData.genrePreferences || [],
      author_preferences: activityData.authorPreferences || [],
      preferred_languages: activityData.preferredLanguages || ['en', 'he'],
      preferred_reading_length: activityData.preferredReadingLength || 'any',
      interaction_events: activityData.interactionEvents || [],
      total_books_read: activityData.totalBooksRead || 0,
      total_books_written: activityData.totalBooksWritten || 0,
      total_reading_time: activityData.totalReadingTime || 0,
      total_writing_time: activityData.totalWritingTime || 0,
      average_session_duration: activityData.averageSessionDuration || 0,
      last_active_at: activityData.lastActiveAt || now,
      current_streak: activityData.currentStreak || 0,
      longest_streak: activityData.longestStreak || 0,
      last_streak_date: activityData.lastStreakDate || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('user_activities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user activity:', error);
      throw new Error(error.message);
    }

    return rowToUserActivity(data as UserActivityRow);
  }

  static async findByIdAndUpdate(
    id: string,
    update: Partial<IUserActivity> | { $set?: any; $push?: any; $inc?: any }
  ): Promise<IUserActivity | null> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Handle $set
    if ('$set' in update && update.$set) {
      Object.entries(update.$set).forEach(([key, value]) => {
        updateData[camelToSnake(key)] = value;
      });
    }

    // Handle $push (append to arrays)
    if ('$push' in update && update.$push) {
      const current = await this.findById(id);
      if (current) {
        Object.entries(update.$push).forEach(([key, value]) => {
          const currentArray = (current as any)[key] || [];
          updateData[camelToSnake(key)] = [...currentArray, value];
        });
      }
    }

    // Handle $inc
    if ('$inc' in update && update.$inc) {
      const current = await this.findById(id);
      if (current) {
        Object.entries(update.$inc).forEach(([key, value]) => {
          updateData[camelToSnake(key)] = ((current as any)[key] || 0) + (value as number);
        });
      }
    }

    // Handle direct updates
    if (!('$set' in update) && !('$push' in update) && !('$inc' in update)) {
      Object.entries(update).forEach(([key, value]) => {
        if (key !== 'id' && key !== '_id') {
          updateData[camelToSnake(key)] = value;
        }
      });
    }

    // Limit interaction events to 1000
    if (updateData.interaction_events && updateData.interaction_events.length > 1000) {
      updateData.interaction_events = updateData.interaction_events.slice(-1000);
    }

    const { data, error } = await supabaseAdmin
      .from('user_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return rowToUserActivity(data as UserActivityRow);
  }

  static async findOneAndUpdate(
    query: Record<string, any>,
    update: any,
    options?: { upsert?: boolean; new?: boolean }
  ): Promise<IUserActivity | null> {
    let activity = await this.findOne(query);

    if (!activity && options?.upsert) {
      activity = await this.create({ userId: query.userId });
    }

    if (!activity) return null;

    return this.findByIdAndUpdate(activity.id, update);
  }

  static async find(query: Record<string, any> = {}): Promise<IUserActivity[]> {
    let queryBuilder = supabaseAdmin.from('user_activities').select('*');

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }

    queryBuilder = queryBuilder.order('last_active_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding user activities:', error);
      return [];
    }

    return (data || []).map(row => rowToUserActivity(row as UserActivityRow));
  }

  static async findByIdAndDelete(id: string): Promise<IUserActivity | null> {
    const activity = await this.findById(id);
    if (!activity) return null;

    const { error } = await supabaseAdmin
      .from('user_activities')
      .delete()
      .eq('id', id);

    if (error) return null;
    return activity;
  }
}

// Helper to convert camelCase to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default UserActivity;
