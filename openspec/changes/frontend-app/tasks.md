# Frontend App - Implementation Tasks

> **⚠️ 重要：UI 开发和审查必须使用以下 Skills**
>
> | 阶段 | Skill | 用途 |
> |------|-------|------|
> | 设计/开发 | `ui-ux-pro-max` | 创建页面或组件时获取设计建议 |
> | 代码审查 | `web-design-guidelines` | 检查可访问性和 Web 最佳实践 |
>
> 每个模块完成后，使用 `web-design-guidelines` 进行代码审查

## 1. Project Setup

- [x] 1.1 Create Next.js 14 project with TypeScript
- [x] 1.2 Configure Tailwind CSS
- [x] 1.3 Initialize shadcn/ui components
- [x] 1.4 Set up project directory structure (app, components, hooks, stores, lib, types)
- [x] 1.5 Configure path aliases in tsconfig.json
- [x] 1.6 Set up ESLint and Prettier
- [x] 1.7 Create environment variables template (.env.example)

## 2. Core Infrastructure

- [x] 2.1 Create API client with Axios (lib/api/client.ts)
- [x] 2.2 Implement request/response interceptors
- [x] 2.3 Create TypeScript types from API schema (types/*.ts)
- [x] 2.4 Set up Zustand stores structure
- [x] 2.5 Configure React Query provider
- [x] 2.6 Set up next-themes for dark mode
- [x] 2.7 Create SSE stream handling utilities

## 3. Authentication System

- [x] 3.1 Create auth-store with Zustand (persist to localStorage)
- [x] 3.2 Implement auth API functions (lib/api/auth.ts)
- [x] 3.3 Create login page with form validation
- [x] 3.4 Create register page with form validation
- [x] 3.5 Implement protected route guard (layout component)
- [x] 3.6 Add 401 handling in API interceptor
- [x] 3.7 Create user menu dropdown component

## 4. Layout Components

> 🎨 **开发**: ui-ux-pro-max | **审查**: web-design-guidelines

- [x] 4.1 Create root layout with providers
- [x] 4.2 Create auth layout (simple, no sidebar)
- [x] 4.3 Create main layout with sidebar
- [x] 4.4 Build sidebar component with navigation
- [x] 4.5 Build header component with user menu and theme toggle
- [x] 4.6 Implement responsive sidebar (mobile hamburger menu)
- [x] 4.7 Add sidebar collapse/expand for desktop
- [ ] 4.8 Layout 组件代码审查 (web-design-guidelines)

## 5. Model Management

- [x] 5.1 Create models API functions (lib/api/models.ts)
- [x] 5.2 Create useModels hook with React Query
- [x] 5.3 Build model list component
- [x] 5.4 Build model card component with edit/delete actions
- [x] 5.5 Build model form dialog (add/edit)
- [x] 5.6 Implement set default model functionality
- [x] 5.7 Build model selector dropdown component

## 6. Chat Functionality

> 🎨 **开发**: ui-ux-pro-max | **审查**: web-design-guidelines

- [x] 6.1 Create conversations API functions (lib/api/conversations.ts)
- [x] 6.2 Create chat-store for UI state
- [x] 6.3 Create useConversations hook
- [x] 6.4 Create useConversation hook (single conversation with messages)
- [x] 6.5 Build conversation list component (sidebar)
- [x] 6.6 Build conversation item component with rename/delete
- [x] 6.7 Build message list component with auto-scroll
- [x] 6.8 Build message item component with copy/regenerate
- [x] 6.9 Build message input component with draft persistence
- [x] 6.10 Implement SSE streaming with Next.js API Route proxy
- [x] 6.11 Implement useStreamChat hook
- [x] 6.12 Add optimistic update for user messages
- [x] 6.13 Implement message regeneration
- [ ] 6.14 Chat 组件代码审查 (web-design-guidelines)

## 7. Note Creation

- [x] 7.1 Create notes API functions (lib/api/notes.ts)
- [x] 7.2 Build save note dialog component
- [x] 7.3 Implement AI summary generation (call /notes/generate)
- [x] 7.4 Build note content editor (title, content, tags)
- [x] 7.5 Build folder selector dropdown
- [x] 7.6 Implement tag input with suggestions
- [x] 7.7 Add note save functionality

## 8. Knowledge Base

> 🎨 **开发**: ui-ux-pro-max | **审查**: web-design-guidelines

- [x] 8.1 Create folders API functions (lib/api/folders.ts)
- [x] 8.2 Create tags API functions (lib/api/tags.ts)
- [x] 8.3 Create useNotes hook with filtering
- [x] 8.4 Create useFolders hook
- [x] 8.5 Create useTags hook
- [x] 8.6 Build knowledge base page layout
- [x] 8.7 Build folder tree component (sidebar)
- [x] 8.8 Build tag cloud component (sidebar)
- [x] 8.9 Build notes list component with filtering
- [x] 8.10 Build note card component
- [x] 8.11 Build note detail panel
- [x] 8.12 Implement search functionality
- [x] 8.13 Implement folder CRUD (create, rename, delete)
- [x] 8.14 Implement note edit functionality
- [x] 8.15 Implement note delete functionality
- [x] 8.16 Implement note move to folder
- [x] 8.17 Implement single note export (Markdown download)
- [x] 8.18 Implement batch note export (ZIP download)
- [ ] 8.19 Knowledge Base 组件代码审查 (web-design-guidelines)

## 9. Common Components

- [x] 9.1 Build Markdown renderer component (react-markdown)
- [x] 9.2 Build loading skeleton component
- [x] 9.3 Build empty state component
- [x] 9.4 Build confirm dialog component (using alert-dialog)
- [x] 9.5 Build toast notification wrapper
- [x] 9.6 Build copy button component

## 10. Polish & Optimization

> 🎨 **UI 审查使用双 Skill**：
> - `ui-ux-pro-max`: 审查 UI 美观性和设计质量
> - `web-design-guidelines`: 检查 Web 界面规范和可访问性

- [x] 10.1 Add loading states to all async operations
- [x] 10.2 Add error handling and error toasts
- [ ] 10.3 Implement infinite scroll for message history
- [x] 10.4 Add keyboard shortcuts (Enter to send, etc.)
- [ ] 10.5 Optimize bundle size
- [x] 10.6 Add meta tags and SEO basics
- [ ] 10.7 Test responsive design on various screen sizes
- [ ] 10.8 UI 美观性审查 (ui-ux-pro-max skill)
- [ ] 10.9 Web 规范审查 (web-design-guidelines skill)
