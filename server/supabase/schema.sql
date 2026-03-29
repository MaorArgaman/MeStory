-- MeStory Database Schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('FREE', 'STANDARD', 'PREMIUM', 'ADMIN');
CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium');
CREATE TYPE book_writing_goal AS ENUM ('short-story', 'novella', 'novel');
CREATE TYPE book_target_audience AS ENUM ('children', 'young-adult', 'adult', 'all-ages');
CREATE TYPE book_age_rating AS ENUM ('G', 'PG', 'PG-13', 'R', '18+');
CREATE TYPE publishing_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE summary_source_type AS ENUM ('INTERVIEW', 'FILE', 'AUDIO', 'DIRECT');
CREATE TYPE summary_status AS ENUM ('pending', 'processing', 'completed', 'converted', 'failed');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_currency AS ENUM ('USD', 'ILS');
CREATE TYPE transaction_plan AS ENUM ('free', 'standard', 'premium');
CREATE TYPE payment_method AS ENUM ('paypal', 'mock', 'credit_card');
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'share', 'purchase', 'new_message', 'new_follower', 'book_published', 'payment', 'subscription', 'quality_score', 'mention', 'system', 'promotion');
CREATE TYPE character_role AS ENUM ('protagonist', 'antagonist', 'supporting', 'minor');
CREATE TYPE template_category AS ENUM ('academic', 'personal-story', 'children', 'novel', 'poetry', 'self-help', 'cookbook', 'travel', 'photo-album', 'custom');
CREATE TYPE page_size AS ENUM ('A4', 'A5', 'Letter', 'Custom', '6x9', '5x8');
CREATE TYPE ai_design_status AS ENUM ('idle', 'analyzing', 'generating-design', 'generating-images', 'completed', 'error');

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'FREE',
    credits INTEGER DEFAULT 100,

    -- Subscription (embedded as JSONB)
    subscription JSONB DEFAULT '{
        "tier": "free",
        "price": 0,
        "credits": 100,
        "startDate": null,
        "endDate": null,
        "isActive": true,
        "autoRenew": false
    }'::jsonb,

    -- Profile (embedded as JSONB)
    profile JSONB DEFAULT '{
        "bio": "",
        "avatar": "",
        "headerImage": "",
        "language": "en",
        "authorProfile": {
            "publishedBooks": 0,
            "totalSales": 0,
            "rating": 0,
            "followers": []
        },
        "following": [],
        "readingHistory": [],
        "writingStatistics": {
            "totalWords": 0,
            "booksWritten": 0,
            "averageQualityScore": 0
        },
        "earnings": {
            "totalEarned": 0,
            "pendingPayout": 0,
            "withdrawn": 0,
            "history": []
        },
        "notificationPreferences": {
            "emailNotifications": true,
            "pushNotifications": true,
            "marketingEmails": false,
            "newFollowerNotification": true,
            "newCommentNotification": true,
            "newPurchaseNotification": true,
            "weeklyDigest": true
        }
    }'::jsonb,

    -- PayPal (embedded as JSONB)
    paypal JSONB DEFAULT '{
        "email": null,
        "accountId": null,
        "isVerified": false,
        "connectedAt": null
    }'::jsonb,

    -- Email Verification
    email_verification JSONB DEFAULT '{
        "isVerified": false,
        "verificationCode": null,
        "verificationCodeExpires": null,
        "verifiedAt": null
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User indexes
-- Note: idx_users_email not needed - UNIQUE constraint creates index automatically
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_tier ON users((subscription->>'tier'));
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_name_trgm ON users USING GIN(name gin_trgm_ops);

-- =====================================================
-- BOOKS TABLE
-- =====================================================

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre VARCHAR(100) NOT NULL,
    writing_goal book_writing_goal DEFAULT 'novel',
    target_audience book_target_audience DEFAULT 'adult',
    description TEXT,
    synopsis TEXT,
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    age_rating book_age_rating DEFAULT 'G',
    likes INTEGER DEFAULT 0,
    liked_by UUID[] DEFAULT '{}',

    -- Story Context (Deep Dive Interview)
    story_context JSONB DEFAULT '{
        "theme": null,
        "characters": null,
        "conflict": null,
        "climax": null,
        "resolution": null,
        "setting": null,
        "keyPoints": [],
        "narrativeArc": null,
        "completedAt": null,
        "voiceInterview": {
            "responses": [],
            "summary": null
        }
    }'::jsonb,

    -- Chapters (array of chapter objects)
    chapters JSONB DEFAULT '[]'::jsonb,

    -- Characters
    characters JSONB DEFAULT '[]'::jsonb,

    -- Plot Structure
    plot_structure JSONB DEFAULT '{
        "threeActStructure": {
            "act1": null,
            "act2": null,
            "act3": null
        },
        "plotPoints": {
            "incitingIncident": null,
            "firstPlotPoint": null,
            "midpoint": null,
            "secondPlotPoint": null,
            "climax": null
        },
        "subplots": [],
        "timeline": []
    }'::jsonb,

    -- Quality Score
    quality_score JSONB DEFAULT '{
        "overallScore": null,
        "rating": null,
        "ratingLabel": null,
        "categories": {
            "writingQuality": { "score": null, "weight": 25 },
            "plotStructure": { "score": null, "weight": 20 },
            "characterDevelopment": { "score": null, "weight": 20 },
            "dialogue": { "score": null, "weight": 15 },
            "setting": { "score": null, "weight": 10 },
            "originality": { "score": null, "weight": 10 }
        },
        "detailedFeedback": null,
        "suggestions": [],
        "evaluatedAt": null,
        "evaluatedBy": null
    }'::jsonb,

    -- Cover Design
    cover_design JSONB DEFAULT '{
        "front": {
            "type": "solid",
            "imageUrl": null,
            "backgroundColor": "#1a1a2e",
            "gradientColors": ["#1a1a2e", "#16213e"],
            "title": { "text": null, "font": "Playfair Display", "size": 48, "color": "#ffffff", "position": { "x": 50, "y": 30 } },
            "subtitle": { "text": null, "font": "Lato", "size": 18, "color": "#cccccc", "position": { "x": 50, "y": 45 } },
            "authorName": { "text": null, "font": "Lato", "size": 20, "color": "#ffffff", "position": { "x": 50, "y": 85 } }
        },
        "back": {
            "imageUrl": null,
            "backgroundColor": "#1a1a2e",
            "synopsis": { "text": null, "font": "Lato", "size": 12, "color": "#cccccc", "position": { "x": 10, "y": 10 }, "maxWidth": 80 },
            "authorBio": { "text": null, "font": "Lato", "size": 10, "color": "#aaaaaa", "position": { "x": 10, "y": 70 } },
            "authorPhoto": { "url": null, "position": { "x": 10, "y": 80 }, "size": 60 },
            "barcodeArea": { "position": { "x": 70, "y": 85 }, "width": 25, "height": 12 }
        },
        "spine": {
            "width": 20,
            "title": { "text": null, "font": "Playfair Display", "size": 14, "color": "#ffffff" },
            "author": { "text": null, "font": "Lato", "size": 10, "color": "#cccccc" },
            "backgroundColor": "#1a1a2e"
        }
    }'::jsonb,

    -- Page Layout
    page_layout JSONB DEFAULT '{
        "bodyFont": "Georgia",
        "fontSize": 12,
        "lineHeight": 1.6,
        "pageSize": "A5",
        "margins": { "top": 72, "bottom": 72, "left": 72, "right": 72 },
        "columns": 1,
        "headerFooter": {
            "showHeader": true,
            "showFooter": true,
            "headerContent": "chapter",
            "footerContent": "page-number",
            "headerFont": "Georgia",
            "footerFont": "Georgia",
            "headerSize": 10,
            "footerSize": 10
        },
        "tableOfContents": {
            "enabled": true,
            "title": "Table of Contents",
            "showPageNumbers": true,
            "style": "classic"
        },
        "pages": []
    }'::jsonb,

    -- Page Images
    page_images JSONB DEFAULT '[]'::jsonb,

    -- AI Design State
    ai_design_state JSONB DEFAULT '{
        "status": "idle",
        "progress": { "currentStep": 0, "totalSteps": 0, "stepName": null },
        "design": null,
        "error": null,
        "startedAt": null,
        "completedAt": null
    }'::jsonb,

    -- Publishing Status
    publishing_status JSONB DEFAULT '{
        "status": "draft",
        "publishedAt": null,
        "unpublishedAt": null,
        "price": 0,
        "priceILS": 0,
        "isFree": true,
        "isPublic": false,
        "marketingStrategy": {
            "targetAudience": null,
            "description": null,
            "categories": [],
            "tags": [],
            "launchDate": null
        }
    }'::jsonb,

    -- Statistics
    statistics JSONB DEFAULT '{
        "wordCount": 0,
        "pageCount": 0,
        "chapterCount": 0,
        "characterCount": 0,
        "views": 0,
        "purchases": 0,
        "revenue": 0,
        "averageRating": 0,
        "totalReviews": 0,
        "completionRate": 0,
        "readingTime": 0,
        "shares": 0,
        "comments": 0
    }'::jsonb,

    -- Reviews
    reviews JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Book indexes
CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_publishing_status ON books((publishing_status->>'status'));
CREATE INDEX idx_books_price ON books(((publishing_status->>'price')::numeric));
CREATE INDEX idx_books_quality_score ON books(((quality_score->>'overallScore')::numeric) DESC NULLS LAST);
CREATE INDEX idx_books_views ON books(((statistics->>'views')::integer) DESC);
CREATE INDEX idx_books_purchases ON books(((statistics->>'purchases')::integer) DESC);
CREATE INDEX idx_books_created_at ON books(created_at DESC);
CREATE INDEX idx_books_tags ON books USING GIN(tags);
CREATE INDEX idx_books_published_public ON books((publishing_status->>'status'), (publishing_status->>'isPublic'));
CREATE INDEX idx_books_title_trgm ON books USING GIN(title gin_trgm_ops);

-- =====================================================
-- SUMMARIES TABLE
-- =====================================================

CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    source_type summary_source_type NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    status summary_status DEFAULT 'pending',
    converted_to_book BOOLEAN DEFAULT FALSE,
    ai_credits_used INTEGER DEFAULT 0,
    error TEXT,

    -- Characters extracted from summary
    characters JSONB DEFAULT '[]'::jsonb,

    -- Plot structure
    plot_structure JSONB DEFAULT '{
        "premise": null,
        "theme": null,
        "genre": null,
        "setting": null,
        "tone": null,
        "targetAudience": null,
        "threeActStructure": { "act1": null, "act2": null, "act3": null },
        "plotPoints": {
            "incitingIncident": null,
            "firstPlotPoint": null,
            "midpoint": null,
            "climax": null,
            "resolution": null
        },
        "conflict": { "type": null, "description": null }
    }'::jsonb,

    -- Chapters outline
    chapters JSONB DEFAULT '[]'::jsonb,

    -- Metadata (flexible based on source type)
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Summary indexes
CREATE INDEX idx_summaries_user ON summaries(user_id);
CREATE INDEX idx_summaries_book ON summaries(book_id);
CREATE INDEX idx_summaries_source_type ON summaries(source_type);
CREATE INDEX idx_summaries_status ON summaries(status);
CREATE INDEX idx_summaries_converted ON summaries(converted_to_book);
CREATE INDEX idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX idx_summaries_user_status ON summaries(user_id, status);
CREATE INDEX idx_summaries_user_converted ON summaries(user_id, converted_to_book);
CREATE INDEX idx_summaries_book_source ON summaries(book_id, source_type);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency transaction_currency DEFAULT 'USD',
    plan transaction_plan DEFAULT 'free',
    status transaction_status DEFAULT 'pending',
    payment_method payment_method DEFAULT 'paypal',
    order_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    paypal_capture_id VARCHAR(255),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_paypal_order ON transactions(paypal_order_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status_created ON transactions(status, created_at DESC);
CREATE INDEX idx_transactions_user_plan ON transactions(user_id, plan);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    last_message JSONB DEFAULT '{
        "content": null,
        "sender": null,
        "sentAt": null
    }'::jsonb,
    unread_count JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversation indexes
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_book ON conversations(book_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
-- Note: Removed timestamp index on JSONB field due to IMMUTABLE requirement
-- CREATE INDEX idx_conversations_last_message ON conversations(((last_message->>'sentAt')::timestamp) DESC NULLS LAST);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 5000),
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message indexes
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification indexes
CREATE INDEX idx_notifications_recipient_read_created ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_recipient_type_created ON notifications(recipient_id, type, created_at DESC);
CREATE INDEX idx_notifications_recipient_archived_created ON notifications(recipient_id, is_archived, created_at DESC);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TYPE email_digest_frequency AS ENUM ('none', 'daily', 'weekly');

CREATE TABLE notification_preferences (
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

-- Notification Preferences indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- USER ACTIVITIES TABLE
-- =====================================================

CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Reading tracking
    reading_history JSONB DEFAULT '[]'::jsonb,
    currently_reading UUID[] DEFAULT '{}',
    completed_books UUID[] DEFAULT '{}',
    abandoned_books UUID[] DEFAULT '{}',

    -- Writing tracking
    writing_progress JSONB DEFAULT '[]'::jsonb,
    currently_writing UUID[] DEFAULT '{}',
    completed_writing UUID[] DEFAULT '{}',
    abandoned_writing UUID[] DEFAULT '{}',

    -- Preferences
    genre_preferences JSONB DEFAULT '[]'::jsonb,
    author_preferences JSONB DEFAULT '[]'::jsonb,
    preferred_languages TEXT[] DEFAULT ARRAY['en', 'he'],
    preferred_reading_length VARCHAR(20) DEFAULT 'any',

    -- Interaction history (limited to last 1000)
    interaction_events JSONB DEFAULT '[]'::jsonb,

    -- Engagement metrics
    total_books_read INTEGER DEFAULT 0,
    total_books_written INTEGER DEFAULT 0,
    total_reading_time INTEGER DEFAULT 0,
    total_writing_time INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity indexes
CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_last_active ON user_activities(last_active_at DESC);

-- =====================================================
-- BOOK TEMPLATES TABLE
-- =====================================================

CREATE TABLE book_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_he VARCHAR(255),
    category template_category NOT NULL,
    description TEXT,
    description_he TEXT,
    thumbnail VARCHAR(500),
    preview_images TEXT[] DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,

    -- Defaults
    defaults JSONB DEFAULT '{
        "pageSize": "A5",
        "customPageSize": null,
        "pageLayout": null
    }'::jsonb,

    -- Page types configuration
    page_types JSONB DEFAULT '{
        "titlePage": null,
        "tableOfContents": null,
        "chapterOpener": null,
        "bodyPage": null,
        "sectionDivider": null,
        "acknowledgments": null
    }'::jsonb,

    -- Cover defaults
    cover_defaults JSONB DEFAULT '{
        "frontCover": null,
        "backCover": null,
        "spine": null
    }'::jsonb,

    -- AI settings
    ai_settings JSONB DEFAULT '{
        "suggestedFonts": [],
        "suggestedColorPalettes": [],
        "imagePlacementRules": null,
        "styleGuidelines": null
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Book template indexes
CREATE INDEX idx_book_templates_category ON book_templates(category);
CREATE INDEX idx_book_templates_is_system ON book_templates(is_system);
CREATE INDEX idx_book_templates_is_active ON book_templates(is_active);
CREATE INDEX idx_book_templates_usage ON book_templates(usage_count DESC);
CREATE INDEX idx_book_templates_created_by ON book_templates(created_by);

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_activities_updated_at BEFORE UPDATE ON user_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_book_templates_updated_at BEFORE UPDATE ON book_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_templates ENABLE ROW LEVEL SECURITY;

-- Note: Since we're using server-side Supabase client with service role key,
-- RLS policies are bypassed. If you want to add client-side access,
-- you'll need to add appropriate policies.

-- =====================================================
-- CLEANUP OLD NOTIFICATIONS (Scheduled Job)
-- =====================================================

-- This function can be called by a scheduled job to delete old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Note: Storage buckets must be created through the Supabase Dashboard
-- or via the Supabase CLI. The following SQL shows the policy setup.

-- Create avatars bucket (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow public read access to avatars
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
-- CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'avatars' AND auth.role() = 'service_role'
-- );

-- Allow authenticated users to update their own avatars
-- CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE USING (
--   bucket_id = 'avatars' AND auth.role() = 'service_role'
-- );

-- Allow authenticated users to delete their own avatars
-- CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE USING (
--   bucket_id = 'avatars' AND auth.role() = 'service_role'
-- );

-- =====================================================
-- REFUND REQUESTS TABLE
-- =====================================================

CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status refund_status DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency transaction_currency DEFAULT 'USD',
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refund request indexes
CREATE INDEX idx_refund_requests_user ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_transaction ON refund_requests(transaction_id);
CREATE INDEX idx_refund_requests_book ON refund_requests(book_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_status_created ON refund_requests(status, created_at DESC);
CREATE INDEX idx_refund_requests_user_status ON refund_requests(user_id, status);

-- Enable RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON refund_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INVOICE COUNTERS TABLE
-- =====================================================
-- Stores sequential invoice numbers per year

CREATE TABLE invoice_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL UNIQUE,
    counter INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice counter indexes
CREATE INDEX idx_invoice_counters_year ON invoice_counters(year);

-- Enable RLS
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_invoice_counters_updated_at BEFORE UPDATE ON invoice_counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
