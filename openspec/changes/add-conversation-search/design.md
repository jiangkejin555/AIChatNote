# Design: Add Conversation Search

## Context

当前系统使用 PostgreSQL 作为数据库，已有会话（conversations）和消息（messages）表。用户需要一个搜索功能来快速查找历史会话内容。

**技术栈：**
- 后端: Go + Gin + GORM
- 数据库: PostgreSQL 15+
- 前端: Next.js + React + TypeScript

**相关现有实现：**
项目中 `notes` 表已使用 PostgreSQL 全文搜索（`tsvector` + GIN 索引），可以参考此模式。

## Goals / Non-Goals

**Goals:**
- 支持搜索会话标题和消息内容
- 搜索结果按相关度排序
- 显示匹配内容片段
- 搜索响应时间 < 500ms
- 支持实时搜索（debounce 300ms）

**Non-Goals:**
- 不支持高级搜索语法（AND/OR/NOT）
- 不支持搜索笔记内容
- 不支持搜索结果高亮（仅显示片段）
- 不实现中文分词优化（使用 simple 配置）

## Decisions

### 1. 搜索技术选型：PostgreSQL 全文搜索

**选择：** 使用 PostgreSQL 内置全文搜索（tsvector + GIN 索引）

**替代方案：**
| 方案 | 优点 | 缺点 |
|-----|------|------|
| LIKE 查询 | 实现简单 | 无法使用索引，性能差 |
| PostgreSQL FTS | 高性能，已有使用经验 | 需要迁移 |
| Meilisearch | 更强大的搜索能力 | 增加外部依赖 |

**理由：** 项目已在使用 PostgreSQL FTS for notes，保持一致性；对于当前规模足够高效。

### 2. 数据结构：物化视图

**选择：** 创建物化视图 `conversation_search_index` 存储预计算的搜索索引

**理由：**
- 避免每次搜索时 JOIN + 聚合
- 支持创建 GIN 索引加速查询
- 可接受的延迟（每分钟刷新）

```sql
CREATE MATERIALIZED VIEW conversation_search_index AS
SELECT
    c.id as conversation_id,
    c.user_id,
    c.title,
    c.updated_at,
    string_agg(m.content, ' ') as all_content,
    to_tsvector('simple',
        coalesce(c.title, '') || ' ' ||
        coalesce(string_agg(m.content, ' '), '')
    ) as search_vector
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.user_id, c.title, c.updated_at;
```

### 3. 刷新策略：定时刷新

**选择：** 每分钟定时刷新物化视图

**替代方案：**
| 方案 | 优点 | 缺点 |
|-----|------|------|
| 实时刷新（触发器） | 数据实时 | 写入性能影响大 |
| 定时刷新 | 性能好 | 最多1分钟延迟 |
| 手动刷新 | 灵活 | 用户体验差 |

**理由：** 会话搜索不需要毫秒级实时性；1分钟延迟可接受；避免影响消息写入性能。

**实现方式：** 使用 Go ticker 在后端定时执行 `REFRESH MATERIALIZED VIEW CONCURRENTLY`

### 4. API 设计

```
GET /api/conversations/search?q={keyword}&limit={limit}

Response:
{
  "data": [
    {
      "id": 123,
      "title": "如何使用 React Hooks",
      "snippet": "...关于 <b>关键词</b> 的使用方法...",
      "matched_in": "content",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 5. 前端实现

**搜索触发：** 实时搜索，使用 debounce 300ms

**UI 位置：** 会话历史标题旁，点击图标展开输入框

**结果展示：**
- 显示匹配片段（snippet）
- 显示匹配位置（标题/内容）
- 按相关度排序

## Risks / Trade-offs

### Risk 1: 物化视图刷新延迟
- **风险：** 新消息最多1分钟后才能被搜到
- **缓解：** 在 UI 上不需要特别提示，用户通常不会立即搜索刚发送的内容

### Risk 2: 中文搜索质量
- **风险：** 使用 `simple` 配置，中文按字分词，搜索质量不如专业分词
- **缓解：** 后续可升级到 `zhparser` 扩展；当前使用 `simple` 配置已能满足基本需求

### Risk 3: 大量会话时的性能
- **风险：** 用户有数千会话时，物化视图更新可能变慢
- **缓解：** 监控刷新时间；必要时可增加 WHERE 条件限制索引范围

### Trade-off: 实现复杂度 vs 功能完整性
- **选择：** 先实现基础搜索，后续迭代高级功能
- **放弃：** 高级搜索语法、高亮、拼音搜索等

## Migration Plan

### 部署步骤

1. **数据库迁移**
   ```bash
   # 应用迁移文件
   psql -f backend/migrations/009_add_conversation_search.sql
   ```

2. **后端部署**
   - 新增代码无破坏性变更
   - 可直接部署

3. **前端部署**
   - 新增组件和 API 调用
   - 可直接部署

### 回滚策略

1. 删除物化视图和索引：
   ```sql
   DROP MATERIALIZED VIEW IF EXISTS conversation_search_index;
   ```

2. 回滚后端代码
3. 回滚前端代码

## Open Questions

无待确认问题。设计已完整。
