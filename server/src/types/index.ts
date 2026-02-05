import { Request } from 'express';
import { UserRole } from '../models/User';

// Re-export UserRole for convenience
export { UserRole };

// Subscription plan types
export interface SubscriptionPlan {
  tier: UserRole;
  price: number;
  credits: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// Authenticated request with user
// Note: user property is defined in types/express.d.ts for Passport compatibility
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    _id?: any;
    name?: string;
    credits?: number;
    profile?: any;
    subscription?: any;
    paypal?: any;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
