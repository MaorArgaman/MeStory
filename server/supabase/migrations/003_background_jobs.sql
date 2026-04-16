-- Background jobs queue table.
-- Stores long-running work (PDF export, "design everything", batch AI generation, etc.)
-- so the HTTP request can return immediately and the client can poll progress.

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,

  -- Job classification
  type TEXT NOT NULL CHECK (type IN (
    'pdf_export',
    'design_generation',
    'image_generation',
    'translation',
    'bulk_ai'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),

  -- Progress tracking
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  progress_message TEXT,

  -- Input/output payload (JSONB for flexibility)
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the two hot query patterns:
-- 1. "Show me my jobs" (user dashboard)
-- 2. "Find next pending job to process" (worker)
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at)
  WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_jobs_book ON jobs(book_id) WHERE book_id IS NOT NULL;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Row Level Security: users see only their own jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_select_own ON jobs;
CREATE POLICY jobs_select_own ON jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS jobs_insert_own ON jobs;
CREATE POLICY jobs_insert_own ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS automatically, so the server can update any row.
