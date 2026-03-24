-- AI Chat Notes - Database Migration
-- Add model_id column to conversations table for model snapshot

-- ============================================
-- 1. Add model_id column to conversations
-- ============================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS model_id VARCHAR(255);

-- ============================================
-- 2. Backfill existing conversations with model_id
-- ============================================
-- Update model_id from provider_models table for existing conversations
UPDATE conversations c
SET model_id = pm.model_id
FROM provider_models pm
WHERE c.provider_model_id = pm.id
  AND c.model_id IS NULL;

-- ============================================
-- 3. Create index for model_id lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversations_model_id ON conversations(model_id);

-- ============================================
-- 4. Add comment for documentation
-- ============================================
COMMENT ON COLUMN conversations.model_id IS 'Snapshot of model_id from provider_models, preserved even after model deletion';
