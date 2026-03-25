## Why

当前点击"新建对话"按钮会立即调用后端 API 创建对话记录，即使用户还没有发送任何消息。这导致：
1. 后端产生大量无用的空对话记录
2. 用户连续点击会创建多个空对话
3. 用户体验不佳 - 应该在用户真正开始对话时才创建

## What Changes

- 新增"开始页面"：点击"新建对话"后显示居中的欢迎界面，包含模型选择器、欢迎文字和输入框
- 延迟对话创建：只有在用户发送第一条消息时才调用后端创建对话
- 复用 pending 状态：如果当前已经在"开始页面"状态，再次点击"新建对话"时复用当前页面，不重复操作

## Capabilities

### New Capabilities
- `chat-start-page`: 开始页面的 UI 组件和状态管理，包含居中布局、欢迎文字、模型选择器和输入框

### Modified Capabilities
- `chat-conversation`: 对话创建逻辑从"点击新建立即创建"改为"发送首条消息时创建"

## Impact

- `frontend/src/stores/chat-store.ts`: 新增 `isPendingNewChat` 状态
- `frontend/src/components/layout/sidebar.tsx`: 修改 `handleNewConversation` 逻辑
- `frontend/src/app/(main)/page.tsx`: 条件渲染开始页面
- `frontend/src/components/chat/`: 新增 `ChatStartPage` 组件
- `frontend/messages/en.json` 和 `zh.json`: 新增翻译 key
