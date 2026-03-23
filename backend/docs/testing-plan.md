# 后端单元测试方案

## 1. 概述

### 1.1 测试目标

- **覆盖率目标**：整体代码覆盖率达到 **80%**
- **质量保障**：确保核心业务逻辑正确性，预防回归问题
- **文档作用**：测试代码作为活文档，帮助理解系统行为
- **快速反馈**：单元测试执行时间控制在 30 秒以内

### 1.2 测试范围

| 模块 | 文件 | 优先级 | 测试类型 |
|------|------|--------|----------|
| crypto | password.go | P0 | 单元测试 |
| crypto | jwt.go | P0 | 单元测试 |
| crypto | aes.go | P0 | 单元测试 |
| utils | response.go | P1 | 单元测试 |
| repository | user.go | P0 | 集成测试 |
| repository | refresh_token.go | P1 | 集成测试 |
| repository | conversation.go | P0 | 集成测试 |
| repository | message.go | P1 | 集成测试 |
| repository | note.go | P0 | 集成测试 |
| repository | folder.go | P1 | 集成测试 |
| repository | provider.go | P1 | 集成测试 |
| repository | provider_model.go | P1 | 集成测试 |
| repository | tag.go | P2 | 集成测试 |
| handlers | auth.go | P0 | API 集成测试 |
| handlers | conversation.go | P0 | API 集成测试 |
| handlers | note.go | P0 | API 集成测试 |
| handlers | provider.go | P1 | API 集成测试 |
| handlers | provider_model.go | P1 | API 集成测试 |
| services | ai.go | P1 | Mock 测试 |

---

## 2. 测试策略

### 2.1 测试分层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        测试金字塔                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          ▲                                          │
│                         ╱ ╲                                         │
│                        ╱   ╲                                        │
│                       ╱ API ╲        ← httptest + SQLite            │
│                      ╱ 集成  ╲          (Handlers 层)                │
│                     ╱─────────╲                                     │
│                    ╱  Repository ╲   ← SQLite 内存数据库             │
│                   ╱    集成测试   ╲      (Repository 层)             │
│                  ╱───────────────╲                                  │
│                 ╱    单元测试      ╲  ← 纯函数测试                   │
│                ╱  (crypto/utils)   ╲     (无外部依赖)               │
│               ╱─────────────────────╲                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

数量比例：单元测试 60% : 集成测试 30% : API测试 10%
执行速度：   快    ←────────────────────→    慢
```

### 2.2 测试风格

| 场景 | 风格 | 说明 |
|------|------|------|
| 纯函数（crypto/utils） | Table-Driven | 数据驱动，易于扩展用例 |
| Repository CRUD | Table-Driven | 操作模式固定 |
| Handler API | BDD (Given-When-Then) | 描述业务行为，可读性强 |
| Service 业务逻辑 | BDD + Mock | 复杂流程需要清晰描述 |

### 2.3 依赖管理

```
┌─────────────────────────────────────────────────────────────────────┐
│                        测试依赖                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  数据库：SQLite 内存模式                                             │
│  ├── 驱动：github.com/glebarez/sqlite (纯 Go，无 CGO)               │
│  └── 配置：:memory: 模式，每个测试独立数据库                          │
│                                                                     │
│  断言库：github.com/stretchr/testify                                │
│  ├── assert：断言函数                                               │
│  └── require：失败时立即停止                                         │
│                                                                     │
│  HTTP 测试：net/http/httptest                                       │
│  └── 标准库，无需额外依赖                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 测试环境配置

### 3.1 测试数据库初始化

```go
// internal/database/test_helper.go
package database

import (
    "github.com/ai-chat-notes/backend/internal/models"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// SetupTestDB 创建内存数据库用于测试
func SetupTestDB() *gorm.DB {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Silent),
    })
    if err != nil {
        panic("failed to connect test database")
    }

    // 自动迁移
    db.AutoMigrate(
        &models.User{},
        &models.RefreshToken{},
        &models.Provider{},
        &models.ProviderModel{},
        &models.Conversation{},
        &models.Message{},
        &models.Note{},
        &models.NoteTag{},
        &models.Folder{},
    )

    return db
}

// CleanupTestDB 清理测试数据库
func CleanupTestDB(db *gorm.DB) {
    sqlDB, _ := db.DB()
    sqlDB.Close()
}
```

### 3.2 测试主入口

```go
// main_test.go
package main

import (
    "os"
    "testing"

    "github.com/ai-chat-notes/backend/internal/database"
)

func TestMain(m *testing.M) {
    // 设置测试模式
    os.Setenv("GIN_MODE", "test")

    // 初始化测试数据库（用于需要全局 DB 的测试）
    database.DB = database.SetupTestDB()

    code := m.Run()

    // 清理
    database.CleanupTestDB(database.DB)

    os.Exit(code)
}
```

---

## 4. 各模块测试方案

### 4.1 Crypto 模块

#### 4.1.1 password_test.go

**测试目标**：验证密码哈希和校验功能

| 测试用例 | 描述 | 输入 | 期望结果 |
|----------|------|------|----------|
| TestHashPassword_Normal | 正常密码哈希 | "password123" | 无错误，返回哈希字符串 |
| TestHashPassword_Empty | 空密码 | "" | 无错误，返回哈希 |
| TestHashPassword_Long | 超长密码 | 100 字符 | 无错误，返回哈希 |
| TestHashPassword_Unicode | Unicode 密码 | "密码测试🔐" | 无错误，返回哈希 |
| TestCheckPassword_Correct | 正确密码校验 | 原密码 + 哈希 | true |
| TestCheckPassword_Wrong | 错误密码校验 | 错误密码 + 哈希 | false |
| TestCheckPassword_Empty | 空密码校验 | "" + 哈希 | false |
| TestHashPassword_DifferentSalt | 相同密码不同哈希 | "same" 两次 | 两个不同的哈希 |

```go
// 示例代码结构
func TestHashPassword(t *testing.T) {
    tests := []struct {
        name     string
        password string
        wantErr  bool
    }{
        {"normal password", "password123", false},
        {"empty password", "", false},
        {"unicode password", "密码测试🔐", false},
        // ... more cases
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            hash, err := HashPassword(tt.password)
            // assertions...
        })
    }
}
```

#### 4.1.2 jwt_test.go

**测试目标**：验证 JWT Token 生成和验证

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestGenerateToken_Valid | 生成有效 Token | Token 不为空 |
| TestValidateToken_Valid | 验证有效 Token | 返回正确的 Claims |
| TestValidateToken_Expired | 验证过期 Token | 返回错误 |
| TestValidateToken_Invalid | 验证无效 Token | 返回错误 |
| TestValidateToken_WrongSecret | 错误密钥签名 | 返回错误 |
| TestGenerateRefreshToken | 生成刷新 Token | 格式正确，过期时间合理 |
| TestValidateRefreshToken_Valid | 验证有效刷新 Token | true |
| TestValidateRefreshToken_Expired | 验证过期刷新 Token | false |

#### 4.1.3 aes_test.go

**测试目标**：验证 AES 加密解密功能

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestEncrypt_Normal | 正常加密 | 返回 "enc:" 前缀的密文 |
| TestEncrypt_Empty | 空字符串加密 | 返回空字符串 |
| TestDecrypt_Normal | 正常解密 | 返回原始明文 |
| TestDecrypt_Empty | 空字符串解密 | 返回空字符串 |
| TestDecrypt_NoPrefix | 无前缀密文 | 返回原文（兼容模式） |
| TestDecrypt_InvalidBase64 | 无效 Base64 | 返回错误 |
| TestDecrypt_TooShort | 密文过短 | 返回错误 |
| TestEncryptDecrypt_RoundTrip | 加密解密往返 | 原文 == 解密结果 |
| TestEncrypt_DifferentCiphertext | 相同明文不同密文 | 每次加密结果不同（随机 nonce） |

---

### 4.2 Utils 模块

#### 4.2.1 response_test.go

**测试目标**：验证 HTTP 响应辅助函数

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestSendError | 发送错误响应 | 状态码和 JSON 格式正确 |
| TestSendSuccess | 发送成功响应 | 状态码和 JSON 格式正确 |

---

### 4.3 Repository 模块

#### 4.3.1 user_test.go

**测试目标**：验证用户数据访问层

| 测试用例 | 描述 | 前置条件 | 期望结果 |
|----------|------|----------|----------|
| TestUserRepository_Create | 创建用户 | - | 用户被创建，ID > 0 |
| TestUserRepository_Create_Duplicate | 创建重复邮箱 | 已有同名用户 | 返回错误 |
| TestUserRepository_FindByEmail_Exists | 按邮箱查找-存在 | 用户已存在 | 返回用户 |
| TestUserRepository_FindByEmail_NotExists | 按邮箱查找-不存在 | 用户不存在 | 返回错误 |
| TestUserRepository_FindByID_Exists | 按 ID 查找-存在 | 用户已存在 | 返回用户 |
| TestUserRepository_FindByID_NotExists | 按 ID 查找-不存在 | 用户不存在 | 返回错误 |

```go
// 示例代码结构
func TestUserRepository(t *testing.T) {
    // 每个测试独立的数据库
    db := database.SetupTestDB()
    defer database.CleanupTestDB(db)

    // 替换全局 DB
    originalDB := database.DB
    database.DB = db
    defer func() { database.DB = originalDB }()

    repo := repository.NewUserRepository()

    t.Run("Create", func(t *testing.T) {
        user := &models.User{Email: "test@example.com", PasswordHash: "hash"}
        err := repo.Create(user)
        require.NoError(t, err)
        assert.Greater(t, user.ID, uint(0))
    })
}
```

#### 4.3.2 conversation_test.go

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestConversationRepository_Create | 创建对话 | 成功创建 |
| TestConversationRepository_FindByUserID | 按用户查找 | 返回用户所有对话 |
| TestConversationRepository_FindByIDWithMessages | 查找带消息 | 返回对话和消息列表 |
| TestConversationRepository_FindByIDAndUserID | 按 ID 和用户查找 | 权限验证正确 |
| TestConversationRepository_Update | 更新对话 | 更新成功 |
| TestConversationRepository_Delete | 删除对话 | 删除成功 |
| TestConversationRepository_Delete_WrongUser | 删除他人对话 | 失败或无效果 |

#### 4.3.3 note_test.go

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestNoteRepository_Create | 创建笔记 | 成功创建 |
| TestNoteRepository_FindByUserID | 按用户查找 | 返回笔记列表 |
| TestNoteRepository_FindByUserID_WithFilters | 带过滤条件查找 | 正确过滤 |
| TestNoteRepository_FindByIDAndUserID | 按 ID 查找 | 权限验证 |
| TestNoteRepository_Update | 更新笔记 | 更新成功 |
| TestNoteRepository_Delete | 删除笔记 | 删除成功 |
| TestNoteRepository_BatchDelete | 批量删除 | 全部删除 |
| TestNoteRepository_BatchMove | 批量移动 | 移动成功 |
| TestNoteRepository_CreateTags | 创建标签 | 成功创建 |
| TestNoteRepository_DeleteTags | 删除标签 | 成功删除 |

#### 4.3.4 provider_test.go

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestProviderRepository_Create | 创建 Provider | 成功创建 |
| TestProviderRepository_FindByUserID | 按用户查找 | 返回列表 |
| TestProviderRepository_FindByID | 按 ID 查找 | 正确查找 |
| TestProviderRepository_Update | 更新 Provider | 更新成功 |
| TestProviderRepository_Delete | 删除 Provider | 删除成功 |

---

### 4.4 Handler 模块

#### 4.4.1 auth_test.go

**测试目标**：验证认证 API 端点

| 测试用例 | 描述 | 请求 | 期望响应 |
|----------|------|------|----------|
| TestRegister_Success | 注册成功 | 有效邮箱+密码 | 201, token + user |
| TestRegister_InvalidEmail | 无效邮箱 | "invalid" | 400, 错误信息 |
| TestRegister_ShortPassword | 密码过短 | "123" | 400, 错误信息 |
| TestRegister_DuplicateEmail | 重复邮箱 | 已存在的邮箱 | 409, 错误信息 |
| TestLogin_Success | 登录成功 | 正确凭证 | 200, token + user |
| TestLogin_WrongPassword | 密码错误 | 错误密码 | 401, 错误信息 |
| TestLogin_UserNotFound | 用户不存在 | 不存在的邮箱 | 401, 错误信息 |
| TestRefresh_Success | 刷新成功 | 有效 refresh token | 200, 新 token |
| TestRefresh_Invalid | 无效刷新 | 无效 token | 401, 错误信息 |
| TestLogout_Success | 登出成功 | refresh token | 200, 成功消息 |
| TestGetCurrentUser_Success | 获取当前用户 | 有效 token | 200, 用户信息 |
| TestGetCurrentUser_Unauthorized | 未授权 | 无 token | 401, 错误信息 |

```go
// 示例代码结构
func TestAuthHandler(t *testing.T) {
    // 设置测试环境
    db := setupTestDB()
    defer cleanupTestDB(db)

    router := setupTestRouter(db)
    cfg := &config.Config{JWT: config.JWTConfig{
        Secret:       "test-secret-key-for-testing",
        Expiry:       time.Hour,
        RefreshExpiry: 24 * time.Hour,
    }}

    handler := handlers.NewAuthHandler(crypto.NewJWTService(cfg))

    t.Run("Register should succeed with valid credentials", func(t *testing.T) {
        // Given
        body := `{"email": "test@example.com", "password": "password123"}`

        // When
        w := httptest.NewRecorder()
        req := httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
        req.Header.Set("Content-Type", "application/json")
        router.ServeHTTP(w, req)

        // Then
        assert.Equal(t, http.StatusCreated, w.Code)
        // 更多断言...
    })
}
```

#### 4.4.2 conversation_test.go

| 测试用例 | 描述 | 期望响应 |
|----------|------|----------|
| TestListConversations_Success | 列出对话 | 200, 对话列表 |
| TestListConversations_Empty | 空列表 | 200, 空数组 |
| TestCreateConversation_Success | 创建对话 | 201, 新对话 |
| TestCreateConversation_WithTitle | 带标题创建 | 201, 指定标题 |
| TestGetConversation_Success | 获取对话详情 | 200, 对话+消息 |
| TestGetConversation_NotFound | 对话不存在 | 404 |
| TestGetConversation_Forbidden | 无权访问 | 403 |
| TestUpdateConversation_Success | 更新对话 | 200, 更新后 |
| TestDeleteConversation_Success | 删除对话 | 200 |
| TestSendMessage_Success | 发送消息 | 200, AI 回复 |
| TestSendMessage_Mock | Mock 模式 | 200, Mock 回复 |
| TestGetMessages_Success | 获取消息列表 | 200, 消息列表 |

#### 4.4.3 note_test.go

| 测试用例 | 描述 | 期望响应 |
|----------|------|----------|
| TestListNotes_Success | 列出笔记 | 200, 笔记列表 |
| TestListNotes_WithFolderFilter | 按文件夹过滤 | 200, 过滤结果 |
| TestListNotes_WithTagFilter | 按标签过滤 | 200, 过滤结果 |
| TestListNotes_WithSearch | 搜索 | 200, 搜索结果 |
| TestCreateNote_Success | 创建笔记 | 201, 新笔记 |
| TestCreateNote_WithTags | 带标签创建 | 201, 包含标签 |
| TestGetNote_Success | 获取笔记 | 200, 笔记详情 |
| TestGetNote_NotFound | 笔记不存在 | 404 |
| TestUpdateNote_Success | 更新笔记 | 200, 更新后 |
| TestUpdateNote_Tags | 更新标签 | 200, 新标签 |
| TestDeleteNote_Success | 删除笔记 | 200 |
| TestCopyNote_Success | 复制笔记 | 200, 新笔记 |
| TestExportNote_Success | 导出笔记 | 200, Markdown |
| TestBatchDelete_Success | 批量删除 | 200 |
| TestBatchMove_Success | 批量移动 | 200 |
| TestImportNote_Success | 导入笔记 | 201, 新笔记 |
| TestGenerateNote_Success | AI 生成笔记 | 200, 生成的笔记 |

#### 4.4.4 provider_test.go

| 测试用例 | 描述 | 期望响应 |
|----------|------|----------|
| TestListProviders_Success | 列出 Providers | 200, 列表 |
| TestCreateProvider_Success | 创建 Provider | 201 |
| TestCreateProvider_InvalidAPIKey | 无效 API Key | 400 |
| TestUpdateProvider_Success | 更新 Provider | 200 |
| TestDeleteProvider_Success | 删除 Provider | 200 |

#### 4.4.5 folder_test.go

| 测试用例 | 描述 | 期望响应 |
|----------|------|----------|
| TestListFolders_Success | 列出文件夹（树形） | 200, 树形结构 |
| TestCreateFolder_Success | 创建文件夹 | 201 |
| TestCreateFolder_WithParent | 创建子文件夹 | 201 |
| TestUpdateFolder_Success | 更新文件夹 | 200 |
| TestDeleteFolder_Success | 删除文件夹 | 200 |
| TestDeleteFolder_MoveNotes | 删除时移动笔记 | 200, 笔记移到根目录 |
| TestCopyFolder_Success | 复制文件夹 | 200, 包含笔记 |

---

### 4.5 Services 模块

#### 4.5.1 ai_test.go

**测试目标**：验证 AI 服务（Mock 模式）

| 测试用例 | 描述 | 期望结果 |
|----------|------|----------|
| TestGenerateNote_MockEnabled | Mock 模式生成 | 返回 Mock 数据 |
| TestGenerateNote_NoConversation | 对话不存在 | 返回错误 |
| TestGenerateNote_WrongUser | 无权访问对话 | 返回错误 |

```go
func TestAIService_GenerateNote(t *testing.T) {
    t.Run("should return mock data when mock mode is enabled", func(t *testing.T) {
        // Given
        service := services.NewAIService(nil, true) // mockEnabled = true

        // When
        result, err := service.GenerateNoteFromConversation(context.Background(), 1, 1)

        // Then
        require.NoError(t, err)
        assert.Equal(t, "AI 对话总结 (Mock)", result.Title)
        assert.Contains(t, result.Tags, "mock")
    })
}
```

---

## 5. 测试工具函数

### 5.1 测试辅助函数

```go
// internal/testutil/helper.go
package testutil

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/ai-chat-notes/backend/internal/config"
    "github.com/ai-chat-notes/backend/internal/crypto"
    "github.com/ai-chat-notes/backend/internal/database"
    "github.com/ai-chat-notes/backend/internal/middleware"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/require"
)

// SetupTestDB 初始化测试数据库
func SetupTestDB(t *testing.T) func() {
    db := database.SetupTestDB()
    originalDB := database.DB
    database.DB = db

    return func() {
        database.CleanupTestDB(db)
        database.DB = originalDB
    }
}

// SetupTestRouter 创建测试路由
func SetupTestRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    router := gin.New()
    return router
}

// SetupTestConfig 创建测试配置
func SetupTestConfig() *config.Config {
    return &config.Config{
        JWT: config.JWTConfig{
            Secret:        "test-secret-key-for-unit-testing",
            Expiry:        time.Hour,
            RefreshExpiry: 24 * time.Hour,
        },
    }
}

// MakeAuthenticatedRequest 创建带认证的请求
func MakeAuthenticatedRequest(router *gin.Engine, method, path string, body interface{}, userID uint) *httptest.ResponseRecorder {
    // 生成测试 token
    cfg := SetupTestConfig()
    jwtService := crypto.NewJWTService(cfg)
    user := &models.User{ID: userID, Email: "test@example.com"}
    token, _ := jwtService.GenerateToken(user)

    // 序列化 body
    var bodyReader io.Reader
    if body != nil {
        jsonBody, _ := json.Marshal(body)
        bodyReader = bytes.NewReader(jsonBody)
    }

    // 创建请求
    req := httptest.NewRequest(method, path, bodyReader)
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+token)

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    return w
}

// CreateTestUser 创建测试用户
func CreateTestUser(t *testing.T, email, password string) *models.User {
    user := &models.User{
        Email:        email,
        PasswordHash: password,
    }
    err := database.DB.Create(user).Error
    require.NoError(t, err)
    return user
}

// AssertJSONResponse 断言 JSON 响应
func AssertJSONResponse(t *testing.T, w *httptest.ResponseRecorder, expectedStatus int, expectedFields map[string]interface{}) {
    require.Equal(t, expectedStatus, w.Code)

    var response map[string]interface{}
    err := json.Unmarshal(w.Body.Bytes(), &response)
    require.NoError(t, err)

    for key, expectedValue := range expectedFields {
        actualValue, exists := response[key]
        require.True(t, exists, "field %s should exist", key)
        require.Equal(t, expectedValue, actualValue, "field %s should equal", key)
    }
}
```

### 5.2 Test Fixture 数据

```go
// internal/testutil/fixtures.go
package testutil

import (
    "github.com/ai-chat-notes/backend/internal/models"
    "github.com/google/uuid"
)

// Fixtures 测试数据
var TestUser = models.User{
    Email:        "test@example.com",
    PasswordHash: "$2a$12$...", // "password123" 的哈希
}

var TestProvider = models.Provider{
    Name:             "Test Provider",
    APIBase:          "https://api.example.com",
    APIKeyEncrypted:  "enc:...",
}

func NewTestConversation(userID uint) *models.Conversation {
    modelID := uuid.New()
    return &models.Conversation{
        UserID:          userID,
        ProviderModelID: &modelID,
        Title:           "Test Conversation",
    }
}

func NewTestNote(userID uint) *models.Note {
    return &models.Note{
        UserID:  userID,
        Title:   "Test Note",
        Content: "# Test Content\n\nThis is a test note.",
    }
}
```

---

## 6. 测试执行计划

### 6.1 实施顺序

```
Phase 1: 基础设施 (Day 1)
├── 创建测试工具函数 (testutil)
├── 配置 SQLite 测试数据库
└── 编写测试主入口

Phase 2: 单元测试 (Day 1-2)
├── crypto/password_test.go
├── crypto/jwt_test.go
├── crypto/aes_test.go
└── utils/response_test.go

Phase 3: Repository 集成测试 (Day 2-3)
├── repository/user_test.go
├── repository/conversation_test.go
├── repository/note_test.go
├── repository/provider_test.go
└── repository/*_test.go (其他)

Phase 4: Handler API 测试 (Day 3-4)
├── handlers/auth_test.go
├── handlers/conversation_test.go
├── handlers/note_test.go
├── handlers/provider_test.go
└── handlers/provider_model_test.go

Phase 5: Service 测试 (Day 4)
└── services/ai_test.go
```

### 6.2 运行测试

```bash
# 运行所有测试
go test ./... -v

# 运行特定包的测试
go test ./internal/crypto/... -v

# 运行带覆盖率
go test ./... -coverprofile=coverage.out

# 查看覆盖率报告
go tool cover -html=coverage.out

# 按覆盖率排序
go tool cover -func=coverage.out | sort -k2 -n
```

### 6.3 CI 集成

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.25'

      - name: Run tests
        run: |
          cd backend
          go test ./... -v -coverprofile=coverage.out

      - name: Check coverage
        run: |
          cd backend
          COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 80" | bc) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

---

## 7. 测试规范

### 7.1 命名规范

- 测试文件：`<原文件名>_test.go`
- 测试函数：`Test<功能>_<场景>`
- 子测试：描述性名称，如 "should return error when email is invalid"

### 7.2 代码规范

1. **每个测试独立**：不依赖其他测试的状态
2. **清理资源**：使用 `defer` 或 `t.Cleanup()` 清理
3. **明确断言**：使用有意义的断言消息
4. **避免 sleep**：使用条件等待或 mock

### 7.3 Table-Driven 模板

```go
func TestFunction(t *testing.T) {
    tests := []struct {
        name    string
        input   InputType
        want    OutputType
        wantErr bool
    }{
        {
            name:    "description of test case",
            input:   InputType{...},
            want:    OutputType{...},
            wantErr: false,
        },
        // more cases...
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Function(tt.input)
            if tt.wantErr {
                require.Error(t, err)
            } else {
                require.NoError(t, err)
                require.Equal(t, tt.want, got)
            }
        })
    }
}
```

### 7.4 BDD 模板

```go
func TestFeature(t *testing.T) {
    t.Run("scenario description", func(t *testing.T) {
        // Given (准备)
        db := setupTestDB(t)
        user := createTestUser(t, db)

        // When (执行)
        result, err := someFunction(user.ID)

        // Then (断言)
        require.NoError(t, err)
        assert.Equal(t, expectedValue, result)
    })
}
```

---

## 8. 预期覆盖率分布

| 模块 | 预期覆盖率 | 备注 |
|------|------------|------|
| crypto/* | 95%+ | 纯函数，易于测试 |
| utils/* | 90%+ | 简单工具函数 |
| repository/* | 80%+ | 核心 CRUD 操作 |
| handlers/* | 75%+ | 主要 API 路径 |
| services/* | 70%+ | Mock 模式测试 |
| **总计** | **80%** | 目标覆盖率 |

---

## 附录：依赖安装

```bash
cd backend

# 安装测试依赖
go get github.com/stretchr/testify
go get github.com/glebarez/sqlite

# tidy
go mod tidy
```
