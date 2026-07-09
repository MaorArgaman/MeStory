-- =====================================================================
-- AI usage log — cost visibility for every LLM call
-- =====================================================================
-- Business context (docs/BUSINESS_STRATEGY.md): margins depend on knowing
-- the real AI cost per generation / per user. Every Anthropic/Gemini call
-- inserts one row here (fire-and-forget; a failed insert never blocks the
-- user-facing flow).
--
-- No FK constraints on user_id/book_id on purpose: this is an append-only
-- log; it must accept rows even for deleted books/users.
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  feature TEXT NOT NULL,            -- 'auto_design_planner' | 'auto_design_critic' | ...
  provider TEXT NOT NULL,           -- 'anthropic' | 'google'
  model TEXT NOT NULL,
  user_id UUID,
  book_id UUID,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cache_read_tokens INT NOT NULL DEFAULT 0,   -- tokens served from prompt cache (~10% price)
  cache_write_tokens INT NOT NULL DEFAULT 0,  -- tokens written to prompt cache (x1.25 price)
  cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0, -- computed at insert time from the price table
  metadata JSONB
);

-- Daily/weekly cost dashboards scan by time; per-feature breakdowns filter
-- by feature first.
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created
  ON ai_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature_created
  ON ai_usage_log (feature, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user
  ON ai_usage_log (user_id, created_at DESC);

GRANT SELECT, INSERT ON ai_usage_log TO service_role;
