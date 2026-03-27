# Tasks: Add Conversation Search

## 1. 数据库迁移

- [x] 1.1 创建迁移文件 `backend/migrations/009_add_conversation_search.sql`
- [x] 1.2 实现物化视图 `conversation_search_index`
- [x] 1.3 创建 GIN 索引 `idx_conv_search`
- [x] 1.4 测试迁移在本地数据库执行成功

## 2. 后端 Repository 层

- [x] 2.1 在 `backend/internal/repository/conversation.go` 添加 `SearchResult` 结构体
- [x] 2.2 实现 `ConversationRepository.Search(userID, query, limit)` 方法
- [ ] 2.3 添加单元测试验证搜索逻辑

## 3. 后端 Handler 层

- [x] 3.1 在 `backend/internal/handlers/conversation.go` 添加 `Search` 方法
- [x] 3.2 添加请求参数验证（q, limit）
- [ ] 3.3 添加单元测试验证 API 响应格式

## 4. 后端路由和刷新任务

- [x] 4.1 在 `backend/cmd/server/main.go` 添加搜索路由 `GET /api/conversations/search`
- [x] 4.2 实现物化视图定时刷新任务（每分钟）
- [x] 4.3 启动时执行一次物化视图刷新

## 5. 前端 API 层

- [x] 5.1 在 `frontend/src/lib/api/` 添加搜索 API 函数
- [x] 5.2 定义搜索结果类型 `ConversationSearchResult`
- [x] 5.3 添加 `useSearchConversations` hook（含 debounce 300ms）

## 6. 前端 UI 组件

- [x] 6.1 在侧边栏会话历史标题旁添加搜索图标按钮
- [x] 6.2 实现搜索输入框展开/收起动画
- [x] 6.3 实现搜索结果列表组件
- [x] 6.4 显示匹配片段和匹配位置（标题/内容）
- [x] 6.5 实现点击搜索结果跳转到对应会话

## 7. 国际化

- [x] 7.1 在 `frontend/messages/zh.json` 添加中文文本
- [x] 7.2 在 `frontend/messages/en.json` 添加英文文本

## 8. 测试和验证

- [x] 8.1 手动测试搜索功能端到端流程
- [x] 8.2 验证搜索结果按相关度排序
- [x] 8.3 验证 debounce 功能正常工作
- [x] 8.4 验证空搜索返回完整会话列表
- [x] 8.5 验证用户数据隔离（只搜到自己的会话）
