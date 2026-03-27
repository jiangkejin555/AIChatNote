# Proposal: Add Conversation Search

## Why

当前侧边栏的会话历史列表只支持浏览，无法快速查找特定会话。随着用户使用时间增长，会话数量增多，用户难以找到历史对话内容。添加搜索功能可以显著提升用户查找信息的效率。

## What Changes

### 新增功能
- 在侧边栏会话历史区域添加搜索框
- 支持搜索会话标题和消息内容
- 搜索结果按相关度排序，显示匹配片段
- 实时搜索（输入时自动搜索，debounce 300ms）

### 后端改动
- 新增数据库迁移：创建物化视图支持全文搜索
- 新增 API 接口：`GET /api/conversations/search?q={keyword}`
- 新增 Repository 方法：Search()

### 前端改动
- 侧边栏添加搜索输入框
- 搜索状态管理
- 搜索结果展示（含匹配片段）

## Capabilities

### New Capabilities
- `conversation-search`: 会话全文搜索功能，支持搜索标题和消息内容，返回相关度排序结果

### Modified Capabilities
无（这是全新功能，不修改现有能力的需求）

## Impact

### 数据库
- 新增物化视图 `conversation_search_index`
- 新增 GIN 索引用于全文搜索
- 新增定时刷新任务（每分钟刷新一次）

### 后端
- `backend/migrations/`: 新增迁移文件
- `backend/internal/repository/conversation.go`: 新增 Search 方法
- `backend/internal/handlers/conversation.go`: 新增 Search 接口
- `backend/cmd/server/main.go`: 新增路由

### 前端
- `frontend/src/components/layout/sidebar.tsx`: 添加搜索框和结果展示
- `frontend/src/lib/api/`: 新增搜索 API 调用
- `frontend/src/hooks/`: 可能新增搜索相关 hook
- `frontend/messages/*.json`: 新增国际化文本
