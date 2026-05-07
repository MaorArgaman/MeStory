-- =====================================================================
-- Credit system tables
-- =====================================================================
-- Adds the persistence backing for the new creditService:
--   * credit_usage_log     - immutable record of every AI feature charge
--   * monthly_bonus_usage  - per-period counter of bonuses consumed
--   * platform_earnings    - admin commission share from marketplace sales
-- =====================================================================

-- Every AI feature invocation that costs credits (or would have, if not
-- for an admin bypass / bonus pool) writes one row here.
CREATE TABLE IF NOT EXISTS credit_usage_log (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature         TEXT            NOT NULL,
  cost            INTEGER         NOT NULL DEFAULT 0,
  bonus_used      BOOLEAN         NOT NULL DEFAULT false,
  metadata        JSONB,
  idempotency_key TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_usage_log_user_created_idx
  ON credit_usage_log (user_id, created_at DESC);

-- Idempotency lookup: ensure (user, key) is unique so retries don't
-- double-charge.
CREATE UNIQUE INDEX IF NOT EXISTS credit_usage_log_idempotency_idx
  ON credit_usage_log (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Monthly bonus pools. period_start = first day of calendar month, UTC.
CREATE TABLE IF NOT EXISTS monthly_bonus_usage (
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature      TEXT         NOT NULL,
  period_start TIMESTAMPTZ  NOT NULL,
  used         INTEGER      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, feature, period_start)
);

CREATE INDEX IF NOT EXISTS monthly_bonus_usage_period_idx
  ON monthly_bonus_usage (period_start);

-- Atomic bonus increment - avoids the read-then-write race.
CREATE OR REPLACE FUNCTION increment_bonus_usage(
  p_user_id      UUID,
  p_feature      TEXT,
  p_period_start TIMESTAMPTZ
) RETURNS INTEGER AS $$
DECLARE
  v_used INTEGER;
BEGIN
  INSERT INTO monthly_bonus_usage (user_id, feature, period_start, used)
  VALUES (p_user_id, p_feature, p_period_start, 1)
  ON CONFLICT (user_id, feature, period_start)
  DO UPDATE SET used = monthly_bonus_usage.used + 1
  RETURNING used INTO v_used;

  RETURN v_used;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Platform earnings - admin's commission cut from marketplace sales.
-- =====================================================================
-- One row per book purchase. Lets admin run reports on platform revenue
-- without having to derive it from transaction metadata.
CREATE TABLE IF NOT EXISTS platform_earnings (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID         NOT NULL,
  book_id         UUID         NOT NULL,
  author_id       UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  buyer_id        UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  gross_amount    NUMERIC(10,2) NOT NULL,
  author_share    NUMERIC(10,2) NOT NULL,
  platform_share  NUMERIC(10,2) NOT NULL,
  currency        TEXT         NOT NULL DEFAULT 'USD',
  author_plan     TEXT         NOT NULL,  -- 'free' | 'standard' | 'premium' at sale time
  paid_out        BOOLEAN      NOT NULL DEFAULT false,
  paid_out_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_earnings_created_idx
  ON platform_earnings (created_at DESC);

CREATE INDEX IF NOT EXISTS platform_earnings_author_idx
  ON platform_earnings (author_id);

CREATE INDEX IF NOT EXISTS platform_earnings_paid_out_idx
  ON platform_earnings (paid_out) WHERE paid_out = false;
