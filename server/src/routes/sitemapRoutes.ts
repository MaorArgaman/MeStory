/**
 * Sitemap Routes
 * Public routes for SEO - sitemap.xml, robots.txt, and IndexNow verifier.
 */

import { Router } from 'express';
import { generateSitemap, generateRobotsTxt } from '../controllers/sitemapController';
import { serveIndexNowKey, submitToIndexNow } from '../controllers/indexNowController';

const router = Router();

/**
 * GET /sitemap.xml
 * Returns XML sitemap for search engine crawlers.
 */
router.get('/sitemap.xml', generateSitemap as any);

/**
 * GET /robots.txt
 * Returns robots.txt for search engine crawlers.
 */
router.get('/robots.txt', generateRobotsTxt as any);

/**
 * GET /indexnow-key/:key
 * IndexNow ownership verification endpoint. The IndexNow API fetches this URL
 * after a submission and expects the key in plain text.
 */
router.get('/indexnow-key/:key', serveIndexNowKey as any);

/**
 * POST /api/indexnow/submit
 * Programmatic IndexNow submission (manual trigger from admin tools).
 */
router.post('/api/indexnow/submit', submitToIndexNow as any);

export default router;
