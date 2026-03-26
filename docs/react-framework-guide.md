# React 框架结构与运行机制

> 本文档结合项目的 `frontend/` 代码，讲解 React 框架的核心概念、文件组织、基础语法和前后端交互逻辑。

---

## 目录

1. [技术栈概览](#1-技术栈概览)
2. [文件类型说明](#2-文件类型说明)
3. [项目目录结构](#3-项目目录结构)
4. [React 核心概念](#4-react-核心概念)
5. [Next.js App Router 机制](#5-nextjs-app-router-机制)
6. [状态管理](#6-状态管理)
7. [数据请求与缓存](#7-数据请求与缓存)
8. [前后端交互](#8-前后端交互)
9. [组件开发规范](#9-组件开发规范)
10. [常用 Hooks 详解](#10-常用-hooks-详解)

---

## 1. 技术栈概览

本项目前端采用的技术栈：

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.2.0 | React 全栈框架，提供路由、SSR 等能力 |
| **React** | 19.2.4 | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4 | 原子化 CSS 框架 |
| **Zustand** | 5.x | 轻量级状态管理 |
| **TanStack Query** | 5.x | 服务端状态管理与数据请求 |
| **Axios** | 1.x | HTTP 客户端 |
| **shadcn/ui** | - | UI 组件库 |

---

## 2. 文件类型说明

### 2.1 `.ts` vs `.tsx`

| 扩展名 | 用途 | 示例 |
|--------|------|------|
| `.ts` | 纯 TypeScript 文件，不包含 JSX | 工具函数、类型定义、API 模块 |
| `.tsx` | TypeScript + JSX，用于组件 | React 组件、页面 |

**示例对比：**

```typescript
// types/index.ts - 纯类型定义，使用 .ts
export interface User {
  id: number
  email: string
}

export interface Conversation {
  id: number
  title: string
  is_saved: boolean
}
```

```tsx
// components/ui/button.tsx - 包含 JSX，使用 .tsx
function Button({ className, variant, size, ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### 2.2 其他重要文件

| 文件 | 作用 |
|------|------|
| `package.json` | 项目依赖和脚本配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `next.config.ts` | Next.js 框架配置 |
| `tailwind.config.ts` | Tailwind CSS 配置 |
| `globals.css` | 全局样式 |

---

## 3. 项目目录结构

```
frontend/src/
├── app/                    # Next.js 页面路由 (App Router)
│   ├── (auth)/             # 认证相关页面组（括号表示路由组，不影响 URL）
│   │   ├── login/          # /login
│   │   └── register/       # /register
│   ├── (main)/             # 主应用页面组
│   │   ├── about/          # /about
│   │   ├── models/         # /models
│   │   ├── notes/          # /notes
│   │   ├── settings/       # /settings
│   │   └── page.tsx        # / (首页/聊天页)
│   ├── api/                # API 路由（服务端）
│   ├── globals.css         # 全局样式
│   └── layout.tsx          # 根布局
│
├── components/             # React 组件
│   ├── chat/               # 聊天相关组件
│   ├── common/             # 通用组件
│   ├── layout/             # 布局组件
│   ├── notes/              # 笔记相关组件
│   ├── ui/                 # shadcn/ui 基础组件
│   └── providers.tsx       # 全局 Provider 包装器
│
├── hooks/                  # 自定义 React Hooks
│   ├── use-conversations.ts
│   ├── use-models.ts
│   ├── use-notes.ts
│   └── use-stream-chat.ts
│
├── lib/                    # 工具库
│   ├── api/                # API 客户端和各模块
│   ├── utils.ts            # 通用工具函数
│   └── markdown-utils.ts   # Markdown 处理
│
├── stores/                 # Zustand 状态仓库
│   ├── auth-store.ts       # 认证状态
│   ├── chat-store.ts       # 聊天状态
│   ├── notes-store.ts      # 笔记状态
│   └── ui-store.ts         # UI 状态
│
├── types/                  # TypeScript 类型定义
│   └── index.ts
│
├── i18n/                   # 国际化
│   ├── config.ts
│   └── context.tsx
│
└── constants/              # 常量定义
    └── providers.ts
```

---

## 4. React 核心概念

### 4.1 组件 (Components)

React 应用由组件构成，每个组件是一个返回 UI 的函数。

```tsx
// 简单组件示例
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <I18nProvider>
          {children}
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

### 4.2 JSX 语法

JSX 是 JavaScript 的扩展，允许在 JS 中写类似 HTML 的语法：

```tsx
// JSX 示例
<div className="flex flex-col">
  <h1 className="text-xl font-bold">{title}</h1>
  <Button variant="default" onClick={handleClick}>
    点击我
  </Button>
</div>
```

**关键点：**
- 使用 `className` 而非 `class`
- 使用 `{}` 插入 JavaScript 表达式
- 组件名必须大写开头（如 `<Button />`）
- 单标签必须闭合（如 `<img src="..." />`）

### 4.3 Props（属性）

Props 是父组件传递给子组件的数据：

```tsx
// 定义 Props 类型
interface MessageListProps {
  streamingContent?: string
  optimisticMessages: Message[]
  isThinking: boolean
  onRetry: () => void
}

// 使用 Props
function MessageList({
  streamingContent,
  optimisticMessages,
  isThinking,
  onRetry
}: MessageListProps) {
  // 组件实现
}
```

### 4.4 State（状态）

State 是组件内部的响应式数据，改变时会触发重新渲染：

```tsx
import { useState } from 'react'

function ChatPage() {
  // useState 返回 [当前值, 更新函数]
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [saveNoteDialogOpen, setSaveNoteDialogOpen] = useState(false)

  // 更新状态
  const handleModelChange = (newModelId: string) => {
    setSelectedModelId(newModelId)
  }
}
```

### 4.5 组件生命周期与 Effect

`useEffect` 用于处理副作用（数据获取、订阅、DOM 操作等）：

```tsx
import { useEffect } from 'react'

function ChatPage() {
  const { data: conversations } = useConversations()
  const { currentConversationId, setCurrentConversation } = useChatStore()

  // 当 conversations 或 currentConversationId 变化时执行
  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      setCurrentConversation(conversations[0].id)
    }
  }, [conversations, currentConversationId, setCurrentConversation])
  // ↑ 依赖数组：只有这些值变化时才重新执行
}
```

---

## 5. Next.js App Router 机制

### 5.1 文件系统路由

Next.js 使用文件系统作为路由：

| 文件路径 | URL |
|---------|-----|
| `app/page.tsx` | `/` |
| `app/(main)/notes/page.tsx` | `/notes` |
| `app/(auth)/login/page.tsx` | `/login` |

### 5.2 路由组 `(groupName)`

括号包裹的文件夹不会出现在 URL 中，用于组织代码：

```
app/
├── (auth)/          # 认证相关页面组
│   ├── login/       # /login
│   └── register/    # /register
└── (main)/          # 主应用页面组
    ├── notes/       # /notes
    └── page.tsx     # /
```

### 5.3 布局 (Layout)

`layout.tsx` 定义页面的共享布局：

```tsx
// app/layout.tsx - 根布局
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 5.4 `'use client'` 指令

Next.js 13+ 默认所有组件都是服务端组件。需要使用客户端特性（如 useState、useEffect）时，必须在文件顶部声明：

```tsx
'use client'  // ← 必须是第一行

import { useState, useEffect } from 'react'

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false)  // 需要客户端
  // ...
}
```

**服务端组件 vs 客户端组件：**

| 特性 | 服务端组件 | 客户端组件 |
|------|-----------|-----------|
| 获取数据 | ✅ | ✅ |
| 访问后端资源 | ✅ | ❌ |
| 保护敏感信息 | ✅ | ❌ |
| useState/useEffect | ❌ | ✅ |
| 事件处理 | ❌ | ✅ |
| 浏览器 API | ❌ | ✅ |

---

## 6. 状态管理

### 6.1 Zustand 状态管理

本项目使用 **Zustand** 管理全局客户端状态。

**定义 Store：**

```tsx
// stores/chat-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  currentConversationId: number | null
  drafts: Record<number, string>
  isStreaming: boolean
  // Actions
  setCurrentConversation: (id: number | null) => void
  setDraft: (conversationId: number, draft: string) => void
  setIsStreaming: (isStreaming: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // 初始状态
      currentConversationId: null,
      drafts: {},
      isStreaming: false,

      // Actions - 使用 set 更新状态
      setCurrentConversation: (id) => set({ currentConversationId: id }),

      setDraft: (conversationId, draft) =>
        set((state) => ({
          drafts: { ...state.drafts, [conversationId]: draft }
        })),

      setIsStreaming: (isStreaming) => set({ isStreaming }),
    }),
    {
      name: 'chat-storage',  // localStorage key
      partialize: (state) => ({ drafts: state.drafts }),  // 只持久化部分状态
    }
  )
)
```

**在组件中使用：**

```tsx
function ChatPage() {
  // 获取状态和 Actions
  const { currentConversationId, setCurrentConversation, isStreaming } = useChatStore()

  // 使用
  const handleSelectConversation = (id: number) => {
    setCurrentConversation(id)
  }
}
```

### 6.2 状态分类

| 状态类型 | 存储位置 | 工具 | 示例 |
|---------|---------|------|------|
| 服务端状态 | TanStack Query | React Query | 对话列表、消息、笔记 |
| 客户端状态 | Zustand | Zustand | 当前对话ID、草稿、UI状态 |
| 表单状态 | 组件内 | useState | 输入框内容 |

---

## 7. 数据请求与缓存

### 7.1 TanStack Query (React Query)

用于管理服务端数据，自动处理缓存、重试、后台更新。

**查询数据 (useQuery)：**

```tsx
// hooks/use-conversations.ts
import { useQuery } from '@tanstack/react-query'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],  // 缓存键
    queryFn: conversationsApi.getAll,  // 数据获取函数
  })
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => conversationId ? conversationsApi.getMessages(conversationId) : [],
    enabled: !!conversationId,  // 条件查询：只有有 ID 时才执行
  })
}
```

**修改数据 (useMutation)：**

```tsx
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      conversationsApi.create(data),

    onSuccess: (conversation) => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },

    onError: () => {
      toast.error('创建失败')
    },
  })
}
```

**在组件中使用：**

```tsx
function ChatPage() {
  const { data: conversations, isLoading, error } = useConversations()
  const createConversation = useCreateConversation()

  const handleCreate = async () => {
    await createConversation.mutateAsync({ provider_model_id: 'xxx' })
  }
}
```

---

## 8. 前后端交互

### 8.1 API 客户端配置

```tsx
// lib/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'

// 创建 Axios 实例
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加 Token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理 401 错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### 8.2 API 模块组织

```tsx
// lib/api/conversations.ts
import { apiClient } from './client'
import type { Conversation, Message, CreateConversationRequest } from '@/types'

export const conversationsApi = {
  // 获取所有对话
  getAll: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/conversations')
    return response.data
  },

  // 获取单个对话
  getById: async (id: number): Promise<Conversation> => {
    const response = await apiClient.get(`/conversations/${id}`)
    return response.data
  },

  // 创建对话
  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await apiClient.post('/conversations', data)
    return response.data
  },

  // 删除对话
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`)
  },
}
```

### 8.3 数据流向图

```
用户操作
    ↓
组件调用 Hook (useMutation)
    ↓
Hook 调用 API 函数
    ↓
Axios 发送 HTTP 请求 (带 Token)
    ↓
后端处理请求
    ↓
响应返回
    ↓
onSuccess/onError 回调
    ↓
更新 QueryClient 缓存
    ↓
组件自动重新渲染
```

### 8.4 流式响应 (SSE)

对于 AI 对话等场景，使用流式传输：

```tsx
// hooks/use-stream-chat.ts
export function useStreamChat({
  conversationId,
  onMessageChunk,
  onMessageEnd,
  onError,
}) {
  const streamMessage = async (content: string, convId: number) => {
    const response = await fetch(`/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, conversation_id: convId }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      onMessageChunk(chunk)  // 实时更新 UI
    }

    onMessageEnd()
  }

  return { streamMessage }
}
```

---

## 9. 组件开发规范

### 9.1 组件结构

```tsx
// 1. 'use client' 指令（如需要）
'use client'

// 2. 导入
import { useState, useCallback, useMemo } from 'react'
import { useChatStore } from '@/stores'
import { Button } from '@/components/ui/button'
import type { Message } from '@/types'

// 3. 类型定义
interface MessageListProps {
  messages: Message[]
  onRetry?: () => void
}

// 4. 组件函数
export function MessageList({ messages, onRetry }: MessageListProps) {
  // 4.1 Hooks 调用
  const { currentConversationId } = useChatStore()
  const [isLoading, setIsLoading] = useState(false)

  // 4.2 派生状态（使用 useMemo 缓存计算结果）
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [messages])

  // 4.3 事件处理（使用 useCallback 缓存函数）
  const handleRetry = useCallback(() => {
    onRetry?.()
  }, [onRetry])

  // 4.4 JSX 返回
  return (
    <div className="flex flex-col gap-4">
      {sortedMessages.map((msg) => (
        <div key={msg.id} className={msg.role === 'user' ? 'text-right' : ''}>
          {msg.content}
        </div>
      ))}
    </div>
  )
}
```

### 9.2 UI 组件库使用

本项目使用 shadcn/ui + Tailwind CSS：

```tsx
// 使用 Button 组件
<Button variant="default" size="lg">
  主要按钮
</Button>

<Button variant="outline" size="icon">
  <SettingsIcon />
</Button>

<Button variant="destructive">
  删除
</Button>
```

**Tailwind CSS 常用类：**

```tsx
// 布局
<div className="flex flex-col gap-4">          // 弹性布局，垂直排列，间距4
<div className="grid grid-cols-3 gap-2">       // 网格布局，3列，间距2
<div className="flex items-center justify-between">  // 居中对齐，两端分布

// 尺寸
<div className="w-full h-screen">              // 全宽，全屏高
<div className="p-4">                          // padding: 1rem
<div className="px-4 py-2">                    // 水平padding 4，垂直 2

// 文字
<span className="text-sm font-medium">         // 小号字，中等粗细
<span className="text-primary">                // 主题色

// 边框与圆角
<div className="border rounded-lg">            // 边框，大圆角
<div className="shadow-md">                    // 中等阴影
```

---

## 10. 常用 Hooks 详解

### 10.1 useState - 状态管理

```tsx
const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

// 更新方式
setCount(count + 1)              // 直接更新
setCount(prev => prev + 1)       // 函数更新（推荐）
setUser({ ...user, name: 'New' }) // 部分更新需手动合并
```

### 10.2 useEffect - 副作用处理

```tsx
// 组件挂载时执行一次
useEffect(() => {
  fetchData()
}, [])

// 依赖变化时执行
useEffect(() => {
  if (conversationId) {
    fetchMessages(conversationId)
  }
}, [conversationId])

// 清理函数
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()  // 组件卸载时清理
}, [])
```

### 10.3 useCallback - 缽数缓存

```tsx
// 每次渲染都创建新函数
const handleClick = () => { ... }

// 缓存函数，只有依赖变化才重新创建
const handleClick = useCallback(() => {
  sendMessage(content)
}, [content, sendMessage])
```

### 10.4 useMemo - 值缓存

```tsx
// 每次渲染都重新计算
const filteredItems = items.filter(item => item.active)

// 缓存计算结果
const filteredItems = useMemo(() => {
  return items.filter(item => item.active)
}, [items])
```

### 10.5 useRef - 引用持久化

```tsx
// 保存跨渲染的值，变化不触发重渲染
const streamingIdRef = useRef<number | null>(null)

// 读取/更新
streamingIdRef.current = newId

// 访问 DOM 元素
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()
```

### 10.6 自定义 Hook

```tsx
// hooks/use-conversations.ts
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
  })
}

// 使用
function Sidebar() {
  const { data: conversations, isLoading } = useConversations()
  // ...
}
```

---

## 总结

### React 开发核心要点

1. **组件化思维**：将 UI 拆分为独立、可复用的组件
2. **单向数据流**：数据从父组件流向子组件（props），子组件通过回调通知父组件
3. **状态管理**：区分客户端状态（Zustand）和服务端状态（TanStack Query）
4. **副作用隔离**：使用 useEffect 处理数据获取、订阅等副作用
5. **性能优化**：使用 useMemo、useCallback 缓存计算结果和函数

### 本项目架构特点

- **Next.js App Router**：文件系统路由 + 服务端组件
- **Zustand**：轻量级客户端状态管理
- **TanStack Query**：服务端状态管理，自动缓存和同步
- **Axios**：HTTP 客户端，拦截器处理认证
- **shadcn/ui + Tailwind**：原子化 CSS + 组件库

### 学习建议

1. 从 `app/(main)/page.tsx` 开始理解页面结构
2. 查看 `hooks/` 目录了解数据请求模式
3. 研究 `stores/` 目录理解状态管理
4. 阅读 `components/ui/` 学习组件封装
5. 查看 `lib/api/` 了解前后端交互

---

*文档基于项目 frontend/ 代码编写，如有疑问可参考源码。*
