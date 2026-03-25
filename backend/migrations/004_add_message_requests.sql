-- ============================================
-- Migration: Add message_requests table for request deduplication
-- ============================================

-- Create message_requests table to track and deduplicate message requests
CREATE TABLE IF NOT EXISTS message_requests (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    request_id VARCHAR(36) NOT NULL,              -- UUID format
    user_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    assistant_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_message_requests_request_id UNIQUE (request_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_message_requests_conversation ON message_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_status ON message_requests(status);
CREATE INDEX IF NOT EXISTS idx_message_requests_created_at ON message_requests(created_at);

-- Add comment
COMMENT ON TABLE message_requests IS 'Tracks message requests for deduplication and retry handling';
