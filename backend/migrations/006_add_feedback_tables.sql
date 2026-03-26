-- AI Chat Note - Database Migration 006
-- Feedback Tables

-- ============================================
-- 1. Satisfaction Ratings Table
-- ============================================
CREATE TABLE IF NOT EXISTS satisfaction_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_ratings_user_id ON satisfaction_ratings (user_id);

-- ============================================
-- 2. Feedbacks Table
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (
        type IN ('bug', 'feature', 'other')
    ),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'in_progress',
            'resolved',
            'closed'
        )
    ),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks (user_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks (status);

-- ============================================
-- 3. Feature Requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS feature_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'planned' CHECK (
        status IN (
            'planned',
            'in_progress',
            'completed'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. Feature Votes Table
-- ============================================
CREATE TABLE IF NOT EXISTS feature_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    feature_id INTEGER NOT NULL REFERENCES feature_requests (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes (feature_id);

CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes (user_id);

-- ============================================
-- 5. Versions Table
-- ============================================
CREATE TABLE IF NOT EXISTS versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    release_date DATE NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_versions_release_date ON versions (release_date DESC);

-- ============================================
-- 6. Update Timestamp Triggers
-- ============================================

-- Satisfaction ratings table trigger
DROP TRIGGER IF EXISTS update_satisfaction_ratings_updated_at ON satisfaction_ratings;

CREATE TRIGGER update_satisfaction_ratings_updated_at
    BEFORE UPDATE ON satisfaction_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feedbacks table trigger
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;

CREATE TRIGGER update_feedbacks_updated_at
    BEFORE UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feature requests table trigger
DROP TRIGGER IF EXISTS update_feature_requests_updated_at ON feature_requests;

CREATE TRIGGER update_feature_requests_updated_at
    BEFORE UPDATE ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();