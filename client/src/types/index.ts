// User types
export type UserRole = 'free' | 'standard' | 'premium' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  createdAt: string;
  profile?: {
    bio?: string;
    avatar?: string;
  };
  subscription?: {
    tier: UserRole;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  emailVerification?: {
    isVerified: boolean;
    verifiedAt?: string;
  };
}

// Book types
export interface Book {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  genre: string;
  description: string;
  coverImage?: string;
  price: number;
  qualityScore?: number;
  publishingStatus: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

// Chapter type
export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

// Character type
export interface Character {
  id: string;
  name: string;
  age?: number;
  description: string;
  traits: string[];
  backstory?: string;
  goals?: string;
  relationships?: Array<{
    characterId: string;
    relationship: string;
  }>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
