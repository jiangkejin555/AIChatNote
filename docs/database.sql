-- AI Chat Notes - 数据库定义
-- PostgreSQL 15+

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 2. AI 提供商表 (新增)
-- ============================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,              -- 显示名称，如 "OpenAI (个人)"
    type VARCHAR(50) NOT NULL,               -- 提供商类型: openai, volcengine, deepseek, anthropic, google, moonshot, zhipu, custom
    api_base VARCHAR(500) NOT NULL,          -- API 基础地址
    api_key_encrypted TEXT,                  -- API Key（加密存储）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_provider_type CHECK (type IN ('openai', 'volcengine', 'deepseek', 'anthropic', 'google', 'moonshot', 'zhipu', 'custom'))
);

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_type ON providers(type);

-- ============================================
-- 3. 提供商模型表 (新增)
-- ============================================
CREATE TABLE provider_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL,          -- API 返回的模型标识，如 gpt-4o
    display_name VARCHAR(255) NOT NULL,      -- 用户友好的显示名称
    is_default BOOLEAN DEFAULT FALSE,        -- 是否为该提供商的默认模型
    enabled BOOLEAN DEFAULT TRUE,            -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_provider_models_provider_id ON provider_models(provider_id);
CREATE INDEX idx_provider_models_is_default ON provider_models(provider_id, is_default) WHERE is_default = TRUE;

-- ============================================
-- 4. 对话表 (修改：增加 provider_model_id)
-- ============================================
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_model_id UUID REFERENCES provider_models(id) ON DELETE SET NULL,  -- 新字段：关联提供商模型
    model_id INTEGER REFERENCES models(id) ON DELETE SET NULL,  -- 已废弃，保留用于数据迁移
    title VARCHAR(500),                      -- 对话标题
    is_saved BOOLEAN DEFAULT FALSE,          -- 是否已转为笔记
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_provider_model_id ON conversations(provider_model_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_is_saved ON conversations(is_saved);

-- ============================================
-- 5. 消息表
-- ============================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- ============================================
-- 6. 文件夹表
-- ============================================
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,  -- 支持嵌套结构
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- ============================================
-- 7. 笔记表 (修改：字段调整)
-- ============================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    source_conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,  -- 来源对话
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,                   -- HTML 格式内容
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_source_conversation_id ON notes(source_conversation_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- ============================================
-- 8. 笔记标签表 (多对多)
-- ============================================
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag)
);

CREATE INDEX idx_note_tags_tag ON note_tags(tag);

-- ============================================
-- 9. 模型配置表 (已废弃，保留用于数据迁移)
-- ============================================
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,              -- 显示名称，如 "Claude 3.5"
    api_base VARCHAR(500) NOT NULL,          -- API 地址
    api_key VARCHAR(500) NOT NULL,           -- API Key（加密存储）
    model_name VARCHAR(100) NOT NULL,        -- 实际调用的模型名
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_models_user_id ON models(user_id);

-- ============================================
-- 10. 全文搜索支持
-- ============================================

-- 添加搜索向量列
ALTER TABLE notes ADD COLUMN search_vector tsvector;

-- 创建全文搜索索引
CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);

-- 更新搜索向量的触发器函数
CREATE OR REPLACE FUNCTION update_notes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector(
        'simple',
        coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER notes_search_update
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_notes_search_vector();

-- ============================================
-- 11. 更新时间触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表更新触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提供商表更新触发器
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 提供商模型表更新触发器
CREATE TRIGGER update_provider_models_updated_at
    BEFORE UPDATE ON provider_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 对话表更新触发器
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 笔记表更新触发器
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 文件夹表更新触发器
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 模型表更新触发器（已废弃但保留）
CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. 视图：用户标签统计
-- ============================================

CREATE VIEW user_tag_stats AS
SELECT
    n.user_id,
    t.tag as name,
    COUNT(*) as count
FROM note_tags t
JOIN notes n ON t.note_id = n.id
GROUP BY n.user_id, t.tag
ORDER BY count DESC;

-- ============================================
-- 13. 视图：文件夹笔记数量
-- ============================================

CREATE VIEW folder_note_counts AS
SELECT
    f.id as folder_id,
    f.user_id,
    COUNT(n.id) as note_count
FROM folders f
LEFT JOIN notes n ON f.id = n.folder_id
GROUP BY f.id, f.user_id;

-- ============================================
-- 14. 视图：提供商模型完整信息
-- ============================================

CREATE VIEW provider_models_full AS
SELECT
    pm.id,
    pm.provider_id,
    pm.model_id,
    pm.display_name,
    pm.is_default,
    pm.enabled,
    pm.created_at,
    pm.updated_at,
    p.name as provider_name,
    p.type as provider_type,
    p.api_base
FROM provider_models pm
JOIN providers p ON pm.provider_id = p.id;

-- ============================================
-- 15. 函数：确保每个提供商只有一个默认模型
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_default_model()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE provider_models
        SET is_default = FALSE
        WHERE provider_id = NEW.provider_id
          AND id != NEW.id
          AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_model
    BEFORE INSERT OR UPDATE OF is_default ON provider_models
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION ensure_single_default_model();

-- ============================================
-- 16. 数据迁移说明（从旧 models 表迁移到新 providers/provider_models）
-- ============================================

-- 迁移脚本示例（仅供参考，根据实际数据调整）：
--
-- -- 为每个旧模型创建一个 provider
-- INSERT INTO providers (user_id, name, type, api_base, api_key_encrypted)
-- SELECT
--     user_id,
--     name as name,
--     CASE
--         WHEN api_base LIKE '%anthropic%' THEN 'anthropic'
--         WHEN api_base LIKE '%openai%' THEN 'openai'
--         WHEN api_base LIKE '%deepseek%' THEN 'deepseek'
--         WHEN api_base LIKE '%volcengine%' OR api_base LIKE '%volces%' THEN 'volcengine'
--         WHEN api_base LIKE '%moonshot%' THEN 'moonshot'
--         WHEN api_base LIKE '%bigmodel%' THEN 'zhipu'
--         WHEN api_base LIKE '%google%' OR api_base LIKE '%generativelanguage%' THEN 'google'
--         ELSE 'custom'
--     END as type,
--     api_base,
--     api_key
-- FROM models;
--
-- -- 为每个 provider 创建对应的模型
-- INSERT INTO provider_models (provider_id, model_id, display_name, is_default, enabled)
-- SELECT
--     p.id,
--     m.model_name as model_id,
--     m.name as display_name,
--     m.is_default,
--     TRUE as enabled
-- FROM models m
-- JOIN providers p ON p.user_id = m.user_id AND p.name = m.name;
--
-- -- 更新 conversations 的 provider_model_id
-- UPDATE conversations c
-- SET provider_model_id = pm.id
-- FROM models m
-- JOIN providers p ON p.user_id = m.user_id AND p.name = m.name
-- JOIN provider_models pm ON pm.provider_id = p.id AND pm.model_id = m.model_name
-- WHERE c.model_id = m.id;

-- ============================================
-- 17. 常用查询示例
-- ============================================

-- 获取用户的所有提供商（含模型）
-- SELECT * FROM providers p
-- LEFT JOIN provider_models pm ON p.id = pm.provider_id
-- WHERE p.user_id = :user_id
-- ORDER BY p.created_at DESC, pm.is_default DESC;

-- 获取对话详情（含消息）
-- SELECT c.*, pm.display_name as model_name, p.name as provider_name, p.type as provider_type
-- FROM conversations c
-- LEFT JOIN provider_models pm ON c.provider_model_id = pm.id
-- LEFT JOIN providers p ON pm.provider_id = p.id
-- WHERE c.id = :conversation_id;

-- 搜索笔记
-- SELECT * FROM notes
-- WHERE user_id = :user_id
--   AND search_vector @@ to_tsquery('simple', :search_query)
-- ORDER BY ts_rank(search_vector, to_tsquery('simple', :search_query)) DESC;

-- 获取文件夹树（递归）
-- WITH RECURSIVE folder_tree AS (
--     SELECT id, user_id, name, parent_id, 0 as depth
--     FROM folders
--     WHERE user_id = :user_id AND parent_id IS NULL
--     UNION ALL
--     SELECT f.id, f.user_id, f.name, f.parent_id, ft.depth + 1
--     FROM folders f
--     JOIN folder_tree ft ON f.parent_id = ft.id
-- )
-- SELECT * FROM folder_tree ORDER BY depth, name;
