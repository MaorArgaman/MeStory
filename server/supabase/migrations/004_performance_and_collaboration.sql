-- ============================================================================
-- Performance + Collaboration migration
-- ============================================================================
-- Two problems this fixes:
--
-- 1. Missing collaboration columns on `books` — the app tries to query
--    `books.invitations` and `books.is_collaborative` and falls back when
--    they don't exist, causing extra DB round-trips on every dashboard load.
--
-- 2. Missing indexes — queries that filter/sort on author_id, publishing_status,
--    updated_at, etc. fall back to full table scans which is a major reason
--    /api/books takes 5 seconds for users with many books.
-- ============================================================================

-- ---- Part 1: Collaboration columns ----------------------------------------

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS invitations JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Partial index — only index rows where the flag is actually set,
-- so it stays small for non-collaborative books.
CREATE INDEX IF NOT EXISTS idx_books_is_collaborative
  ON books(is_collaborative) WHERE is_collaborative = TRUE;

-- Allow fast "which books have I been invited to?" queries.
-- GIN index on the invitations JSONB so we can filter by invitee user_id.
CREATE INDEX IF NOT EXISTS idx_books_invitations_gin
  ON books USING GIN (invitations);

-- ---- Part 2: Performance indexes ------------------------------------------

-- The #1 hot path: "list my books" on the dashboard.
-- Covers WHERE author_id = ? ORDER BY created_at DESC.
CREATE INDEX IF NOT EXISTS idx_books_author_created
  ON books(author_id, created_at DESC);

-- "My drafts" / "my published books" filter
CREATE INDEX IF NOT EXISTS idx_books_author_status
  ON books(author_id, (publishing_status->>'status'));

-- Public marketplace filter (published + public)
CREATE INDEX IF NOT EXISTS idx_books_public_published
  ON books((publishing_status->>'isPublic'), (publishing_status->>'status'));

-- Sort-by-popularity in the marketplace uses this
CREATE INDEX IF NOT EXISTS idx_books_views
  ON books(((statistics->>'views')::int) DESC)
  WHERE (publishing_status->>'status') = 'published';

-- Recent updates (used by "continue writing" and editor history)
CREATE INDEX IF NOT EXISTS idx_books_updated_at
  ON books(updated_at DESC);

-- ---- Part 3: Indexes on related tables ------------------------------------

-- Unread notification count (called constantly from the navbar)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications(recipient_id, is_read)
  WHERE is_read = FALSE;

-- Message unread count (same reason)
-- Uses conditional creation because the table may not exist in every deploy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread
      ON messages(recipient_id, is_read)
      WHERE is_read = FALSE';
  END IF;
END $$;

-- Jobs table: "what is my latest pending job?" (from the previous migration)
-- Already added in 003, but keep this idempotent.
CREATE INDEX IF NOT EXISTS idx_jobs_user_status
  ON jobs(user_id, status, created_at DESC);

-- ---- Part 4: Analyze so the planner picks the new indexes ----------------

ANALYZE books;
ANALYZE notifications;
ANALYZE jobs;
