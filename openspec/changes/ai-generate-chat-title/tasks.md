## 1. 后端 - Repository 层

- [x] 1.1 在 `conversation.go` repository 中新增 `GetFirstUserMessage` 方法，获取对话的首条用户消息
- [x] 1.2 在 `conversation.go` repository 中新增 `UpdateTitle` 方法，更新对话标题

## 2. 后端 - Handler 层

- [x] 2.1 在 `handlers/conversation.go` 中新增 `GenerateTitle` handler
  - 获取对话 ID 和用户认证信息
  - 调用 repository 获取首条用户消息
  - 调用 AI 服务生成标题
  - 更新对话标题
  - 返回新标题

## 3. 后端 - 路由注册

- [x] 3.1 在 `cmd/server/main.go` 中注册新路由 `POST /api/conversations/:id/generate-title`

## 4. 前端 - API 层

- [x] 4.1 在 `lib/api/conversations.ts` 中新增 `generateTitle` 函数

## 5. 前端 - Hook 集成

- [x] 5.1 在 `hooks/use-stream-chat.ts` 中集成标题生成逻辑
  - 在发送首条消息后异步调用 `generateTitle`
  - 标题生成成功后刷新对话列表

## 6. 测试验证

- [x] 6.1 测试后端 API：调用标题生成接口验证返回
- [x] 6.2 测试前端集成：新建对话发送消息验证标题自动更新
