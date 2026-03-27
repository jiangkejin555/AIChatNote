-- Migration: 009_add_conversation_search.sql
-- Description: Add conversation search support
-- Created: 2026-03-27
-- Updated: 2026-03-27 - Removed materialized view, using ILIKE-based search for better Chinese support

-- ============================================
-- Note: Search Implementation
-- ============================================
-- The conversation search uses ILIKE-based queries directly on the conversations
-- and messages tables. This approach was chosen because:
--
-- 1. PostgreSQL's 'simple' tsvector config doesn't properly segment Chinese text
--    (it treats the entire Chinese string as a single token)
-- 2. ILIKE provides accurate substring matching for all languages
-- 3. For typical user data volumes, ILIKE performance is acceptable
--
-- If search performance becomes an issue with large datasets, consider:
-- - Adding a pg_trgm extension and GIN index for ILIKE acceleration
-- - Using a dedicated search engine like Meilisearch or Elasticsearch
--
-- The search query is implemented in:
-- backend/internal/repository/conversation.go -> ConversationRepository.Search()

-- ============================================
-- Drop any existing materialized view (cleanup from old version)
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS conversation_search_index;
DROP FUNCTION IF EXISTS refresh_conversation_search_index();
