/**
 * Messaging API Service
 * Reader-author communication
 */

import api from './api';

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    profilePicture?: string;
  }>;
  book?: {
    _id: string;
    title: string;
    coverImage?: string;
  };
  lastMessage?: {
    content: string;
    sender: string;
    sentAt: string;
  };
  myUnreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Start or get existing conversation with an author
 */
export const startConversation = async (
  authorId: string,
  bookId?: string
): Promise<Conversation> => {
  const response = await api.post('/messages/conversation', { authorId, bookId });
  return response.data.data.conversation;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  const response = await api.post('/messages/send', { conversationId, content });
  return response.data.data.message;
};

/**
 * Get user's conversations
 */
export const getConversations = async (
  page = 1,
  limit = 20
): Promise<ConversationsResponse> => {
  const response = await api.get('/messages/conversations', {
    params: { page, limit },
  });
  return response.data.data;
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50
): Promise<MessagesResponse> => {
  const response = await api.get(`/messages/conversation/${conversationId}`, {
    params: { page, limit },
  });
  return response.data.data;
};

/**
 * Get total unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/messages/unread-count');
  return response.data.data.unreadCount;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  await api.delete(`/messages/conversation/${conversationId}`);
};
