-- 007_add_conversation_summaries.sql
-- Create conversation_summaries table for storing conversation summaries

CREATE TABLE IF NOT EXISTS conversation_summaries (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    end_message_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_conversation_summary UNIQUE (conversation_id)
);

-- Create index for faster lookups by conversation_id
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id ON conversation_summaries(conversation_id);

-- Add comment to table
COMMENT ON TABLE conversation_summaries IS 'Stores compressed summaries of conversation history for token optimization';
COMMENT ON COLUMN conversation_summaries.end_message_id IS 'ID of the last message covered by this summary';

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_conversation_summaries_updated_at ON conversation_summaries;
CREATE TRIGGER update_conversation_summaries_updated_at
    BEFORE UPDATE ON conversation_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
