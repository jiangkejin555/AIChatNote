# 消息中心设计文档

## 1. 概述

### 1.1 背景

当前应用中，AI 操作结果（如保存笔记成功/失败）仅通过 toast 弹窗展示，用户无法回顾历史记录。需要增加一个持久化的消息中心功能，让用户可以查看系统消息、AI 任务结果和错误通知。

### 1.2 目标

- 提供持久化的消息存储，用户可随时查看历史消息
- 支持 AI 任务结果、系统公告、错误通知等多种消息类型
- 提供完整的消息管理能力（已读、删除、筛选、跳转）

### 1.3 非目标

- 实时推送（WebSocket/SSE）：当前采用页面加载时获取的方式，未来可扩展
- 用户间消息：当前版本不支持

---

## 2. 功能需求

### 2.1 消息类型

| 类型 | 标识 | 说明 | 示例 |
|------|------|------|------|
| 系统 | `system` | 系统公告、账户安全提醒 | 版本更新、维护公告 |
| AI 任务 | `ai_task` | AI 相关操作结果 | 笔记保存成功、AI 总结完成 |
| 错误 | `error` | 错误和异常通知 | API 调用失败、模型配置错误 |

### 2.2 交互功能

- **消息列表**：按时间倒序展示所有消息
- **类型筛选**：按消息类型筛选（全部 / 系统 / AI 任务 / 错误）
- **已读标记**：单条标记已读、全部标记已读
- **删除**：单条删除、全部清空
- **未读角标**：Header 铃铛显示未读数量
- **快速预览**：Popover 预览最近 5 条消息
- **跳转关联**：点击消息跳转到关联资源（如笔记详情）

### 2.3 入口位置

- **主入口**：Header 右侧铃铛图标
- **快速预览**：点击铃铛弹出 Popover
- **完整页面**：`/notifications` 独立消息中心页面

---

## 3. 数据模型

### 3.1 表结构

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_code VARCHAR(50) NOT NULL,   -- 关联消息模板
    type VARCHAR(20) NOT NULL,            -- 'system' | 'ai_task' | 'error'
    title VARCHAR(255) NOT NULL,          -- 消息标题
    content TEXT,                         -- 消息详情
    payload JSONB,                        -- 关联资源 { resource_type, resource_id }
    read_at TIMESTAMP,                    -- NULL = 未读
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

### 3.2 payload 结构

```typescript
interface NotificationPayload {
  resource_type: 'note' | 'model' | 'conversation' | 'announcement' | null
  resource_id?: string    // 资源 ID，用于跳转
  url?: string            // 自定义跳转链接
}
```

**示例：**

```json
// 笔记保存成功
{ "resource_type": "note", "resource_id": "uuid-xxx" }

// 系统公告
{ "resource_type": "announcement", "url": "/changelog" }

// API 错误（无关联资源）
{ "resource_type": null }
```

---

## 4. 消息模板

### 4.1 模板定义

后端通过代码常量定义消息模板，保证格式一致性和可维护性。

```go
// internal/notification/template.go

type MessageType string

const (
    MessageTypeSystem MessageType = "system"
    MessageTypeAITask MessageType = "ai_task"
    TypeError         MessageType = "error"
)

type Template struct {
    Code         string      // 模板标识
    Type         MessageType // 消息类型
    Title        string      // 标题模板
    Content      string      // 内容模板（支持 {{变量}}）
    ResourceType string      // 关联资源类型
}

var Templates = map[string]Template{
    // AI 任务
    "note_saved": {
        Code:         "note_saved",
        Type:         MessageTypeAITask,
        Title:        "笔记保存成功",
        Content:      "笔记「{{title}}」已成功保存到「{{folder}}」",
        ResourceType: "note",
    },
    "note_save_failed": {
        Code:         "note_save_failed",
        Type:         TypeError,
        Title:        "笔记保存失败",
        Content:      "笔记「{{title}}」保存失败：{{error}}",
        ResourceType: "note",
    },
    "ai_summary_done": {
        Code:         "ai_summary_done",
        Type:         MessageTypeAITask,
        Title:        "AI 总结完成",
        Content:      "对话「{{conversation}}」的 AI 总结已完成",
        ResourceType: "note",
    },
    "ai_summary_failed": {
        Code:         "ai_summary_failed",
        Type:         TypeError,
        Title:        "AI 总结失败",
        Content:      "对话「{{conversation}}」的 AI 总结失败：{{error}}",
        ResourceType: "conversation",
    },

    // 系统
    "system_announcement": {
        Code:         "system_announcement",
        Type:         MessageTypeSystem,
        Title:        "系统公告",
        Content:      "{{content}}",
        ResourceType: "announcement",
    },
    "account_security": {
        Code:         "account_security",
        Type:         MessageTypeSystem,
        Title:        "账户安全提醒",
        Content:      "{{content}}",
        ResourceType: "",
    },

    // 错误
    "api_error": {
        Code:         "api_error",
        Type:         TypeError,
        Title:        "API 调用错误",
        Content:      "{{api_name}} 调用失败：{{error}}",
        ResourceType: "",
    },
    "model_config_error": {
        Code:         "model_config_error",
        Type:         TypeError,
        Title:        "模型配置错误",
        Content:      "模型「{{model}}」配置有误：{{error}}",
        ResourceType: "model",
    },
}
```

### 4.2 模板渲染

```go
// Render 根据模板代码和变量渲染消息
func Render(code string, vars map[string]string) (title, content string) {
    t, ok := Templates[code]
    if !ok {
        return "未知消息", ""
    }
    title = os.Expand(t.Title, func(k string) string { return vars[k] })
    content = os.Expand(t.Content, func(k string) string { return vars[k] })
    return title, content
}
```

---

## 5. API 设计

### 5.1 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 获取消息列表 |
| GET | `/api/notifications/unread-count` | 获取未读数量 |
| PUT | `/api/notifications/:id/read` | 标记单条已读 |
| PUT | `/api/notifications/read-all` | 全部标记已读 |
| DELETE | `/api/notifications/:id` | 删除单条 |
| DELETE | `/api/notifications` | 清空全部 |

### 5.2 接口详情

#### GET `/api/notifications`

**Query 参数：**
- `type` - 消息类型筛选：`system` | `ai_task` | `error`
- `unread` - 仅未读：`true` | `false`
- `page` - 页码，默认 1
- `page_size` - 每页数量，默认 20

**响应：**
```json
{
  "data": [
    {
      "id": "uuid-xxx",
      "type": "ai_task",
      "template_code": "note_saved",
      "title": "笔记保存成功",
      "content": "笔记「Golang 入门」已成功保存到「编程」",
      "payload": {
        "resource_type": "note",
        "resource_id": "uuid-note"
      },
      "read_at": null,
      "created_at": "2026-03-28T10:00:00Z"
    }
  ],
  "total": 100,
  "unread_count": 5
}
```

#### GET `/api/notifications/unread-count`

**响应：**
```json
{
  "count": 5
}
```

#### PUT `/api/notifications/:id/read`

**响应：**
```json
{
  "success": true
}
```

#### PUT `/api/notifications/read-all`

**响应：**
```json
{
  "affected": 5
}
```

#### DELETE `/api/notifications/:id`

**响应：**
```json
{
  "success": true
}
```

#### DELETE `/api/notifications`

**Query 参数：**
- `type` - 可选，仅删除指定类型

**响应：**
```json
{
  "affected": 50
}
```

---

## 6. 前端设计

### 6.1 组件结构

```
frontend/src/
├── components/
│   └── notifications/
│       ├── index.ts                    # 导出
│       ├── notification-bell.tsx       # Header 铃铛图标 + 未读角标
│       ├── notification-popover.tsx    # Popover 快速预览
│       └── notification-item.tsx       # 单条消息组件
├── app/
│   └── (main)/
│       └── notifications/
│           └── page.tsx                # 消息中心页面
├── lib/api/
│   └── notifications.ts                # API 调用
├── hooks/
│   └── use-notifications.ts            # React Query hooks
└── types/
    └── notification.ts                 # 类型定义
```

### 6.2 类型定义

```typescript
// types/notification.ts

export type NotificationType = 'system' | 'ai_task' | 'error'

export interface NotificationPayload {
  resource_type: 'note' | 'model' | 'conversation' | 'announcement' | null
  resource_id?: string
  url?: string
}

export interface Notification {
  id: string
  type: NotificationType
  template_code: string
  title: string
  content: string | null
  payload: NotificationPayload | null
  read_at: string | null
  created_at: string
}
```

### 6.3 UI 交互

#### Header 铃铛

- 位置：Header 右侧，主题切换按钮左边
- 图标：Bell 图标
- 角标：未读数量 > 0 时显示红色角标（数字或圆点）
- 点击：弹出 NotificationPopover

#### NotificationPopover

- 显示最近 5 条消息
- 每条消息显示：图标（按类型）+ 标题 + 时间 + 已读状态
- 点击消息：标记已读 + 跳转关联资源
- 底部：「查看全部消息」按钮，跳转 `/notifications`

#### 消息中心页面

- 路由：`/notifications`
- 布局：
  - 顶部：标题 + 操作按钮（全部已读、清空全部）
  - 左侧/顶部：类型筛选 Tabs（全部 / 系统 / AI 任务 / 错误）
  - 主体：消息列表
- 消息项：
  - 左侧：类型图标 + 已读状态指示器
  - 中间：标题 + 内容摘要 + 时间
  - 右侧：删除按钮
  - 点击：标记已读 + 跳转关联资源

### 6.4 类型图标映射

| 类型 | 图标 | 颜色 |
|------|------|------|
| system | `Bell` | text-blue-500 |
| ai_task | `Sparkles` | text-green-500 |
| error | `AlertCircle` | text-red-500 |

---

## 7. 集成点

### 7.1 后端消息发送

在以下场景创建通知：

| 场景 | 模板代码 | 触发位置 |
|------|----------|----------|
| 笔记保存成功 | `note_saved` | `POST /api/notes` |
| 笔记保存失败 | `note_save_failed` | `POST /api/notes` |
| AI 总结完成 | `ai_summary_done` | `POST /api/notes/generate-summary` |
| AI 总结失败 | `ai_summary_failed` | `POST /api/notes/generate-summary` |
| API 调用错误 | `api_error` | 全局错误处理中间件 |
| 模型配置错误 | `model_config_error` | 模型验证逻辑 |

### 7.2 前端消息触发

除了后端自动创建，前端也可通过 API 触发消息（如未来需要）：

```typescript
// 通用消息创建函数
async function createNotification(params: {
  userId: string
  templateCode: string
  variables: Record<string, string>
  payload?: NotificationPayload
}) {
  // POST /api/notifications (internal)
}
```

---

## 8. 国际化支持

消息标题和内容支持 i18n，通过模板系统实现：

```go
// 国际化模板
var Templates = map[string]map[string]Template{
    "note_saved": {
        "zh": { Title: "笔记保存成功", Content: "笔记「{{title}}」已成功保存到「{{folder}}」" },
        "en": { Title: "Note Saved", Content: "Note \"{{title}}\" has been saved to \"{{folder}}\"" },
    },
    // ...
}
```

根据用户语言设置选择对应模板渲染。

---

## 9. 开发计划

### Phase 1: 基础设施
- [ ] 数据库表创建
- [ ] 消息模板定义
- [ ] 后端 API 实现

### Phase 2: 前端集成
- [ ] API 调用层
- [ ] Header 铃铛组件
- [ ] NotificationPopover
- [ ] 消息中心页面

### Phase 3: 消息触发
- [ ] 笔记保存成功/失败
- [ ] AI 总结完成/失败
- [ ] 错误处理集成

---

## 10. 未来扩展

- **实时推送**：引入 WebSocket/SSE，消息实时送达
- **消息分组**：按日期或会话分组展示
- **消息优先级**：重要消息置顶或高亮
- **用户间消息**：支持用户间私信功能
