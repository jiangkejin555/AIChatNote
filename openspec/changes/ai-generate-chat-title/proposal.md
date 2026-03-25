## Why

当前新建聊天时，对话标题默认为"新对话"，用户无法快速区分不同的聊天内容。需要手动修改标题，体验不佳。通过 AI 自动根据对话内容生成标题，可以提升用户体验，让用户更快识别和找到历史对话。

## What Changes

- 新增后端 API：`POST /api/conversations/:id/generate-title`，根据对话首条用户消息生成标题
- 前端在发送第一条消息后异步调用标题生成 API
- 标题生成完成后自动刷新对话列表显示新标题

## Capabilities

### New Capabilities

- `chat-title-generation`: AI 自动生成聊天标题功能，根据用户首条消息生成简洁有意义的标题

### Modified Capabilities

- 无（现有对话 API 不变，仅新增功能）

## Impact

**后端：**
- `backend/internal/handlers/conversation.go` - 新增 `GenerateTitle` handler
- `backend/internal/repository/conversation.go` - 新增获取首条消息、更新标题方法
- `backend/cmd/server/main.go` - 注册新路由

**前端：**
- `frontend/src/hooks/use-stream-chat.ts` - 发送消息后调用标题生成
- `frontend/src/lib/api/conversations.ts` - 新增 `generateTitle` 函数
