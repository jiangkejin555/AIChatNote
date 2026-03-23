## Why

后端核心功能开发已完成，但缺乏自动化测试保障。为了确保代码质量、预防回归问题、并为后续迭代提供信心，需要建立完整的单元测试体系。目标覆盖率达到 **80%**。

## What Changes

### 新增测试文件

**Crypto 模块（单元测试）**
- `internal/crypto/password_test.go` - 密码哈希和校验测试
- `internal/crypto/jwt_test.go` - JWT Token 生成和验证测试
- `internal/crypto/aes_test.go` - AES 加密解密测试

**Utils 模块（单元测试）**
- `internal/utils/response_test.go` - HTTP 响应辅助函数测试

**Repository 模块（集成测试）**
- `internal/repository/user_test.go`
- `internal/repository/refresh_token_test.go`
- `internal/repository/conversation_test.go`
- `internal/repository/note_test.go`
- `internal/repository/folder_test.go`
- `internal/repository/provider_test.go`
- `internal/repository/provider_model_test.go`
- `internal/repository/tag_test.go`

**Handler 模块（API 集成测试）**
- `internal/handlers/auth_test.go`
- `internal/handlers/conversation_test.go`
- `internal/handlers/note_test.go`
- `internal/handlers/provider_test.go`
- `internal/handlers/provider_model_test.go`

**Services 模块（Mock 测试）**
- `internal/services/ai_test.go`

### 新增测试基础设施

- `internal/testutil/helper.go` - 测试辅助函数（数据库初始化、请求构建等）
- `internal/testutil/fixtures.go` - 测试数据 Fixtures

### 新增依赖

- `github.com/stretchr/testify` - 断言和 Mock 库
- `github.com/glebarez/sqlite` - 纯 Go SQLite 驱动（用于内存测试数据库）

## Capabilities

### New Capabilities

- `testing-infrastructure`: 测试基础设施，包括测试数据库配置、辅助函数、Fixtures
- `crypto-tests`: Crypto 模块的完整单元测试
- `repository-tests`: Repository 层的集成测试（SQLite 内存数据库）
- `handler-tests`: Handler 层的 API 集成测试（httptest + SQLite）
- `service-tests`: Service 层的 Mock 测试

### Modified Capabilities

无修改的 Capabilities（纯新增测试，不改变现有功能行为）

## Impact

### 代码影响

| 模块 | 影响程度 | 说明 |
|------|----------|------|
| crypto/* | 无改动 | 仅新增测试 |
| utils/* | 无改动 | 仅新增测试 |
| repository/* | 无改动 | 仅新增测试 |
| handlers/* | 无改动 | 仅新增测试 |
| services/* | 无改动 | 仅新增测试 |

### 依赖影响

- 新增 `github.com/stretchr/testify` 测试依赖
- 新增 `github.com/glebarez/sqlite` 测试依赖

### 系统影响

- 无生产环境影响
- CI 流程可集成测试执行
- 预期测试执行时间 < 30 秒
