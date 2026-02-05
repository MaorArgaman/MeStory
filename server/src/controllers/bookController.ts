import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import PDFParser from 'pdf-parse';
import mammoth from 'mammoth';
import { Book } from '../models/Book';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { generateBookPDF } from '../services/pdfService';
import { transcribeAudio } from '../services/whisperService';
import { generatePricingStrategy } from '../services/pricingStrategyService';
import { exportBook } from '../services/bookExportService';
import {
  notifyBookLike,
  notifyBookComment,
  notifyBookShare,
  notifyBookPurchase,
  notifyBookPublished,
} from '../services/notificationService';
import {
  sendBookPurchaseEmail,
  sendSaleNotificationToAuthor,
} from '../services/emailService';

/**
 * Create a new book
 * POST /api/books
 */
export const createBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { title, genre, description, language, storyContext, chapters } = req.body;

    // Create new book
    const book = new Book({
      title,
      author: req.user.id,
      genre,
      description,
      language: language || 'en',
      storyContext: storyContext || undefined, // Story context from Deep Dive Interview
      chapters: chapters || [],
      characters: [],
      publishingStatus: {
        status: 'draft',
        price: 0,
        isFree: true,
        isPublic: false,
      },
      statistics: {
        wordCount: 0,
        pageCount: 0,
        chapterCount: 0,
        characterCount: 0,
        views: 0,
        purchases: 0,
        revenue: 0,
        totalReviews: 0,
      },
    });

    await book.save();

    // Update user's writing statistics
    const user = await User.findById(req.user.id);
    if (user && user.profile) {
      if (!user.profile.writingStatistics) {
        user.profile.writingStatistics = {
          totalWords: 0,
          booksWritten: 0,
        };
      }
      user.profile.writingStatistics.booksWritten += 1;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        id: book._id,
        book: {
          id: book._id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          language: book.language,
          storyContext: book.storyContext,
          publishingStatus: book.publishingStatus,
          statistics: book.statistics,
          createdAt: book.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create book',
    });
  }
};

/**
 * Get all books for the authenticated user
 * GET /api/books
 */
export const getBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Get query parameters for filtering
    const { status, genre, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query - only return user's own books
    const query: any = { author: req.user.id };

    if (status) {
      query['publishingStatus.status'] = status;
    }

    if (genre) {
      query.genre = genre;
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[sortBy as string] = sortOrder;

    // Find books
    const books = await Book.find(query)
      .sort(sort)
      .select('-chapters.content'); // Exclude chapter content for list view

    res.status(200).json({
      success: true,
      data: {
        books: books.map((book) => ({
          id: book._id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          publishingStatus: book.publishingStatus,
          statistics: book.statistics,
          qualityScore: book.qualityScore,
          coverDesign: book.coverDesign,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        })),
        count: books.length,
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve books',
    });
  }
};

/**
 * Get a single book by ID
 * GET /api/books/:id
 */
export const getBookById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        book: {
          id: book._id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          synopsis: book.synopsis,
          language: book.language,
          chapters: book.chapters,
          characters: book.characters,
          plotStructure: book.plotStructure,
          qualityScore: book.qualityScore,
          coverDesign: book.coverDesign,
          pageLayout: book.pageLayout,
          pageImages: book.pageImages || [],
          publishingStatus: book.publishingStatus,
          statistics: book.statistics,
          tags: book.tags,
          ageRating: book.ageRating,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve book',
    });
  }
};

/**
 * Update a book
 * PUT /api/books/:id
 */
export const updateBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Allowed fields to update
    const allowedUpdates = [
      'title',
      'genre',
      'description',
      'synopsis',
      'language',
      'chapters',
      'characters',
      'plotStructure',
      'coverDesign',
      'pageLayout',
      'pageImages',
      'tags',
      'ageRating',
      'publishingStatus',
    ];

    // Apply updates
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        (book as any)[key] = req.body[key];
      }
    });

    // Save book (pre-save middleware will update statistics)
    await book.save();

    // Update user's writing statistics
    const user = await User.findById(req.user.id);
    if (user && user.profile?.writingStatistics) {
      user.profile.writingStatistics.totalWords = book.statistics.wordCount;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: {
        book: {
          id: book._id,
          title: book.title,
          genre: book.genre,
          description: book.description,
          synopsis: book.synopsis,
          chapters: book.chapters,
          characters: book.characters,
          statistics: book.statistics,
          updatedAt: book.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update book',
    });
  }
};

/**
 * Delete a book
 * DELETE /api/books/:id
 */
export const deleteBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this book',
      });
      return;
    }

    // Don't allow deletion of published books
    if (book.publishingStatus.status === 'published') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a published book. Unpublish it first.',
      });
      return;
    }

    await Book.findByIdAndDelete(id);

    // Update user's writing statistics
    const user = await User.findById(req.user.id);
    if (user && user.profile?.writingStatistics) {
      user.profile.writingStatistics.booksWritten = Math.max(
        0,
        user.profile.writingStatistics.booksWritten - 1
      );
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete book',
    });
  }
};

/**
 * Publish a book
 * POST /api/books/:id/publish
 */
export const publishBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { price, isFree } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to publish this book',
      });
      return;
    }

    // Validate book has content
    if (book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot publish a book without chapters',
      });
      return;
    }

    // Validate marketplace metadata
    if (!book.synopsis || book.synopsis.trim().length < 100) {
      res.status(400).json({
        success: false,
        error: 'Please add a synopsis (minimum 100 characters) before publishing',
      });
      return;
    }

    if (!book.tags || book.tags.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Please add at least one tag before publishing',
      });
      return;
    }

    // Validate pricing (Section 9.2: Max $25)
    if (!isFree && price) {
      if (price < 0 || price > 25) {
        res.status(400).json({
          success: false,
          error: 'Price must be between $0 and $25',
        });
        return;
      }
    }

    // Update publishing status
    book.publishingStatus.status = 'published';
    book.publishingStatus.isPublic = true;
    book.publishingStatus.publishedAt = new Date();
    book.publishingStatus.isFree = isFree || false;
    book.publishingStatus.price = isFree ? 0 : price || 0;

    await book.save();

    // Update user's author profile
    const user = await User.findById(req.user.id);
    if (user && user.profile?.authorProfile) {
      user.profile.authorProfile.publishedBooks += 1;
      await user.save();
    }

    // Send notification to author about successful publication (async, don't wait)
    notifyBookPublished(req.user!.id, id, book.title).catch((err) =>
      console.error('Failed to send book published notification:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Book published successfully',
      data: {
        book: {
          id: book._id,
          title: book.title,
          publishingStatus: book.publishingStatus,
        },
      },
    });
  } catch (error) {
    console.error('Publish book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish book',
    });
  }
};

/**
 * Purchase a book
 * POST /api/books/:id/purchase
 */
export const purchaseBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if book is published
    if (book.publishingStatus.status !== 'published') {
      res.status(400).json({
        success: false,
        error: 'This book is not available for purchase',
      });
      return;
    }

    // Check if user is trying to purchase their own book
    if (book.author.toString() === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'You cannot purchase your own book',
      });
      return;
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Initialize profile if needed
    if (!user.profile) {
      user.profile = {
        bio: '',
        notificationPreferences: {
          writing: true,
          publishing: true,
          sales: true,
          social: true,
          system: true,
          emailDigest: false,
        },
      };
    }

    // Initialize readingHistory if needed
    if (!user.profile.readingHistory) {
      user.profile.readingHistory = [];
    }

    // Check if already purchased
    const alreadyPurchased = user.profile.readingHistory.some(
      (item) => item.bookId.toString() === id
    );

    if (alreadyPurchased) {
      res.status(400).json({
        success: false,
        error: 'You have already purchased this book',
      });
      return;
    }

    // Add to user's library
    user.profile.readingHistory.push({
      bookId: new mongoose.Types.ObjectId(id),
      progress: 0,
      lastRead: new Date(),
    });

    await user.save();

    // Update book statistics
    book.statistics.purchases += 1;
    book.statistics.revenue += book.publishingStatus.price;
    await book.save();

    // Update author's earnings
    const author = await User.findById(book.author);
    if (author && author.profile) {
      if (!author.profile.earnings) {
        author.profile.earnings = {
          totalEarned: 0,
          pendingPayout: 0,
          withdrawn: 0,
          history: [],
        };
      }
      const authorShare = book.publishingStatus.price * 0.5; // 50% split
      author.profile.earnings.totalEarned += authorShare;
      author.profile.earnings.pendingPayout += authorShare;

      if (author.profile.authorProfile) {
        author.profile.authorProfile.totalSales += 1;
      }

      await author.save();
    }

    // Send notification to author about purchase (async, don't wait)
    notifyBookPurchase(
      id,
      req.user!.id,
      book.author.toString(),
      book.publishingStatus.price,
      'ILS'
    ).catch((err) => console.error('Failed to send purchase notification:', err));

    // Send purchase confirmation email to buyer (async)
    const author = await User.findById(book.author).select('name email');
    sendBookPurchaseEmail(
      user!.email,
      user!.name,
      book.title,
      author?.name || 'Unknown',
      book.publishingStatus.price,
      'ILS',
      id
    ).catch((err) => console.error('Failed to send purchase email:', err));

    // Send sale notification email to author (async)
    if (author) {
      sendSaleNotificationToAuthor(
        author.email,
        author.name,
        book.title,
        user!.name,
        book.publishingStatus.price * 0.5, // Author's share
        'ILS'
      ).catch((err) => console.error('Failed to send sale notification email:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Book purchased successfully',
      data: {
        bookId: book._id,
        title: book.title,
        price: book.publishingStatus.price,
        readUrl: `/read/${book._id}`,
      },
    });
  } catch (error) {
    console.error('Purchase book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase book',
    });
  }
};

/**
 * Get all public published books (for marketplace)
 * GET /api/books/public
 * Section 8: Marketplace
 */
export const getPublicBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre, category, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build query
    const query: any = {
      'publishingStatus.status': 'published',
      'publishingStatus.isPublic': true,
    };

    // Filter by genre
    if (genre && typeof genre === 'string') {
      query.genre = genre;
    }

    // Filter by category
    if (category && typeof category === 'string') {
      query['publishingStatus.marketingStrategy.categories'] = category;
    }

    // Search by title or description
    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sortOptions: any = {};
    if (sortBy === 'price') {
      sortOptions['publishingStatus.price'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'quality') {
      sortOptions['qualityScore.overallScore'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'popularity') {
      sortOptions['statistics.views'] = -1;
    } else {
      sortOptions[sortBy as string] = order === 'asc' ? 1 : -1;
    }

    // Fetch books
    const books = await Book.find(query)
      .populate('author', 'name')
      .select('title genre description coverDesign publishingStatus qualityScore statistics author createdAt')
      .sort(sortOptions)
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        books,
        count: books.length,
      },
    });
  } catch (error) {
    console.error('Get public books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public books',
    });
  }
};

/**
 * Export book as PDF
 * GET /api/books/:id/export
 * Section 16.1: PDF Export
 */
export const exportBookPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to export this book',
      });
      return;
    }

    // Generate PDF
    const pdfDoc = await generateBookPDF(id);

    // Set response headers for PDF download
    const filename = book.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

    // Pipe the PDF to the response
    pdfDoc.pipe(res);
  } catch (error) {
    console.error('Export book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export book',
    });
  }
};

/**
 * Toggle like on a book
 * POST /api/books/:id/like
 */
export const likeBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if user already liked this book
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const likedIndex = book.likedBy.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (likedIndex > -1) {
      // Unlike: remove user from likedBy array
      book.likedBy.splice(likedIndex, 1);
      book.likes = Math.max(0, book.likes - 1);
    } else {
      // Like: add user to likedBy array
      book.likedBy.push(userId);
      book.likes += 1;

      // Send notification to author (async, don't wait)
      notifyBookLike(id, req.user!.id, book.author.toString()).catch((err) =>
        console.error('Failed to send like notification:', err)
      );
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: likedIndex > -1 ? 'Book unliked' : 'Book liked',
      data: {
        likes: book.likes,
        isLiked: likedIndex === -1,
      },
    });
  } catch (error) {
    console.error('Like book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like book',
    });
  }
};

/**
 * Add a review to a book
 * POST /api/books/:id/review
 */
export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
      return;
    }

    if (!comment || comment.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Comment is required',
      });
      return;
    }

    if (comment.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'Comment must not exceed 1000 characters',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check if user already reviewed this book
    const existingReview = book.reviews.find(
      (review) => review.user.toString() === req.user!.id
    );

    if (existingReview) {
      res.status(400).json({
        success: false,
        error: 'You have already reviewed this book',
      });
      return;
    }

    // Get user name
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Add review
    book.reviews.push({
      user: new mongoose.Types.ObjectId(req.user.id),
      userName: user.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date(),
    });

    // Update statistics
    book.statistics.totalReviews = book.reviews.length;

    // Calculate average rating
    const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
    book.statistics.averageRating = totalRating / book.reviews.length;

    await book.save();

    // Send notification to author (async, don't wait)
    notifyBookComment(id, req.user!.id, book.author.toString(), rating).catch((err) =>
      console.error('Failed to send comment notification:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: book.reviews[book.reviews.length - 1],
        averageRating: book.statistics.averageRating,
        totalReviews: book.statistics.totalReviews,
      },
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review',
    });
  }
};

/**
 * Get all reviews for a book
 * GET /api/books/:id/reviews
 */
export const getBookReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id).select('reviews statistics.averageRating statistics.totalReviews');

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        reviews: book.reviews,
        averageRating: book.statistics.averageRating,
        totalReviews: book.statistics.totalReviews,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
    });
  }
};

/**
 * Upload cover image
 * POST /api/books/:id/upload-cover
 */
export const uploadCoverImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check ownership
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Generate public URL for the uploaded file
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update book cover design with proper typing
    if (!book.coverDesign) {
      book.coverDesign = {
        front: {
          type: 'uploaded',
          imageUrl,
          title: {
            text: book.title,
            font: 'Arial',
            size: 48,
            color: '#ffffff',
          },
          authorName: {
            text: '',
            font: 'Arial',
            size: 24,
            color: '#ffffff',
          },
        },
      } as any;
    } else if (!book.coverDesign.front) {
      book.coverDesign.front = {
        type: 'uploaded',
        imageUrl,
        title: {
          text: book.title,
          font: 'Arial',
          size: 48,
          color: '#ffffff',
        },
        authorName: {
          text: '',
          font: 'Arial',
          size: 24,
          color: '#ffffff',
        },
      } as any;
    } else {
      book.coverDesign.front.imageUrl = imageUrl;
      book.coverDesign.front.type = 'uploaded';
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload cover image',
    });
  }
};

/**
 * Upload and extract text from manuscript file
 * POST /api/books/upload
 * Section 4.1: File Upload → Analysis → Book
 */
export const uploadManuscript = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const { title, genre } = req.body;

    if (!title || !genre) {
      res.status(400).json({
        success: false,
        error: 'Title and genre are required',
      });
      return;
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let extractedText = '';

    try {
      // Extract text based on file type
      if (fileExtension === '.pdf') {
        // Extract text from PDF
        const dataBuffer = await fs.readFile(filePath);
        const pdfData = await PDFParser(dataBuffer);
        extractedText = pdfData.text;
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else if (fileExtension === '.txt') {
        // Read plain text file
        extractedText = await fs.readFile(filePath, 'utf-8');
      } else {
        // Clean up file
        await fs.unlink(filePath);
        res.status(400).json({
          success: false,
          error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.',
        });
        return;
      }

      // Clean up uploaded file after extraction
      await fs.unlink(filePath);

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 100) {
        res.status(400).json({
          success: false,
          error: 'Could not extract sufficient text from the file. Please ensure the file contains readable text.',
        });
        return;
      }

      // Calculate word count
      const wordCount = extractedText.trim().split(/\s+/).length;

      // Create new book with extracted content
      const book = new Book({
        title: title.trim(),
        author: req.user.id,
        genre,
        description: `Imported from ${req.file.originalname}`,
        language: 'en',
        chapters: [
          {
            title: 'Imported Content',
            content: extractedText.trim(),
            order: 0,
            wordCount,
          },
        ],
        publishingStatus: {
          status: 'draft',
          price: 0,
          isFree: true,
          isPublic: false,
        },
        statistics: {
          wordCount,
          pageCount: Math.ceil(wordCount / 250), // Rough estimate: 250 words per page
          chapterCount: 1,
          characterCount: 0,
          views: 0,
          purchases: 0,
          revenue: 0,
          totalReviews: 0,
        },
      });

      await book.save();

      // Update user's writing statistics
      const user = await User.findById(req.user.id);
      if (user && user.profile) {
        if (!user.profile.writingStatistics) {
          user.profile.writingStatistics = {
            totalWords: 0,
            booksWritten: 0,
          };
        }
        user.profile.writingStatistics.booksWritten += 1;
        user.profile.writingStatistics.totalWords += wordCount;
        await user.save();
      }

      res.status(201).json({
        success: true,
        message: 'Manuscript uploaded and processed successfully',
        data: {
          book: {
            id: book._id,
            title: book.title,
            genre: book.genre,
            wordCount,
            chapters: book.chapters.map((ch) => ({
              title: ch.title,
              wordCount: ch.wordCount,
            })),
          },
        },
      });
    } catch (extractError) {
      // Clean up file on error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
      throw extractError;
    }
  } catch (error) {
    console.error('Upload manuscript error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process uploaded manuscript',
    });
  }
};

/**
 * Upload and transcribe audio file
 * POST /api/books/upload-audio
 * Section 4.1: Audio Upload → Transcription → Book
 */
export const uploadAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No audio file uploaded',
      });
      return;
    }

    const { title, genre, language } = req.body;

    if (!title || !genre) {
      res.status(400).json({
        success: false,
        error: 'Title and genre are required',
      });
      return;
    }

    const filePath = req.file.path;

    try {
      console.log(`🎤 Processing audio file: ${req.file.originalname}`);

      // Transcribe audio using Whisper API
      const { text: transcribedText, language: detectedLanguage } = await transcribeAudio(
        filePath,
        language
      );

      // Clean up uploaded file after transcription
      await fs.unlink(filePath);

      // Validate transcribed text
      if (!transcribedText || transcribedText.trim().length < 50) {
        res.status(400).json({
          success: false,
          error: 'Could not transcribe sufficient text from the audio. Please ensure the audio has clear speech.',
        });
        return;
      }

      // Calculate word count
      const wordCount = transcribedText.trim().split(/\s+/).length;

      // Create new book with transcribed content
      const book = new Book({
        title: title.trim(),
        author: req.user.id,
        genre,
        description: `Transcribed from audio: ${req.file.originalname}`,
        language: detectedLanguage || 'en',
        chapters: [
          {
            title: 'Transcribed Content',
            content: transcribedText.trim(),
            order: 0,
            wordCount,
          },
        ],
        publishingStatus: {
          status: 'draft',
          price: 0,
          isFree: true,
          isPublic: false,
        },
        statistics: {
          wordCount,
          pageCount: Math.ceil(wordCount / 250),
          chapterCount: 1,
          characterCount: 0,
          views: 0,
          purchases: 0,
          revenue: 0,
          totalReviews: 0,
        },
      });

      await book.save();

      // Update user's writing statistics
      const user = await User.findById(req.user.id);
      if (user && user.profile) {
        if (!user.profile.writingStatistics) {
          user.profile.writingStatistics = {
            totalWords: 0,
            booksWritten: 0,
          };
        }
        user.profile.writingStatistics.booksWritten += 1;
        user.profile.writingStatistics.totalWords += wordCount;
        await user.save();
      }

      console.log(`✅ Audio transcription complete. Created book: ${book._id}`);

      res.status(201).json({
        success: true,
        message: 'Audio transcribed and book created successfully',
        data: {
          book: {
            id: book._id,
            title: book.title,
            genre: book.genre,
            language: detectedLanguage,
            wordCount,
            chapters: book.chapters.map((ch) => ({
              title: ch.title,
              wordCount: ch.wordCount,
            })),
          },
        },
      });
    } catch (transcriptionError: any) {
      // Clean up file on error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to clean up audio file:', unlinkError);
      }

      // Handle specific transcription errors
      if (transcriptionError.message.includes('API key')) {
        res.status(500).json({
          success: false,
          error: 'Audio transcription is not configured. Please contact support.',
        });
        return;
      }

      throw transcriptionError;
    }
  } catch (error: any) {
    console.error('Upload audio error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process uploaded audio',
    });
  }
};

/**
 * Get AI pricing strategy for a book
 * GET /api/books/:id/pricing-strategy
 */
export const getPricingStrategy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    // Generate pricing strategy
    const strategy = await generatePricingStrategy(id, req.user.id);

    res.status(200).json({
      success: true,
      data: strategy,
    });
  } catch (error: any) {
    console.error('Get pricing strategy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate pricing strategy',
    });
  }
};

/**
 * Export book to PDF or DOCX
 * GET /api/books/:id/export/:format
 */
export const exportBookToFormat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, format } = req.params;

    // Validate format
    if (!['pdf', 'docx'].includes(format)) {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Supported formats: pdf, docx',
      });
      return;
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to export this book',
      });
      return;
    }

    // Generate export file
    const buffer = await exportBook(id, format as 'pdf' | 'docx');

    // Set response headers
    const filename = book.title.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '_');
    const contentType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error: any) {
    console.error('Export book error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export book',
    });
  }
};

/**
 * Upload a page image for book layout
 * POST /api/books/:id/page-image
 */
export const uploadPageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No image file uploaded',
      });
      return;
    }

    const { id } = req.params;
    const { pageIndex, x, y, width, height, rotation } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Validate pageIndex
    if (pageIndex === undefined || pageIndex < 0) {
      res.status(400).json({
        success: false,
        error: 'Valid page index is required',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Generate public URL for the uploaded file
    const imageUrl = `/uploads/${req.file.filename}`;

    // Initialize pageImages array if it doesn't exist
    if (!book.pageImages) {
      book.pageImages = [];
    }

    // Create page image entry
    const pageImage = {
      pageIndex: parseInt(pageIndex, 10),
      url: imageUrl,
      x: parseFloat(x) || 10,
      y: parseFloat(y) || 10,
      width: parseFloat(width) || 30,
      height: parseFloat(height) || 30,
      rotation: parseFloat(rotation) || 0,
      isAiGenerated: false,
      createdAt: new Date(),
    };

    book.pageImages.push(pageImage as any);
    await book.save();

    // Get the saved image with its _id
    const savedImage = book.pageImages[book.pageImages.length - 1];

    res.status(201).json({
      success: true,
      message: 'Page image uploaded successfully',
      data: {
        image: savedImage,
      },
    });
  } catch (error: any) {
    console.error('Upload page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload page image',
    });
  }
};

/**
 * Update page image position/size
 * PUT /api/books/:id/page-image/:imageId
 */
export const updatePageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, imageId } = req.params;
    const { pageIndex, x, y, width, height, rotation } = req.body;

    // Validate MongoDB IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid image ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Find the page image
    if (!book.pageImages) {
      res.status(404).json({
        success: false,
        error: 'No page images found',
      });
      return;
    }

    const imageIndex = book.pageImages.findIndex(
      (img: any) => img._id?.toString() === imageId
    );

    if (imageIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Page image not found',
      });
      return;
    }

    // Update image properties
    if (pageIndex !== undefined) book.pageImages[imageIndex].pageIndex = parseInt(pageIndex, 10);
    if (x !== undefined) book.pageImages[imageIndex].x = parseFloat(x);
    if (y !== undefined) book.pageImages[imageIndex].y = parseFloat(y);
    if (width !== undefined) book.pageImages[imageIndex].width = parseFloat(width);
    if (height !== undefined) book.pageImages[imageIndex].height = parseFloat(height);
    if (rotation !== undefined) book.pageImages[imageIndex].rotation = parseFloat(rotation);

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Page image updated successfully',
      data: {
        image: book.pageImages[imageIndex],
      },
    });
  } catch (error: any) {
    console.error('Update page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update page image',
    });
  }
};

/**
 * Delete page image
 * DELETE /api/books/:id/page-image/:imageId
 */
export const deletePageImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id, imageId } = req.params;

    // Validate MongoDB IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid image ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Find and remove the page image
    if (!book.pageImages) {
      res.status(404).json({
        success: false,
        error: 'No page images found',
      });
      return;
    }

    const imageIndex = book.pageImages.findIndex(
      (img: any) => img._id?.toString() === imageId
    );

    if (imageIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Page image not found',
      });
      return;
    }

    // Get the image URL before removing (for cleanup)
    const imageUrl = book.pageImages[imageIndex].url;

    // Remove from array
    book.pageImages.splice(imageIndex, 1);
    await book.save();

    // Try to delete the actual file (optional - don't fail if file doesn't exist)
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filename = imageUrl.replace('/uploads/', '');
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.log('Could not delete image file:', filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Page image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete page image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete page image',
    });
  }
};

/**
 * Get all page images for a book
 * GET /api/books/:id/page-images
 */
export const getPageImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id).select('pageImages author');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        images: book.pageImages || [],
      },
    });
  } catch (error: any) {
    console.error('Get page images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get page images',
    });
  }
};

/**
 * Update page images in batch (for auto-save)
 * PUT /api/books/:id/page-images
 */
export const updatePageImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { images } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    // Update page images (only update positions, not add new ones)
    if (Array.isArray(images) && book.pageImages) {
      images.forEach((update: any) => {
        if (update._id) {
          const existingIndex = book.pageImages!.findIndex(
            (img: any) => img._id?.toString() === update._id
          );
          if (existingIndex !== -1) {
            if (update.pageIndex !== undefined) book.pageImages![existingIndex].pageIndex = update.pageIndex;
            if (update.x !== undefined) book.pageImages![existingIndex].x = update.x;
            if (update.y !== undefined) book.pageImages![existingIndex].y = update.y;
            if (update.width !== undefined) book.pageImages![existingIndex].width = update.width;
            if (update.height !== undefined) book.pageImages![existingIndex].height = update.height;
            if (update.rotation !== undefined) book.pageImages![existingIndex].rotation = update.rotation;
          }
        }
      });
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Page images updated successfully',
      data: {
        images: book.pageImages || [],
      },
    });
  } catch (error: any) {
    console.error('Update page images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update page images',
    });
  }
};

/**
 * Track book share
 * POST /api/books/:id/share
 */
export const shareBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { platform } = req.body; // 'whatsapp', 'twitter', 'facebook', 'copy', 'native'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Increment share count
    if (!book.statistics.shares) {
      book.statistics.shares = 0;
    }
    book.statistics.shares += 1;

    await book.save();

    // Send notification to author (async, don't wait)
    notifyBookShare(id, req.user!.id, book.author.toString(), platform).catch((err) =>
      console.error('Failed to send share notification:', err)
    );

    // Generate share URL
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reader/${id}`;

    res.status(200).json({
      success: true,
      message: 'Share tracked successfully',
      data: {
        shares: book.statistics.shares,
        shareUrl,
        platform: platform || 'unknown',
      },
    });
  } catch (error) {
    console.error('Share book error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track share',
    });
  }
};

/**
 * Get book social stats (likes, shares, comments)
 * GET /api/books/:id/social-stats
 */
export const getBookSocialStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const book = await Book.findById(id).select(
      'likes likedBy statistics.shares statistics.totalReviews statistics.averageRating'
    );

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        likes: book.likes,
        shares: book.statistics.shares || 0,
        comments: book.statistics.totalReviews,
        averageRating: book.statistics.averageRating,
      },
    });
  } catch (error) {
    console.error('Get social stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get social stats',
    });
  }
};
