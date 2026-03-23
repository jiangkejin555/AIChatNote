## Context

当前应用已有基础的 i18n 架构：
- `src/i18n/config.ts` - 语言配置和 localStorage 存储
- `src/i18n/context.tsx` - I18nProvider 和 useI18n/useTranslations hooks
- `messages/zh.json` 和 `messages/en.json` - 翻译文件

但存在以下问题：
1. 大量组件直接使用硬编码中文，未调用 `t()` 函数
2. hooks 文件中的 toast 消息无法直接访问 React Context
3. 没有字体设置相关的状态管理和 UI

## Goals / Non-Goals

**Goals:**
- 实现所有 UI 文本的国际化（50+ 文件）
- 新增字体大小设置（小/中/大三档）
- 新增字体样式设置（预设字体列表）
- 设置持久化到 localStorage

**Non-Goals:**
- 不支持用户自定义字体（只提供预设列表）
- 不影响聊天内容和笔记编辑器的字体（用户内容区域）
- 不新增后端 API
- 不支持更多语言（仅中英文）

## Decisions

### D1: i18n 修复策略

**方案：统一使用 `useTranslations()` hook**

对于组件：
```tsx
// Before
<p>暂无对话，开始新的对话吧</p>

// After
const t = useTranslations()
<p>{t('chat.noConversations')}</p>
```

对于 hooks 中的 toast 消息，采用以下策略：
```tsx
// 方案：在调用 mutation 时传入翻译函数，或使用固定 key
// toast 组件本身支持 key，可以保持 toast.success('notes.saved') 形式
// 在 toast 显示时通过 i18n 转换
```

实际上，更简单的方案是让 hooks 返回翻译后的消息，或者使用 Sonner toast 的特性。

**最终方案**：创建一个全局翻译函数 `getT()` 可在组件外使用：
```ts
// src/i18n/index.ts
export function getT() {
  const locale = getSavedLocale()
  return (key: string) => {/* 直接查 messages */}
}
```

### D2: 字体设置状态管理

在 `ui-store.ts` 中新增：

```ts
interface UIState {
  // 现有状态
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  // 新增
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: string
  // Actions
  setFontSize: (size: FontSize) => void
  setFontFamily: (family: string) => void
}

type FontSize = 'small' | 'medium' | 'large'
```

持久化配置：
```ts
partialize: (state) => ({
  sidebarCollapsed: state.sidebarCollapsed,
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
})
```

### D3: 字体大小映射

| 档位 | 基础字体大小 | 用途 |
|------|-------------|------|
| small | 14px | 紧凑显示 |
| medium | 16px | 默认 |
| large | 18px | 大字体 |

通过 CSS 变量实现：
```css
:root {
  --font-size-base: 16px;
}

[data-font-size="small"] {
  --font-size-base: 14px;
}

[data-font-size="large"] {
  --font-size-base: 18px;
}

body {
  font-size: var(--font-size-base);
}
```

### D4: 预设字体列表

```ts
const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System Default' },
  { value: 'Inter, system-ui', label: 'Inter' },
  { value: 'Roboto, system-ui', label: 'Roboto' },
  { value: '"Noto Sans SC", system-ui', label: 'Noto Sans SC' },
  { value: '"PingFang SC", system-ui', label: 'PingFang SC' },
  { value: 'Georgia, serif', label: 'Georgia' },
] as const
```

通过 CSS 变量应用：
```css
:root {
  --font-family-base: system-ui, -apple-system, sans-serif;
}

[data-font-family="Inter, system-ui"] {
  --font-family-base: 'Inter', system-ui, sans-serif;
}

body {
  font-family: var(--font-family-base);
}
```

### D5: 设置页面 UI 结构

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│  Appearance                             │
│  ├─ Theme:      [Light] [Dark] [System] │
│  ├─ Language:   [简体中文 ▼]            │
│  ├─ Font Size:  [Small] [Medium] [Large]│
│  └─ Font Style: [System Default ▼]      │
└─────────────────────────────────────────┘
```

### D6: 翻译文件补充 Key

需要在 `messages/*.json` 中补充的 key：

```json
{
  "common": {
    "loading": "...",
    "error": "Error",
    "success": "Success"
  },
  "settings": {
    "fontSize": "Font Size",
    "fontSizeSmall": "Small",
    "fontSizeMedium": "Medium",
    "fontSizeLarge": "Large",
    "fontFamily": "Font Style",
    "fontSystem": "System Default"
  },
  "chat": {
    "noConversations": "No conversations yet. Start a new chat!",
    "newConversation": "New Conversation",
    "confirmDelete": "Confirm Delete",
    "confirmDeleteDesc": "Are you sure you want to delete this conversation? This action cannot be undone.",
    "renamed": "Conversation renamed"
  },
  // ... 更多
}
```

## Risks / Trade-offs

### R1: Hooks 中的 Toast 消息

**风险**：hooks 在组件外调用，无法直接使用 React Context

**缓解**：创建 `getT()` 函数直接读取 localStorage 和 messages 文件

### R2: 字体设置生效范围

**风险**：字体设置可能意外影响用户内容区域（笔记编辑器、聊天消息）

**缓解**：明确限定 CSS 变量作用域，使用 `[data-font-size]` 选择器而非全局覆盖

### R3: 翻译 Key 命名一致性

**风险**：不同开发者可能使用不同的 key 命名风格

**缓解**：遵循现有命名规范（模块.子项），在 tasks 中明确定义所有新增 key
