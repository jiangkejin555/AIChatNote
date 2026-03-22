# AI Chat Notes - 产品设计文档

## 1. 项目概述

### 1.1 背景

当前使用 AI 时面临两个核心问题：

1. **多模型散乱** - 大模型种类繁多，各有优势，需要不停切换不同应用，上下文无法复用
2. **知识流失** - 每次沟通完就不会再看，再次遇到同样问题需要重新沟通

### 1.2 解决方案

构建一个简洁的 Web 应用，实现：

- **统一入口**：一个应用聚合多个 LLM，用户可自由配置 API
- **知识沉淀**：聊天可转化为结构化笔记，支持标签分类和检索
- **数据归属**：支持 Markdown 导出，用户拥有数据控制权

### 1.3 核心价值

> **聊天即生产，对话即沉淀**

### 1.4 产品定位

- **垂直**：专注 AI 聊天和笔记记录，不做大而全的平台
- **简洁**：界面清爽，功能聚焦，学习成本低
- **智能**：AI 自动总结、格式化、标签建议

---

## 2. 功能设计

### 2.1 用户系统

| 功能 | 说明 |
|------|------|
| 注册 | 邮箱 + 密码注册 |
| 登录 | 邮箱 + 密码登录 |
| 登出 | 退出当前会话 |
| 修改密码 | 更新账户密码 |

### 2.2 模型管理

| 功能 | 说明 |
|------|------|
| 添加模型 | 配置模型名称、API 地址、API Key、实际模型名 |
| 编辑模型 | 修改已有模型配置 |
| 删除模型 | 删除模型配置 |
| 设置默认 | 设置默认使用的模型 |

**说明**：支持所有 OpenAI 兼容 API 格式的模型（Claude、GPT、DeepSeek、Gemini、本地模型等）

### 2.3 聊天功能

| 功能 | 说明 |
|------|------|
| 新建对话 | 创建新的聊天会话 |
| 选择模型 | 选择使用哪个已配置的模型 |
| 多轮对话 | 保持上下文连续对话 |
| 流式输出 | 实时显示 AI 回复 |
| 对话列表 | 查看历史对话 |
| 对话重命名 | 修改对话标题 |
| 删除对话 | 删除不需要的对话 |
| 消息复制 | 复制单条消息内容 |
| 重新生成 | 重新生成 AI 回复 |

### 2.4 笔记功能

| 功能 | 说明 |
|------|------|
| 保存为笔记 | 将对话转化为笔记 |
| AI 生成标题 | 自动生成笔记标题 |
| AI 生成总结 | DeepSeek 自动总结对话内容（Markdown 格式）|
| AI 建议标签 | 自动生成标签建议 |
| 编辑笔记 | 修改标题、内容、标签 |
| 文件夹归类 | 选择保存到哪个文件夹 |

### 2.5 知识库

| 功能 | 说明 |
|------|------|
| 笔记列表 | 查看所有已保存笔记 |
| 文件夹管理 | 创建、重命名、删除文件夹 |
| 按文件夹筛选 | 查看特定文件夹下的笔记 |
| 按标签筛选 | 查看特定标签的笔记 |
| 关键词搜索 | 全文搜索笔记内容 |
| 查看详情 | 查看笔记完整内容 |
| 删除笔记 | 删除不需要的笔记 |
| 移动笔记 | 移动到其他文件夹 |
| 导出笔记 | 导出单篇或批量导出 Markdown |

### 2.6 用户体验

| 功能 | 说明 |
|------|------|
| 深色模式 | 支持亮色/暗色主题切换 |
| 响应式布局 | 适配桌面和移动端 |
| 加载状态 | 清晰的加载和错误提示 |

---

## 3. 用户流程

### 3.1 首次使用

```
注册 → 登录 → 配置模型（添加 API Key）→ 开始使用
```

### 3.2 日常使用 - 需要沉淀的场景

```
新建对话 → 选择模型（如 Claude）→ 多轮对话 → 理解原理 →
点击"保存为笔记" → AI 生成标题/总结/标签 → 用户确认/编辑 →
选择文件夹 → 保存成功
```

### 3.3 日常使用 - 即用即弃的场景

```
新建对话 → 选择模型（如 DeepSeek）→ 一问一答 → 关闭对话
```

### 3.4 查找知识

```
进入知识库 → 搜索/筛选 → 查看笔记 → 导出（可选）
```

---

## 4. 技术架构

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端                                   │
│                    Next.js + TypeScript                         │
│                    shadcn/ui + Tailwind CSS                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          后端 API                                │
│                         Go + Gin                                │
│                    RESTful API + JWT                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   LLM APIs      │  │   DeepSeek      │
│   (Supabase)    │  │   (用户配置)     │  │   (笔记总结)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 4.2 技术栈

#### 前端

| 技术 | 说明 |
|------|------|
| Next.js 14+ | React 框架，App Router |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式框架 |
| shadcn/ui | UI 组件库 |
| Zustand | 状态管理 |
| React Query | 数据请求 |
| react-markdown | Markdown 渲染 |
| remark-gfm | GitHub 风格 Markdown |
| Lucide React | 图标库 |

#### 后端

| 技术 | 说明 |
|------|------|
| Go 1.21+ | 编程语言 |
| Gin | Web 框架 |
| GORM | ORM |
| go-openai | LLM API 调用 |
| jwt-go | JWT 认证 |
| testify | 测试框架 |

#### 数据库

| 技术 | 说明 |
|------|------|
| PostgreSQL 15+ | 主数据库 |
| Docker | 本地开发环境 |
| Supabase | 生产环境（初期）|
| 阿里云 RDS | 生产环境（后期）|

#### 部署

| 服务 | 说明 |
|------|------|
| Vercel | 前端部署 |
| Railway / 云服务器 | 后端部署 |
| Supabase | 数据库托管 |

---

## 5. 数据模型

### 5.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   models    │       │conversations│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │───┐   │ id          │   ┌───│ id          │
│ email       │   │   │ user_id     │───┘   │ user_id     │
│ password    │   │   │ name        │       │ model_id    │
│ created_at  │   │   │ api_base    │       │ title       │
│ updated_at  │   │   │ api_key     │       │ is_saved    │
└─────────────┘   │   │ model_name  │       │ created_at  │
                  │   │ is_default  │       │ updated_at  │
                  │   │ created_at  │       └──────┬──────┘
                  │   └─────────────┘              │
                  │                                │
                  │   ┌─────────────┐              │
                  │   │  messages   │              │
                  │   ├─────────────┤              │
                  │   │ id          │              │
                  └───│ conv_id     │◄─────────────┘
                      │ role        │
                      │ content     │
                      │ created_at  │
                      └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  folders    │       │   notes     │       │    tags     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ user_id     │───────│ user_id     │───────│ note_id     │
│ name        │       │ conv_id     │       │ name        │
│ parent_id   │       │ folder_id   │       └─────────────┘
│ created_at  │       │ title       │
└─────────────┘       │ content     │
                      │ created_at  │
                      │ updated_at  │
                      └─────────────┘
```

### 5.2 表结构定义

#### users 表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### models 表

```sql
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- 显示名称
    api_base VARCHAR(500) NOT NULL,       -- API 地址
    api_key VARCHAR(500) NOT NULL,        -- API Key (加密存储)
    model_name VARCHAR(100) NOT NULL,     -- 实际调用的模型名
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### conversations 表

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES models(id) ON DELETE SET NULL,
    title VARCHAR(255),                   -- 对话标题
    is_saved BOOLEAN DEFAULT FALSE,       -- 是否已转为笔记
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### messages 表

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,            -- user / assistant
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

#### folders 表

```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### notes 表

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,                -- Markdown 格式
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
```

#### tags 表

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    UNIQUE(note_id, name)
);

CREATE INDEX idx_tags_note_id ON tags(note_id);
CREATE INDEX idx_tags_name ON tags(name);
```

### 5.3 全文搜索

使用 PostgreSQL 内置全文搜索：

```sql
-- 创建全文搜索索引
ALTER TABLE notes ADD COLUMN search_vector tsvector;

CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);

-- 更新搜索向量的触发器
CREATE OR REPLACE FUNCTION update_notes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_update
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_notes_search_vector();
```

---

## 6. API 设计

### 6.1 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| PUT | /api/auth/password | 修改密码 |

### 6.2 模型管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/models | 获取模型列表 |
| POST | /api/models | 添加模型 |
| PUT | /api/models/:id | 更新模型 |
| DELETE | /api/models/:id | 删除模型 |
| PUT | /api/models/:id/default | 设置默认模型 |

### 6.3 对话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/conversations | 获取对话列表 |
| POST | /api/conversations | 创建对话 |
| GET | /api/conversations/:id | 获取对话详情（含消息）|
| PUT | /api/conversations/:id | 更新对话（重命名）|
| DELETE | /api/conversations/:id | 删除对话 |
| POST | /api/conversations/:id/messages | 发送消息（流式返回）|

### 6.4 笔记管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/notes | 从对话创建笔记 |
| GET | /api/notes | 获取笔记列表 |
| GET | /api/notes/:id | 获取笔记详情 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| PUT | /api/notes/:id/move | 移动笔记到其他文件夹 |
| POST | /api/notes/generate-summary | 生成笔记总结（预览）|

### 6.5 文件夹管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/folders | 获取文件夹树 |
| POST | /api/folders | 创建文件夹 |
| PUT | /api/folders/:id | 更新文件夹 |
| DELETE | /api/folders/:id | 删除文件夹 |

### 6.6 搜索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search?q=keyword | 搜索笔记 |
| GET | /api/notes?tag=xxx | 按标签筛选 |
| GET | /api/notes?folder_id=xxx | 按文件夹筛选 |

### 6.7 导出

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes/:id/export | 导出单篇笔记 |
| POST | /api/notes/export | 批量导出笔记 |

---

## 7. LLM 集成

### 7.1 用户配置模型调用

用户聊天时，使用用户配置的模型：

```go
// 请求结构
type ChatRequest struct {
    ConversationID string `json:"conversation_id"`
    ModelID        string `json:"model_id"`
    Message        string `json:"message"`
    Stream         bool   `json:"stream"`  // 是否流式返回
}

// 调用 OpenAI 兼容 API
func CallLLM(apiBase, apiKey, modelName string, messages []Message, stream bool) {
    // 使用 go-openai 库
    config := openai.DefaultConfig(apiKey)
    config.BaseURL = apiBase

    client := openai.NewClientWithConfig(config)

    // 流式调用
    if stream {
        stream, _ := client.CreateChatCompletionStream(ctx, request)
        for response := range stream {
            // 通过 SSE 返回给前端
        }
    }
}
```

### 7.2 笔记总结模型

笔记总结固定使用 DeepSeek：

```go
const (
    SummaryAPIBase = "https://api.deepseek.com"
    SummaryModel   = "deepseek-chat"
)

// 总结提示词
const SummaryPrompt = `请将以下对话总结为一篇结构化的笔记，要求：
1. 生成一个简洁的标题
2. 提取核心知识点，使用 Markdown 格式
3. 建议合适的标签（格式：#标签1 #标签2）

对话内容：
%s

请按以下格式输出：
---
title: 标题
tags: #标签1 #标签2 #标签3
---
正文内容（Markdown格式）
`
```

---

## 8. 前端页面设计

### 8.1 页面结构

```
├── /login              # 登录页
├── /register           # 注册页
├── /                   # 首页（对话列表）
│   ├── 侧边栏
│   │   ├── 模型选择
│   │   ├── 对话列表
│   │   └── 知识库入口
│   └── 聊天区域
│       ├── 消息列表
│       └── 输入框
├── /settings           # 设置页
│   └── /settings/models    # 模型管理
└── /notes              # 知识库页
    ├── 侧边栏
    │   ├── 文件夹树
    │   └── 标签云
    └── 内容区
        ├── 笔记列表
        └── 笔记详情
```

### 8.2 核心交互

#### 聊天页面

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌────────────────────────────────────────────┐  │
│  │ 模型选择 ▼│  │  对话标题                          ⚙️ 删除  │  │
│  ├──────────┤  ├────────────────────────────────────────────┤  │
│  │          │  │                                            │  │
│  │ 对话列表 │  │  用户: golang proto 怎么用？               │  │
│  │          │  │                                            │  │
│  │ • 对话1  │  │  AI: Protocol Buffers 是一种...           │  │
│  │ • 对话2  │  │                                            │  │
│  │ • 对话3  │  │  用户: 能举个例子吗？                       │  │
│  │          │  │                                            │  │
│  │          │  │  AI: 当然，这是一个示例...                 │  │
│  │          │  │                                            │  │
│  │          │  ├────────────────────────────────────────────┤  │
│  │          │  │  💾 保存为笔记                              │  │
│  │──────────│  ├────────────────────────────────────────────┤  │
│  │ 📚 知识库│  │  输入消息...                          发送  │  │
│  └──────────┘  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 保存笔记弹窗

```
┌─────────────────────────────────────────────┐
│  保存为笔记                            ✕   │
├─────────────────────────────────────────────┤
│                                             │
│  标题                                        │
│  ┌─────────────────────────────────────┐   │
│  │ golang protobuf 使用方法            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  内容预览                                    │
│  ┌─────────────────────────────────────┐   │
│  │ ## 概述                              │   │
│  │ Protocol Buffers 是 Google 开发...   │   │
│  │                                     │   │
│  │ ## 核心概念                          │   │
│  │ - .proto 文件定义结构                │   │
│  │ - protoc 编译生成代码                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  标签                                        │
│  ┌─────────────────────────────────────┐   │
│  │ #编程 #golang #protobuf +           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  保存到文件夹                                │
│  ┌─────────────────────────────────────┐   │
│  │ 📁 编程                      ▼      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│         取消              保存笔记          │
└─────────────────────────────────────────────┘
```

#### 知识库页面

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 知识库                              🔍 搜索笔记...         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────────────────────────────┐  │
│  │ 文件夹        │  │  笔记列表                              │  │
│  │              │  │                                        │  │
│  │ 📁 全部笔记  │  │  ┌──────────────────────────────────┐ │  │
│  │ 📁 编程      │  │  │ golang protobuf 使用方法          │ │  │
│  │   📁 Go      │  │  │ #编程 #golang #protobuf           │ │  │
│  │   📁 React   │  │  │ 2024-03-20                        │ │  │
│  │ 📁 生活      │  │  └──────────────────────────────────┘ │  │
│  │ 📁 设计      │  │  ┌──────────────────────────────────┐ │  │
│  │              │  │  │ React Hooks 最佳实践              │ │  │
│  │ 标签         │  │  │ #编程 #react #hooks               │ │  │
│  │              │  │  │ 2024-03-18                        │ │  │
│  │ #编程 (12)   │  │  └──────────────────────────────────┘ │  │
│  │ #golang (5)  │  │                                        │  │
│  │ #react (4)   │  │                                        │  │
│  │ #设计 (3)    │  │                                        │  │
│  └──────────────┘  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. 部署方案

### 9.1 开发环境

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_chat_notes
      POSTGRES_PASSWORD: dev123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 9.2 生产环境

#### 阶段一（初期）

| 组件 | 服务 | 配置 | 预估成本 |
|------|------|------|----------|
| 前端 | Vercel | Free | $0/月 |
| 后端 | Railway | $5 档 | $5/月 |
| 数据库 | Supabase | Free | $0/月 |
| **合计** | | | **$5/月** |

#### 阶段二（规模化）

| 组件 | 服务 | 配置 | 预估成本 |
|------|------|------|----------|
| 前端 | Vercel | Pro | $20/月 |
| 后端 | 云服务器 | 2C4G | $30/月 |
| 数据库 | 阿里云 RDS | 基础版 | $20/月 |
| **合计** | | | **$70/月** |

### 9.3 环境变量

```bash
# 后端环境变量
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-jwt-secret
DEEPSEEK_API_KEY=your-deepseek-key

# 前端环境变量
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 10. 数据安全

### 10.1 敏感数据处理

| 数据 | 处理方式 |
|------|----------|
| 用户密码 | bcrypt 加密存储 |
| API Key | AES 加密存储 |
| JWT Token | 短期有效 + Refresh Token |

### 10.2 API 安全

- 所有 API 需要认证（除登录注册）
- Rate Limiting 防止滥用
- CORS 限制允许的域名

### 10.3 数据备份

- Supabase 自动每日备份
- 定期导出用户数据（用户可触发）

---

## 11. 开发计划

### 11.1 阶段划分

#### Phase 1: 基础架构（1 周）

- [ ] 项目初始化（前端 + 后端）
- [ ] 数据库设计与迁移
- [ ] 用户认证系统
- [ ] 基础 API 框架

#### Phase 2: 核心功能（3 周）

- [ ] 模型管理 CRUD
- [ ] 对话功能（创建、列表、详情）
- [ ] 消息发送与流式返回
- [ ] LLM API 集成

#### Phase 3: 笔记功能（2 周）

- [ ] 笔记创建流程
- [ ] AI 总结功能
- [ ] 文件夹管理
- [ ] 标签管理

#### Phase 4: 知识库（1 周）

- [ ] 笔记列表与筛选
- [ ] 全文搜索
- [ ] 导出功能

#### Phase 5: 优化与发布（1 周）

- [ ] UI/UX 优化
- [ ] 深色模式
- [ ] 性能优化
- [ ] 部署上线

### 11.2 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1 | 第 1 周末 | 基础架构可运行 |
| M2 | 第 4 周末 | 聊天功能完成 |
| M3 | 第 6 周末 | 笔记功能完成 |
| M4 | 第 7 周末 | 知识库完成 |
| M5 | 第 8 周末 | 发布上线 |

---

## 12. 附录

### 12.1 参考产品

- **Cherry Studio** - 多模型聚合桌面应用
- **Obsidian** - 知识管理工具
- **ChatGPT** - 对话 UI 参考
- **Notion** - 笔记组织方式参考

### 12.2 技术文档链接

- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Gin 文档](https://gin-gonic.com/docs)
- [GORM 文档](https://gorm.io/docs)
- [go-openai 文档](https://github.com/sashabaranov/go-openai)

### 12.3 术语表

| 术语 | 说明 |
|------|------|
| LLM | Large Language Model，大语言模型 |
| SSE | Server-Sent Events，服务器推送事件 |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| MVP | Minimum Viable Product，最小可行产品 |
