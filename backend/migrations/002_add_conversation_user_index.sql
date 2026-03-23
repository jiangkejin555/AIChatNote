-- Add composite index for conversations table
-- This ensures efficient queries and data isolation by user_id and id

-- Create composite index for better query performance and data isolation
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_id ON conversations(user_id, id);

-- Optionally add a comment explaining the purpose
COMMENT ON INDEX idx_conversations_user_id_id IS 'Composite index for user data isolation and efficient conversation lookup';
