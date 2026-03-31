# AI Chat Note - 产品设计文档 v2

> 基于已完成代码的实际实现状态编写，反映真实产品功能。

---

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
| 邮箱注册 | 邮箱 + 密码 + 验证码注册 |
| 邮箱登录 | 邮箱 + 密码登录 |
| 验证码登录 | 邮箱 + 验证码免密登录（未注册自动注册） |
| OAuth 登录 | Google / GitHub 第三方登录 |
| OAuth 绑定 | 已有账户绑定/解绑第三方账号（安全检查防止删除最后一种登录方式） |
| 修改密码 | 邮箱验证码 + 新密码 |
| 删除账户 | 邮箱验证码确认，级联删除所有用户数据 |
| Token 刷新 | JWT + Refresh Token 双 Token 机制，支持无感刷新 |

### 2.2 模型管理

| 功能 | 说明 |
|------|------|
| 添加 Provider | 配置服务商类型、名称、API 地址、API Key（AES 加密存储） |
| 编辑 Provider | 修改已有服务商配置 |
| 删除 Provider | 删除服务商及其下所有模型 |
| 预置服务商 | 8 种预置类型：OpenAI、火山引擎、DeepSeek、Anthropic、Google、Moonshot、智谱、自定义 |
| 动态获取模型 | 从 Provider API 自动拉取可用模型列表 |
| 预定义模型 | 对不支持动态获取的 Provider 提供预定义模型列表 |
| 批量添加模型 | 一次性添加多个模型到 Provider |
| 模型同步 | 一键同步（添加/删除/启用/禁用/设置默认） |
| 连接测试 | 发送测试请求验证 Provider 连通性和延迟 |
| 启用/禁用模型 | 控制模型是否在聊天中可选 |

### 2.3 聊天功能

| 功能 | 说明 |
|------|------|
| 新建对话 | 创建新的聊天会话 |
| 选择模型 | 按 Provider 分组选择可用模型 |
| 切换模型 | 对话中途切换模型（确认弹窗） |
| 多轮对话 | 保持上下文连续对话 |
| 流式输出 | SSE 实时显示 AI 回复，支持手动停止 |
| 思考状态 | 显示 AI 正在思考、超时、已取消等状态 |
| 对话列表 | 查看历史对话，支持搜索（标题 + 消息内容） |
| 对话重命名 | 手动或 AI 自动生成对话标题 |
| 删除对话 | 删除不需要的对话 |
| 消息复制 | 复制单条消息内容 |
| 重新生成 | 重新生成 AI 回复（流式） |
| 消息去重 | 基于 request_id 的幂等性保证，防止重复发送 |
| 消息取消 | 用户停止流式输出时，部分回复标记为已取消并保存 |
| 草稿保存 | 未发送的消息内容自动保存 |
| 输入历史 | 每个对话保存最近 100 条输入历史 |

### 2.4 笔记功能

| 功能 | 说明 |
|------|------|
| AI 生成笔记 | 从对话一键生成结构化笔记（标题 + Markdown 正文 + 标签） |
| 异步生成 | 后台异步生成，前端轮询进度，支持崩溃恢复 |
| 手动创建笔记 | 直接创建空白笔记 |
| 编辑笔记 | Markdown 编辑器，支持工具栏 |
| 查看笔记 | 只读模式，带目录（TOC）导航 |
| 文件夹归类 | 选择保存到哪个文件夹 |
| 标签管理 | 添加/移除标签 |
| 移动笔记 | 移动到其他文件夹（支持批量） |
| 复制笔记 | 复制笔记及其标签 |
| 删除笔记 | 单条或批量删除 |
| 导入笔记 | 导入 Markdown 文件（自动解析 H1 为标题） |
| 导出笔记 | 单篇导出为 .md，批量导出为 .zip |
| 同步到 Notion | 将笔记同步到 Notion 工作区 |

### 2.5 知识库

| 功能 | 说明 |
|------|------|
| 笔记列表 | 查看所有已保存笔记 |
| 文件夹管理 | 创建、重命名、删除、复制文件夹（支持嵌套） |
| 按文件夹筛选 | 查看特定文件夹下的笔记 |
| 按标签筛选 | 通过下拉菜单按标签筛选 |
| 关键词搜索 | 全文搜索笔记标题和内容 |
| 目录导航 | 笔记详情页的 TOC 侧边栏 |
| 折叠侧边栏 | 知识库三栏布局可折叠 |

### 2.6 通知系统

| 功能 | 说明 |
|------|------|
| 通知列表 | 按类型筛选（系统/AI 任务/错误） |
| 未读计数 | 导航栏铃铛图标显示未读数 |
| 标记已读 | 单条或全部标记已读 |
| 清空通知 | 按类型或全部清空 |
| 通知模板 | 预置模板：欢迎、AI 总结完成/失败、系统公告、账户安全、API 错误 |

### 2.7 用户设置

| 功能 | 说明 |
|------|------|
| 主题切换 | 亮色 / 暗色 / 跟随系统 |
| 语言切换 | 中文 / English（浏览器自动检测） |
| 字体大小 | 小(14px) / 中(16px) / 大(18px) |
| 字体选择 | 9 种字体：系统默认、Georgia、Lora、Playfair Display、Crimson Text、Source Serif 4、Noto Serif SC、Long Cang、马善政 |
| 上下文模式 | 总结模式（AI 压缩历史） / 简单模式（直接截取最近 N 条） |
| 记忆级别 | 短(5 条) / 普通(10 条) / 长(20 条)，控制发送给 AI 的上下文深度 |
| Notion 集成 | OAuth 连接/断开 Notion，笔记可同步到 Notion |

### 2.8 反馈与帮助

| 功能 | 说明 |
|------|------|
| 满意度评分 | 1-5 星评分 + 文字评价 |
| 提交反馈 | Bug / 功能建议 / 其他，支持管理员回复 |
| 功能投票 | 查看功能请求列表，投票/取消投票 |
| 版本记录 | 查看版本更新日志 |
| 帮助中心 | 功能介绍、快速上手、FAQ |
| 关于页面 | 品牌介绍、联系方式、法律链接 |

---

## 3. 用户流程

### 3.1 首次使用

```
注册（邮箱/OAuth）→ 登录 → 添加 Provider → 配置模型 → 开始使用
```

### 3.2 日常使用 - 需要沉淀的场景

```
新建对话 → 选择模型 → 多轮对话 → 点击"保存为笔记" →
后台异步生成笔记 → AI 生成标题/内容/标签 → 用户确认/编辑 →
选择文件夹 → 保存成功（可选同步到 Notion）
```

### 3.3 日常使用 - 即用即弃的场景

```
新建对话 → 选择模型 → 一问一答 → 关闭对话
```

### 3.4 查找知识

```
进入知识库 → 搜索/按文件夹/按标签筛选 → 查看笔记 → 导出（可选）
```

---

## 4. 技术架构

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端                                   │
│                    Next.js 16 + React 19                        │
│                    shadcn/ui + Tailwind CSS                     │
│                    Zustand + TanStack Query                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │  Next.js API Route       │
                    │  /api/chat/stream (SSE)  │
                    └────────────┬────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                          后端 API                                │
│                         Go + Gin                                │
│                    RESTful API + JWT                            │
│                    GORM + PostgreSQL                            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   LLM APIs      │  │   Notion API    │
│                 │  │   (用户配置)     │  │   (集成同步)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 4.2 技术栈

#### 前端

| 技术 | 说明 |
|------|------|
| Next.js 16 | React 框架，App Router，React 19 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式框架 |
| shadcn/ui | UI 组件库（base-nova 风格） |
| Zustand | 客户端状态管理（持久化到 localStorage） |
| TanStack React Query | 服务端状态管理，数据请求与缓存 |
| react-markdown + remark-gfm | Markdown 渲染 |
| react-hook-form | 表单管理 |
| Axios | HTTP 客户端，JWT 拦截器 |
| next-themes | 主题切换 |
| Lucide React | 图标库 |
| Sonner | Toast 通知 |

#### 后端

| 技术 | 说明 |
|------|------|
| Go 1.21+ | 编程语言 |
| Gin | Web 框架 |
| GORM | ORM |
| go-openai | LLM API 调用（OpenAI 兼容） |
| jwt-go | JWT 认证（双 Token） |
| bcrypt | 密码加密 |
| AES-256 | API Key 加密 |
| goldmark | Markdown 解析（转 Notion Blocks） |
| testify | 测试框架 |
| SQLite | 测试隔离 |

#### 数据库

| 技术 | 说明 |
|------|------|
| PostgreSQL 15+ | 主数据库 |
| Docker Compose | 本地开发环境 |

#### 部署

| 服务 | 说明 |
|------|------|
| Vercel | 前端部署 |
| 云服务器 | 后端部署 |
| PostgreSQL | 数据库托管 |

---

## 5. 数据模型

### 5.1 ER 图

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    users     │    │  providers   │    │provider_models│
├──────────────┤    ├──────────────┤    ├──────────────┤
│ id (uint)    │──┐ │ id (uuid)    │──┐ │ id (uuid)    │
│ email        │  │ │ user_id      │  │ │ provider_id  │
│ password_hash│  │ │ name         │  │ │ model_id     │
│ nickname     │  │ │ type         │  │ │ display_name │
│ avatar_url   │  │ │ api_base     │  │ │ is_default   │
│ email_verified│  │ │ api_key(AES) │  │ │ enabled      │
└──────────────┘  │ └──────────────┘  │ └──────┬───────┘
                  │                    │        │
                  │   ┌──────────────┐  │        │
                  │   │conversations │◄─┼────────┘
                  │   ├──────────────┤  │
                  │   │ id (uint)    │  │
                  │   │ user_id      │──┤
                  │   │ current_     │  │   ┌──────────────┐
                  │   │ provider_    │  │   │  messages    │
                  │   │ model_id     │  │   ├──────────────┤
                  │   │ title        │  ├──→│ id (uint)    │
                  │   │ is_saved     │  │   │ conv_id      │
                  │   └──────────────┘  │   │ role         │
                  │                     │   │ content      │
                  │   ┌──────────────┐  │   │ provider_    │
                  │   │conversation_ │  │   │ model_id     │
                  │   │ summaries    │  │   │ canceled     │
                  │   ├──────────────┤  │   └──────────────┘
                  │   │ id           │  │
                  │   │ conv_id      │  │   ┌──────────────┐
                  │   │ summary      │  │   │message_reqs  │
                  │   │ end_msg_id   │  │   ├──────────────┤
                  │   └──────────────┘  │   │ id           │
                  │                     │   │ conv_id      │
                  │   ┌──────────────┐  │   │ request_id   │
                  │   │   folders    │  │   │ status       │
                  │   ├──────────────┤  │   └──────────────┘
                  ├──→│ id           │  │
                  │   │ user_id      │  │
                  │   │ name         │  │
                  │   │ parent_id    │──┘ (自引用)
                  │   └──────────────┘
                  │
                  │   ┌──────────────┐    ┌──────────────┐
                  ├──→│    notes     │───→│  note_tags   │
                  │   ├──────────────┤    ├──────────────┤
                  │   │ id           │    │ note_id (PK) │
                  │   │ user_id      │    │ tag (PK)     │
                  │   │ folder_id    │──┘ └──────────────┘
                  │   │ source_conv  │
                  │   │ title        │    ┌──────────────┐
                  │   │ content      │    │note_gen_tasks│
                  │   │ notion_page  │    ├──────────────┤
                  │   │ notion_sync  │    │ id           │
                  │   └──────────────┘    │ user_id      │
                  │                       │ conv_id      │
                  │   ┌──────────────┐    │ status       │
                  ├──→│user_settings │    │ note_id      │
                  │   ├──────────────┤    └──────────────┘
                  │   │ id           │
                  │   │ user_id      │    ┌──────────────┐
                  │   │ context_mode │    │oauth_accounts│
                  │   │ memory_level │    ├──────────────┤
                  │   └──────────────┘    │ id           │
                  │                       │ user_id      │
                  │   ┌──────────────┐    │ provider     │
                  ├──→│notifications │    │ provider_uid │
                  │   ├──────────────┤    │ access_token │
                  │   │ id           │    │ refresh_token│
                  │   │ user_id      │    └──────────────┘
                  │   │ type         │
                  │   │ title        │    ┌──────────────┐
                  │   │ content      │    │  integrations│
                  │   │ payload      │    ├──────────────┤
                  │   │ read_at      │    │ id (uuid)    │
                  │   └──────────────┘    │ user_id      │
                  │                       │ provider     │
                  │   ┌──────────────┐    │ access_token │
                  ├──→│  feedbacks   │    │ notion_*     │
                  │   ├──────────────┤    └──────────────┘
                  │   │ id           │
                  │   │ user_id      │    ┌──────────────┐
                  │   │ type         │    │   versions   │
                  │   │ title        │    ├──────────────┤
                  │   │ description  │    │ id           │
                  │   │ status       │    │ version      │
                  │   │ admin_reply  │    │ release_date │
                  │   └──────────────┘    │ changes      │
                  │                       └──────────────┘
                  │   ┌──────────────┐
                  ├──→│feature_reqs  │
                  │   ├──────────────┤    ┌──────────────┐
                  │   │ id           │    │refresh_tokens│
                  │   │ title        │    ├──────────────┤
                  │   │ description  │    │ id           │
                  │   │ status       │    │ user_id      │
                  │   └──────────────┘    │ token_hash   │
                  │                       │ expires_at   │
                  │   ┌──────────────┐    └──────────────┘
                  └──→│satisfaction  │
                      ├──────────────┐
                      │ id           │    ┌──────────────┐
                      │ user_id      │    │ feature_votes│
                      │ rating (1-5) │    ├──────────────┤
                      │ comment      │    │ id           │
                      └──────────────┘    │ user_id      │
                                          │ feature_id   │
                                          └──────────────┘
```

### 5.2 全部数据表（20 张）

| 表名 | 说明 |
|------|------|
| users | 用户（邮箱、密码、昵称、头像、邮箱验证状态） |
| providers | AI 服务商（类型、API 地址、加密 API Key） |
| provider_models | 服务商下的模型配置（模型 ID、显示名、默认、启用） |
| conversations | 对话（当前模型、标题、是否已保存为笔记） |
| messages | 消息（角色、内容、所用模型、是否取消） |
| message_requests | 消息请求去重（request_id UUID、状态追踪） |
| conversation_summaries | 对话摘要（AI 压缩的上下文摘要） |
| folders | 文件夹（自引用 parent_id，支持嵌套） |
| notes | 笔记（标题、Markdown 内容、Notion 同步状态） |
| note_tags | 笔记标签（复合主键 note_id + tag） |
| note_generation_tasks | 笔记异步生成任务（状态追踪） |
| oauth_accounts | OAuth 第三方账号（Google/GitHub） |
| refresh_tokens | 刷新令牌（哈希存储） |
| user_settings | 用户设置（上下文模式、记忆级别） |
| notifications | 通知（模板、类型、载荷、已读状态） |
| feedbacks | 用户反馈（Bug/功能/其他，管理员回复） |
| feature_requests | 功能请求（投票数、状态） |
| feature_votes | 功能投票（用户+功能唯一约束） |
| satisfaction_ratings | 满意度评分（1-5 星） |
| versions | 版本记录（版本号、发布日期、变更列表 JSON） |
| user_integrations | 第三方集成（Notion OAuth 令牌、工作区信息） |

### 5.3 数据库迁移

| 迁移 | 说明 |
|------|------|
| 001_init | 核心表创建（users, providers, provider_models, conversations, messages, folders, notes, note_tags）+ 全文搜索 tsvector + 触发器 |
| 002 | conversations 表 user_id 复合索引 |
| 003 | conversations 增加 model_id 快照字段 |
| 004 | message_requests 表（消息去重） |
| 005 | 对话模型切换支持（字段重命名 + messages 增加模型字段） |
| 006 | 反馈系统表（satisfaction_ratings, feedbacks, feature_requests, feature_votes, versions） |
| 007 | conversation_summaries 表（对话摘要） |
| 008 | user_settings 表（上下文模式、记忆级别） |
| 009 | 对话搜索（ILIKE 方案，支持中文） |
| 009_oauth | OAuth 支持（users 增加字段 + oauth_accounts 表） |
| 010 | 清理 notes 的 tsvector（切换到 ILIKE） |
| 20260328 | Notion 同步（user_integrations 表 + notes 增加 notion 字段） |

---

## 6. API 设计

### 6.1 认证相关（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 邮箱+密码+验证码注册 |
| POST | /api/auth/login | 邮箱+密码登录 |
| POST | /api/auth/refresh | 刷新 Token（双 Token 轮转） |
| POST | /api/auth/email/code | 发送邮箱验证码（60s 限频） |
| POST | /api/auth/email/login | 验证码登录（未注册自动注册） |

### 6.2 认证相关（需认证）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/logout | 登出（删除 Refresh Token） |
| GET | /api/auth/me | 获取当前用户信息 |
| DELETE | /api/auth/account | 删除账户（需验证码，级联删除所有数据） |
| PUT | /api/auth/password | 修改密码（需验证码） |

### 6.3 OAuth

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/oauth/:provider/auth-url | 获取 OAuth 授权 URL（HMAC 签名 state） |
| POST | /api/oauth/:provider/callback | OAuth 回调处理（自动创建/绑定账户） |
| GET | /api/oauth/accounts | 获取已绑定的第三方账号 |
| DELETE | /api/oauth/:provider/unlink | 解绑第三方账号（安全检查） |
| GET | /api/oauth/:provider/bind | 已有账户绑定第三方（返回授权 URL） |

### 6.4 Provider 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/providers | 获取 Provider 列表 |
| POST | /api/providers | 创建 Provider |
| GET | /api/providers/:id | 获取 Provider 详情 |
| PUT | /api/providers/:id | 更新 Provider |
| DELETE | /api/providers/:id | 删除 Provider |
| GET | /api/providers/:id/available-models | 从 API 拉取可用模型 |
| POST | /api/providers/:id/test-connection | 测试连接 |

### 6.5 Provider 模型管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/providers/:id/models | 获取模型列表 |
| POST | /api/providers/:id/models | 添加模型 |
| PUT | /api/providers/:id/models/:modelId | 更新模型 |
| DELETE | /api/providers/:id/models/:modelId | 删除模型 |
| POST | /api/providers/:id/models/batch | 批量添加模型 |
| POST | /api/providers/:id/models/sync | 一键同步模型 |

### 6.6 对话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/conversations | 获取对话列表 |
| GET | /api/conversations/search | 搜索对话（标题+内容） |
| POST | /api/conversations | 创建对话 |
| GET | /api/conversations/:id | 获取对话详情（含消息） |
| PUT | /api/conversations/:id | 更新对话（重命名） |
| PUT | /api/conversations/:id/model | 切换对话模型 |
| DELETE | /api/conversations/:id | 删除对话 |
| PUT | /api/conversations/:id/saved | 标记已保存为笔记 |
| GET | /api/conversations/:id/messages | 获取消息（分页，支持 before_id 游标） |
| POST | /api/conversations/:id/messages | 发送消息（支持流式 SSE、request_id 去重） |
| POST | /api/conversations/:id/messages/:messageId/regenerate | 重新生成回复 |
| POST | /api/conversations/:id/generate-title | AI 生成对话标题 |

### 6.7 笔记管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notes | 获取笔记列表（支持 folder_id, tag, search 筛选） |
| POST | /api/notes | 创建笔记 |
| POST | /api/notes/generate | AI 异步生成笔记（返回 task_id） |
| GET | /api/notes/tasks/:id | 查询生成任务状态 |
| GET | /api/notes/:id | 获取笔记详情 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| GET | /api/notes/:id/export | 导出单篇为 Markdown |
| POST | /api/notes/:id/copy | 复制笔记 |
| POST | /api/notes/:id/sync/notion | 同步到 Notion |
| POST | /api/notes/export | 批量导出为 ZIP |
| POST | /api/notes/import | 导入 Markdown 文件 |
| POST | /api/notes/batch-delete | 批量删除 |
| POST | /api/notes/batch-move | 批量移动 |

### 6.8 文件夹管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/folders | 获取文件夹树 |
| POST | /api/folders | 创建文件夹 |
| GET | /api/folders/:id | 获取文件夹详情 |
| PUT | /api/folders/:id | 更新文件夹 |
| DELETE | /api/folders/:id | 删除文件夹（内含笔记移至根目录） |
| POST | /api/folders/:id/copy | 复制文件夹（含内含笔记） |

### 6.9 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tags | 获取标签列表（含使用计数） |

### 6.10 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 通知列表（分页，支持类型筛选） |
| GET | /api/notifications/unread-count | 未读数量 |
| PUT | /api/notifications/:id/read | 标记已读 |
| PUT | /api/notifications/read-all | 全部标记已读 |
| DELETE | /api/notifications/:id | 删除通知 |
| DELETE | /api/notifications | 清空通知 |

### 6.11 用户设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/settings | 获取用户设置 |
| PUT | /api/user/settings | 更新用户设置 |

### 6.12 反馈系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/feedback/satisfaction | 获取满意度评分 |
| POST | /api/feedback/satisfaction | 提交/更新满意度评分 |
| GET | /api/feedbacks | 获取反馈列表 |
| POST | /api/feedbacks | 创建反馈 |
| GET | /api/feedbacks/:id | 获取反馈详情 |
| PUT | /api/feedbacks/:id | 更新反馈 |
| GET | /api/features | 获取功能请求列表（含投票状态） |
| POST | /api/features/:id/vote | 投票 |
| DELETE | /api/features/:id/vote | 取消投票 |

### 6.13 版本

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/versions | 获取版本列表 |
| GET | /api/versions/current | 获取当前版本 |

### 6.14 Notion 集成

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/integrations/notion/auth-url | 获取 Notion 授权 URL |
| POST | /api/integrations/notion/callback | Notion 回调处理 |
| GET | /api/integrations/notion/status | 获取 Notion 连接状态 |
| DELETE | /api/integrations/notion/disconnect | 断开 Notion 连接 |

---

## 7. 核心技术实现

### 7.1 LLM 集成

所有 LLM 调用使用 OpenAI 兼容 API 格式：

```go
// 用户配置的 Provider -> 动态创建 OpenAI Client
config := openai.DefaultConfig(apiKey)
config.BaseURL = apiBase
client := openai.NewClientWithConfig(config)

// 流式调用
stream, _ := client.CreateChatCompletionStream(ctx, request)
for response := range stream {
    // SSE 返回给前端: data: {"content": "..."}
}
```

### 7.2 对话上下文管理

#### 简单模式

直接截取最近 N 条消息发送给 LLM：

| 记忆级别 | 消息数 |
|----------|--------|
| 短 | 5 |
| 普通 | 10 |
| 长 | 15 |

#### 总结模式

使用滑动窗口 + AI 压缩，保留关键上下文：

| 记忆级别 | 窗口大小 | 保留最近 |
|----------|----------|----------|
| 短 | 10 | 5 |
| 普通 | 20 | 10 |
| 长 | 40 | 20 |

超过窗口大小时，旧消息由 AI 生成摘要（`ConversationSummary`），支持增量更新。摘要提示词按时间加权：早期消息简略，近期消息详细。

### 7.3 消息去重

```
客户端发送消息 → 带 request_id (UUID)
    ├─ 已完成 → 直接返回缓存结果
    ├─ 处理中 → 返回 202 (防止重复处理)
    ├─ 已失败 → 允许重试（最多 3 次）
    └─ 不存在 → 正常处理
```

### 7.4 异步笔记生成

```
用户点击"保存为笔记" → POST /api/notes/generate
    → 创建 NoteGenerationTask (status: generating)
    → 启动后台 goroutine
        → AI 生成标题 + Markdown 内容 + 标签
        → 创建 Note + NoteTags
        → 更新 Task (status: done, note_id: xxx)
    ← 返回 task_id

前端轮询 GET /api/notes/tasks/:id（3s 间隔）
    → 完成后获取笔记内容
    → localStorage 保存 task_id（崩溃恢复）
```

### 7.5 Notion 同步

```
用户连接 Notion → OAuth 获取 Access Token（AES 加密存储）
    → 在用户工作区创建 "AIChatNote" 专属页面

同步笔记 → 将 Markdown 解析为 Notion Blocks
    → (goldmark 解析器，支持段落/标题/代码块/列表/HTML)
    → Notion API 限制：单次最多 100 个 Block，超过时分批发送
    → Rich Text 单块最多 2000 字符，超过时自动分块
    → 重复同步：归档旧页面，创建新页面
```

### 7.6 OAuth 安全

```
state = nonce.timestamp.HMAC-SHA256(nonce + timestamp + secret)
```

无需服务端存储 state，验证时重新计算 HMAC 签名即可。支持 Google（openid email profile）和 GitHub（user:email）。

### 7.7 前端 SSE 流式传输

两种路径：

1. **直接流**：浏览器直接连接后端 SSE（同域部署时）
2. **代理流**：通过 Next.js API Route `/api/chat/stream` 代理（跨域场景）

解析逻辑：`parseSSEStream()` 异步生成器解析 `data: {json}` 行和 `[DONE]` 标记。

每个对话独立追踪流式状态，支持：
- 60 秒超时
- 手动停止（`_cancelled` 标记）
- 乐观更新（用户消息立即显示）
- 重试去重（`request_id`）

---

## 8. 前端页面结构

### 8.1 路由结构

```
├── (auth)/                    # 未认证区域（左动画 + 右表单）
│   ├── /login                 # 登录（密码/验证码/OAuth）
│   ├── /register              # 注册
│   └── /callback/[provider]   # OAuth 回调
│
├── (main)/                    # 认证区域（侧边栏 + 内容）
│   ├── /                      # 聊天主页
│   ├── /notes                 # 知识库
│   ├── /models                # 模型管理
│   ├── /settings              # 设置
│   ├── /account               # 账户管理
│   ├── /notifications         # 通知中心
│   ├── /about                 # 关于
│   └── /help                  # 帮助与反馈
│
├── /privacy                   # 隐私政策
├── /terms                     # 服务条款
├── /auth/notion/callback      # Notion 回调（动画过渡页）
│
└── /api/chat/stream           # SSE 代理 API Route
```

### 8.2 核心页面交互

#### 聊天页面（/）

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌───────────────────────────────────────────┐ │
│ │ ☰ 侧边栏     │  │  模型: DeepSeek ▼  │  对话标题    ⋯ 删除│ │
│ ├──────────────┤  ├───────────────────────────────────────────┤ │
│ │ 搜索对话...   │  │                                           │ │
│ │              │  │  用户: golang proto 怎么用？               │ │
│ │ • 对话1      │  │                                           │ │
│ │ • 对话2  👈  │  │  AI: Protocol Buffers 是一种...           │ │
│ │ • 对话3      │  │                                           │ │
│ │              │  │  用户: 能举个例子吗？                       │ │
│ │              │  │                                           │ │
│ │              │  │  AI: 当然，这是一个示例...  [复制] [重新生成]│ │
│ │              │  │                                           │ │
│ │              │  ├───────────────────────────────────────────┤ │
│ │ ─────────── │  │  💾 保存为笔记                              │ │
│ │ 💬 聊天     │  ├───────────────────────────────────────────┤ │
│ │ 📝 知识库   │  │  输入消息...                    发送 / 停止 │ │
│ │ 🤖 模型管理 │  └───────────────────────────────────────────┘ │
│ │ ⚙️ 设置     │                                              │
│ │ 🔔 通知(3)  │                                              │
│ └──────────────┘                                              │
└──────────────────────────────────────────────────────────────────┘
```

#### 知识库页面（/notes）

```
┌──────────────────────────────────────────────────────────────────┐
│ 📝 知识库                                    🔍 搜索笔记...     │
├──────────────┬──────────────────────┬───────────────────────────┤
│ 文件夹       │ 笔记列表             │ 笔记详情                  │
│              │                      │                           │
│ 📁 全部笔记  │ ┌──────────────────┐ │  golang protobuf 使用方法 │
│ 📁 编程      │ │ 笔记卡片1        │ │  ─────────────────────── │
│   📁 Go      │ │ #编程 #golang     │ │  [编辑] [导出] [同步Notion]│
│   📁 React   │ │ 2024-03-20       │ │                           │
│ 📁 生活      │ └──────────────────┘ │  ## 概述                  │
│              │ ┌──────────────────┐ │  Protocol Buffers 是...    │
│ 标签 ▼       │ │ 笔记卡片2        │ │                           │
│              │ │ #编程 #react      │ │  ## 核心概念               │
│ #编程 (12)   │ │ 2024-03-18       │ │  - .proto 文件定义结构     │
│ #golang (5)  │ └──────────────────┘ │  - protoc 编译生成代码     │
│              │                      │                           │
│              │                      │  目录 (TOC)               │
│              │                      │  · 概述                   │
│              │                      │  · 核心概念               │
│              │                      │  · 使用示例               │
└──────────────┴──────────────────────┴───────────────────────────┘
```

### 8.3 前端状态管理

| Store | 持久化 | 管理内容 |
|-------|--------|----------|
| auth-store | localStorage | 用户信息、JWT Token、认证状态 |
| chat-store | localStorage | 当前对话 ID、草稿、流式状态、输入历史 |
| ui-store | localStorage | 侧边栏状态、字体大小、字体选择 |
| notes-store | localStorage | 选中的文件夹/标签/笔记、展开的文件夹、编辑状态 |

所有 Server State（对话列表、笔记、Provider 等）通过 TanStack React Query 管理，自动缓存和刷新。

### 8.4 国际化

支持中文（默认）和英文，共 16 个翻译域：

| 域 | 内容 |
|----|------|
| common | 通用词汇（加载、取消、确认、保存、删除等） |
| sidebar | 导航标签 |
| chat | 聊天界面、流式状态、错误提示 |
| saveNote | 保存笔记弹窗 |
| provider | Provider 和模型管理 |
| notes | 笔记和文件夹操作 |
| auth | 登录、注册、验证码、OAuth |
| settings | 设置页面 |
| notifications | 通知类型和操作 |
| helpFeedback | 帮助和反馈 |
| accountManagement | 账户管理 |
| about | 关于页面 |

---

## 9. 数据安全

### 9.1 敏感数据处理

| 数据 | 处理方式 |
|------|----------|
| 用户密码 | bcrypt 哈希存储 |
| API Key | AES-256 加密存储 |
| OAuth Token | AES-256 加密存储 |
| JWT Access Token | 短期有效，前端 localStorage |
| Refresh Token | 哈希存储于数据库，支持轮转 |

### 9.2 API 安全

- 所有 API 需 JWT 认证（除登录、注册、OAuth、版本信息、健康检查）
- CORS 限制允许的域名（逗号分隔配置，支持通配符）
- 邮箱验证码 60 秒发送限频
- 消息请求去重（request_id）
- OAuth state 使用 HMAC 签名防 CSRF
- 账户删除前验证邮箱验证码
- OAuth 解绑安全检查（防止删除最后一种登录方式）

### 9.3 数据隔离

- 所有查询强制 `WHERE user_id = ?`
- conversations 表 user_id 复合索引确保隔离效率
- 级联删除：删除 Provider 时清理关联 conversations 的 current_provider_model_id

---

## 10. 与原始设计（v1）的差异

| 维度 | v1 设计 | v2 实现 |
|------|---------|---------|
| 用户系统 | 邮箱+密码 | 邮箱+密码 + 验证码登录 + OAuth（Google/GitHub） + 账户删除 |
| 模型管理 | 单层模型 CRUD | Provider + Model 两层管理，8 种预置服务商，动态拉取/同步/连接测试 |
| 上下文管理 | 无 | 两种模式（简单/总结）+ 三级记忆深度 + AI 摘要压缩 |
| 流式聊天 | 基础 SSE | SSE + 消息去重 + 取消标记 + 乐观更新 + 前端代理 |
| 笔记生成 | 同步 | 异步生成（后台 goroutine + 任务轮询 + 崩溃恢复） |
| 笔记管理 | 基础 CRUD | CRUD + 导入 Markdown + 批量操作 + 复制 + Notion 同步 |
| 通知系统 | 无 | 完整通知系统（模板、类型筛选、未读计数） |
| 反馈系统 | 无 | 满意度评分 + 反馈提交 + 功能投票 + 版本日志 |
| 用户设置 | 无 | 主题/语言/字体/上下文模式/记忆级别/Notion 集成 |
| 国际化 | 无 | 中/英双语，16 个翻译域 |
| 字体 | 无 | 3 级字体大小 + 9 种字体选择（含中文艺术字体） |
| 安全 | 基础 JWT | 双 Token 轮转 + AES 加密 + HMAC state + 验证码限频 |
| 数据模型 | 6 张表 | 20 张表（+message_requests, summaries, notifications, feedbacks, integrations 等） |
| API 数量 | ~20 个 | ~60 个 |
