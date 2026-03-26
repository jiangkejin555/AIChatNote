## Why

当前实现会将对话的**所有历史消息**发送给 LLM，导致 token 消耗随对话长度线性增长。长对话会：
- 增加用户成本（API 调用费用）
- 增加响应延迟
- 可能超出模型上下文窗口限制

需要实现对话摘要压缩功能，在保留对话语义连续性的同时控制 token 消耗。

## What Changes

- 新增**滑动窗口 + 摘要压缩**策略，替代当前的"全量历史"模式
- 新增 `conversation_summaries` 数据库表存储对话摘要
- 修改消息发送逻辑：超过窗口大小时，生成摘要并发送 `[摘要] + [最近消息]`
- 摘要采用增量更新策略：基于旧摘要 + 新消息合并压缩
- 摘要生成时对消息分组加权（早期轻度概括，近期保留细节）

## Capabilities

### New Capabilities

- `conversation-summary`: 对话摘要压缩能力，包括：
  - 滑动窗口管理（窗口大小 20，保留最近 10 条原始消息）
  - 摘要生成与增量更新（每新增 5 条消息更新一次摘要）
  - 摘要存储与检索
  - 分组加权压缩（早期/中期/近期不同处理策略）

### Modified Capabilities

无。这是新增功能，不改变现有 API 接口和用户体验。

## Impact

### 后端

- `backend/internal/models/` - 新增 `ConversationSummary` 模型
- `backend/internal/repository/` - 新增摘要仓库
- `backend/internal/handlers/conversation.go` - 修改 `SendMessage` 逻辑
- `backend/migrations/` - 新增数据库迁移文件

### 数据库

- 新增 `conversation_summaries` 表

### 前端

- 无影响（用户无感知）

### 成本影响

- 摘要生成需要额外 LLM 调用（约 500 tokens/次）
- 长对话可节省约 37% token 消耗
- 用户发送 3-4 条消息后开始"回本"
