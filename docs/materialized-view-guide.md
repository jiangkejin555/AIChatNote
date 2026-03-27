# 数据库视图与物化视图详解

## 1. 什么是视图

视图（View）是一个虚拟表，它只存储 **SQL 查询定义**，不存储实际数据。每次查询视图时，数据库会动态执行底层 SQL。

### 1.1 视图存储的内容

| 存储项 | 是否存储 |
|-------|---------|
| SQL 定义 | ✅ |
| 实际数据 | ❌ |
| 索引 | ❌ |

### 1.2 视图的作用

| 作用 | 说明 |
|-----|------|
| 简化复杂查询 | 将复杂的 JOIN 封装成简单的视图 |
| 权限控制 | 只暴露需要的字段，隐藏敏感数据 |
| 逻辑抽象 | 源表结构变化时，只需修改视图定义 |
| 统一数据口径 | 多团队使用同一视图，确保计算逻辑一致 |

### 1.3 视图示例

```sql
-- 创建视图：组合用户和订单信息
CREATE VIEW v_user_order AS
SELECT
    u.name,
    CONCAT(LEFT(u.phone, 3), '****', RIGHT(u.phone, 4)) as phone,
    u.city,
    o.product,
    o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;
```

查询视图时看起来就像一张普通的表：

| name | phone | city | product | amount |
|------|-------|------|---------|--------|
| 张三 | 138****5678 | 北京 | iPhone | 6999 |
| 张三 | 138****5678 | 北京 | AirPods | 1299 |
| 李四 | 139****4321 | 上海 | iPad | 4599 |

---

## 2. 什么是物化视图

物化视图（Materialized View）与普通视图的区别在于：**它不仅存储 SQL 定义，还存储查询结果数据**。

### 2.1 核心对比

| 特性 | 普通视图 | 物化视图 |
|-----|---------|---------|
| 存储 | 仅 SQL 定义 | SQL + 实际数据 |
| 查询性能 | 慢（每次实时计算） | 快（直接读缓存） |
| 数据实时性 | 实时 | 有延迟（需刷新） |
| 存储空间 | 不占用 | 占用 |

### 2.2 刷新机制

物化视图的数据需要定期刷新以保持与源表同步：

| 刷新方式 | 说明 |
|---------|------|
| ON COMMIT | 源表提交时自动刷新（Oracle） |
| ON DEMAND | 手动触发刷新 |
| 定时刷新 | 按固定间隔刷新 |
| 增量刷新 | 只更新变化的数据 |

```sql
-- 手动刷新
REFRESH MATERIALIZED VIEW mv_order_summary;

-- 增量刷新（PostgreSQL，不阻塞查询）
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_order_summary;
```

### 2.3 使用场景

**适合使用：**
- 数据仓库 / BI 报表
- 预计算复杂的聚合查询
- 实时性要求不高的统计数据
- 读多写少的场景

**不适合使用：**
- 数据实时性要求高（如库存、余额）
- 数据频繁变更
- 数据量小、查询简单

---

## 3. 项目中的实际应用

### 3.1 搜索实现方案

**注意：** 项目最初使用了物化视图 + PostgreSQL 全文搜索（tsvector），但后来改用 ILIKE 方式，原因是：

1. PostgreSQL 的 `simple` 配置对中文分词效果差（整个中文字符串被当作一个词）
2. ILIKE 提供准确的子串匹配，对所有语言都有效
3. 对于典型的用户数据量，ILIKE 性能可接受

### 3.2 当前实现

**会话搜索** (`backend/internal/repository/conversation.go`):
```go
// 使用 ILIKE 搜索标题和消息内容
sql := `
    SELECT c.id, c.title, ...
    FROM conversations c
    WHERE c.user_id = ?
      AND (c.title ILIKE '%' || ? || '%'
           OR EXISTS (
               SELECT 1 FROM messages m
               WHERE m.conversation_id = c.id
                 AND m.content ILIKE '%' || ? || '%'
           ))
    ORDER BY rank DESC, c.updated_at DESC
`
```

**笔记搜索** (`backend/internal/repository/note.go`):
```go
// 使用 ILIKE 搜索标题和内容
searchPattern := "%" + search.(string) + "%"
query = query.Where("title ILIKE ? OR content ILIKE ?", searchPattern, searchPattern)
```

### 3.3 原物化视图方案（已废弃）

以下是原来的物化视图设计，仅供参考：

```sql
-- 已废弃：原来的物化视图设计
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_search_index AS
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

### 3.4 SQL 详解（原方案）

#### `string_agg(m.content, ' ')`

将一个会话的所有消息合并成一个字符串：

```
消息表 messages:
| conversation_id | content      |
|-----------------|--------------|
| 1               | 你好         |
| 1               | 今天天气不错 |
| 1               | 是的         |

聚合后: "你好 今天天气不错 是的"
```

#### `to_tsvector('simple', ...)`

将文本转换为全文搜索向量，用于加速搜索：

```
输入: "今天天气不错 Hello World"
输出: 'hello':2 'world':3 '今天天气不错':1
```

`'simple'` 是分词配置，表示简单的分词规则（不做词干提取）。

#### `coalesce(..., '')`

处理 NULL 值，避免 NULL 拼接导致整体为 NULL：

```sql
NULL || 'hello'  →  NULL     -- 危险！
'' || 'hello'    →  'hello'  -- 安全
```

### 3.5 当前方案的优势

| 优势 | 说明 |
|-----|------|
| 中文支持好 | ILIKE 子串匹配对所有语言都准确 |
| 实现实简单 | 无需维护物化视图和刷新任务 |
| 无延迟 | 搜索结果实时，无需等待刷新 |

### 3.6 性能优化建议

如果未来数据量增大导致 ILIKE 性能下降，可以考虑：

1. **pg_trgm 扩展**：创建 GIN 索引加速 ILIKE 查询
   ```sql
   CREATE EXTENSION pg_trgm;
   CREATE INDEX idx_notes_title_trgm ON notes USING GIN (title gin_trgm_ops);
   CREATE INDEX idx_notes_content_trgm ON notes USING GIN (content gin_trgm_ops);
   ```

2. **专业搜索引擎**：如 Meilisearch、Elasticsearch

3. **中文分词扩展**：如 zhparser

---

## 4. 总结

| 概念 | 本质 |
|-----|------|
| **普通视图** | SQL 的"别名"，每次查询实时计算 |
| **物化视图** | SQL + 结果缓存，用空间换时间 |

### 本项目的搜索方案演变

1. **最初方案**：物化视图 + PostgreSQL 全文搜索（tsvector）
2. **发现问题**：`simple` 配置对中文分词效果差
3. **当前方案**：ILIKE 子串匹配，简单有效，支持所有语言

物化视图仍然是一个有用的技术，但在本项目中，由于中文搜索的需求，ILIKE 是更合适的选择。
