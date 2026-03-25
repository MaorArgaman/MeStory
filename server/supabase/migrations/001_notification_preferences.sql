-- Migration: Add notification_preferences table
-- Run this migration to add notification preferences support to an existing database

-- Create the email digest frequency enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE email_digest_frequency AS ENUM ('none', 'daily', 'weekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Email notifications
    email_notifications JSONB DEFAULT '{
        "purchases": true,
        "subscriptions": true,
        "bookUpdates": true,
        "marketing": false
    }'::jsonb,

    -- Push notifications
    push_notifications JSONB DEFAULT '{
        "purchases": true,
        "subscriptions": true,
        "bookUpdates": true,
        "mentions": true
    }'::jsonb,

    -- In-app notifications
    in_app_notifications JSONB DEFAULT '{
        "purchases": true,
        "subscriptions": true,
        "bookUpdates": true,
        "mentions": true,
        "likes": true,
        "comments": true,
        "shares": true,
        "newFollowers": true,
        "messages": true,
        "payments": true,
        "qualityScore": true,
        "promotions": true,
        "system": true
    }'::jsonb,

    -- Email digest frequency
    email_digest email_digest_frequency DEFAULT 'weekly',

    -- Quiet hours (do not disturb)
    quiet_hours_start VARCHAR(5) DEFAULT NULL, -- e.g., "22:00"
    quiet_hours_end VARCHAR(5) DEFAULT NULL,   -- e.g., "08:00"
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users (if using Supabase Auth)
-- Uncomment if needed:
-- CREATE POLICY "Users can view their own notification preferences"
--     ON notification_preferences FOR SELECT
--     USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can update their own notification preferences"
--     ON notification_preferences FOR UPDATE
--     USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can insert their own notification preferences"
--     ON notification_preferences FOR INSERT
--     WITH CHECK (auth.uid() = user_id);
