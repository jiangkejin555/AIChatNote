## Context

当前聊天消息发送流程：
1. 前端发送 POST 请求到 `/conversations/:id/messages`
2. 后端保存用户消息，调用 AI API，保存 AI 回复
3. 通过 SSE 流式返回 AI 回复

**问题**：前端设置 10 分钟超时，超时后用户可能点击重试。但前端断开连接不等于后端停止处理，可能导致重复消息。

**约束**：
- 后端使用 PostgreSQL，无 Redis
- 需要处理并发竞态条件
- 尽量减少对现有代码的改动

## Goals / Non-Goals

**Goals:**
- 实现请求去重，确保相同 `request_id` 只被处理一次
- 利用数据库唯一约束解决并发竞态问题
- 重试时能获取已完成的 AI 回复
- 兼容现有 API（`request_id` 为可选参数）

**Non-Goals:**
- 不实现分布式锁（无 Redis）
- 不修改 AI 调用层
- 不处理历史数据的 `request_id` 回填

## Decisions

### 1. 存储方案：新建 `message_requests` 表

**选择**：新建独立表，而非在 `messages` 表添加字段

**原因**：
- `messages` 表只存储已完成的消息，无法表达"处理中"状态
- 独立表可以存储请求元数据（状态、时间戳、关联消息 ID）
- 便于查询和管理请求状态

**表结构**：
```sql
CREATE TABLE message_requests (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    request_id VARCHAR(36) NOT NULL,              -- UUID format
    user_message_id INTEGER REFERENCES messages(id),
    assistant_message_id INTEGER REFERENCES messages(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_message_requests_request_id UNIQUE (request_id)
);

CREATE INDEX idx_message_requests_conversation ON message_requests(conversation_id);
CREATE INDEX idx_message_requests_status ON message_requests(status);
```

### 2. 去重机制：利用数据库唯一约束

**选择**：INSERT 时利用 `UNIQUE` 约束，失败则查询现有记录

**原因**：
- PostgreSQL 的 UNIQUE 约束是原子的
- 无需额外锁机制
- 简单可靠

**流程**：
```
1. 尝试 INSERT (request_id, status='processing')
2. 如果成功 → 开始处理
3. 如果失败（唯一约束冲突）→ 查询现有记录
   - status='completed' → 返回已有的 assistant_message
   - status='processing' → 等待或返回提示
   - status='failed' → 可选择重试
```

### 3. 前端 request_id 生成

**选择**：使用 `crypto.randomUUID()`

**原因**：
- 浏览器原生支持，无需额外依赖
- UUID v4 格式，足够唯一

**实现**：
```typescript
// 发送消息时
const requestId = crypto.randomUUID()

// 重试时复用同一个 requestId
```

### 4. API 变更

**选择**：`request_id` 作为可选参数

**原因**：
- 向后兼容，老客户端不传也能正常工作
- 新客户端传递后享受去重保护

## Risks / Trade-offs

### Risk 1: message_requests 表无限增长
**Mitigation**: 添加定期清理任务，删除 30 天前的已完成记录

### Risk 2: 等待"processing"状态的请求可能导致用户长时间等待
**Mitigation**:
- 设置等待超时（如 30 秒）
- 超时后返回提示："请求正在处理中，请稍后刷新查看"

### Risk 3: 前端未传递 request_id 时无法去重
**Mitigation**: 这是预期行为，保持向后兼容

## Migration Plan

### 部署步骤
1. 运行数据库迁移，创建 `message_requests` 表
2. 部署后端新代码（兼容无 request_id 的情况）
3. 部署前端新代码（生成并传递 request_id）

### 回滚策略
1. 回滚前端（不再传递 request_id）
2. 回滚后端
3. 如需要，删除 `message_requests` 表

## Open Questions

1. **是否需要定期清理 message_requests 表？**
   - 建议：是，30 天后删除已完成记录
   - 可作为后续任务

2. **status='processing' 时的等待策略？**
   - 方案 A：长轮询等待
   - 方案 B：立即返回提示，让用户刷新
   - 建议：先实现方案 B，更简单
