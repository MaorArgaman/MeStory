# Supabase migrations runbook

## How to apply a migration

Migrations live as `.sql` files in this directory. Supabase doesn't auto-apply
them - you run them manually through the Supabase Dashboard.

### Steps

1. Open <https://supabase.com/dashboard/project/_/sql>
2. Click **SQL Editor** > **New query**
3. Paste the entire contents of the `.sql` file you want to apply
4. Click **Run** (or `Ctrl+Enter`)
5. Verify success at the bottom of the editor (should say "Success. No rows returned")

### Order matters

Apply in numerical order, oldest first. The credit-system migration is `007_credit_system.sql`.
You should already have 001-006 applied; if not, apply them first.

### Verifying

After running `007_credit_system.sql`, run this in the SQL editor to confirm:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('credit_usage_log', 'monthly_bonus_usage', 'platform_earnings');
```

Expected: 3 rows returned. If you see fewer, the migration didn't fully apply.

Also verify the RPC function:

```sql
SELECT proname FROM pg_proc WHERE proname = 'increment_bonus_usage';
```

Expected: 1 row.

### Rolling back

For `007_credit_system.sql` specifically, to roll back:

```sql
DROP FUNCTION IF EXISTS increment_bonus_usage(UUID, TEXT, TIMESTAMPTZ);
DROP TABLE IF EXISTS credit_usage_log;
DROP TABLE IF EXISTS monthly_bonus_usage;
DROP TABLE IF EXISTS platform_earnings;
```

WARNING: This destroys all credit usage history and platform earnings records.
Don't run on production without a backup.

## After applying 007_credit_system.sql

The credit system is now functional. Next:

1. Verify the server boots cleanly (check Vercel logs for `[ENV]` validation report)
2. Test a small AI call (e.g. POST `/api/ai/enhance-text`). It should:
   - Deduct 2 credits from your user
   - Log a row in `credit_usage_log`
3. As an admin, hit `GET /api/admin/platform-earnings/summary` (after a marketplace sale)
   to confirm earnings are being recorded.

If the server's auto-consume hook fails silently, look in Vercel logs for
`[requireCredits] Auto-consume failed:` - the most likely cause is the table
not existing yet.
