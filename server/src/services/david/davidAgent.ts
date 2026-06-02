/**
 * David — the daily orchestrator. One bounded cycle per day:
 *   1. ensure tracked queries exist (seed on first run)
 *   2. discover competitors if none configured
 *   3. re-check a rotating batch of queries (AEO + grounded Google)
 *   4. pick an uncovered gap and write ONE article (guardrailed) → publish
 *   5. grow the tracked-query set with fresh gaps
 *   6. note a media/promotion observation
 *   7. snapshot metrics, email the admin, stamp the run
 *
 * Everything is best-effort and time-bounded to fit Vercel's 300s limit.
 * David never repeats a topic: covered queries and published titles are
 * read back from the store before he picks new work.
 */

import * as store from './davidStore';
import { checkQuery, discoverCompetitors } from './rankChecker';
import { generateArticle } from './articleWriter';
import { reviewArticle } from './guardrails';
import { sendDailyReport, DailyReport } from './davidEmail';
import { anthropicStructured, geminiGroundedSearch } from './llmClients';
import { DavidQuery, Lang, RankResult, QueryCheck } from './types';

// Bilingual seed set — the questions/keywords David starts tracking.
const SEED_QUERIES: Array<{ query: string; lang: Lang; intent: 'seo' | 'geo' | 'aeo' }> = [
  { query: 'איך כותבים ספר הנצחה לאדם יקר', lang: 'he', intent: 'aeo' },
  { query: 'איך לכתוב אוטוביוגרפיה', lang: 'he', intent: 'aeo' },
  { query: 'ספר זיכרון לחייל שנפל', lang: 'he', intent: 'seo' },
  { query: 'איך לתעד את סיפור החיים של סבא וסבתא', lang: 'he', intent: 'aeo' },
  { query: 'שאלות לראיון עם בן משפחה מבוגר', lang: 'he', intent: 'aeo' },
  { query: 'יצירת ספר משפחתי דיגיטלי', lang: 'he', intent: 'seo' },
  { query: 'איך מנציחים זיכרון של אדם אהוב', lang: 'he', intent: 'aeo' },
  { query: 'הדפסת ספר זיכרון אישי', lang: 'he', intent: 'seo' },
  { query: 'how to write a memorial book for a loved one', lang: 'en', intent: 'aeo' },
  { query: 'how to write an autobiography', lang: 'en', intent: 'aeo' },
  { query: 'best way to preserve family stories', lang: 'en', intent: 'aeo' },
  { query: 'questions to ask elderly relatives about their life', lang: 'en', intent: 'aeo' },
  { query: 'creating a tribute book for someone who passed away', lang: 'en', intent: 'seo' },
  { query: 'how to start writing your life story', lang: 'en', intent: 'aeo' },
  { query: 'memorial book ideas', lang: 'en', intent: 'seo' },
  { query: 'AI tools for writing a family history book', lang: 'en', intent: 'seo' },
];

const NEW_QUERIES_SCHEMA = {
  type: 'object',
  properties: {
    queries: {
      type: 'array',
      minItems: 0,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'A real search query / question people ask' },
          lang: { type: 'string', enum: ['he', 'en'] },
          intent: { type: 'string', enum: ['seo', 'geo', 'aeo'] },
        },
        required: ['query', 'lang', 'intent'],
        additionalProperties: false,
      },
    },
  },
  required: ['queries'],
  additionalProperties: false,
};

export interface RunResult {
  status: 'success' | 'partial' | 'error' | 'skipped';
  runId?: string;
  summary: string;
}

export async function runDailyCycle(trigger: 'cron' | 'manual'): Promise<RunResult> {
  const config = await store.getConfig();
  if (!config.enabled) {
    return { status: 'skipped', summary: 'David is disabled in config.' };
  }

  const runId = await store.startRun(trigger);
  const report: DailyReport = {
    date: new Date().toISOString().split('T')[0],
    trigger,
    ranks: [],
    addedQueries: 0,
    discoveredCompetitors: [],
    mediaNotes: [],
    metrics: { trackedQueries: 0, coveredQueries: 0, presenceRate: 0 },
    nextFocus: [],
  };
  let actionsCount = 0;
  let competitors = config.competitors;

  try {
    // 1. Seed on first run.
    const active = await store.getActiveQueries();
    if (active.length === 0) {
      await store.addQueries(SEED_QUERIES);
    }

    // 2. Discover competitors if none configured.
    if (competitors.length === 0) {
      const found = await discoverCompetitors();
      if (found.length) {
        competitors = found;
        await store.updateConfig({ competitors: found });
        await store.logAction({
          run_id: runId,
          type: 'competitor_discovered',
          title: `זוהו ${found.length} מתחרים פוטנציאליים`,
          details: { competitors: found },
        });
        actionsCount++;
        report.discoveredCompetitors = found.map((c) => c.name);
      }
    }

    // 3. Re-check a rotating batch — in parallel to stay well under the
    //    serverless time limit (each query already fans out to 3 assistants).
    const toCheck = await store.getQueriesToCheck(config.queries_per_run);
    const rankResults = await Promise.all(
      toCheck.map(async (q) => {
        try {
          const result = await checkQuery(q.query, q.lang, competitors);
          const check: QueryCheck = {
            date: report.date,
            present: result.aiPresent,
            googlePresent: result.googlePresent,
            competitors: result.competitorsSeen,
          };
          await store.recordQueryCheck(q, check);
          await store.logAction({
            run_id: runId,
            type: 'rank_check',
            title: `נבדקה השאלה: ${q.query}`,
            details: { ...result },
          });
          return result;
        } catch (e: any) {
          console.error('[David] rank check failed for', q.query, e.message || e);
          return null;
        }
      }),
    );
    for (const r of rankResults) {
      if (r) {
        report.ranks.push(r);
        actionsCount++;
      }
    }

    // Steps 4-6 are independent of each other, so run them concurrently to
    // keep total wall-clock comfortably under the serverless time limit.
    // (Article generation is the long pole; new-query proposal and the media
    //  observation overlap with it instead of adding to it.)
    const [, added, media] = await Promise.all([
      // 4. Pick an uncovered gap and write an article.
      (async () => {
        if (config.articles_per_run <= 0) return;
        const gap = await pickGap(report.ranks);
        if (!gap) {
          report.nextFocus.push('כל השאלות הפעילות כוסו במאמר — הרחבת מאגר השאלות.');
          return;
        }
        const existing = await store.getExistingTopics();
        const articleAction = await writeAndPublish(runId, gap, existing.map((e) => e.title), competitors);
        if (articleAction) {
          actionsCount++;
          if (articleAction.published) report.publishedArticle = articleAction.published;
          if (articleAction.drafted) report.draftedArticle = articleAction.drafted;
        }
      })().catch((e) => console.error('[David] article step failed:', e.message || e)),

      // 5. Grow the tracked-query set with fresh gaps.
      proposeNewQueries(competitors.map((c) => c.name)).catch((e) => {
        console.error('[David] proposeNewQueries failed:', e.message || e);
        return 0;
      }),

      // 6. Media / promotion observation (best-effort, single grounded query).
      mediaObservation().catch((e) => {
        console.error('[David] mediaObservation failed:', e.message || e);
        return null;
      }),
    ]);

    if (added && added > 0) {
      report.addedQueries = added;
      await store.logAction({
        run_id: runId,
        type: 'keyword_added',
        title: `נוספו ${added} שאלות חדשות למעקב`,
        details: {},
      });
      actionsCount++;
    }

    if (media) {
      report.mediaNotes.push(media);
      await store.logAction({
        run_id: runId,
        type: 'media_observation',
        title: 'תצפית מדיה/קידום',
        details: { note: media },
      });
      actionsCount++;
    }

    // 7. Metrics snapshot.
    const metrics = await computeMetrics();
    report.metrics = metrics;

    const status = report.ranks.length > 0 || report.publishedArticle ? 'success' : 'partial';
    const summary = buildSummary(report);
    await store.finishRun(runId, { status, summary, metrics, actions_count: actionsCount });
    await store.updateConfig({ last_run_date: report.date });

    // Email the admin (failure here must not fail the run).
    try {
      await sendDailyReport(config.email_recipient, report);
    } catch (e: any) {
      console.error('[David] daily email failed:', e.message || e);
    }

    return { status, runId, summary };
  } catch (err: any) {
    console.error('[David] run failed:', err);
    await store.finishRun(runId, {
      status: 'error',
      error: err.message || String(err),
      actions_count: actionsCount,
    });
    return { status: 'error', runId, summary: err.message || 'Run failed' };
  }
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/** Prefer a query we're absent from in this run; fall back to any uncovered active query. */
async function pickGap(ranks: RankResult[]): Promise<DavidQuery | null> {
  const active = await store.getActiveQueries();
  const uncovered = active.filter((q) => !q.covered_by_article_id);
  if (uncovered.length === 0) return null;

  // First choice: a query checked this run where we were absent.
  const absentQueries = new Set(ranks.filter((r) => !r.aiPresent).map((r) => r.query));
  const absentUncovered = uncovered.find((q) => absentQueries.has(q.query));
  if (absentUncovered) return absentUncovered;

  // Otherwise the oldest uncovered query.
  return uncovered[0];
}

async function writeAndPublish(
  runId: string,
  gap: DavidQuery,
  existingTitles: string[],
  competitors: { name: string }[],
): Promise<{ published?: { title: string; slug: string; targetQuery: string | null }; drafted?: { title: string; reason: string } } | null> {
  let generated = await generateArticle({
    query: gap.query,
    lang: gap.lang,
    existingTitles,
    competitors: competitors as any,
  });
  if (!generated) return null;

  // Guardrail pass; one regeneration attempt on failure.
  let review = await reviewArticle(generated.body, generated.title, generated.description);
  if (!review.ok) {
    const retry = await generateArticle({
      query: gap.query,
      lang: gap.lang,
      existingTitles,
      competitors: competitors as any,
      fixViolations: review.violations,
    });
    if (retry) {
      const retryReview = await reviewArticle(retry.body, retry.title, retry.description);
      if (retryReview.ok) {
        generated = retry;
        review = retryReview;
      } else {
        review = retryReview;
        generated = retry;
      }
    }
  }

  const slug = await store.uniqueSlug(generated.slug);

  if (review.ok) {
    const article = await store.insertArticle({
      slug,
      lang: gap.lang,
      title: generated.title,
      description: generated.description,
      keywords: generated.keywords,
      body: generated.body,
      target_query: gap.query,
      status: 'published',
      source_run_id: runId,
    });
    await store.markQueryCovered(gap.query, gap.lang, article.id);
    await store.logAction({
      run_id: runId,
      type: 'article_published',
      title: `פורסם מאמר: ${generated.title}`,
      details: { slug, targetQuery: gap.query, keywords: generated.keywords },
    });
    return { published: { title: generated.title, slug, targetQuery: gap.query } };
  }

  // Failed guardrails twice — keep as a draft for manual review, do NOT publish.
  const reason = review.violations.slice(0, 3).join('; ') || 'compliance check failed';
  const article = await store.insertArticle({
    slug,
    lang: gap.lang,
    title: generated.title,
    description: generated.description,
    keywords: generated.keywords,
    body: generated.body,
    target_query: gap.query,
    status: 'draft',
    review_notes: reason,
    source_run_id: runId,
  });
  await store.logAction({
    run_id: runId,
    type: 'article_drafted',
    title: `נכתב מאמר אך נשמר כטיוטה: ${generated.title}`,
    details: { slug, reason, violations: review.violations, articleId: article.id },
  });
  return { drafted: { title: generated.title, reason } };
}

async function proposeNewQueries(competitorNames: string[]): Promise<number> {
  const active = await store.getActiveQueries();
  if (active.length >= 60) return 0; // cap the tracked set

  const sample = active.slice(0, 30).map((q) => q.query);
  const res = await anthropicStructured<{ queries: Array<{ query: string; lang: Lang; intent: string }> }>({
    system:
      'You expand a keyword/question tracking list for MeStory (memorial books, autobiography, family-story writing). Propose fresh, realistic search queries people actually type, in Hebrew and English. Avoid anything already tracked. Mix informational questions (good for AEO) and commercial keywords (good for SEO).',
    prompt: `Already tracked (do not repeat):\n${sample.join('\n')}\n\n${competitorNames.length ? `Competitors to stay ahead of: ${competitorNames.join(', ')}.\n` : ''}Propose up to 5 NEW distinct queries.`,
    toolName: 'submit_queries',
    schema: NEW_QUERIES_SCHEMA,
    maxTokens: 600,
  });
  if (!res?.queries?.length) return 0;
  const clean = res.queries
    .filter((q) => q.query && (q.lang === 'he' || q.lang === 'en'))
    .map((q) => ({ query: q.query.trim(), lang: q.lang, intent: q.intent || 'seo' }));
  return store.addQueries(clean);
}

async function mediaObservation(): Promise<string | null> {
  const grounded = await geminiGroundedSearch(
    'מהי הנוכחות המקוונת של MeStory (mestory-ai.com) — אזכורים, רשתות חברתיות, ביקורות? תן סיכום קצר ועובדתי של מה שמופיע, ללא המלצות שיווקיות.',
  );
  if (!grounded?.text) return null;
  // Keep it short for the email/log.
  return grounded.text.replace(/\s+/g, ' ').trim().slice(0, 400);
}

async function computeMetrics(): Promise<{ trackedQueries: number; coveredQueries: number; presenceRate: number }> {
  const active = await store.getActiveQueries();
  const trackedQueries = active.length;
  const coveredQueries = active.filter((q) => q.covered_by_article_id).length;
  const evaluated = active.filter((q) => q.last_present !== null);
  const present = evaluated.filter((q) => q.last_present === true).length;
  const presenceRate = evaluated.length ? present / evaluated.length : 0;
  return { trackedQueries, coveredQueries, presenceRate };
}

function buildSummary(r: DailyReport): string {
  const parts: string[] = [];
  parts.push(`נבדקו ${r.ranks.length} שאלות`);
  parts.push(`נוכחות ב‑AI: ${r.ranks.filter((x) => x.aiPresent).length}/${r.ranks.length}`);
  if (r.publishedArticle) parts.push(`פורסם מאמר: ${r.publishedArticle.title}`);
  else if (r.draftedArticle) parts.push(`מאמר נשמר כטיוטה`);
  if (r.addedQueries) parts.push(`+${r.addedQueries} שאלות למעקב`);
  parts.push(`שיעור נוכחות מצטבר ${Math.round(r.metrics.presenceRate * 100)}%`);
  return parts.join(' · ');
}
