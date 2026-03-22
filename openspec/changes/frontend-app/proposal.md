# Frontend App - Proposal

## Why

当前项目只有后端 API 设计文档，缺少前端应用。用户需要一个现代化的 Web 前端来实现 AI Chat Notes 的核心功能：多模型聊天聚合和知识库管理。前端需要提供流畅的用户体验，包括流式输出、Markdown 渲染、深色模式等现代特性。

## What Changes

### 新增

- **Next.js 14+ 前端应用**：基于 App Router 的 React 应用
- **用户认证系统**：登录、注册、登出功能，JWT Token 管理
- **模型管理**：添加、编辑、删除、设置默认模型
- **聊天功能**：多轮对话、流式输出（SSE）、消息复制、重新生成
- **笔记功能**：AI 自动总结、标签建议、Markdown 格式
- **知识库**：文件夹管理、标签筛选、全文搜索、Markdown 导出
- **深色模式**：亮色/暗色主题切换
- **响应式布局**：适配桌面和移动端

## Capabilities

### New Capabilities

- `user-auth`: 用户认证（登录、注册、登出、Token 管理）
- `model-management`: 模型配置管理（CRUD、设置默认）
- `chat-conversation`: 聊天对话（创建、列表、详情、流式消息）
- `note-creation`: 笔记创建（AI 总结、标签建议、保存）
- `knowledge-base`: 知识库管理（文件夹、标签、搜索、导出）
- `ui-theme`: UI 主题系统（深色模式、响应式布局）

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

### 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand (客户端状态) + React Query (服务端状态)
- **Markdown**: react-markdown + remark-gfm
- **图标**: Lucide React

### 目录结构

```
frontend/
├── src/
│   ├── app/           # Next.js App Router 路由
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义 Hooks
│   ├── stores/        # Zustand stores
│   ├── lib/           # 工具库和 API 封装
│   ├── types/         # TypeScript 类型定义
│   └── constants/     # 常量
└── public/            # 静态资源
```

### API 依赖

前端将调用以下后端 API：

- `/api/auth/*` - 认证相关
- `/api/models/*` - 模型管理
- `/api/conversations/*` - 对话管理
- `/api/notes/*` - 笔记管理
- `/api/folders/*` - 文件夹管理
- `/api/tags/*` - 标签管理

### 部署

- 开发环境：本地 Next.js 开发服务器
- 生产环境：Vercel 部署
