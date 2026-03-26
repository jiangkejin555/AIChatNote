-- AI Chat Note - 数据库定义
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

CREATE INDEX idx_users_email ON users (email);

-- ============================================
-- 2. AI 提供商表
-- ============================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- 显示名称，如 "OpenAI (个人)"
    type VARCHAR(50) NOT NULL, -- 提供商类型: openai, volcengine, deepseek, anthropic, google, moonshot, zhipu, custom
    api_base VARCHAR(500) NOT NULL, -- API 基础地址
    api_key_encrypted TEXT, -- API Key（加密存储）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_provider_type CHECK (
        type IN (
            'openai',
            'volcengine',
            'deepseek',
            'anthropic',
            'google',
            'moonshot',
            'zhipu',
            'custom'
        )
    )
);

CREATE INDEX idx_providers_user_id ON providers (user_id);

CREATE INDEX idx_providers_type ON providers(type);

-- ============================================
-- 3. 提供商模型表
-- ============================================
CREATE TABLE provider_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    provider_id UUID NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL, -- API 返回的模型标识，如 gpt-4o
    display_name VARCHAR(255) NOT NULL, -- 用户友好的显示名称
    is_default BOOLEAN DEFAULT FALSE, -- 是否为该提供商的默认模型
    enabled BOOLEAN DEFAULT TRUE, -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider_id, model_id)
);

CREATE INDEX idx_provider_models_provider_id ON provider_models (provider_id);

CREATE INDEX idx_provider_models_is_default ON provider_models (provider_id, is_default)
WHERE
    is_default = TRUE;

-- ============================================
-- 4. 刷新令牌表
-- ============================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

-- ============================================
-- 5. 对话表
-- ============================================
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    provider_model_id UUID REFERENCES provider_models (id) ON DELETE SET NULL, -- 关联提供商模型
    title VARCHAR(500), -- 对话标题
    is_saved BOOLEAN DEFAULT FALSE, -- 是否已转为笔记
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations (user_id);

CREATE INDEX idx_conversations_provider_model_id ON conversations (provider_model_id);

CREATE INDEX idx_conversations_created_at ON conversations (created_at DESC);

CREATE INDEX idx_conversations_is_saved ON conversations (is_saved);

CREATE INDEX idx_conversations_user_id_id ON conversations (user_id, id);
-- 复合索引用于数据隔离

-- ============================================
-- 6. 消息表
-- ============================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);

CREATE INDEX idx_messages_created_at ON messages (conversation_id, created_at);

-- ============================================
-- 7. 文件夹表
-- ============================================
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders (id) ON DELETE SET NULL, -- 支持嵌套结构
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_folders_user_id ON folders (user_id);

CREATE INDEX idx_folders_parent_id ON folders (parent_id);

-- ============================================
-- 8. 笔记表
-- ============================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    folder_id INTEGER REFERENCES folders (id) ON DELETE SET NULL,
    source_conversation_id INTEGER REFERENCES conversations (id) ON DELETE SET NULL, -- 来源对话
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL, -- HTML 格式内容
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes (user_id);

CREATE INDEX idx_notes_folder_id ON notes (folder_id);

CREATE INDEX idx_notes_source_conversation_id ON notes (source_conversation_id);

CREATE INDEX idx_notes_created_at ON notes (created_at DESC);

-- ============================================
-- 9. 笔记标签表 (多对多)
-- ============================================
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag)
);

CREATE INDEX idx_note_tags_tag ON note_tags (tag);

-- ============================================
-- 10. 全文搜索支持
-- ============================================

-- 添加搜索向量列
ALTER TABLE notes ADD COLUMN search_vector tsvector;

-- 创建全文搜索索引
CREATE INDEX idx_notes_search ON notes USING GIN (search_vector);

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
-- 10.5 会话摘要表
-- ============================================
CREATE TABLE conversation_summaries (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER UNIQUE NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    summary TEXT NOT NULL, -- 摘要内容
    end_message_id INTEGER NOT NULL, -- 摘要覆盖到的最后一条消息 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_summaries_conversation_id ON conversation_summaries (conversation_id);

-- ============================================
-- 10.6 用户设置表
-- ============================================
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    context_mode VARCHAR(20) DEFAULT 'simple', -- 上下文处理模式: summary | simple
    memory_level VARCHAR(20) DEFAULT 'normal', -- 记忆等级: short | normal | long
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_context_mode CHECK (
        context_mode IN ('summary', 'simple')
    ),
    CONSTRAINT chk_memory_level CHECK (
        memory_level IN ('short', 'normal', 'long')
    )
);

CREATE INDEX idx_user_settings_user_id ON user_settings (user_id);

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

-- 会话摘要表更新触发器
CREATE TRIGGER update_conversation_summaries_updated_at
    BEFORE UPDATE ON conversation_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户设置表更新触发器
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. 视图：用户标签统计
-- ============================================

CREATE VIEW user_tag_stats AS
SELECT n.user_id, t.tag as name, COUNT(*) as count
FROM note_tags t
    JOIN notes n ON t.note_id = n.id
GROUP BY
    n.user_id,
    t.tag
ORDER BY count DESC;

-- ============================================
-- 13. 视图：文件夹笔记数量
-- ============================================

CREATE VIEW folder_note_counts AS
SELECT f.id as folder_id, f.user_id, COUNT(n.id) as note_count
FROM folders f
    LEFT JOIN notes n ON f.id = n.folder_id
GROUP BY
    f.id,
    f.user_id;

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
FROM
    provider_models pm
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
-- 16. 常用查询示例
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