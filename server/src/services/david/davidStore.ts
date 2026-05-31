/**
 * Data-access layer for David. All reads/writes go through supabaseAdmin
 * (service role). Keeps SQL out of the agent logic and centralises the
 * "never repeat work" memory (covered queries + published slugs).
 */

import { supabaseAdmin } from '../../config/supabase';
import {
  DavidConfig,
  DavidQuery,
  DavidArticle,
  DavidAction,
  QueryCheck,
  Lang,
} from './types';

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

export async function getConfig(): Promise<DavidConfig> {
  const { data, error } = await supabaseAdmin
    .from('david_config')
    .select('*')
    .eq('id', 1)
    .single();
  if (error || !data) {
    // Defensive default so a run never crashes on a missing config row.
    return {
      id: 1,
      enabled: true,
      competitors: [],
      email_recipient: 'maorargaman22@gmail.com',
      locales: ['he', 'en'],
      queries_per_run: 5,
      articles_per_run: 1,
      last_run_date: null,
    };
  }
  return data as DavidConfig;
}

export async function updateConfig(patch: Partial<DavidConfig>): Promise<DavidConfig> {
  const { data, error } = await supabaseAdmin
    .from('david_config')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('*')
    .single();
  if (error) throw new Error(`updateConfig failed: ${error.message}`);
  return data as DavidConfig;
}

// ---------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------

export async function startRun(trigger: 'cron' | 'manual'): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseAdmin
    .from('david_runs')
    .insert({ run_date: today, status: 'running', trigger })
    .select('id')
    .single();
  if (error || !data) throw new Error(`startRun failed: ${error?.message}`);
  return data.id as string;
}

export async function finishRun(
  runId: string,
  fields: { status: string; summary?: string; metrics?: Record<string, unknown>; actions_count?: number; error?: string },
): Promise<void> {
  await supabaseAdmin
    .from('david_runs')
    .update({ ...fields, finished_at: new Date().toISOString() })
    .eq('id', runId);
}

export async function listRuns(limit = 30): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('david_runs')
    .select('*')
    .order('run_date', { ascending: false })
    .order('started_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getRunWithActions(runId: string): Promise<{ run: any; actions: any[] } | null> {
  const { data: run } = await supabaseAdmin.from('david_runs').select('*').eq('id', runId).single();
  if (!run) return null;
  const { data: actions } = await supabaseAdmin
    .from('david_actions')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });
  return { run, actions: actions || [] };
}

/** Was this run already executed today? Prevents double daily runs. */
export async function hasRunToday(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabaseAdmin
    .from('david_runs')
    .select('id')
    .eq('run_date', today)
    .in('status', ['success', 'partial', 'running'])
    .limit(1);
  return !!(data && data.length);
}

// ---------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------

export async function logAction(action: DavidAction): Promise<void> {
  await supabaseAdmin.from('david_actions').insert({
    run_id: action.run_id,
    type: action.type,
    title: action.title,
    details: action.details || {},
  });
}

// ---------------------------------------------------------------------
// Queries (tracked questions / keywords)
// ---------------------------------------------------------------------

export async function getActiveQueries(): Promise<DavidQuery[]> {
  const { data } = await supabaseAdmin
    .from('david_queries')
    .select('*')
    .eq('active', true);
  return (data || []) as DavidQuery[];
}

/** The queries to re-check this run: oldest-checked first (round-robin). */
export async function getQueriesToCheck(limit: number): Promise<DavidQuery[]> {
  const { data } = await supabaseAdmin
    .from('david_queries')
    .select('*')
    .eq('active', true)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  return (data || []) as DavidQuery[];
}

export async function recordQueryCheck(
  query: DavidQuery,
  check: QueryCheck,
): Promise<void> {
  const history = [...(query.history || []), check].slice(-60); // keep last 60
  await supabaseAdmin
    .from('david_queries')
    .update({
      last_present: check.present,
      last_google_present: check.googlePresent,
      last_checked_at: new Date().toISOString(),
      history,
    })
    .eq('id', query.id);
}

export async function addQueries(
  queries: Array<{ query: string; lang: Lang; intent: string }>,
): Promise<number> {
  if (!queries.length) return 0;
  // upsert on (query, lang) so we never create duplicates.
  const { data, error } = await supabaseAdmin
    .from('david_queries')
    .upsert(queries, { onConflict: 'query,lang', ignoreDuplicates: true })
    .select('id');
  if (error) {
    console.error('[David] addQueries error:', error.message);
    return 0;
  }
  return data?.length || 0;
}

export async function markQueryCovered(queryText: string, lang: Lang, articleId: string): Promise<void> {
  await supabaseAdmin
    .from('david_queries')
    .update({ covered_by_article_id: articleId })
    .eq('query', queryText)
    .eq('lang', lang);
}

// ---------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------

export async function listPublishedArticles(): Promise<DavidArticle[]> {
  const { data } = await supabaseAdmin
    .from('david_articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data || []) as DavidArticle[];
}

export async function listAllArticles(): Promise<DavidArticle[]> {
  const { data } = await supabaseAdmin
    .from('david_articles')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as DavidArticle[];
}

export async function getArticleBySlug(slug: string): Promise<DavidArticle | null> {
  const { data } = await supabaseAdmin
    .from('david_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return (data as DavidArticle) || null;
}

/** All slugs + titles ever used — so David never writes the same topic twice. */
export async function getExistingTopics(): Promise<Array<{ slug: string; title: string; target_query: string | null }>> {
  const { data } = await supabaseAdmin
    .from('david_articles')
    .select('slug, title, target_query');
  return data || [];
}

export async function insertArticle(article: {
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  keywords: string[];
  body: unknown;
  target_query: string | null;
  status: 'published' | 'draft';
  review_notes?: string | null;
  source_run_id: string;
}): Promise<DavidArticle> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('david_articles')
    .insert({
      ...article,
      published_at: article.status === 'published' ? now : null,
    })
    .select('*')
    .single();
  if (error) throw new Error(`insertArticle failed: ${error.message}`);
  return data as DavidArticle;
}

export async function setArticleStatus(
  id: string,
  status: 'published' | 'draft' | 'unpublished',
): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'published') patch.published_at = new Date().toISOString();
  await supabaseAdmin.from('david_articles').update(patch).eq('id', id);
}

/** Ensure a slug is unique by appending -2, -3, … if needed. */
export async function uniqueSlug(base: string): Promise<string> {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'article';
  let candidate = clean;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabaseAdmin.from('david_articles').select('id').eq('slug', candidate).limit(1);
    if (!data || !data.length) return candidate;
    candidate = `${clean}-${i}`;
  }
  return `${clean}-${Date.now()}`;
}
