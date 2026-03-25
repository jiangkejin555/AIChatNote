## Context

当前聊天应用的"新建对话"流程存在问题：点击按钮立即调用后端创建对话记录，即使用户还未发送任何消息。这导致后端积累大量空对话，且用户连续点击会创建多个空对话。

当前架构：
- `chat-store.ts`: 管理 `currentConversationId`, `drafts`, `isStreaming` 状态
- `sidebar.tsx`: `handleNewConversation` 直接调用 `createConversation.mutate()`
- `page.tsx`: 根据 `currentConversationId` 显示消息列表或空状态
- `message-list.tsx`: 当 `currentConversationId === null` 时显示提示文字

## Goals / Non-Goals

**Goals:**
- 点击"新建对话"后显示居中的开始页面，不调用后端
- 用户发送第一条消息时才创建对话
- 连续点击"新建对话"时复用当前 pending 状态

**Non-Goals:**
- 不修改后端 API
- 不修改现有对话列表的显示逻辑
- 不添加示例问题卡片等功能

## Decisions

### D1: 新增 `isPendingNewChat` 状态到 chat-store

**选择**: 在 `chat-store.ts` 中新增 `isPendingNewChat: boolean` 状态

**原因**:
- 需要区分"用户从未选择对话"和"用户点击了新建对话但未发送消息"两种状态
- `currentConversationId === null` 无法区分这两种情况

**备选方案**:
- 使用特殊值如 `currentConversationId = -1` 表示 pending 状态 → 不够语义化，容易混淆

### D2: 创建独立的 `ChatStartPage` 组件

**选择**: 新建 `frontend/src/components/chat/chat-start-page.tsx` 组件

**原因**:
- 开始页面有独立的 UI（居中布局、欢迎文字）
- 与 `MessageList` 组件职责分离
- 便于维护和测试

### D3: 在 ChatPage 中条件渲染

**选择**: 在 `page.tsx` 中根据 `isPendingNewChat` 条件渲染 `ChatStartPage` 或正常聊天界面

**原因**:
- 保持现有的页面结构
- 最小化改动范围

## Risks / Trade-offs

- **状态同步风险**: `isPendingNewChat` 与 `currentConversationId` 需要正确同步
  - Mitigation: 在 `handleSendMessage` 成功创建对话后，确保重置 `isPendingNewChat = false`
- **浏览器刷新**: 用户刷新页面后 `isPendingNewChat` 会丢失（未持久化）
  - 这是可接受的行为，刷新后应显示之前的对话或空状态
