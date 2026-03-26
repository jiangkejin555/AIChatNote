-- Add user_settings table for configurable context processing
-- This table stores user preferences for conversation memory settings

CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    context_mode VARCHAR(20) DEFAULT 'simple',  -- 'summary' | 'simple'
    memory_level VARCHAR(20) DEFAULT 'normal',  -- 'short' | 'normal' | 'long'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster user lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Add comment to table
COMMENT ON TABLE user_settings IS 'User preferences for conversation context processing';
COMMENT ON COLUMN user_settings.context_mode IS 'Context processing mode: summary (sliding window + compression) or simple (direct pass)';
COMMENT ON COLUMN user_settings.memory_level IS 'Memory length: short, normal, or long';
