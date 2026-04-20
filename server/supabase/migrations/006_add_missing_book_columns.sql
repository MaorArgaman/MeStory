-- ============================================================================
-- Add missing columns to books table
-- ============================================================================
-- The Book model references these columns but they were never added to the
-- database, causing PostgREST errors when using explicit column selection
-- (findByIdLite, findByIdForDesign).
-- ============================================================================

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS mentions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS collaborators JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS memorial_dedication JSONB DEFAULT NULL;

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS book_type VARCHAR(50) NOT NULL DEFAULT 'personal';

ANALYZE books;
