-- Migration: 010_cleanup_search_vector.sql
-- Description: Remove unused search_vector column and trigger from notes table
-- Created: 2026-03-27
--
-- Background: The notes search now uses ILIKE-based queries for better Chinese
-- text support, making the tsvector column and trigger unnecessary.

-- ============================================
-- 1. Drop the trigger
-- ============================================

DROP TRIGGER IF EXISTS notes_search_update ON notes;

-- ============================================
-- 2. Drop the trigger function
-- ============================================

DROP FUNCTION IF EXISTS update_notes_search_vector();

-- ============================================
-- 3. Drop the GIN index
-- ============================================

DROP INDEX IF EXISTS idx_notes_search;

-- ============================================
-- 4. Drop the search_vector column
-- ============================================

ALTER TABLE notes DROP COLUMN IF EXISTS search_vector;

-- ============================================
-- Note: Search Implementation
-- ============================================
-- The note search now uses ILIKE-based queries directly on the notes table.
-- This approach was chosen because:
--
-- 1. PostgreSQL's 'simple' tsvector config doesn't properly segment Chinese text
--    (it treats the entire Chinese string as a single token)
-- 2. ILIKE provides accurate substring matching for all languages
-- 3. For typical user data volumes, ILIKE performance is acceptable
--
-- The search query is implemented in:
-- backend/internal/repository/note.go -> NoteRepository.FindByUserID()
