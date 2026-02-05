/**
 * Messaging Controller
 * Handles reader-author communication
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import { Message, Conversation } from '../models/Message';
import { User } from '../models/User';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import { notifyNewMessage } from '../services/notificationService';

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

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
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
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400).json({ success: false, error: 'Invalid book ID' });
        return;
      }

      const book = await Book.findById(bookId);
      if (!book) {
        res.status(404).json({ success: false, error: 'Book not found' });
        return;
      }

      if (book.author.toString() !== authorId) {
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
      conversation = new Conversation({
        participants,
        book: bookId || null,
        unreadCount: new Map([
          [req.user.id, 0],
          [authorId, 0],
        ]),
      });
      await conversation.save();
    }

    // Populate conversation data
    await conversation.populate([
      { path: 'participants', select: 'name profilePicture' },
      { path: 'book', select: 'title coverImage' },
    ]);

    res.status(200).json({
      success: true,
      data: { conversation },
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

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
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

    if (!conversation.participants.some((p) => p.toString() === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content: content.trim(),
    });
    await message.save();

    // Update conversation's last message and unread count
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== req.user!.id
    );

    conversation.lastMessage = {
      content: content.trim().substring(0, 100),
      sender: new mongoose.Types.ObjectId(req.user.id),
      sentAt: new Date(),
    };

    // Increment unread count for other participant
    if (otherParticipantId) {
      const currentCount = conversation.unreadCount.get(otherParticipantId.toString()) || 0;
      conversation.unreadCount.set(otherParticipantId.toString(), currentCount + 1);

      // Send notification to the other participant (async, don't wait)
      // Get book title if conversation is about a specific book
      let bookTitle: string | undefined;
      if (conversation.book) {
        const book = await Book.findById(conversation.book).select('title');
        bookTitle = book?.title;
      }

      notifyNewMessage(
        otherParticipantId.toString(),
        req.user!.id,
        conversationId,
        content.trim(),
        bookTitle
      ).catch((err) => console.error('Failed to send message notification:', err));
    }

    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name profilePicture');

    res.status(201).json({
      success: true,
      data: { message },
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
    })
      .populate('participants', 'name profilePicture')
      .populate('book', 'title coverImage')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({
      participants: req.user.id,
      isActive: true,
    });

    // Add unread count for current user to each conversation
    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv.toObject(),
      myUnreadCount: conv.unreadCount.get(req.user!.id) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
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

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ success: false, error: 'Invalid conversation ID' });
      return;
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p) => p.toString() === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversation: conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        readAt: null,
      },
      { readAt: new Date() }
    );

    // Reset unread count for current user
    conversation.unreadCount.set(req.user.id, 0);
    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Return in chronological order
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
      totalUnread += conv.unreadCount.get(req.user!.id) || 0;
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

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({ success: false, error: 'Invalid conversation ID' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p) => p.toString() === req.user!.id)) {
      res.status(403).json({ success: false, error: 'Not a participant in this conversation' });
      return;
    }

    // Soft delete - mark as inactive
    conversation.isActive = false;
    await conversation.save();

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
