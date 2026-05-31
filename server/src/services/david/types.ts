/**
 * Shared types for David — the autonomous daily SEO/GEO/AEO agent.
 */

export type Lang = 'he' | 'en';
export type Intent = 'seo' | 'geo' | 'aeo';

export interface Competitor {
  name: string;
  domain?: string;
  note?: string;
}

export interface DavidConfig {
  id: number;
  enabled: boolean;
  competitors: Competitor[];
  email_recipient: string;
  locales: Lang[];
  queries_per_run: number;
  articles_per_run: number;
  last_run_date: string | null;
}

export interface DavidQuery {
  id: string;
  query: string;
  lang: Lang;
  intent: Intent;
  active: boolean;
  last_present: boolean | null;
  last_google_present: boolean | null;
  last_checked_at: string | null;
  history: QueryCheck[];
  covered_by_article_id: string | null;
  created_at: string;
}

export interface QueryCheck {
  date: string;
  present: boolean;
  googlePresent: boolean | null;
  competitors: string[];
}

/** Structured, render-safe article body. No raw HTML. */
export interface ArticleBody {
  intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ q: string; a: string }>;
  conclusion: string;
}

export interface DavidArticle {
  id: string;
  slug: string;
  lang: Lang;
  title: string;
  description: string;
  keywords: string[];
  body: ArticleBody;
  target_query: string | null;
  status: 'published' | 'draft' | 'unpublished';
  review_notes: string | null;
  source_run_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionType =
  | 'rank_check'
  | 'article_published'
  | 'article_drafted'
  | 'keyword_added'
  | 'competitor_discovered'
  | 'media_observation'
  | 'skipped';

export interface DavidAction {
  id?: string;
  run_id: string;
  type: ActionType;
  title: string;
  details?: Record<string, unknown>;
}

export interface RankResult {
  query: string;
  lang: Lang;
  /** Present in at least one AI assistant's answer (AEO/GEO). */
  aiPresent: boolean;
  /** Per-model presence, e.g. { anthropic: true, openai: false, gemini: true }. */
  byModel: Record<string, boolean>;
  /** Approx presence in Google results via grounded search. */
  googlePresent: boolean | null;
  /** Competitor names spotted in the answers/results. */
  competitorsSeen: string[];
}
