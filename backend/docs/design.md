# AI Chat Note - Backend 设计文档

## 1. 项目概述

### 1.1 背景

AI Chat Note 后端是一个 RESTful API 服务，为前端提供：

- 用户认证与管理
- AI 提供商与模型配置管理
- 对话管理与流式聊天
- 笔记管理与 AI 总结
- 知识库组织（文件夹、标签）

### 1.2 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Go | 1.21+ | 编程语言 |
| Gin | v1.9+ | Web 框架 |
| GORM | v1.25+ | ORM |
| PostgreSQL | 15+ | 主数据库 |
| jwt-go | v5 | JWT 认证 |
| go-openai | v1.x | LLM API 客户端 |
| testify | v1.8+ | 测试框架 |

### 1.3 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
├── internal/
│   ├── config/                  # 配置管理
│   │   └── config.go
│   ├── crypto/                  # 加密模块
│   │   └── aes.go
│   ├── handlers/                # HTTP handlers
│   │   ├── auth.go
│   │   ├── provider.go
│   │   ├── provider_model.go
│   │   ├── conversation.go
│   │   ├── note.go
│   │   ├── folder.go
│   │   └── tag.go
│   ├── middleware/              # 中间件
│   │   ├── auth.go
│   │   ├── cors.go
│   │   └── logger.go
│   ├── models/                  # GORM 模型
│   │   ├── user.go
│   │   ├── provider.go
│   │   ├── provider_model.go
│   │   ├── conversation.go
│   │   ├── message.go
│   │   ├── note.go
│   │   ├── folder.go
│   │   ├── note_tag.go
│   │   └── refresh_token.go
│   ├── repository/              # 数据访问层
│   │   ├── user.go
│   │   ├── provider.go
│   │   ├── conversation.go
│   │   ├── note.go
│   │   └── ...
│   ├── services/                # 业务逻辑层
│   │   ├── auth.go
│   │   ├── provider.go
│   │   ├── chat.go
│   │   ├── note.go
│   │   └── llm.go
│   └── utils/                   # 工具函数
│       ├── response.go
│       └── validator.go
├── migrations/                  # SQL 迁移脚本
│   └── 001_init.sql
├── docs/                        # 文档
│   └── design.md
├── .env.example                 # 环境变量示例
├── docker-compose.yml           # 本地开发环境
├── Dockerfile                   # 生产部署
├── go.mod
└── go.sum
```

---

## 2. 数据模型

### 2.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│    users    │       │  providers  │       │ provider_models │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (SERIAL) │───┐   │ id (UUID)   │   ┌───│ id (UUID)       │
│ email       │   │   │ user_id     │───┘   │ provider_id     │
│ password    │   │   │ name        │       │ model_id        │
│ created_at  │   │   │ type        │       │ display_name    │
│ updated_at  │   │   │ api_base    │       │ is_default      │
└─────────────┘   │   │ api_key_enc │       │ enabled         │
      │           │   │ created_at  │       └────────┬────────┘
      │           │   └─────────────┘                │
      │           │                                  │
      │           │   ┌─────────────────┐            │
      │           │   │ refresh_tokens  │            │
      │           │   ├─────────────────┤            │
      │           └───│ user_id         │            │
      │               │ token_hash      │            │
      │               │ expires_at      │            │
      │               └─────────────────┘            │
      │                                              │
      │   ┌─────────────────┐                        │
      │   │  conversations  │◄───────────────────────┘
      │   ├─────────────────┤
      ├───│ user_id         │
      │   │ provider_model  │
      │   │ title           │
      │   │ is_saved        │
      │   └────────┬────────┘
      │            │
      │            │   ┌─────────────┐
      │            └──▶│  messages   │
      │                ├─────────────┤
      │                │ id          │
      │                │ conv_id     │
      │                │ role        │
      │                │ content     │
      │                └─────────────┘
      │
      │   ┌─────────────┐       ┌─────────────┐
      │   │  folders    │       │   notes     │
      │   ├─────────────┤       ├─────────────┤
      ├───│ user_id     │───────│ user_id     │
      │   │ name        │       │ folder_id   │
      │   │ parent_id   │       │ title       │
      │   └─────────────┘       │ content(MD) │
      │                         │ source_conv │
      │                         └──────┬──────┘
      │                                │
      │                                │   ┌─────────────┐
      │                                └──▶│  note_tags  │
      │                                    ├─────────────┤
      │                                    │ note_id     │
      │                                    │ tag         │
      │                                    └─────────────┘
      │
      └──▶ (用户关联)
```

### 2.2 模型定义

#### User

```go
type User struct {
    ID           uint           `gorm:"primaryKey" json:"id"`
    Email        string         `gorm:"uniqueIndex;not null" json:"email"`
    PasswordHash string         `gorm:"not null" json:"-"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
}
```

#### Provider

```go
type ProviderType string

const (
    ProviderOpenAI     ProviderType = "openai"
    ProviderVolcengine ProviderType = "volcengine"
    ProviderDeepSeek   ProviderType = "deepseek"
    ProviderAnthropic  ProviderType = "anthropic"
    ProviderGoogle     ProviderType = "google"
    ProviderMoonshot   ProviderType = "moonshot"
    ProviderZhipu      ProviderType = "zhipu"
    ProviderCustom     ProviderType = "custom"
)

type Provider struct {
    ID              uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    UserID          uint          `gorm:"not null;index" json:"user_id"`
    Name            string        `gorm:"not null" json:"name"`
    Type            ProviderType  `gorm:"not null" json:"type"`
    APIBase         string        `gorm:"not null" json:"api_base"`
    APIKeyEncrypted string        `gorm:"type:text" json:"-"` // 加密存储，不返回给前端
    Models          []ProviderModel `gorm:"foreignKey:ProviderID" json:"models"`
    CreatedAt       time.Time     `json:"created_at"`
    UpdatedAt       time.Time     `json:"updated_at"`
}
```

#### ProviderModel

```go
type ProviderModel struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    ProviderID  uuid.UUID `gorm:"type:uuid;not null;index" json:"provider_id"`
    ModelID     string    `gorm:"not null" json:"model_id"`        // API 返回的模型标识
    DisplayName string    `gorm:"not null" json:"display_name"`    // 用户友好名称
    IsDefault   bool      `gorm:"default:false" json:"is_default"`
    Enabled     bool      `gorm:"default:true" json:"enabled"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

#### Conversation

```go
type Conversation struct {
    ID              uint           `gorm:"primaryKey" json:"id"`
    UserID          uint           `gorm:"not null;index" json:"user_id"`
    ProviderModelID *uuid.UUID     `gorm:"type:uuid" json:"provider_model_id"`
    Title           string         `gorm:"size:500" json:"title"`
    IsSaved         bool           `gorm:"default:false" json:"is_saved"`
    Messages        []Message      `gorm:"foreignKey:ConversationID" json:"messages,omitempty"`
    CreatedAt       time.Time      `json:"created_at"`
    UpdatedAt       time.Time      `json:"updated_at"`
}
```

#### Message

```go
type MessageRole string

const (
    RoleUser      MessageRole = "user"
    RoleAssistant MessageRole = "assistant"
)

type Message struct {
    ID             uint         `gorm:"primaryKey" json:"id"`
    ConversationID uint         `gorm:"not null;index" json:"conversation_id"`
    Role           MessageRole  `gorm:"not null" json:"role"`
    Content        string       `gorm:"type:text;not null" json:"content"`
    CreatedAt      time.Time    `json:"created_at"`
}
```

#### Note

```go
type Note struct {
    ID                   uint       `gorm:"primaryKey" json:"id"`
    UserID               uint       `gorm:"not null;index" json:"user_id"`
    FolderID             *uint      `gorm:"index" json:"folder_id"`
    SourceConversationID *uint      `json:"source_conversation_id"`
    Title                string     `gorm:"size:500;not null" json:"title"`
    Content              string     `gorm:"type:text;not null" json:"content"` // Markdown 格式
    Tags                 []NoteTag  `gorm:"foreignKey:NoteID" json:"tags"`
    CreatedAt            time.Time  `json:"created_at"`
    UpdatedAt            time.Time  `json:"updated_at"`
}
```

#### Folder

```go
type Folder struct {
    ID        uint       `gorm:"primaryKey" json:"id"`
    UserID    uint       `gorm:"not null;index" json:"user_id"`
    Name      string     `gorm:"not null" json:"name"`
    ParentID  *uint      `gorm:"index" json:"parent_id"`
    CreatedAt time.Time  `json:"created_at"`
    UpdatedAt time.Time  `json:"updated_at"`
}
```

#### NoteTag

```go
type NoteTag struct {
    NoteID    uint      `gorm:"primaryKey" json:"note_id"`
    Tag       string    `gorm:"primaryKey;size:100" json:"tag"`
    CreatedAt time.Time `json:"created_at"`
}
```

#### RefreshToken

```go
type RefreshToken struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    UserID     uint      `gorm:"not null;index" json:"user_id"`
    TokenHash  string    `gorm:"uniqueIndex;not null" json:"-"`
    ExpiresAt  time.Time `gorm:"not null" json:"expires_at"`
    CreatedAt  time.Time `json:"created_at"`
}
```

---

## 3. API 设计

### 3.1 基础信息

- **Base URL**: `/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **错误格式**: `{"error": "ERROR_CODE", "message": "错误详情"}`

### 3.2 认证相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/logout | 用户登出 | 是 |
| POST | /auth/refresh | 刷新 Token | 否 (需 Refresh Token) |
| GET | /auth/me | 获取当前用户 | 是 |

#### 注册请求

```json
{
  "email": "user@example.com",
  "password": "password123",
  "code": "123456"
}
```

**字段说明**:
- `email`: 用户邮箱（必填，需为有效邮箱格式）
- `password`: 用户密码（必填，至少8位）
- `code`: 验证码（必填，6位数字，需先调用发送验证码接口获取）

#### 登录响应

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "rt_xxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 刷新 Token 请求

```json
{
  "refresh_token": "rt_xxxxxxxxxxxxx"
}
```

### 3.3 Provider 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /providers | 获取提供商列表 |
| POST | /providers | 创建提供商 |
| GET | /providers/:id | 获取详情 |
| PUT | /providers/:id | 更新提供商 |
| DELETE | /providers/:id | 删除提供商 |
| GET | /providers/:id/available-models | 获取可用模型 |
| POST | /providers/:id/test-connection | 测试连接 |

### 3.4 Provider Model 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /providers/:id/models | 获取模型列表 |
| POST | /providers/:id/models | 添加模型 |
| PUT | /providers/:id/models/:modelId | 更新模型 |
| DELETE | /providers/:id/models/:modelId | 删除模型 |
| POST | /providers/:id/models/batch | 批量添加模型 |
| POST | /providers/:id/models/sync | 批量同步模型 |

#### Sync Models API

批量同步提供商模型，支持在单个事务中完成添加、删除、更新默认模型操作。

**请求**

```
POST /providers/:id/models/sync
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "add": [
    { "model_id": "gpt-4o", "display_name": "GPT-4o" },
    { "model_id": "gpt-4o-mini", "display_name": "GPT-4o Mini" }
  ],
  "delete": ["<provider_model_uuid_1>", "<provider_model_uuid_2>"],
  "default_model_id": "<provider_model_uuid>"
}
```

**响应**

```json
{
  "models": [
    {
      "id": "uuid",
      "provider_id": "provider-uuid",
      "model_id": "gpt-4o",
      "display_name": "GPT-4o",
      "is_default": true,
      "enabled": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "added": 2,
  "deleted": 2,
  "updated": 1
}
```

**特点**:
- 一次请求完成多个操作，减少网络往返
- 所有操作在数据库事务中执行，保证原子性
- 任一操作失败则全部回滚

### 3.5 对话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /conversations | 获取对话列表 |
| POST | /conversations | 创建对话 |
| GET | /conversations/:id | 获取详情(含消息) |
| PUT | /conversations/:id | 更新对话 |
| DELETE | /conversations/:id | 删除对话 |
| PUT | /conversations/:id/saved | 标记已保存 |
| GET | /conversations/:id/messages | 获取消息列表 |
| POST | /conversations/:id/messages | 发送消息 (支持 SSE) |
| POST | /conversations/:id/messages/:msgId/regenerate | 重新生成 |

#### 3.5.1 发送消息 API (POST /conversations/:id/messages)

**请求参数**:

```json
{
  "content": "用户消息内容",
  "stream": true,
  "request_id": "uuid-v4-string"  // 可选，用于请求去重
}
```

**request_id 说明**:
- 类型：UUID v4 字符串（如 `550e8400-e29b-41d4-a716-446655440000`）
- 用途：请求去重，- 行为：
  - 首次请求：后端创建请求记录并处理
  - 超时后重试：前端复用同一个 `request_id`
  - 后端检测到已处理的请求时：
    - `completed`: 返回已保存的 AI 回复
    - `processing`: 返回 202 Accepted，提示"请求正在处理中"

**响应**:
- 成功：SSE 流式响应或 JSON 响应（非流式）
- 去重响应：
  ```json
  {
    "data": { /* 已保存的消息 */ },
    "deduplicated": true
  }
  ```

### 3.6 笔记管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /notes | 获取笔记列表 (支持筛选) |
| POST | /notes | 创建笔记 |
| GET | /notes/:id | 获取详情 |
| PUT | /notes/:id | 更新笔记 |
| DELETE | /notes/:id | 删除笔记 |
| POST | /notes/generate | AI 生成笔记预览 |
| GET | /notes/:id/export | 导出 Markdown |
| POST | /notes/:id/copy | 复制笔记 |
| POST | /notes/export | 批量导出 |
| POST | /notes/import | 导入 Markdown |
| POST | /notes/batch-delete | 批量删除 |
| POST | /notes/batch-move | 批量移动 |

### 3.7 文件夹管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /folders | 获取文件夹树 |
| POST | /folders | 创建文件夹 |
| GET | /folders/:id | 获取详情 |
| PUT | /folders/:id | 更新文件夹 |
| DELETE | /folders/:id | 删除文件夹 |
| POST | /folders/:id/copy | 复制文件夹 |

### 3.8 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /tags | 获取标签列表(含统计) |

---

## 4. 安全方案

### 4.1 密码存储

使用 bcrypt 加密，cost=12：

```go
hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
```

### 4.2 JWT Token

**Access Token**:
- 算法: HS256
- 有效期: 24 小时
- 载荷: `user_id`, `email`, `exp`

**Refresh Token**:
- 格式: 随机字符串 `rt_` 前缀
- 有效期: 7 天
- 存储: 数据库存储 hash 值

```go
type Claims struct {
    UserID uint   `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}
```

### 4.3 API Key 加密

使用 AES-256-GCM 加密用户 API Key：

```go
type AESCrypto struct {
    key []byte // 32 bytes
}

// 加密流程
func (a *AESCrypto) Encrypt(plaintext string) (string, error) {
    // 1. 创建 AES Cipher
    // 2. 创建 GCM mode
    // 3. 生成随机 nonce
    // 4. 加密: seal(nonce, plaintext)
    // 5. 返回 "enc:" + base64(nonce + ciphertext)
}

// 解密流程
func (a *AESCrypto) Decrypt(encrypted string) (string, error) {
    // 1. 解析 base64
    // 2. 提取 nonce
    // 3. 解密: open(nonce, ciphertext)
    // 4. 返回明文
}
```

**特点**:
- 每个 API Key 使用随机 nonce
- 相同明文加密结果不同
- GCM 提供认证，防篡改
- 前缀 `enc:` 标识加密数据

### 4.4 CORS 配置

```go
func CORSMiddleware() gin.HandlerFunc {
    return cors.New(cors.Config{
        AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    })
}
```

---

## 5. 流式聊天实现

### 5.1 SSE 响应格式

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":" world"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 5.2 实现流程

```
┌─────────────┐    POST /conversations/:id/messages     ┌─────────────┐
│   Frontend  │ ───────────────────────────────────────▶│   Backend   │
│             │    Content-Type: application/json       │             │
│             │    Accept: text/event-stream            │             │
└─────────────┘                                          └──────┬──────┘
                                                               │
    ┌──────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Backend 处理                              │
├──────────────────────────────────────────────────────────────────┤
│  1. 获取对话信息 + ProviderModel                                  │
│  2. 获取 Provider，解密 API Key                                   │
│  3. 构建历史消息列表                                               │
│  4. 调用 LLM API (stream=true)                                   │
│  5. 流式转发响应给前端                                             │
│  6. 保存用户消息和 AI 响应                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 代码示例

```go
func (h *ConversationHandler) SendMessage(c *gin.Context) {
    // 1. 解析请求
    var req SendMessageRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, ErrorResponse("invalid_request", err.Error()))
        return
    }

    // 2. 获取对话和模型配置
    conv, _ := h.repo.GetConversationByID(convID)
    providerModel, _ := h.repo.GetProviderModel(conv.ProviderModelID)
    provider, _ := h.repo.GetProvider(providerModel.ProviderID)

    // 3. 解密 API Key
    apiKey, _ := h.crypto.Decrypt(provider.APIKeyEncrypted)

    // 4. 获取历史消息
    messages, _ := h.repo.GetMessages(convID)

    // 5. 设置 SSE headers
    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control", "no-cache")
    c.Header("Connection", "keep-alive")

    // 6. 调用 LLM API 并流式返回
    stream := h.llmService.ChatStream(c.Request.Context(), provider, messages, req.Content)

    var fullContent string
    for chunk := range stream {
        fullContent += chunk.Content
        // 发送 SSE 事件
        fmt.Fprintf(c.Writer, "data: %s\n\n", chunk.JSON())
        c.Writer.Flush()
    }

    // 7. 保存消息
    h.repo.CreateMessage(convID, RoleUser, req.Content)
    h.repo.CreateMessage(convID, RoleAssistant, fullContent)

    // 8. 发送结束标记
    fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
}
```

---

## 6. AI 笔记总结

### 6.1 设计

- 使用系统配置的 DeepSeek API Key
- 环境变量: `DEEPSEEK_API_KEY`
- 模型: `deepseek-chat`

### 6.2 Prompt 模板

```
请将以下对话总结为一篇结构化的笔记，要求：
1. 生成一个简洁的标题
2. 提取核心知识点，使用 Markdown 格式
3. 建议合适的标签（格式：#标签1 #标签2）

对话内容：
%s

请严格按以下 JSON 格式输出：
{
  "title": "标题",
  "content": "Markdown 格式的正文内容",
  "tags": ["标签1", "标签2", "标签3"]
}
```

### 6.3 API 实现

```go
func (s *NoteService) GenerateFromConversation(convID uint) (*GenerateNoteResult, error) {
    // 1. 获取对话消息
    messages, _ := s.repo.GetMessages(convID)

    // 2. 构建对话文本
    var dialogText string
    for _, msg := range messages {
        dialogText += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
    }

    // 3. 调用 DeepSeek API
    prompt := fmt.Sprintf(SummaryPrompt, dialogText)
    response, _ := s.llmService.Chat(prompt, "deepseek-chat")

    // 4. 解析 JSON 响应
    var result GenerateNoteResult
    json.Unmarshal([]byte(response), &result)

    return &result, nil
}
```

---

## 7. 配置管理

### 7.1 环境变量

```bash
# .env.example

# Server
PORT=8080
GIN_MODE=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_chat_notes?sslmode=disable

# JWT
JWT_SECRET=your-jwt-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key-base64

# LLM
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_API_BASE=https://api.deepseek.com

# CORS
FRONTEND_URL=http://localhost:3000
```

### 7.2 配置结构

```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    JWT      JWTConfig
    LLM      LLMConfig
    CORS     CORSConfig
}

type ServerConfig struct {
    Port     string
    GinMode  string
}

type DatabaseConfig struct {
    URL string
}

type JWTConfig struct {
    Secret        string
    RefreshSecret string
    Expiry        time.Duration
    RefreshExpiry time.Duration
}

type LLMConfig struct {
    DeepSeekAPIKey  string
    DeepSeekAPIBase string
}

type CORSConfig struct {
    FrontendURL string
}
```

---

## 8. Docker 部署

### 8.1 docker-compose.yml (开发环境)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: chat-note-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_chat_notes
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 8.2 Dockerfile (生产部署)

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080
CMD ["./server"]
```

---

## 9. 开发计划

### Phase 1: 基础架构 (Day 1)

- [x] 项目初始化
- [ ] Docker Compose 配置
- [ ] 配置管理
- [ ] 数据库连接与 GORM 配置
- [ ] 基础路由与中间件
- [ ] AES 加密模块

### Phase 2: 认证系统 (Day 2)

- [ ] User 模型与 Repository
- [ ] 注册 API
- [ ] 登录 API (JWT + Refresh Token)
- [ ] Auth Middleware
- [ ] Refresh Token API
- [ ] CORS 配置

### Phase 3: Provider 管理 (Day 3)

- [ ] Provider 模型与 Repository
- [ ] ProviderModel 模型与 Repository
- [ ] Provider CRUD APIs
- [ ] ProviderModel CRUD APIs
- [ ] API Key 加密存储
- [ ] 获取可用模型 API
- [ ] 连接测试 API

### Phase 4: 对话功能 (Day 4-5)

- [ ] Conversation 模型与 Repository
- [ ] Message 模型与 Repository
- [ ] Conversation CRUD APIs
- [ ] 消息发送 API
- [ ] SSE 流式响应
- [ ] LLM Service (go-openai)
- [ ] 重新生成 API

### Phase 5: 笔记功能 (Day 6-7)

- [ ] Note 模型与 Repository
- [ ] Folder 模型与 Repository
- [ ] NoteTag 模型与 Repository
- [ ] Note CRUD APIs
- [ ] Folder CRUD APIs
- [ ] AI 笔记总结 (DeepSeek)
- [ ] 导出功能 (Markdown)
- [ ] 导入功能
- [ ] 批量操作

### Phase 6: 标签与搜索 (Day 8)

- [ ] Tag API
- [ ] 全文搜索 (PostgreSQL tsvector)
- [ ] 性能优化

---

## 10. 测试策略

### 10.1 单元测试

- 使用 testify 框架
- 覆盖核心业务逻辑
- Mock 数据库操作

### 10.2 集成测试

- 使用 testcontainers 启动 PostgreSQL
- 测试完整 API 流程

### 10.3 测试覆盖率目标

- Repository: 80%+
- Service: 90%+
- Handler: 70%+

---

## 11. 监控与日志

### 11.1 日志格式

```json
{
  "time": "2024-01-01T00:00:00Z",
  "level": "info",
  "msg": "request completed",
  "method": "POST",
  "path": "/api/conversations/1/messages",
  "status": 200,
  "latency_ms": 1234,
  "user_id": 1
}
```

### 11.2 健康检查

```
GET /health
```

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
