# OAuth 登录功能 Spec

## Why

当前系统仅支持邮箱+密码登录，用户需要记住额外的密码，且存在密码管理风险。通过集成 OAuth 登录，可以：
1. 提升用户体验：一键登录，无需记住密码
2. 增强安全性：利用邮箱服务商的安全机制
3. 简化流程：无需密码找回、修改密码等功能
4. 降低维护成本：减少密码管理相关的代码和风险

## What Changes

- **新增 OAuth 提供商集成**：支持 Google、GitHub、QQ 等主流 OAuth 提供商
- **新增 OAuth 账号关联**：支持一个用户绑定多个 OAuth 账号
- **保留邮箱+密码登录**：作为备选登录方式
- **新增安全验证机制**：State 参数防 CSRF 攻击
- **前端登录页面重构**：添加 OAuth 登录按钮
- **新增账户注销功能**：支持用户注销账户并删除所有关联数据

## Impact

- Affected specs: 无
- Affected code:
  - 后端: `backend/internal/models/` 新增 OAuthAccount 模型
  - 后端: `backend/internal/handlers/auth.go` 新增 OAuth 相关接口
  - 后端: `backend/internal/repository/` 新增 OAuth 相关仓库
  - 后端: `backend/internal/config/config.go` 新增 OAuth 配置
  - 前端: `frontend/src/app/(auth)/login/page.tsx` 添加 OAuth 登录按钮
  - 前端: `frontend/src/app/(auth)/register/page.tsx` 添加 OAuth 注册按钮
  - 前端: `frontend/src/lib/api/auth.ts` 新增 OAuth API 调用
  - 数据库: 新增 `oauth_accounts` 表

## ADDED Requirements

### Requirement: OAuth 提供商配置

系统应支持配置多个 OAuth 提供商。

#### Scenario: 管理员配置 OAuth 提供商
- **WHEN** 管理员在环境变量中配置 OAuth 提供商信息
- **THEN** 系统应加载并验证配置
- **AND** 支持的提供商包括：Google、GitHub、QQ

#### Scenario: OAuth 配置验证
- **WHEN** 系统启动时
- **THEN** 系统应验证每个已配置提供商的必要参数
- **AND** 对于缺失必要参数的提供商，应记录警告日志但不阻止系统启动

### Requirement: OAuth 授权 URL 生成

系统应能够生成 OAuth 提供商的授权 URL。

#### Scenario: 用户请求 Google 登录
- **WHEN** 用户点击"使用 Google 登录"按钮
- **THEN** 系统生成包含 state 参数的授权 URL
- **AND** state 参数应存储在 Redis 中，有效期 10 分钟
- **AND** 返回授权 URL 给前端

#### Scenario: State 参数生成
- **WHEN** 系统生成 OAuth 授权 URL
- **THEN** state 参数应为 32 位随机字符串
- **AND** state 参数应与提供商名称绑定存储

### Requirement: OAuth 回调处理

系统应能够处理 OAuth 提供商的回调请求。

#### Scenario: Google OAuth 回调成功
- **WHEN** Google 回调接口收到授权码和 state 参数
- **THEN** 系统验证 state 参数有效性
- **AND** 使用授权码换取 access token
- **AND** 使用 access token 获取用户信息
- **AND** 创建或更新用户账号
- **AND** 生成 JWT token 返回给前端

#### Scenario: State 参数验证失败
- **WHEN** 回调接口收到的 state 参数无效或已过期
- **THEN** 系统返回 401 错误
- **AND** 提示"授权已过期，请重新登录"

#### Scenario: OAuth 用户首次登录
- **WHEN** OAuth 提供商返回的用户邮箱在系统中不存在
- **THEN** 系统创建新用户
- **AND** 用户昵称使用 OAuth 提供商返回的名称
- **AND** 用户头像使用 OAuth 提供商返回的头像 URL
- **AND** 创建 OAuth 账号关联记录

#### Scenario: OAuth 用户已存在
- **WHEN** OAuth 提供商返回的用户邮箱在系统中已存在
- **THEN** 系统更新用户信息（昵称、头像）
- **AND** 检查是否已关联该 OAuth 提供商
- **AND** 如未关联，创建新的 OAuth 账号关联记录

### Requirement: OAuth 账号关联管理

系统应支持用户管理已关联的 OAuth 账号。

#### Scenario: 用户查看已关联账号
- **WHEN** 用户访问账号设置页面
- **THEN** 系统显示所有已关联的 OAuth 提供商
- **AND** 显示每个提供商的关联时间

#### Scenario: 用户解除 OAuth 关联
- **WHEN** 用户点击解除某个 OAuth 账号关联
- **THEN** 系统检查是否还有其他登录方式
- **AND** 如还有其他登录方式，允许解除关联
- **AND** 如这是唯一的登录方式，提示"无法解除唯一的登录方式"

#### Scenario: 用户绑定新的 OAuth 账号
- **WHEN** 已登录用户点击绑定新的 OAuth 账号
- **THEN** 系统发起 OAuth 授权流程
- **AND** 授权成功后创建新的 OAuth 账号关联

### Requirement: 前端 OAuth 登录流程

前端应支持完整的 OAuth 登录流程。

#### Scenario: 用户点击 OAuth 登录按钮
- **WHEN** 用户在登录页面点击"使用 Google 登录"
- **THEN** 前端调用后端获取授权 URL
- **AND** 跳转到 OAuth 提供商授权页面

#### Scenario: OAuth 回调页面处理
- **WHEN** 用户在 OAuth 提供商授权后跳转回应用
- **THEN** 前端从 URL 中提取 code 和 state 参数
- **AND** 调用后端回调接口
- **AND** 存储 JWT token
- **AND** 更新用户状态
- **AND** 跳转到主页或原始请求页面

#### Scenario: OAuth 登录失败
- **WHEN** OAuth 登录过程中发生错误
- **THEN** 前端显示错误提示
- **AND** 提供重试选项

### Requirement: 安全性要求

OAuth 登录应满足安全要求。

#### Scenario: State 参数防 CSRF
- **WHEN** OAuth 回调请求到达
- **THEN** 系统必须验证 state 参数
- **AND** state 参数只能使用一次
- **AND** state 参数有效期不超过 10 分钟

#### Scenario: Redirect URI 验证
- **WHEN** OAuth 回调请求到达
- **THEN** 系统验证 redirect_uri 是否在白名单中
- **AND** 只接受预配置的回调地址

#### Scenario: HTTPS 要求
- **WHEN** 生产环境部署
- **THEN** 所有 OAuth 相关接口必须使用 HTTPS
- **AND** Cookie 设置 Secure 和 HttpOnly 标志

### Requirement: 账户注销功能

系统应支持用户注销账户，并删除所有关联数据。

#### Scenario: 用户请求注销账户
- **WHEN** 用户在设置页面点击"注销账户"
- **THEN** 系统要求用户确认操作
- **AND** 提示"此操作将永久删除您的账户和所有数据，且不可恢复"

#### Scenario: 用户确认注销账户
- **WHEN** 用户确认注销账户
- **THEN** 系统删除用户的所有数据，包括：
  - 用户的所有会话（conversations）
  - 用户的所有消息（messages）
  - 用户的所有笔记（notes）
  - 用户的所有文件夹（folders）
  - 用户的所有标签（note_tags）
  - 用户的所有模型配置（providers, provider_models）
  - 用户的所有 OAuth 关联（oauth_accounts）
  - 用户的所有刷新令牌（refresh_tokens）
  - 用户的所有消息请求记录（message_requests）
  - 用户的所有会话摘要（conversation_summaries）
  - 用户的所有用户设置（user_settings）
  - 用户的所有反馈数据（feedbacks, satisfaction_ratings, feature_requests）
  - 用户账号本身（users）
- **AND** 系统清除用户的登录状态
- **AND** 系统返回成功消息
- **AND** 前端跳转到登录页面

#### Scenario: 注销账户失败
- **WHEN** 注销过程中发生错误
- **THEN** 系统回滚所有已删除的数据
- **AND** 系统记录错误日志
- **AND** 提示用户"注销失败，请稍后重试"

#### Scenario: 注销账户安全验证
- **WHEN** 用户请求注销账户
- **THEN** 系统要求用户输入密码或进行 OAuth 验证
- **AND** 验证通过后才允许注销

## MODIFIED Requirements

### Requirement: 用户模型扩展

用户模型应支持 OAuth 登录相关信息。

#### Scenario: 用户信息包含 OAuth 数据
- **WHEN** 用户通过 OAuth 登录
- **THEN** 用户模型应包含以下字段：
  - `nickname`: 用户昵称（来自 OAuth）
  - `avatar_url`: 用户头像 URL（来自 OAuth）
  - `email_verified`: 邮箱是否已验证

### Requirement: 登录页面改造

登录页面应同时支持邮箱登录和 OAuth 登录。

#### Scenario: 用户访问登录页面
- **WHEN** 用户访问 `/login` 页面
- **THEN** 页面显示邮箱登录表单
- **AND** 页面显示 OAuth 登录按钮（Google、GitHub、QQ）
- **AND** OAuth 按钮仅在对应提供商已配置时显示

### Requirement: 注册页面改造

注册页面应支持 OAuth 注册。

#### Scenario: 用户访问注册页面
- **WHEN** 用户访问 `/register` 页面
- **THEN** 页面显示邮箱注册表单
- **AND** 页面显示 OAuth 注册按钮
- **AND** 提示"使用 OAuth 快速注册"

## 数据库设计

### 新增表: oauth_accounts

```sql
CREATE TABLE oauth_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- google, github, qq
    provider_user_id VARCHAR(255) NOT NULL,  -- OAuth 提供商的用户 ID
    access_token TEXT,  -- 可选：存储 OAuth access token
    refresh_token TEXT,  -- 可选：存储 OAuth refresh token
    token_expires_at TIMESTAMP,  -- token 过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id),  -- 同一提供商的用户 ID 唯一
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider, provider_user_id)
);
```

### 修改表: users

```sql
ALTER TABLE users ADD COLUMN nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

### 账户注销数据删除清单

当用户注销账户时，需要删除以下表中的数据：

| 表名 | 删除条件 | 说明 |
|------|---------|------|
| `conversations` | `user_id = ?` | 用户的所有会话 |
| `messages` | 通过 conversations 级联删除 | 会话中的所有消息 |
| `notes` | `user_id = ?` | 用户的所有笔记 |
| `folders` | `user_id = ?` | 用户的所有文件夹 |
| `note_tags` | 通过 notes 级联删除 | 笔记的所有标签 |
| `providers` | `user_id = ?` | 用户的所有模型提供商配置 |
| `provider_models` | 通过 providers 级联删除 | 提供商的所有模型配置 |
| `oauth_accounts` | `user_id = ?` | 用户的所有 OAuth 关联 |
| `refresh_tokens` | `user_id = ?` | 用户的所有刷新令牌 |
| `message_requests` | `user_id = ?` | 用户的所有消息请求记录 |
| `conversation_summaries` | `user_id = ?` | 用户的所有会话摘要 |
| `user_settings` | `user_id = ?` | 用户的所有设置 |
| `feedbacks` | `user_id = ?` | 用户的所有反馈 |
| `satisfaction_ratings` | `user_id = ?` | 用户的所有满意度评分 |
| `feature_requests` | `user_id = ?` | 用户的所有功能请求 |
| `users` | `id = ?` | 用户账号本身 |

**删除顺序**（考虑外键依赖）：
1. 删除子表数据（messages, note_tags, provider_models 等）
2. 删除关联表数据（conversations, notes, folders, providers 等）
3. 删除独立表数据（refresh_tokens, message_requests, user_settings 等）
4. 删除用户账号（users）

**事务要求**：
- 所有删除操作必须在一个事务中完成
- 如果任何步骤失败，必须回滚所有已删除的数据

## API 设计

### 新增接口

#### 1. 获取 OAuth 授权 URL
```
GET /api/auth/oauth/:provider
Response: {
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 2. OAuth 回调处理
```
POST /api/auth/oauth/:provider/callback
Request: {
  "code": "4/0AX4XfWh...",
  "state": "abc123..."
}
Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "def456...",
  "user": {...}
}
```

#### 3. 获取已关联的 OAuth 账号
```
GET /api/auth/oauth/accounts
Response: {
  "accounts": [
    {
      "provider": "google",
      "provider_user_id": "123456789",
      "created_at": "2024-03-20T10:00:00Z"
    }
  ]
}
```

#### 4. 解除 OAuth 关联
```
DELETE /api/auth/oauth/:provider
Response: {
  "message": "OAuth account unlinked successfully"
}
```

#### 5. 绑定新的 OAuth 账号（已登录用户）
```
GET /api/auth/oauth/:provider/bind
Response: {
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### 6. 注销账户
```
DELETE /api/auth/account
Request: {
  "password": "user-password" // 可选，邮箱登录用户需要
}
Response: {
  "message": "Account deleted successfully"
}
```

**注意**：
- 邮箱登录用户需要提供密码验证
- OAuth 登录用户需要重新进行 OAuth 验证
- 此操作不可逆，会删除所有用户数据

## OAuth 提供商配置

### Google OAuth
```yaml
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
```

### GitHub OAuth
```yaml
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback
```

### QQ OAuth
```yaml
QQ_APP_ID=your-app-id
QQ_APP_KEY=your-app-key
QQ_REDIRECT_URI=http://localhost:3000/api/auth/oauth/qq/callback
```

## 前端设计

### 登录页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🤖 AI Chat Note                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  邮箱登录                                                        │
│  ─────────────────────────────────────────────────────────────  │
│  [邮箱输入框]                                                    │
│  [密码输入框]                                                    │
│  [登录按钮]                                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ──────────────── 或 ────────────────                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第三方登录                                                      │
│  ─────────────────────────────────────────────────────────────  │
│  [🔵 使用 Google 登录]                                           │
│  [⚫ 使用 GitHub 登录]                                           │
│  [🔵 使用 QQ 登录]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 国际化

需要在翻译文件中添加以下新键：

```json
{
  "auth": {
    "oauth": {
      "loginWith": "使用 {provider} 登录",
      "google": "Google",
      "github": "GitHub",
      "qq": "QQ",
      "or": "或",
      "thirdParty": "第三方登录",
      "bindNew": "绑定新的 {provider} 账号",
      "unlink": "解除关联",
      "unlinkSuccess": "已解除 {provider} 关联",
      "unlinkFailed": "解除关联失败",
      "cannotUnlinkLast": "无法解除唯一的登录方式",
      "linkedAccounts": "已关联账号",
      "linkedAt": "关联时间",
      "stateExpired": "授权已过期，请重新登录",
      "callbackFailed": "登录失败，请重试"
    },
    "deleteAccount": {
      "title": "注销账户",
      "description": "此操作将永久删除您的账户和所有数据，且不可恢复",
      "warning": "删除的数据包括：会话记录、笔记、文件夹、模型配置等所有数据",
      "confirmLabel": "我已了解风险，确认注销账户",
      "confirmButton": "确认注销",
      "cancelButton": "取消",
      "passwordRequired": "请输入密码以确认注销",
      "oauthRequired": "请通过 {provider} 验证以确认注销",
      "success": "账户已注销",
      "failed": "注销失败，请稍后重试",
      "confirmDialogTitle": "确认注销账户？",
      "confirmDialogDescription": "此操作不可撤销，您的所有数据将被永久删除。"
    }
  },
  "settings": {
    "account": "账户管理",
    "deleteAccountSection": "危险操作",
    "deleteAccountButton": "注销账户"
  }
}
```

## 实施优先级

### Phase 1: 核心功能（必须）
1. Google OAuth 集成
2. OAuth 账号关联表创建
3. 用户模型扩展
4. 前端登录页面改造
5. State 参数安全验证

### Phase 2: 扩展功能（推荐）
1. GitHub OAuth 集成
2. OAuth 账号管理页面
3. 绑定/解除关联功能

### Phase 3: 可选功能
1. QQ OAuth 集成
2. 登录历史记录
3. 异常登录提醒

## 测试策略

### 单元测试
- OAuth URL 生成测试
- State 参数生成和验证测试
- 用户创建/关联逻辑测试
- Token 生成测试

### 集成测试
- 完整 OAuth 流程测试（使用 mock）
- 多提供商集成测试
- 账号关联/解除关联测试

### E2E 测试
- 用户登录流程测试
- OAuth 回调处理测试
- 错误场景测试

## 风险与缓解

### 风险 1: OAuth 提供商服务不可用
- **影响**: 用户无法通过该提供商登录
- **缓解**: 保留邮箱+密码登录作为备选方案

### 风险 2: 用户邮箱在不同提供商间不一致
- **影响**: 可能创建重复账号
- **缓解**: 提供账号合并功能（后续版本）

### 风险 3: OAuth token 泄露
- **影响**: 攻击者可能冒充用户
- **缓解**: Token 加密存储，定期刷新

## 回滚计划

如需回滚 OAuth 功能：
1. 移除 OAuth 相关路由
2. 隐藏前端 OAuth 按钮
3. 保留 `oauth_accounts` 表和用户扩展字段（不影响现有功能）
4. 用户仍可使用邮箱+密码登录
