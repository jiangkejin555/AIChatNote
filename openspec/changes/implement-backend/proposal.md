## Why

前端开发已完成，目前使用 Mock 数据运行。需要实现 Go 后端 API 服务，为前端提供真实的数据存储、用户认证、LLM 对话和笔记管理功能，使产品能够真正上线使用。

## What Changes

- **新增** Go 后端服务 (Gin + GORM + PostgreSQL)
- **新增** 用户认证系统 (JWT + Refresh Token)
- **新增** AI 提供商管理 (API Key AES 加密存储)
- **新增** 对话系统 (支持 SSE 流式聊天)
- **新增** 笔记系统 (Markdown 存储 + AI 总结)
- **新增** 知识库管理 (文件夹、标签、全文搜索)
- **新增** Docker Compose 本地开发环境

## Capabilities

### New Capabilities

- `user-auth`: 用户注册、登录、JWT 认证、Refresh Token 机制
- `provider-management`: AI 提供商配置管理，支持 OpenAI、Claude、DeepSeek、火山引擎等
- `model-management`: 提供商下的模型配置，支持动态获取可用模型列表
- `conversation-system`: 对话创建、管理、消息历史
- `streaming-chat`: SSE 流式聊天，调用用户配置的 LLM API
- `note-management`: 笔记 CRUD，Markdown 存储，AI 自动总结
- `folder-management`: 文件夹树形结构管理
- `tag-management`: 标签统计与筛选
- `search-functionality`: PostgreSQL 全文搜索笔记内容
- `export-import`: 笔记导出 Markdown、批量导出、Markdown 导入

### Modified Capabilities

无（这是全新的后端实现）

## Impact

**新增目录**:
- `backend/` - Go 后端项目根目录
- `backend/cmd/server/` - 应用入口
- `backend/internal/` - 核心代码
- `backend/migrations/` - 数据库迁移
- `backend/docs/` - 后端文档

**环境变量**:
- `DATABASE_URL` - PostgreSQL 连接
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT 签名密钥
- `ENCRYPTION_KEY` - API Key 加密密钥
- `DEEPSEEK_API_KEY` - 笔记总结用
- `FRONTEND_URL` - CORS 配置

**依赖服务**:
- PostgreSQL 15+ 数据库
- Docker Compose 本地开发环境

**前端改动**:
- 将 `USE_MOCK = true` 改为 `false` 启用真实 API
