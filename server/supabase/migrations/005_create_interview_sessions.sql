-- ============================================================================
-- Interview Sessions persistence
-- ============================================================================
-- Fixes: interview state was stored in an in-memory Map which is lost on every
-- Vercel serverless cold start, causing 404 "Interview not found" errors
-- when the user sends a message after the function instance recycles.
-- ============================================================================

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_topic VARCHAR(50) NOT NULL DEFAULT 'theme',
    questions_asked INTEGER NOT NULL DEFAULT 0,
    questions_per_topic JSONB NOT NULL DEFAULT '{
        "theme": 0, "characters": 0, "conflict": 0, "climax": 0,
        "resolution": 0, "setting": 0, "keyPoints": 0, "narrativeArc": 0
    }'::jsonb,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    genre VARCHAR(100),
    target_audience VARCHAR(100),
    language VARCHAR(10) NOT NULL DEFAULT 'he',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);

-- Auto-cleanup: delete completed interviews older than 24 hours
-- (can be run periodically or via Supabase cron)
-- DELETE FROM interview_sessions WHERE is_complete = TRUE AND updated_at < NOW() - INTERVAL '24 hours';

-- RLS: users can only access their own interview sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY interview_sessions_user_policy ON interview_sessions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role bypasses RLS (used by backend)
