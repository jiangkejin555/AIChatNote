-- AI Chat Note - Database Migration
-- Support model switching in conversations

-- ============================================
-- 1. Rename conversations.provider_model_id to current_provider_model_id
-- ============================================
ALTER TABLE conversations
RENAME COLUMN provider_model_id TO current_provider_model_id;

-- ============================================
-- 2. Add provider_model_id and model_id columns to messages
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS provider_model_id UUID;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS model_id VARCHAR(255);

-- ============================================
-- 3. Backfill messages with model info from their conversation
-- ============================================
-- For assistant messages, set provider_model_id and model_id from conversation
UPDATE messages m
SET
    provider_model_id = c.current_provider_model_id,
    model_id = c.model_id
FROM conversations c
WHERE
    m.conversation_id = c.id
    AND m.role = 'assistant'
    AND m.provider_model_id IS NULL;

-- ============================================
-- 4. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_provider_model_id ON messages (provider_model_id);

CREATE INDEX IF NOT EXISTS idx_messages_model_id ON messages (model_id);

-- ============================================
-- 5. Add foreign key constraint for messages.provider_model_id
-- ============================================
ALTER TABLE messages
ADD CONSTRAINT fk_messages_provider_model FOREIGN KEY (provider_model_id) REFERENCES provider_models (id) ON DELETE SET NULL;

-- ============================================
-- 6. Add comments for documentation
-- ============================================
COMMENT ON COLUMN conversations.current_provider_model_id IS 'Currently selected model for the conversation, can be switched';

COMMENT ON COLUMN messages.provider_model_id IS 'Model used for this message (assistant messages only)';

COMMENT ON COLUMN messages.model_id IS 'Snapshot of model_id (e.g., "gpt-4o"), preserved after model deletion';