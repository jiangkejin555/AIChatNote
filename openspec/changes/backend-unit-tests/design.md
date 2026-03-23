## Context

后端采用 Gin + GORM + PostgreSQL 技术栈，代码结构为：
- **Handlers** - HTTP 请求处理
- **Repository** - 数据访问层（直接使用全局 `database.DB`）
- **Services** - 业务逻辑（AI 服务等）
- **Crypto/Utils** - 工具函数

当前代码特点：
1. Repository 直接依赖全局 `database.DB` 变量
2. Handler 在构造函数中直接 new Repository
3. 无接口抽象，紧耦合

这些特点决定了我们需要选择合适的测试策略，避免大规模重构。

## Goals / Non-Goals

**Goals:**
- 建立完整的测试体系，覆盖率目标 80%
- 测试执行速度快（< 30 秒）
- 测试代码易于维护和扩展
- 无需外部依赖（Docker、真实数据库）即可运行测试

**Non-Goals:**
- 不修改现有业务代码结构（不引入接口抽象）
- 不追求 100% 覆盖率（性价比低）
- 不做 E2E 端到端测试（超出范围）

## Decisions

### D1: 测试数据库选择 - SQLite 内存模式

**决定**: 使用 `github.com/glebarez/sqlite` 作为测试数据库

**理由:**
- 纯 Go 实现，无 CGO 依赖，跨平台兼容
- `:memory:` 模式，测试间完全隔离
- GORM 原生支持，与 PostgreSQL 兼容性高
- 每个测试独立数据库，无状态污染

**替代方案:**
- ❌ testcontainers + PostgreSQL：需要 Docker，启动慢
- ❌ go-sqlmock：Mock SQL 行为复杂，维护成本高

### D2: 测试分层策略

```
┌─────────────────────────────────────────┐
│           测试金字塔                     │
├─────────────────────────────────────────┤
│     ▲                                   │
│    ╱ ╲      API 集成测试                 │
│   ╱   ╲     (httptest + SQLite)         │
│  ╱─────╲    Handlers 层                  │
│ ╱       ╲                                │
│╱  集成测试 ╲  SQLite 内存数据库           │
│  Repository   Repository 层              │
│╲           ╱                             │
│ ╲─────────╱                              │
│  ╲       ╱   单元测试                    │
│   ╲─────╱    crypto/utils               │
│    单元测试  纯函数，无依赖               │
└─────────────────────────────────────────┘
```

**比例**: 单元测试 60% : 集成测试 30% : API 测试 10%

### D3: 测试风格选择

| 层级 | 风格 | 原因 |
|------|------|------|
| crypto/utils | Table-Driven | 纯函数，输入输出明确 |
| repository | Table-Driven | CRUD 操作模式固定 |
| handlers | BDD | 描述业务行为，可读性强 |
| services | BDD + Mock | 复杂流程需要清晰描述 |

### D4: Handler 测试方式 - httptest

**决定**: 使用 `net/http/httptest` 模拟 HTTP 请求

**理由:**
- 标准库，无额外依赖
- 不需要启动真实服务
- 不监听端口，直接调用 `ServeHTTP`
- 测试速度快

**示例结构:**
```go
func TestLogin(t *testing.T) {
    router := setupTestRouter()
    req := httptest.NewRequest("POST", "/login", body)
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)  // 直接调用，无网络
    assert.Equal(t, 200, w.Code)
}
```

### D5: 测试隔离策略

**每个测试独立:**
1. 创建新的 SQLite 内存数据库
2. 运行 GORM 自动迁移
3. 执行测试
4. 关闭数据库连接

**实现方式:**
```go
func setupTestDB(t *testing.T) func() {
    db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    db.AutoMigrate(&models.User{}, ...)
    originalDB := database.DB
    database.DB = db
    return func() {
        database.DB = originalDB
        sqlDB, _ := db.DB()
        sqlDB.Close()
    }
}
```

### D6: 断言库选择

**决定**: 使用 `github.com/stretchr/testify`

**理由:**
- Go 社区最流行的断言库
- `assert` - 普通断言
- `require` - 失败时立即停止
- 丰富的断言函数

## Risks / Trade-offs

### R1: SQLite 与 PostgreSQL 行为差异

**风险**: SQLite 与 PostgreSQL 在某些 SQL 语法和行为上存在差异

**缓解措施:**
- 核心业务逻辑测试不受影响
- 复杂 SQL 查询（如 JSON 操作）可跳过或用真实数据库测试
- 文档中记录已知差异

### R2: 全局 database.DB 变量竞争

**风险**: 并行测试可能因全局变量产生竞争

**缓解措施:**
- 使用 `-p 1` 限制并行度
- 或使用 `t.Parallel()` 精确控制并行范围
- 每个测试独立设置/恢复全局变量

### R3: 测试数据管理复杂度

**风险**: 随着测试增多，Fixtures 管理可能变复杂

**缓解措施:**
- 提供 `CreateTestUser` 等辅助函数
- 使用 Builder 模式构建复杂对象
- 保持 Fixtures 简单，按需创建

## Migration Plan

不涉及生产环境迁移，仅需：

1. 安装测试依赖
```bash
go get github.com/stretchr/testify
go get github.com/glebarez/sqlite
```

2. 运行测试
```bash
go test ./... -v
```

3. CI 集成（可选）
```yaml
- name: Run tests
  run: cd backend && go test ./... -coverprofile=coverage.out
```

## Open Questions

1. **是否需要覆盖率门槛？**
   - 建议：CI 中设置 80% 门槛，低于则失败

2. **是否需要性能基准测试？**
   - 当前不包含，后续可添加 Benchmark 测试

3. **是否需要 Mock AI API 调用？**
   - 已有 `mockEnabled` 标志，使用 Mock 模式即可
