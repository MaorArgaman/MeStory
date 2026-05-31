/**
 * HTTP layer for David:
 *   - public:  serve published articles to the site (/api/articles...)
 *   - cron:    the daily trigger (/api/agents/david/run), secret-guarded
 *   - admin:   dashboard data + controls (mounted under /api/admin/david)
 */

import { Request, Response } from 'express';
import * as store from './../services/david/davidStore';
import { runDailyCycle } from '../services/david/davidAgent';

// ==================== PUBLIC (site) ====================

export const listPublicArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await store.listPublishedArticles();
    // Trim payload for the list view.
    const list = articles.map((a) => ({
      slug: a.slug,
      lang: a.lang,
      title: a.title,
      description: a.description,
      keywords: a.keywords,
      published_at: a.published_at,
    }));
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error('listPublicArticles error:', error);
    res.status(500).json({ success: false, error: 'Failed to list articles' });
  }
};

export const getPublicArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await store.getArticleBySlug(req.params.slug);
    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('getPublicArticle error:', error);
    res.status(500).json({ success: false, error: 'Failed to load article' });
  }
};

// ==================== CRON ====================

/**
 * Daily trigger. In production Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET`. We accept that, or a ?key= match.
 */
export const runDavidCron = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    const keyParam = (req.query.key as string) || '';
    if (auth !== `Bearer ${secret}` && keyParam !== secret) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Refuse to run unguarded in production.
    res.status(503).json({ success: false, error: 'CRON_SECRET not configured' });
    return;
  }

  // Avoid double daily runs if the cron fires more than once.
  if (await store.hasRunToday()) {
    res.status(200).json({ success: true, skipped: true, reason: 'already ran today' });
    return;
  }

  // Respond immediately, run in the background (cron has no consumer waiting).
  res.status(202).json({ success: true, message: 'David started' });
  runDailyCycle('cron').catch((e) => console.error('[David] cron run error:', e));
};

// ==================== ADMIN ====================

export const adminGetOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [config, runs, queries, articles] = await Promise.all([
      store.getConfig(),
      store.listRuns(30),
      store.getActiveQueries(),
      store.listAllArticles(),
    ]);

    const trend = runs
      .slice()
      .reverse()
      .map((r) => ({
        date: r.run_date,
        presenceRate: r.metrics?.presenceRate ?? null,
        trackedQueries: r.metrics?.trackedQueries ?? null,
        coveredQueries: r.metrics?.coveredQueries ?? null,
      }));

    res.status(200).json({
      success: true,
      data: {
        config,
        lastRun: runs[0] || null,
        totals: {
          trackedQueries: queries.length,
          coveredQueries: queries.filter((q) => q.covered_by_article_id).length,
          publishedArticles: articles.filter((a) => a.status === 'published').length,
          draftArticles: articles.filter((a) => a.status === 'draft').length,
          totalRuns: runs.length,
        },
        trend,
      },
    });
  } catch (error) {
    console.error('adminGetOverview error:', error);
    res.status(500).json({ success: false, error: 'Failed to load David overview' });
  }
};

export const adminListRuns = async (_req: Request, res: Response): Promise<void> => {
  try {
    const runs = await store.listRuns(60);
    res.status(200).json({ success: true, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list runs' });
  }
};

export const adminGetRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await store.getRunWithActions(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, error: 'Run not found' });
      return;
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load run' });
  }
};

export const adminGetConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await store.getConfig();
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load config' });
  }
};

export const adminUpdateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ['enabled', 'competitors', 'email_recipient', 'locales', 'queries_per_run', 'articles_per_run'] as const;
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in req.body) patch[k] = req.body[k];
    }
    const config = await store.updateConfig(patch);
    res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update config' });
  }
};

export const adminRunNow = async (_req: Request, res: Response): Promise<void> => {
  // Run synchronously so the admin sees the result, but cap exposure: the
  // cycle itself is time-bounded.
  try {
    const result = await runDailyCycle('manual');
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Run failed' });
  }
};

export const adminListArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await store.listAllArticles();
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list articles' });
  }
};

export const adminSetArticleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: 'published' | 'draft' | 'unpublished' };
    if (!['published', 'draft', 'unpublished'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }
    await store.setArticleStatus(req.params.id, status);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update article' });
  }
};
