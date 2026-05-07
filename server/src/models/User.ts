import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

// Use crypto.randomUUID() instead of uuid package (Node 14.17+)
const uuidv4 = () => crypto.randomUUID();

/** Retry wrapper with exponential backoff for transient Supabase errors. */
async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message || '';
      const isTransient = msg.includes('timeout') || msg.includes('TIMEOUT') || msg.includes('Network') || msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('aborted');
      if (!isTransient || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 5000);
      console.warn(`[User.${label}] Transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${msg}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`[User.${label}] All retries exhausted`);
}

// User role enum
export enum UserRole {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
}

// Subscription interface
export interface ISubscription {
  tier: string;
  plan?: string;
  price: number;
  credits: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  autoRenew?: boolean;
}

// Profile interface
export interface IProfile {
  bio?: string;
  avatar?: string;
  headerImage?: string;
  language?: 'en' | 'he';
  gender?: string;
  currency?: string;
  authorProfile?: {
    publishedBooks: number;
    totalSales: number;
    rating: number;
    followers: string[];
  };
  following?: string[];
  readingHistory?: Array<{
    bookId: string;
    progress: number;
    lastRead: string;
  }>;
  writingStatistics?: {
    totalWords: number;
    booksWritten: number;
    averageQualityScore?: number;
  };
  earnings?: {
    totalEarned: number;
    pendingPayout: number;
    withdrawn: number;
    lastPayoutDate?: string;
    history: Array<{
      amount: number;
      date: string;
      status: 'pending' | 'completed' | 'failed';
      paypalEmail: string;
    }>;
  };
  notificationPreferences?: {
    writing: boolean;
    publishing: boolean;
    sales: boolean;
    social: boolean;
    system: boolean;
    emailDigest: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

// PayPal interface
export interface IPayPal {
  email?: string;
  accountId?: string;
  isVerified: boolean;
  connectedAt?: string;
}

// Email verification interface
export interface IEmailVerification {
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: string;
  verifiedAt?: string;
}

// User interface
export interface IUser {
  id: string;
  _id?: string; // Alias for compatibility
  name: string;
  displayName?: string;
  email: string;
  password: string;
  role: UserRole;
  credits: number;
  subscription?: ISubscription;
  profile?: IProfile;
  paypal?: IPayPal;
  emailVerification: IEmailVerification;
  organizationId?: string; // Link to organization (for association members)
  created_at: string;
  updated_at: string;
  // Compatibility aliases
  createdAt?: string;
  updatedAt?: string;
}

// Database row type (snake_case from PostgreSQL)
interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  credits: number;
  subscription: ISubscription | null;
  profile: IProfile | null;
  paypal: IPayPal | null;
  email_verification: IEmailVerification | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

// Transform database row to IUser
function rowToUser(row: UserRow): IUser {
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role as UserRole,
    credits: row.credits,
    subscription: row.subscription || undefined,
    profile: row.profile || undefined,
    paypal: row.paypal || undefined,
    emailVerification: row.email_verification || { isVerified: false },
    organizationId: row.organization_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// User Model class for Supabase operations
export class User {
  // Find user by ID
  static async findById(id: string, includePassword = false): Promise<IUser | null> {
    return withRetry(async () => {
      const columns = includePassword
        ? '*'
        : 'id, name, email, role, credits, subscription, profile, paypal, email_verification, created_at, updated_at';

      const { data, error } = await supabaseAdmin
        .from('users')
        .select(columns)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Database error in User.findById: ${error.message}`);
      }
      if (!data) return null;

      const user = rowToUser(data as unknown as UserRow);
      if (!includePassword) {
        user.password = '';
      }
      return user;
    }, 'findById');
  }

  // PERF: Batch fetch multiple users in a single query. Replaces the N+1
  // pattern `Promise.all(ids.map(id => User.findById(id)))` which spawns
  // one round-trip per id — this does it in one.
  static async findByIds(ids: string[]): Promise<IUser[]> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, credits, subscription, profile, paypal, email_verification, created_at, updated_at')
      .in('id', ids);

    if (error || !data) return [];
    return (data as unknown as UserRow[]).map((row) => {
      const user = rowToUser(row);
      user.password = '';
      return user;
    });
  }

  // Find user by email
  static async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    return withRetry(async () => {
      const columns = includePassword
        ? '*'
        : 'id, name, email, role, credits, subscription, profile, paypal, email_verification, created_at, updated_at';

      const { data, error } = await supabaseAdmin
        .from('users')
        .select(columns)
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Database error in User.findByEmail: ${error.message}`);
      }
      if (!data) return null;

      const user = rowToUser(data as unknown as UserRow);
      if (!includePassword) {
        user.password = '';
      }
      return user;
    }, 'findByEmail');
  }

  // Find one user by query
  static async findOne(query: Partial<{ email: string; _id: string; id: string }>, selectPassword = false): Promise<IUser | null> {
    if (query.email) {
      return this.findByEmail(query.email, selectPassword);
    }
    if (query._id || query.id) {
      return this.findById(query._id || query.id!, selectPassword);
    }
    return null;
  }

  // Create new user
  static async create(userData: Partial<IUser>): Promise<IUser> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertData = {
      id,
      name: userData.name,
      email: userData.email?.toLowerCase(),
      password: userData.password,
      role: userData.role || UserRole.FREE,
      credits: userData.credits ?? 100,
      subscription: userData.subscription || {
        tier: 'free',
        price: 0,
        credits: 100,
        startDate: now,
        endDate: null,
        isActive: true,
        autoRenew: false,
      },
      profile: userData.profile || {
        bio: '',
        avatar: '',
        headerImage: '',
        language: 'en',
        authorProfile: { publishedBooks: 0, totalSales: 0, rating: 0, followers: [] },
        following: [],
        readingHistory: [],
        writingStatistics: { totalWords: 0, booksWritten: 0, averageQualityScore: 0 },
        earnings: { totalEarned: 0, pendingPayout: 0, withdrawn: 0, history: [] },
        notificationPreferences: {
          writing: true,
          publishing: true,
          sales: true,
          social: true,
          system: true,
          emailDigest: false,
        },
      },
      paypal: userData.paypal || null,
      email_verification: userData.emailVerification || { isVerified: false },
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message);
    }

    return rowToUser(data as UserRow);
  }

  // Update user by ID
  static async findByIdAndUpdate(
    id: string,
    update: Partial<IUser> | { $set?: Partial<IUser>; $inc?: { credits?: number } } | Record<string, any>,
    options?: { new?: boolean }
  ): Promise<IUser | null> {
    // Handle $set and $inc operators for Mongoose compatibility
    let updateData: Record<string, any> = {};

    if ('$set' in update && update.$set) {
      updateData = { ...update.$set };
    } else if ('$inc' in update) {
      // Handle increment - need to fetch current value first
      const currentUser = await this.findById(id);
      if (!currentUser) return null;

      if (update.$inc?.credits) {
        updateData.credits = currentUser.credits + update.$inc.credits;
      }
    } else {
      updateData = { ...update };
    }

    // Convert camelCase to snake_case for specific fields
    if (updateData.emailVerification) {
      updateData.email_verification = updateData.emailVerification;
      delete updateData.emailVerification;
    }

    updateData.updated_at = new Date().toISOString();

    // Remove undefined values and id field
    delete updateData.id;
    delete updateData._id;
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return rowToUser(data as UserRow);
  }

  // Delete user by ID
  static async findByIdAndDelete(id: string): Promise<IUser | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return null;
    }

    return user;
  }

  // Find multiple users
  static async find(query: Record<string, any> = {}): Promise<IUser[]> {
    let queryBuilder = supabaseAdmin
      .from('users')
      .select('id, name, email, role, credits, subscription, profile, paypal, email_verification, created_at, updated_at');

    // Apply filters
    Object.entries(query).forEach(([key, value]) => {
      if (key === '_id' || key === 'id') {
        queryBuilder = queryBuilder.eq('id', value);
      } else if (key === 'role') {
        queryBuilder = queryBuilder.eq('role', value);
      } else if (key === 'email') {
        queryBuilder = queryBuilder.eq('email', value.toLowerCase());
      }
    });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error finding users:', error);
      return [];
    }

    return (data || []).map(row => rowToUser(row as UserRow));
  }

  // Count users
  static async countDocuments(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });

    Object.entries(query).forEach(([key, value]) => {
      if (key === 'role') {
        queryBuilder = queryBuilder.eq('role', value);
      }
    });

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Error counting users:', error);
      return 0;
    }

    return count || 0;
  }

  // Helper: Deduct credits (legacy semantics - Premium/Admin unbounded)
  // Kept for backward compatibility with callers that haven't migrated to
  // creditService yet. New callers should use creditService.consume().
  static async deductCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    // Premium/Admin users have unlimited credits
    if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.credits < amount) {
      return false;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ credits: user.credits - amount })
      .eq('id', userId);

    return !error;
  }

  // Helper: Deduct credits with strict accounting. Unlike deductCredits,
  // this charges Premium users too (they have a real bounded balance now).
  // Admin still bypasses. Used by the new creditService pipeline.
  static async deductCreditsStrict(userId: string, amount: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    if (user.role === UserRole.ADMIN) return true;

    if (user.credits < amount) return false;

    const { error } = await supabaseAdmin
      .from('users')
      .update({ credits: user.credits - amount })
      .eq('id', userId);

    return !error;
  }

  // Helper: Add credits
  static async addCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    const { error } = await supabaseAdmin
      .from('users')
      .update({ credits: user.credits + amount })
      .eq('id', userId);

    return !error;
  }

  // Check if user is premium
  static isPremium(user: IUser): boolean {
    return user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN;
  }

  // Check if user has credits
  static hasCredits(user: IUser): boolean {
    if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) {
      return true; // Premium/Admin users have unlimited credits
    }
    return (user.credits || 0) > 0;
  }
}
