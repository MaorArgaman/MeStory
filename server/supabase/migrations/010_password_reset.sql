-- =====================================================================
-- Password reset support
-- =====================================================================
-- Adds a password_reset JSONB column on users. Holds a hashed token
-- and its expiry while a reset is in flight; cleared after the user
-- successfully sets a new password (or after the token expires).
--
-- Shape: { tokenHash: string, expiresAt: ISO timestamp, requestedAt: ISO }
--
-- Stored as JSONB rather than dedicated columns so we don't need to
-- coordinate a schema change with every old row, and so the API surface
-- area stays small (just User.findByPasswordResetTokenHash + the setter).
-- =====================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_reset JSONB;

-- Index the token hash for fast lookups during reset confirmation.
-- Only a small fraction of rows have an active reset token, so a partial
-- index keeps it tiny.
CREATE INDEX IF NOT EXISTS users_password_reset_token_hash_idx
  ON users ((password_reset->>'tokenHash'))
  WHERE password_reset IS NOT NULL;
