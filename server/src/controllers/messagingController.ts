/**
 * Messaging Controller
 * Handles reader-author communication
 */

import { Response } from 'express';
import { Message, Conversation } from '../models/Message';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import { notifyNewMessage } from '../services/notificationService';
import { sendMessageNotification } from '../services/socketService';

// UUID validation regex for Supabase
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Note: XSS protection is handled by React on the client side.
 * React automatically escapes text content when rendering.
 * No server-side escaping is needed for content that will be displayed via React.
 * This avoids double-escaping issues where "&lt;" would display as "&lt;" instead of "<".
 */

/**
 * Start or get existing conversation with an author about a book
 * POST /api/messages/conversation
 */
export const startConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { authorId, bookId } = req.body;

    if (!authorId) {
      res.status(400).json({ success: false, error: 'Author ID is required' });
      return;
    }

    if (!UUID_REGEX.test(authorId)) {
      res.status(400).json({ success: false, error: 'Invalid author ID' });
      return;
    }

    // Verify author exists
    const author = await User.findById(authorId);
    if (!author) {
      res.status(404).json({ success: false, error: 'Author not found' });
      return;
    }

    // Can't start conversation with yourself
    if (authorId === req.user.id) {
      res.status(400).json({ success: false, error: 'Cannot start conversation with yourself' });
      return;
    }

    // If bookId provided, verify it exists and belongs to the author
    if (bookId) {
      if (!UUID_REGEX.test(bookId)) {
        res.status(400).json({ success: false, error: 'Invalid book ID' });
        return;
      }

      const book = await Book.findById(bookId);
      if (!book) {
        res.status(404).json({ success: false, error: 'Book not found' });
        return;
      }

      if (book.author !== authorId) {
        res.status(400).json({ success: false, error: 'Book does not belong to this author' });
        return;
      }
    }

    // Check for existing conversation
    const participants = [req.user.id, authorId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      book: bookId || null,
    });

    if (!conversation) {
      // Create new conversation
      const unreadCountObj: Record<string, number> = {};
      unreadCountObj[req.user.id] = 0;
      unreadCountObj[authorId] = 0;

      conversation = await Conversation.create({
        participants,
        book: bookId || null,
        unreadCount: unreadCountObj,
      });
    }

    // Fetch participant and book details separately (Supabase doesn't support populate)
    const participantDetails = await Promise.all(
      conversation.participants.map(async (participantId: string) => {
        const participant = await User.findById(participantId);
        return participant ? {
          id: participant.id,
          name: participant.name,
          profilePicture: participant.profile?.avatar,
        } : null;
      })
    );

    let bookDetails = null;
    if (conversation.book) {
      const book = await Book.findById(conversation.book);
      if (book) {
        bookDetails = {
          id: book.id,
          title: book.title,
          coverImage: book.coverDesign?.front?.imageUrl,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          ...conversation,
          participants: participantDetails.filter(Boolean),
          book: bookDetails,
        },
      },
    });
  } catch (error: any) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start conversation',
    });
  }
};

/**
 * Send a message in a conversation
 * POST /api/messages/send
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      res.status(400).json({ success: false, error: 'Conversation ID and content are required' });
      return;
    }

    if (!UUID_REGEX.test(conversationId)) {
      res.status(400).json({ success: false, error: 'Invalid conversation ID' });
      return;
    }

    if (content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Message content cannot be empty' });
      return;
    }

    if (content.length > 5000) {
      res.status(400).json({ success: false, error: 'Message too long (max 5000 characters)' });
      return;
    }

    // Find conversation and verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: string) => p === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    // Content is stored as-is; XSS protection is handled by React on the client
    const messageContent = content.trim();

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content: messageContent,
    });

    // Update conversation's last message and unread count
    const otherParticipantId = conversation.participants.find(
      (p: string) => p !== req.user!.id
    );

    // Increment unread count for other participant
    let bookTitle: string | undefined;
    if (otherParticipantId) {
      const currentCount = conversation.unreadCount[otherParticipantId] || 0;
      conversation.unreadCount[otherParticipantId] = currentCount + 1;

      // Get book title if conversation is about a specific book
      if (conversation.book) {
        const book = await Book.findById(conversation.book);
        bookTitle = book?.title;
      }

      // Send notification to the other participant (async, don't wait)
      notifyNewMessage(
        otherParticipantId,
        req.user!.id,
        conversationId,
        messageContent,
        bookTitle
      ).catch((err) => console.error('Failed to send message notification:', err));

      // Also send real-time socket message for instant delivery
      const sender = await User.findById(req.user!.id);
      if (sender) {
        sendMessageNotification(otherParticipantId, {
          conversationId,
          message: {
            _id: message._id,
            content: messageContent,
            sender: {
              _id: sender.id,
              name: sender.name,
              profilePicture: sender.profile?.avatar,
            },
            createdAt: message.createdAt,
          },
        });
      }
    }

    // Update conversation with lastMessage and unreadCount
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content: messageContent.substring(0, 100),
        sender: req.user.id,
        sentAt: new Date().toISOString(),
      },
      unreadCount: conversation.unreadCount,
    });

    // Fetch sender info separately (Supabase doesn't support populate)
    const sender = await User.findById(req.user.id);
    const messageWithSender = {
      ...message,
      sender: sender ? {
        id: sender.id,
        name: sender.name,
        profilePicture: sender.profile?.avatar,
      } : null,
    };

    res.status(201).json({
      success: true,
      data: { message: messageWithSender },
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message',
    });
  }
};

/**
 * Get user's conversations
 * GET /api/messages/conversations
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // SEC-007 FIX: Validate pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    let conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    });

    const total = conversations.length;

    // Sort by updatedAt descending, then apply pagination
    conversations = conversations
      .sort((a: any, b: any) => new Date(b.updatedAt || b.updated_at).getTime() - new Date(a.updatedAt || a.updated_at).getTime())
      .slice(skip, skip + limit);

    // Fetch participant and book details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Fetch participant details
        const participantDetails = await Promise.all(
          conv.participants.map(async (participantId: string) => {
            const participant = await User.findById(participantId);
            return participant ? {
              id: participant.id,
              name: participant.name,
              profilePicture: participant.profile?.avatar,
            } : null;
          })
        );

        // Fetch book details if exists
        let bookDetails = null;
        if (conv.book) {
          const book = await Book.findById(conv.book);
          if (book) {
            bookDetails = {
              id: book.id,
              title: book.title,
              coverImage: book.coverDesign?.front?.imageUrl,
            };
          }
        }

        return {
          ...conv,
          participants: participantDetails.filter(Boolean),
          book: bookDetails,
          myUnreadCount: conv.unreadCount[req.user!.id] || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithDetails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get conversations',
    });
  }
};

/**
 * Get messages in a conversation
 * GET /api/messages/conversation/:conversationId
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!UUID_REGEX.test(conversationId)) {
      res.status(400).json({ success: false, error: 'Invalid conversation ID' });
      return;
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: string) => p === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    let messages = await Message.find({ conversation: conversationId });

    const total = messages.length;

    // Sort by createdAt descending, then apply pagination
    messages = messages
      .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
      .slice(skip, skip + limit);

    // Fetch sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findById(msg.sender);
        return {
          ...msg,
          sender: sender ? {
            id: sender.id,
            name: sender.name,
            profilePicture: sender.profile?.avatar,
          } : null,
        };
      })
    );

    // SEC-015 FIX: Mark messages as read - use allSettled for graceful partial failure handling
    const unreadMessages = messages.filter(
      (msg) => msg.sender !== req.user!.id && !msg.readAt
    );
    const markResults = await Promise.allSettled(
      unreadMessages.map((msg) =>
        Message.findByIdAndUpdate(msg.id, { readAt: new Date().toISOString() })
      )
    );

    // Log any failed updates but don't fail the request
    const failedUpdates = markResults.filter((r) => r.status === 'rejected');
    if (failedUpdates.length > 0) {
      console.warn(`Failed to mark ${failedUpdates.length}/${unreadMessages.length} messages as read`);
    }

    // Reset unread count for current user
    conversation.unreadCount[req.user.id] = 0;
    await Conversation.findByIdAndUpdate(conversationId, {
      unreadCount: conversation.unreadCount,
    });

    res.status(200).json({
      success: true,
      data: {
        messages: messagesWithSenders.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get messages',
    });
  }
};

/**
 * Get total unread message count for user
 * GET /api/messages/unread-count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      totalUnread += conv.unreadCount[req.user!.id] || 0;
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread },
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count',
    });
  }
};

/**
 * Delete/deactivate a conversation
 * DELETE /api/messages/conversation/:conversationId
 */
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;

    if (!UUID_REGEX.test(conversationId)) {
      res.status(400).json({ success: false, error: 'Invalid conversation ID' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: string) => p === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    // Soft delete - mark as inactive
    await Conversation.findByIdAndUpdate(conversationId, {
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete conversation',
    });
  }
};
