import { Router, Request, Response, NextFunction } from 'express';
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
 * Cache middleware for public promotion endpoints.
 * 2-minute CDN cache + stale-while-revalidate so Vercel edge serves instantly
 * while the next response is being prepared in the background.
 */
function publicCache(maxAge = 120) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`);
    next();
  };
}

/**
 * Promotion Routes
 * Provides organic book promotion endpoints
 */

// GET /api/promotions/featured - Get featured/editor's choice books
router.get('/featured', publicCache(120), optionalAuth as any, getFeatured as any);

// GET /api/promotions/rising-stars - Get rising star books
router.get('/rising-stars', publicCache(120), optionalAuth as any, getRisingStars as any);

// GET /api/promotions/quality-releases - Get quality new releases
router.get('/quality-releases', publicCache(120), optionalAuth as any, getQualityReleases as any);

// GET /api/promotions/trending - Get trending by velocity
router.get('/trending', publicCache(120), optionalAuth as any, getTrending as any);

// GET /api/promotions/top-authors - Get top authors spotlight
router.get('/top-authors', publicCache(120), optionalAuth as any, getTopAuthorsSpotlight as any);

// GET /api/promotions/genre/:genre - Get top books in genre
router.get('/genre/:genre', publicCache(60), optionalAuth as any, getTopInGenre as any);

// GET /api/promotions/summary - Get promotion summary (for admin)
router.get('/summary', optionalAuth as any, getPromotionSummary as any);

export default router;
