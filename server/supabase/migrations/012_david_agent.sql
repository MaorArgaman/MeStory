-- =====================================================================
-- "David" — autonomous daily SEO / GEO / AEO agent
-- =====================================================================
-- David runs once every morning (Vercel Cron in prod, node-cron in dev).
-- Each run he:
--   1. checks a rotating batch of tracked questions/keywords to see whether
--      MeStory shows up in AI answers (AEO/GEO) and in Google (GEO/SEO),
--   2. picks an uncovered gap and writes ONE evergreen article on the site
--      (published under /guides/<slug>),
--   3. logs everything and emails the admin a factual summary.
--
-- All tables are written/read only by the backend service-role client
-- (supabaseAdmin), which bypasses RLS — so no public RLS policies needed.
-- Public article reads are served through the API, never directly.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Singleton configuration row (id = 1). Admin-editable from the dashboard.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS david_config (
  id              INT PRIMARY KEY DEFAULT 1,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  -- People we want to stay ahead of. Each: { name, domain?, note? }.
  -- May be empty — David will infer likely competitors via search.
  competitors     JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Where the daily report is sent.
  email_recipient TEXT NOT NULL DEFAULT 'maorargaman22@gmail.com',
  -- Locales David works in.
  locales         JSONB NOT NULL DEFAULT '["he","en"]'::jsonb,
  -- How many tracked queries to re-check per daily run (time-bounded).
  queries_per_run INT NOT NULL DEFAULT 5,
  -- Max articles David may publish in a single run.
  articles_per_run INT NOT NULL DEFAULT 1,
  last_run_date   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT david_config_singleton CHECK (id = 1)
);

INSERT INTO david_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- One row per daily run. metrics holds a snapshot used to draw the trend.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS david_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date     DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'running',  -- running | success | partial | error
  trigger      TEXT NOT NULL DEFAULT 'cron',     -- cron | manual
  summary      TEXT,
  -- { queriesChecked, presentCount, absentCount, articlesPublished,
  --   trackedQueries, coveredQueries, presenceRate, ... }
  metrics      JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions_count INT NOT NULL DEFAULT 0,
  error        TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_david_runs_date ON david_runs (run_date DESC);

-- ---------------------------------------------------------------------
-- Granular activity log. Also used to guarantee David never repeats work.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS david_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID REFERENCES david_runs (id) ON DELETE CASCADE,
  -- rank_check | article_published | article_drafted | keyword_added |
  -- competitor_discovered | media_observation | skipped
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_david_actions_run ON david_actions (run_id);
CREATE INDEX IF NOT EXISTS idx_david_actions_type ON david_actions (type, created_at DESC);

-- ---------------------------------------------------------------------
-- Tracked questions / search terms David monitors (he + en). Grows over
-- time as he discovers new gaps. last_present / last_rank drive the trend.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS david_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query           TEXT NOT NULL,
  lang            TEXT NOT NULL DEFAULT 'he',    -- he | en
  intent          TEXT NOT NULL DEFAULT 'seo',   -- seo | geo | aeo
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  -- Presence in AI answers (AEO/GEO): true if MeStory was mentioned.
  last_present    BOOLEAN,
  -- Approx Google presence from grounded search (true/false/null).
  last_google_present BOOLEAN,
  last_checked_at TIMESTAMPTZ,
  -- Append-only history of checks: [{ date, present, googlePresent, competitors }]
  history         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Article that now targets this query (once David covers it).
  covered_by_article_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (query, lang)
);

CREATE INDEX IF NOT EXISTS idx_david_queries_check ON david_queries (active, last_checked_at NULLS FIRST);

-- ---------------------------------------------------------------------
-- Articles David writes. Doubles as the article CMS: the public
-- /guides/<slug> page renders straight from here. body is structured
-- JSON (intro, sections, faq, conclusion) — safe to render, great for
-- FAQ/Article schema (AEO).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS david_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  lang          TEXT NOT NULL DEFAULT 'he',
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  keywords      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- { intro, sections:[{heading,paragraphs:[]}], faq:[{q,a}], conclusion }
  body          JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- The tracked query this article was written to answer.
  target_query  TEXT,
  status        TEXT NOT NULL DEFAULT 'published', -- published | draft | unpublished
  -- Why it was held back, if guardrails flagged it.
  review_notes  TEXT,
  source_run_id UUID REFERENCES david_runs (id) ON DELETE SET NULL,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_david_articles_status ON david_articles (status, published_at DESC);

-- ---------------------------------------------------------------------
-- Grants — backend uses the service role, which bypasses RLS.
-- ---------------------------------------------------------------------
GRANT ALL ON david_config, david_runs, david_actions, david_queries, david_articles TO service_role;
