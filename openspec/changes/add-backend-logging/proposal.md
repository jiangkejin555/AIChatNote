## Why

后端代码当前日志覆盖率极低（约 3%），导致问题排查困难、无法追踪用户操作、缺乏性能监控数据。关键业务流程如用户认证、AI 对话、笔记管理等均无日志记录，严重影响运维效率和问题定位能力。

## What Changes

- 在所有 Handler 层添加操作日志（开始/成功/失败）
- 在关键业务流程添加详细日志（用户认证、AI 调用、数据操作）
- 在 Middleware 层添加认证日志（Token 验证成功/失败）
- 在 Service 层添加外部调用日志（AI API 调用、耗时）
- 建立统一的日志格式规范（模块名、操作、关键参数）
- 对敏感信息进行脱敏处理（API Key、密码等）

## Capabilities

### New Capabilities

- `backend-logging`: 后端日志系统，定义日志格式、级别、脱敏规则和各模块日志要求

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

### 影响的代码文件

**Handlers 层**
- `internal/handlers/auth.go` - 添加认证相关日志
- `internal/handlers/conversation.go` - 添加对话和 AI 调用日志
- `internal/handlers/note.go` - 补充笔记操作日志
- `internal/handlers/provider.go` - 添加 Provider 管理日志
- `internal/handlers/folder.go` - 添加文件夹操作日志

**Middleware 层**
- `internal/middleware/auth.go` - 添加认证中间件日志

**Services 层**
- `internal/services/ai.go` - 添加 AI 服务调用日志

### 不需要修改

- Repository 层 - 保持简洁，错误在 Handler 层统一记录
- Models 层 - 无需日志
- 现有 API 接口 - 无变化

### 日志输出

- 使用 Go 标准库 `log` 包
- 输出到标准输出（容器环境友好）
- 格式：`[模块名] 操作名: key=value, key=value`
