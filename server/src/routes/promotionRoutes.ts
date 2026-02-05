import { Router } from 'express';
import {
  getFeatured,
  getRisingStars,
  getQualityReleases,
  getTrending,
  getTopAuthorsSpotlight,
  getTopInGenre,
  getPromotionSummary,
} from '../controllers/promotionController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Promotion Routes
 * Provides organic book promotion endpoints
 */

// GET /api/promotions/featured - Get featured/editor's choice books
router.get('/featured', optionalAuth as any, getFeatured as any);

// GET /api/promotions/rising-stars - Get rising star books
router.get('/rising-stars', optionalAuth as any, getRisingStars as any);

// GET /api/promotions/quality-releases - Get quality new releases
router.get('/quality-releases', optionalAuth as any, getQualityReleases as any);

// GET /api/promotions/trending - Get trending by velocity
router.get('/trending', optionalAuth as any, getTrending as any);

// GET /api/promotions/top-authors - Get top authors spotlight
router.get('/top-authors', optionalAuth as any, getTopAuthorsSpotlight as any);

// GET /api/promotions/genre/:genre - Get top books in genre
router.get('/genre/:genre', optionalAuth as any, getTopInGenre as any);

// GET /api/promotions/summary - Get promotion summary (for admin)
router.get('/summary', optionalAuth as any, getPromotionSummary as any);

export default router;
