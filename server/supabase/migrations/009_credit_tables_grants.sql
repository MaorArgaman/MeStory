-- =====================================================================
-- Grant permissions on credit-system tables
-- =====================================================================
-- Migration 007 created the tables but on some Supabase projects the
-- service_role doesn't auto-receive INSERT/UPDATE permission, leading
-- to "permission denied for table credit_usage_log" in Vercel logs.
-- This grants explicit access to all roles that the server uses.
-- =====================================================================

-- Service role (used by supabaseAdmin in the server) needs full access.
GRANT ALL ON credit_usage_log TO service_role;
GRANT ALL ON monthly_bonus_usage TO service_role;
GRANT ALL ON platform_earnings TO service_role;

-- Authenticated role (logged-in users via Supabase JS client). The server
-- doesn't currently expose these tables to the browser, but if RLS is
-- ever enabled the role still needs base privileges to evaluate policies.
GRANT SELECT, INSERT, UPDATE ON credit_usage_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON monthly_bonus_usage TO authenticated;
GRANT SELECT ON platform_earnings TO authenticated;

-- The increment RPC must be callable by service_role.
GRANT EXECUTE ON FUNCTION increment_bonus_usage(UUID, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION increment_bonus_usage(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- Disable RLS on these tables (server uses service_role anyway, and
-- there's no use case for end-user direct access). If RLS becomes
-- desired later, add policies in a follow-up migration.
ALTER TABLE credit_usage_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bonus_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_earnings DISABLE ROW LEVEL SECURITY;

-- Verify after running:
--   SELECT has_table_privilege('service_role', 'credit_usage_log', 'INSERT');
-- Should return: true
