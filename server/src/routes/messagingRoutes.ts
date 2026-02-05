/**
 * Messaging Routes
 * Reader-author communication endpoints
 */

import { Router } from 'express';
import {
  startConversation,
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
  deleteConversation,
} from '../controllers/messagingController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for messaging endpoints
const messagingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All messaging routes require authentication
router.use(authenticate as any);
router.use(messagingLimiter);

/**
 * POST /api/messages/conversation
 * Start or get existing conversation with an author
 * Body: { authorId: string, bookId?: string }
 */
router.post('/conversation', startConversation as any);

/**
 * POST /api/messages/send
 * Send a message in a conversation
 * Body: { conversationId: string, content: string }
 */
router.post('/send', sendMessage as any);

/**
 * GET /api/messages/conversations
 * Get user's conversations
 * Query: { page?: number, limit?: number }
 */
router.get('/conversations', getConversations as any);

/**
 * GET /api/messages/conversation/:conversationId
 * Get messages in a conversation
 * Query: { page?: number, limit?: number }
 */
router.get('/conversation/:conversationId', getMessages as any);

/**
 * GET /api/messages/unread-count
 * Get total unread message count
 */
router.get('/unread-count', getUnreadCount as any);

/**
 * DELETE /api/messages/conversation/:conversationId
 * Delete/deactivate a conversation
 */
router.delete('/conversation/:conversationId', deleteConversation as any);

export default router;
