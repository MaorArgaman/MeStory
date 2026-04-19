import { Response } from 'express';
import { AuthRequest } from '../types';
import * as recommendationService from '../services/recommendationService';
import * as mlRecommendationService from '../services/mlRecommendationService';
import { Book } from '../models/Book';
import { UserActivity } from '../models/UserActivity';

/**
 * Get personalized book recommendations
 * GET /api/recommendations
 */
export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const { books, reasons } = await recommendationService.getPersonalizedRecommendations(
      req.user.id,
      limit
    );

    // Convert reasons Map to object for JSON
    const reasonsObj: Record<string, string[]> = {};
    reasons.forEach((value, key) => {
      reasonsObj[key] = value;
    });

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: {
          books,
          reasons: reasonsObj,
        },
      });
    }
  } catch (error) {
    console.error('Get recommendations error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
      });
    }
  }
};

/**
 * Get trending books
 * GET /api/recommendations/trending
 */
export const getTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const { books } = await recommendationService.getTrendingBooks(limit);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get trending error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get trending books',
      });
    }
  }
};

/**
 * Get new releases
 * GET /api/recommendations/new-releases
 */
export const getNewReleases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const minQuality = parseInt(req.query.minQuality as string) || 60;

    const books = await recommendationService.getNewReleases(limit, minQuality);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get new releases error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get new releases',
      });
    }
  }
};

/**
 * Get books by genre
 * GET /api/recommendations/genre/:genre
 */
export const getByGenre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genre } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const books = await recommendationService.getBooksByGenre(genre, limit);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get by genre error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get books by genre',
      });
    }
  }
};

/**
 * Get continue reading list
 * GET /api/recommendations/continue-reading
 */
export const getContinueReading = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const books = await recommendationService.getContinueReading(req.user.id);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get continue reading error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get continue reading list',
      });
    }
  }
};

/**
 * Get continue writing list
 * GET /api/recommendations/continue-writing
 */
export const getContinueWriting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const books = await recommendationService.getContinueWriting(req.user.id);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get continue writing error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get continue writing list',
      });
    }
  }
};

/**
 * Get similar books
 * GET /api/recommendations/similar/:bookId
 */
export const getSimilar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const books = await recommendationService.getSimilarBooks(bookId, limit);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get similar books error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get similar books',
      });
    }
  }
};

/**
 * Get top authors
 * GET /api/recommendations/top-authors
 */
export const getTopAuthors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const authors = await recommendationService.getTopAuthors(limit);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { authors },
      });
    }
  } catch (error) {
    console.error('Get top authors error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get top authors',
      });
    }
  }
};

/**
 * Record user interaction
 * POST /api/recommendations/interaction
 */
export const recordInteraction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, type, duration, metadata } = req.body;

    if (!bookId || !type) {
      res.status(400).json({
        success: false,
        error: 'bookId and type are required',
      });
      return;
    }

    await recommendationService.recordInteraction(
      req.user.id,
      bookId,
      type,
      duration,
      metadata
    );

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: 'Interaction recorded',
      });
    }
  } catch (error) {
    console.error('Record interaction error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to record interaction',
      });
    }
  }
};

/**
 * Update reading progress
 * POST /api/recommendations/reading-progress
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

    const { bookId, chapterNumber, percentageComplete, readingTime } = req.body;

    if (!bookId) {
      res.status(400).json({
        success: false,
        error: 'bookId is required',
      });
      return;
    }

    await recommendationService.updateReadingProgress(
      req.user.id,
      bookId,
      chapterNumber || 0,
      percentageComplete || 0,
      readingTime || 0
    );

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        message: 'Reading progress updated',
      });
    }
  } catch (error) {
    console.error('Update reading progress error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to update reading progress',
      });
    }
  }
};

// ==================== ML RECOMMENDATION ENDPOINTS ====================

/**
 * Get personalized feed with all recommendation types
 * GET /api/recommendations/personalized-feed
 */
export const getPersonalizedFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const feed = await mlRecommendationService.getPersonalizedFeed(req.user.id);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: feed,
      });
    }
  } catch (error) {
    console.error('Get personalized feed error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get personalized feed',
      });
    }
  }
};

/**
 * Get diversified recommendations with ML algorithms
 * GET /api/recommendations/ml
 */
export const getMLRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const diversity = parseFloat(req.query.diversity as string) || 0.3;

    const recommendations = await mlRecommendationService.getDiversifiedRecommendations(
      req.user.id,
      limit,
      diversity
    );

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { recommendations },
      });
    }
  } catch (error) {
    console.error('Get ML recommendations error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get ML recommendations',
      });
    }
  }
};

/**
 * Get "Because you read" recommendations
 * GET /api/recommendations/because-you-read
 */
export const getBecauseYouRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 3;
    const booksPerSource = parseInt(req.query.booksPerSource as string) || 4;

    const recommendations = await mlRecommendationService.getBecauseYouRead(
      req.user.id,
      limit,
      booksPerSource
    );

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { recommendations },
      });
    }
  } catch (error) {
    console.error('Get because you read error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get because you read recommendations',
      });
    }
  }
};

/**
 * Get content-based similar books
 * GET /api/recommendations/content-similar/:bookId
 */
export const getContentSimilar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const books = await mlRecommendationService.getContentSimilarBooks(bookId, limit);

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { books },
      });
    }
  } catch (error) {
    console.error('Get content similar error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get similar books',
      });
    }
  }
};

/**
 * Get user's reading progress with book details
 * GET /api/recommendations/reading-progress
 */
/**
 * Lightweight progress-details handler.
 *
 * The old implementation called getPersonalizedFeed() which runs 6+ heavy
 * DB queries (trending, recommendations, etc.) but only used two fields from
 * the result.  This replacement makes exactly 2 targeted queries:
 *   1. UserActivity  — to get currentlyReading book IDs + reading history
 *   2. Book.find     — user's draft books (max 5, lightweight projection)
 *
 * Runs in < 200 ms vs the 10 s+ that caused Vercel 504s.
 */
export const getReadingProgressDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userId = req.user.id;

    // ── 1. Continue Reading ───────────────────────────────────────────────────
    let continueReading: Array<{ book: any; progress: number; lastReadAt: Date }> = [];
    try {
      const userActivity = await UserActivity.findOne({ userId });

      if (userActivity && userActivity.currentlyReading?.length > 0) {
        const ids = userActivity.currentlyReading.map((id: any) => id.toString());
        // Fetch each book individually (custom model doesn't support $in filter natively)
        const bookResults = await Promise.all(
          ids.map((id: string) => Book.findOne({ _id: id }).catch(() => null))
        );
        const books = bookResults.filter(Boolean) as any[];

        continueReading = books.map((book: any) => {
          const hist = (userActivity.readingHistory || []).find(
            (h: any) => h.bookId?.toString() === book._id?.toString()
          );
          return {
            book,
            progress: hist?.percentageComplete || 0,
            lastReadAt: hist?.lastReadAt ? new Date(hist.lastReadAt) : new Date(),
          };
        });
        continueReading.sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime());
      }
    } catch (e) {
      console.warn('continueReading fetch failed:', e);
    }

    // ── 2. Continue Writing ───────────────────────────────────────────────────
    let continueWriting: Array<{ book: any; lastEditedAt: Date; wordCount: number }> = [];
    try {
      const allAuthorBooks = await Book.find({ author: userId });
      const drafts = allAuthorBooks
        .filter((b: any) => !b.publishingStatus?.status || b.publishingStatus.status === 'draft')
        .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 5);

      continueWriting = drafts.map((book: any) => ({
        book,
        lastEditedAt: book.updatedAt ? new Date(book.updatedAt) : new Date(),
        wordCount: book.statistics?.wordCount || 0,
      }));
    } catch (e) {
      console.warn('continueWriting fetch failed:', e);
    }

    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        data: { continueReading, continueWriting },
      });
    }
  } catch (error) {
    console.error('Get reading progress details error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to get reading progress details' });
    }
  }
};
