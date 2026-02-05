import { Router } from 'express';
import {
  getRecommendations,
  getTrending,
  getNewReleases,
  getByGenre,
  getContinueReading,
  getContinueWriting,
  getSimilar,
  getTopAuthors,
  recordInteraction,
  updateReadingProgress,
  getPersonalizedFeed,
  getMLRecommendations,
  getBecauseYouRead,
  getContentSimilar,
  getReadingProgressDetails,
} from '../controllers/recommendationController';
import { authenticate, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * Recommendation Routes
 * Provides personalized book recommendations and discovery features
 */

// GET /api/recommendations - Get personalized recommendations (requires auth)
router.get('/', authenticate as any, getRecommendations as any);

// GET /api/recommendations/personalized-feed - Get full personalized feed (requires auth)
router.get('/personalized-feed', authenticate as any, getPersonalizedFeed as any);

// GET /api/recommendations/ml - Get ML-powered diversified recommendations (requires auth)
router.get('/ml', authenticate as any, getMLRecommendations as any);

// GET /api/recommendations/because-you-read - Get "because you read" recommendations (requires auth)
router.get('/because-you-read', authenticate as any, getBecauseYouRead as any);

// GET /api/recommendations/trending - Get trending books (public)
router.get('/trending', optionalAuth as any, getTrending as any);

// GET /api/recommendations/new-releases - Get new releases (public)
router.get('/new-releases', optionalAuth as any, getNewReleases as any);

// GET /api/recommendations/genre/:genre - Get books by genre (public)
router.get('/genre/:genre', optionalAuth as any, getByGenre as any);

// GET /api/recommendations/continue-reading - Get continue reading list (requires auth)
router.get('/continue-reading', authenticate as any, getContinueReading as any);

// GET /api/recommendations/continue-writing - Get continue writing list (requires auth)
router.get('/continue-writing', authenticate as any, getContinueWriting as any);

// GET /api/recommendations/progress-details - Get reading/writing progress with details (requires auth)
router.get('/progress-details', authenticate as any, getReadingProgressDetails as any);

// GET /api/recommendations/similar/:bookId - Get similar books (public)
router.get('/similar/:bookId', optionalAuth as any, getSimilar as any);

// GET /api/recommendations/content-similar/:bookId - Get content-based similar books (public)
router.get('/content-similar/:bookId', optionalAuth as any, getContentSimilar as any);

// GET /api/recommendations/top-authors - Get top authors (public)
router.get('/top-authors', optionalAuth as any, getTopAuthors as any);

// POST /api/recommendations/interaction - Record user interaction (requires auth)
router.post('/interaction', authenticate as any, recordInteraction as any);

// POST /api/recommendations/reading-progress - Update reading progress (requires auth)
router.post('/reading-progress', authenticate as any, updateReadingProgress as any);

export default router;
