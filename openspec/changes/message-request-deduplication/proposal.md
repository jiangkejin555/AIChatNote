## Why

当用户发送消息后等待 AI 回复时，如果请求超时（10分钟），前端会断开连接但后端可能仍在处理。用户点击重试后，后端会收到新请求并再次处理，导致数据库中出现重复的 AI 回复消息。

需要一个请求去重机制，确保相同的请求只被处理一次，避免产生重复消息。

## What Changes

- 新增 `message_requests` 表，用于跟踪每个请求的处理状态
- 前端生成唯一 `request_id`（UUID），重试时复用同一个 ID
- 后端在处理请求前先检查该 `request_id` 是否已处理或正在处理
- 利用数据库唯一约束实现原子性，解决并发竞态问题
- 如果请求已完成，直接返回已有的 AI 回复
- 如果请求正在处理中，等待处理完成

## Capabilities

### New Capabilities

- `message-request-deduplication`: 消息请求去重机制，确保相同请求只被处理一次

### Modified Capabilities

- `chat-conversation`: 修改消息发送接口，新增 `request_id` 参数，支持去重逻辑

## Impact

### 前端
- `use-stream-chat.ts`: 生成并传递 `request_id`
- `page.tsx`: 重试时复用同一个 `request_id`

### 后端
- 新增数据库迁移：创建 `message_requests` 表
- 新增 Model: `MessageRequest`
- 新增 Repository: `MessageRequestRepository`
- 修改 `SendMessageRequest`: 新增 `request_id` 字段
- 修改 `conversation.go`: 添加去重检查逻辑

### API
- `POST /conversations/:id/messages`: 新增可选参数 `request_id` (string, UUID format)
