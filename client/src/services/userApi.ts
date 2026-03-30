/**
 * User API Service
 * Handles user-related API calls including search and library
 */

import api from './api';

export interface UserSearchResult {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
}

export interface UserLibraryBook {
  id: string;
  title: string;
  genre: string;
  synopsis?: string;
  coverImage?: string;
  statistics: {
    views: number;
    likes: number;
    rating: number;
    reviews: number;
  };
  price: number;
  isFree: boolean;
  publishedAt?: string;
}

export interface UserLibraryData {
  user: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  books: UserLibraryBook[];
  totalBooks: number;
}

export interface Mention {
  userId: string;
  userName: string;
  userAvatar?: string;
  addedAt: string;
}

/**
 * Search users by name
 */
export const searchUsers = async (
  query: string,
  limit: number = 10
): Promise<UserSearchResult[]> => {
  const response = await api.get(`/user/search`, {
    params: { q: query, limit },
  });
  return response.data.data.users;
};

/**
 * Get user's public library (published books)
 */
export const getUserLibrary = async (userId: string): Promise<UserLibraryData> => {
  const response = await api.get(`/user/${userId}/library`);
  return response.data.data;
};

/**
 * Get mentions for a book
 */
export const getBookMentions = async (bookId: string): Promise<Mention[]> => {
  const response = await api.get(`/books/${bookId}/mentions`);
  return response.data.data.mentions;
};

/**
 * Add a mention to a book
 */
export const addMention = async (
  bookId: string,
  userId: string
): Promise<Mention> => {
  const response = await api.post(`/books/${bookId}/mention`, { userId });
  return response.data.data.mention;
};

/**
 * Remove a mention from a book
 */
export const removeMention = async (
  bookId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/books/${bookId}/mention/${userId}`);
};
