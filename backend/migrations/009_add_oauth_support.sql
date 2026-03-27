-- Add OAuth support and user profile fields
-- Migration: 009_add_oauth_support

-- Add new fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create oauth_accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Create indexes for oauth_accounts
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- Add comment to table
COMMENT ON TABLE oauth_accounts IS 'OAuth account associations for users';
COMMENT ON COLUMN oauth_accounts.provider IS 'OAuth provider name: google, github, qq';
COMMENT ON COLUMN oauth_accounts.provider_user_id IS 'User ID from OAuth provider';
