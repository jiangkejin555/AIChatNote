# Frontend App - Design

## Context

本项目是一个 AI 聊天聚合 + 知识库管理的 Web 应用。后端使用 Go + Gin，数据库使用 PostgreSQL。目前已有完整的产品设计文档、数据库设计和 API 定义，但缺少前端实现。

前端需要实现以下核心功能：

1. **用户认证**：登录/注册，JWT Token 管理
2. **模型管理**：配置多个 LLM API
3. **聊天功能**：多轮对话、流式输出
4. **笔记功能**：AI 自动总结对话
5. **知识库**：文件夹、标签、搜索、导出

## Goals / Non-Goals

**Goals:**

- 构建一个现代化的 React 前端应用
- 实现流畅的用户体验，包括流式输出和实时交互
- 支持深色模式和响应式布局
- 代码结构清晰，便于维护和扩展
- 使用 shadcn/ui 保证 UI 美观和一致性

**Non-Goals:**

- 不实现国际化（先只支持中文）
- 不实现团队协作功能
- 不实现代码执行环境
- 不实现文件上传解析
- 不实现语音对话或图片生成

## Decisions

### 1. 技术栈选择

| 决策 | 选择 | 备选方案 | 理由 |
|------|------|----------|------|
| 框架 | Next.js 14+ (App Router) | Vite + React Router | App Router 更现代，支持 RSC，利于 SEO |
| 语言 | TypeScript | JavaScript | 类型安全，IDE 支持更好 |
| 样式 | Tailwind CSS + shadcn/ui | Styled Components | Tailwind 开发效率高，shadcn/ui 组件美观 |
| 客户端状态 | Zustand | Redux, Jotai | 简单轻量，学习成本低 |
| 服务端状态 | React Query | SWR | 缓存、重试、乐观更新功能完善 |
| Markdown | react-markdown | MDX | 简单够用，支持 GFM |

### 2. 状态管理策略

采用 **React Query + Zustand** 混合方案：

| 状态类型 | 管理方式 | 示例 |
|----------|----------|------|
| 服务端数据 | React Query | 对话列表、笔记列表、文件夹树 |
| 认证状态 | Zustand (persist) | user, token, isAuthenticated |
| UI 状态 | Zustand | 当前对话ID、侧边栏展开、主题 |
| 表单草稿 | Zustand | 输入框内容 |

**React Query 职责**：
- 对话列表、消息列表
- 笔记列表、文件夹树、标签列表
- 模型列表
- 自动缓存、后台刷新、乐观更新

**Zustand 职责**：
- `auth-store`: 用户认证（持久化到 localStorage）
- `chat-store`: 当前对话、输入草稿
- `notes-store`: 筛选条件、选中状态
- `ui-store`: 主题、侧边栏状态

### 3. 流式输出方案

**决策**: 使用 Next.js API Route 代理 SSE 流

```
前端 → Next.js API Route (/api/chat/stream) → 后端 API
```

**理由**：
- 避免暴露后端 API 地址
- 统一处理认证
- 便于开发环境调试

**实现**：
```typescript
// 前端调用
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ conversation_id, content, stream: true }),
})

// 读取 SSE 流
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // 解析 "data: {...}\n\n" 格式
}
```

### 4. 认证方案

**决策**: localStorage 存储 + 短期 Token (7天)

**理由**：
- MVP 阶段实现简单
- 前后端分离部署，localStorage 更方便
- 后续可升级为 refresh token 机制

**流程**：
1. 登录成功后，存储 token 到 localStorage（通过 Zustand persist）
2. 页面加载时，Zustand 自动从 localStorage 恢复 token
3. 所有 API 请求自动携带 Authorization header
4. 401 响应时，清除认证状态，重定向到登录页

### 5. 路由结构

采用 Next.js 路由分组实现不同布局：

```
app/
├── (auth)/              # 认证页面（无侧边栏）
│   ├── login/
│   ├── register/
│   └── layout.tsx       # 简洁布局
│
├── (main)/              # 主应用（有侧边栏）
│   ├── page.tsx         # 首页/聊天
│   ├── notes/           # 知识库
│   ├── settings/        # 设置
│   └── layout.tsx       # 主布局 + 路由守卫
│
├── api/                 # API Routes
│   └── chat/stream/     # SSE 代理
│
└── layout.tsx           # 根布局
```

### 6. 组件组织

按功能模块划分组件：

```
components/
├── ui/          # shadcn/ui 基础组件
├── layout/      # 布局组件（Sidebar, Header）
├── chat/        # 聊天模块
├── notes/       # 笔记/知识库模块
├── settings/    # 设置模块
└── common/      # 通用组件（Markdown 渲染器等）
```

### 7. UI 设计原则

- **必须使用 `ui-ux-pro-max` skill** 进行 UI 设计和开发，确保页面美观和合理性
- 使用 `shadcn/ui` 组件库保证一致性
- 参考 ChatGPT 和 Notion 的交互设计
- 支持深色模式（通过 next-themes）
- 响应式布局，移动端优先

**Skill 使用规范**：

| 阶段 | Skill | 用途 |
|------|-------|------|
| 设计/开发 | `ui-ux-pro-max` | 创建页面或组件时获取设计建议 |
| 代码审查 | `web-design-guidelines` | 检查 UI 代码是否符合 Web 界面最佳实践 |
| 最终审查 | `ui-ux-pro-max` + `web-design-guidelines` | 综合审查 UI 美观性和规范性 |

**ui-ux-pro-max 使用场景**：
- 创建新页面或组件时，先用 skill 生成设计规范
- 实现复杂 UI（如聊天界面、知识库布局）时，获取布局和样式建议
- 完成后进行 UI 美观性审查

**web-design-guidelines 使用场景**：
- 组件/页面开发完成后，检查可访问性 (a11y)
- 审查响应式设计是否规范
- 检查交互是否符合 Web 最佳实践和优化

## Risks / Trade-offs

### 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| SSE 流式输出在部分网络环境不稳定 | 用户体验下降 | 添加超时处理和重连机制；提供非流式备选方案 |
| localStorage XSS 攻击风险 | Token 泄露 | Token 有效期设为 7 天；后续升级为 httpOnly cookie |
| 大量消息时渲染性能问题 | 页面卡顿 | 虚拟滚动；消息分页加载 |
| Markdown 渲染 XSS 风险 | 安全问题 | 使用 react-markdown 的安全默认配置 |

### 权衡

| 决策 | 权衡 |
|------|------|
| localStorage vs httpOnly cookie | 牺牲部分安全性换取实现简单，适合 MVP |
| Zustand vs Redux | 牺牲生态成熟度换取开发效率 |
| Next.js API Route 代理 vs 直连后端 | 增加一层代理，但提高了安全性和灵活性 |
| react-markdown vs 专业编辑器 | 牺牲编辑体验换取实现简单，后续可升级 |
