/**
 * Sitemap Routes
 * Public routes for SEO - sitemap.xml and robots.txt
 */

import { Router } from 'express';
import { generateSitemap, generateRobotsTxt } from '../controllers/sitemapController';

const router = Router();

/**
 * GET /sitemap.xml
 * Returns XML sitemap for search engine crawlers
 * No authentication required
 */
router.get('/sitemap.xml', generateSitemap as any);

/**
 * GET /robots.txt
 * Returns robots.txt for search engine crawlers
 * No authentication required
 */
router.get('/robots.txt', generateRobotsTxt as any);

export default router;
