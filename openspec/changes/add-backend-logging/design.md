## Context

### 当前状态
- 后端使用 Go 标准库 `log` 包
- 日志仅在 `main.go`（启动）和 `note.go`（部分错误）存在
- 关键业务流程无日志追踪
- 无统一的日志格式规范

### 约束
- 保持简单，不引入新的日志框架依赖
- 日志输出到 stdout，适配容器环境
- 不能影响性能，敏感信息必须脱敏
- 不修改现有 API 接口

## Goals / Non-Goals

**Goals:**
- 建立统一的日志格式规范
- 在所有 Handler 的关键节点添加日志
- 在 Middleware 层记录认证状态
- 在 Service 层记录外部调用（AI API）
- 敏感信息脱敏（API Key、密码、Token）

**Non-Goals:**
- 不引入结构化日志库（zap、zerolog 等）
- 不在 Repository 层添加日志
- 不实现日志分级（Debug/Info/Error）
- 不实现日志聚合或分析系统

## Decisions

### 1. 使用标准库 log 包

**选择**: 继续使用 Go 标准库 `log`

**原因**:
- 项目规模小，不需要结构化日志
- 无需引入新依赖
- stdout 输出天然适配 Docker/K8s

**替代方案**:
- zap/zerolog：性能更好，但对当前项目过度设计

### 2. 日志格式规范

**选择**: 统一前缀格式 `[ModuleName] Operation:`

```
[AuthHandler] Login success: userID=1, email=user@example.com
[ConversationHandler] SendMessage: convID=1, provider=openai, model=gpt-4, latency=1500ms
[AuthMiddleware] Token validation failed: reason=expired
```

**原因**:
- 可读性好，易于 grep 过滤
- 模块名便于定位代码位置
- key=value 格式便于提取信息

### 3. 日志粒度

**选择**: Handler/Service/Middleware 三层

| 层级 | 记录内容 |
|------|---------|
| Handler | 操作开始、成功、失败、业务参数 |
| Service | 外部调用、耗时、错误 |
| Middleware | 认证状态、验证失败原因 |

**不在 Repository 层记录**：
- Repository 层错误已在 Handler 层统一记录
- 避免日志冗余

### 4. 敏感信息脱敏

**选择**: 手动脱敏关键信息

```go
// API Key 脱敏
func maskAPIKey(key string) string {
    if len(key) <= 8 {
        return "****"
    }
    return key[:4] + "****" + key[len(key)-4:]
}

// Token 脱敏
func maskToken(token string) string {
    if len(token) <= 16 {
        return "****"
    }
    return token[:8] + "****"
}
```

**脱敏规则**:
- API Key: 显示前4后4位，中间用 **** 替代
- Token: 显示前8位，后面用 **** 替代
- 密码: 完全不记录

### 5. 耗时记录

**选择**: 关键外部调用记录耗时

```go
start := time.Now()
// ... external call
latency := time.Since(start)
log.Printf("[ConversationHandler] AI call completed: provider=%s, latency=%dms", provider, latency.Milliseconds())
```

**记录场景**:
- AI API 调用
- 外部 Provider 连接测试
- 大批量数据操作（导出、批量删除）

## Risks / Trade-offs

### Risk 1: 日志量增加影响性能
**Mitigation**: 仅在关键节点记录，避免循环中记录日志

### Risk 2: 敏感信息泄露
**Mitigation**:
- 严格使用脱敏函数
- Code Review 检查
- 密码字段永不记录

### Risk 3: 日志格式不一致
**Mitigation**: 提供格式模板，按模块统一实现

## Migration Plan

### 阶段 1: 基础设施（Day 1）
1. 创建 `internal/utils/logger.go` 工具函数
2. 实现脱敏函数

### 阶段 2: 认证模块（Day 1）
1. 添加 `middleware/auth.go` 日志
2. 添加 `handlers/auth.go` 日志

### 阶段 3: 核心业务（Day 2）
1. 添加 `handlers/conversation.go` 日志
2. 添加 `services/ai.go` 日志

### 阶段 4: 其他模块（Day 2）
1. 添加 `handlers/provider.go` 日志
2. 补充 `handlers/note.go` 日志

### 回滚策略
日志添加是增量修改，可按模块独立回滚，不影响功能。
