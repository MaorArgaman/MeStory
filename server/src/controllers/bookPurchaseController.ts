/**
 * Book Purchase Controller
 * Handles book purchases with PayPal integration and 50/50 revenue split
 */

import { Response } from 'express';
import { AuthRequest } from '../types';

// UUID validation function for Supabase
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
import { Book } from '../models/Book';
import { User } from '../models/User';
import { supabaseAdmin } from '../config/supabase';
import {
  createBookPurchaseOrder,
  captureBookPayment,
  processAuthorPayout,
  getAuthorEarnings,
  connectAuthorPayPal,
  checkBookOwnership,
} from '../services/paypalService';
import {
  notifyBookPurchase,
} from '../services/notificationService';
import {
  sendBookPurchaseEmail,
  sendSaleNotificationToAuthor,
} from '../services/emailService';

/**
 * Create purchase order for a book
 * POST /api/book-purchases/:id/create-order
 */
export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id: bookId } = req.params;

    // Validate MongoDB ID
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const result = await createBookPurchaseOrder(bookId, req.user.id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: result.orderId,
        approvalUrl: result.approvalUrl,
        mockMode: result.mockMode,
      },
    });
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create purchase order',
    });
  }
};

/**
 * Capture payment after PayPal approval
 * POST /api/book-purchases/capture
 */
export const capturePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
      return;
    }

    const result = await captureBookPayment(orderId, req.user.id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    // Get transaction details for notification
    const { Transaction } = await import('../models/Transaction');
    const transaction = await Transaction.findOne({ orderId });
    const metadata = transaction?.metadata as any;

    if (transaction && metadata) {
      const book = await Book.findById(metadata.bookId);
      const buyer = await User.findById(req.user.id);
      const author = await User.findById(metadata.authorId);

      if (book && buyer && author) {
        // Send purchase notification to author
        notifyBookPurchase(
          metadata.bookId,
          req.user.id,
          metadata.authorId,
          transaction.amount,
          'USD'
        ).catch((err) => console.error('Failed to send purchase notification:', err));

        // Send email confirmations
        sendBookPurchaseEmail(
          buyer.email,
          buyer.name,
          book.title,
          author.name,
          transaction.amount,
          'USD',
          metadata.bookId
        ).catch((err) => console.error('Failed to send purchase email:', err));

        sendSaleNotificationToAuthor(
          author.email,
          author.name,
          book.title,
          buyer.name,
          result.authorShare || 0,
          'USD'
        ).catch((err) => console.error('Failed to send sale notification:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
      data: {
        transactionId: result.transactionId,
        authorShare: result.authorShare,
        platformShare: result.platformShare,
        mockMode: result.mockMode,
      },
    });
  } catch (error: any) {
    console.error('Capture payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture payment',
    });
  }
};

/**
 * Check if user can access a book (owns it or it's free)
 * GET /api/book-purchases/:id/check-access
 */
export const checkAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id: bookId } = req.params;

    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const result = await checkBookOwnership(req.user.id, bookId);

    res.status(200).json({
      success: true,
      data: {
        hasAccess: result.owns,
        isFree: result.isFree,
        isAuthor: result.isAuthor,
      },
    });
  } catch (error: any) {
    console.error('Check access error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check book access',
    });
  }
};

/**
 * Get author earnings dashboard
 * GET /api/book-purchases/earnings
 */
export const getEarnings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const earnings = await getAuthorEarnings(req.user.id);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings',
    });
  }
};

/**
 * Request payout to PayPal
 * POST /api/book-purchases/request-payout
 */
export const requestPayout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await processAuthorPayout(req.user.id);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Payout processed successfully',
      data: {
        payoutBatchId: result.payoutBatchId,
        amount: result.amount,
        mockMode: result.mockMode,
      },
    });
  } catch (error: any) {
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payout',
    });
  }
};

/**
 * Connect PayPal account
 * POST /api/book-purchases/connect-paypal
 */
export const connectPayPal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { paypalEmail } = req.body;

    if (!paypalEmail) {
      res.status(400).json({
        success: false,
        error: 'PayPal email is required',
      });
      return;
    }

    const result = await connectAuthorPayPal(req.user.id, paypalEmail);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'PayPal account connected successfully',
    });
  } catch (error: any) {
    console.error('Connect PayPal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect PayPal account',
    });
  }
};

/**
 * Get user's purchased books (library)
 * GET /api/book-purchases/library
 * BUG-008 FIX: Batch fetch all authors in one query to avoid N+1 problem
 */
export const getLibrary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const readingHistory = user.profile?.readingHistory || [];
    const bookIds = readingHistory.map((item) => item.bookId);

    // Get full book details
    const allBooks = await Book.find({});
    const books = allBooks.filter(book => bookIds.includes(book.id));

    // Also get user's own books
    const allOwnBooks = await Book.find({ author: req.user.id });

    // BUG-008 FIX: Collect all unique author IDs and batch fetch them
    const authorIds = new Set<string>();
    books.forEach(book => authorIds.add(book.author));
    allOwnBooks.forEach(book => authorIds.add(book.author));

    // Batch fetch all authors in a single query using Supabase's 'in' filter
    const authorIdsArray = Array.from(authorIds);
    let authors: any[] = [];
    if (authorIdsArray.length > 0) {
      const { data: authorsData } = await supabaseAdmin
        .from('users')
        .select('id, name, profile')
        .in('id', authorIdsArray);
      authors = authorsData || [];
    }

    // Create a map for quick author lookup
    const authorMap = new Map<string, any>();
    authors.forEach(author => {
      authorMap.set(author.id, author);
    });

    // Add author names and merge with reading progress (no more N+1 queries)
    const libraryBooks = books.map((book) => {
      const author = authorMap.get(book.author);
      const historyItem = readingHistory.find(
        (item) => item.bookId === book.id
      );
      return {
        ...book,
        authorName: author?.name || 'Unknown Author',
        authorAvatar: author?.profile?.avatar,
        readingProgress: historyItem?.progress || 0,
        lastRead: historyItem?.lastRead,
      };
    });

    // Map own books with author info (no more N+1 queries)
    const ownBooks = allOwnBooks.map((book) => {
      const author = authorMap.get(book.author);
      return {
        ...book,
        authorName: author?.name || 'Unknown Author',
        authorAvatar: author?.profile?.avatar,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        purchasedBooks: libraryBooks,
        ownBooks,
        totalPurchased: libraryBooks.length,
        totalOwn: ownBooks.length,
      },
    });
  } catch (error: any) {
    console.error('Get library error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get library',
    });
  }
};

/**
 * Get a book for reading (with access check)
 * GET /api/book-purchases/:id/read
 */
export const getBookForReading = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id: bookId } = req.params;

    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Check access
    const access = await checkBookOwnership(req.user.id, bookId);

    if (!access.owns) {
      res.status(403).json({
        success: false,
        error: 'You do not have access to this book. Please purchase it first.',
        requiresPurchase: true,
      });
      return;
    }

    // Get full book data
    const book = await Book.findById(bookId);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Get author info
    const author = await User.findById(book.author);

    // Increment view count (if not author)
    if (!access.isAuthor) {
      await Book.findByIdAndUpdate(bookId, {
        $inc: { 'statistics.views': 1 },
      });
    }

    // Get user's reading progress
    const user = await User.findById(req.user.id);
    const historyItem = user?.profile?.readingHistory?.find(
      (item) => item.bookId === bookId
    );

    // Attach author info to book
    const bookWithAuthor = {
      ...book,
      authorName: author?.name || 'Unknown Author',
      authorAvatar: author?.profile?.avatar,
      authorBio: author?.profile?.bio,
    };

    res.status(200).json({
      success: true,
      data: {
        book: {
          ...bookWithAuthor,
          // Include all content for reading
          chapters: book.chapters,
          characters: book.characters,
          storyContext: book.storyContext,
          pageImages: book.pageImages,
          pageLayout: book.pageLayout,
          coverDesign: book.coverDesign,
        },
        readingProgress: historyItem?.progress || 0,
        lastRead: historyItem?.lastRead,
        isAuthor: access.isAuthor,
        isFree: access.isFree,
      },
    });
  } catch (error: any) {
    console.error('Get book for reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get book',
    });
  }
};

/**
 * Update reading progress
 * PUT /api/book-purchases/:id/progress
 */
export const updateReadingProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id: bookId } = req.params;
    const { progress } = req.body;

    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      res.status(400).json({
        success: false,
        error: 'Progress must be between 0 and 100',
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Initialize reading history if needed
    const profile = user.profile || {};
    const readingHistory = profile.readingHistory || [];

    // Find or create reading history entry
    const historyIndex = readingHistory.findIndex(
      (item) => item.bookId === bookId
    );

    if (historyIndex === -1) {
      // Add new entry - use bookId directly as string for Supabase
      readingHistory.push({
        bookId: bookId as any,
        progress,
        lastRead: new Date(),
      });
    } else {
      // Update existing entry
      readingHistory[historyIndex].progress = progress;
      readingHistory[historyIndex].lastRead = new Date();
    }

    await User.findByIdAndUpdate(req.user.id, {
      'profile.readingHistory': readingHistory,
    });

    // Update book completion rate if progress is 100%
    if (progress === 100) {
      const book = await Book.findById(bookId);
      if (book) {
        // Calculate new completion rate
        const totalReaders = book.statistics.purchases + (book.publishingStatus.isFree ? book.statistics.views : 0);
        const previousCompletions = (book.statistics.completionRate || 0) * totalReaders / 100;
        const newCompletionRate = ((previousCompletions + 1) / totalReaders) * 100;

        await Book.findByIdAndUpdate(bookId, {
          'statistics.completionRate': Math.min(100, newCompletionRate),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Reading progress updated',
      data: {
        progress,
        lastRead: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Update reading progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reading progress',
    });
  }
};
