/**
 * Public + cron routes for David. Mounted at /api.
 *   GET  /api/articles            → list published articles (for the site)
 *   GET  /api/articles/:slug      → one published article
 *   GET|POST /api/agents/david/run → daily trigger (CRON_SECRET-guarded)
 *
 * Admin controls live under /api/admin/david/* (see adminRoutes.ts) so they
 * inherit the authenticate + requireAdmin chain.
 */

import { Router } from 'express';
import {
  listPublicArticles,
  getPublicArticle,
  runDavidCron,
} from '../controllers/davidController';

const router = Router();

router.get('/articles', listPublicArticles as any);
router.get('/articles/:slug', getPublicArticle as any);

router.get('/agents/david/run', runDavidCron as any);
router.post('/agents/david/run', runDavidCron as any);

export default router;
