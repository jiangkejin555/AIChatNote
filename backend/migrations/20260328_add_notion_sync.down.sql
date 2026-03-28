ALTER TABLE notes
DROP COLUMN IF EXISTS notion_last_sync_at,
DROP COLUMN IF EXISTS notion_page_id;

DROP TABLE IF EXISTS user_integrations;
