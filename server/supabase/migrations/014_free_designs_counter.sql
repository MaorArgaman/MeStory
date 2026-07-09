-- =====================================================================
-- Freemium: 2 free auto-designs per ACCOUNT (lifetime)
-- =====================================================================
-- Business decision 2026-07-09 (docs/BUSINESS_STRATEGY.md §1): every new
-- user gets 2 free design generations before hitting the paywall.
--
-- Plain column on purpose — NOT inside the profile JSONB. Dot-path updates
-- on users JSONB columns fail silently (documented bug, see User.ts
-- findByIdAndUpdate notes), and this counter guards real money, so it gets
-- a real column with a compare-and-swap update path.
-- =====================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS free_designs_used INT NOT NULL DEFAULT 0;

GRANT SELECT, UPDATE ON users TO service_role;
