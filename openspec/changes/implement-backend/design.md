## Context

前端已完成开发，使用 Next.js + TypeScript + Zustand，目前所有 API 调用都使用 Mock 数据。需要实现一个 Go 后端服务，提供 RESTful API 和 SSE 流式聊天功能。

**约束条件**:
- 必须与前端已定义的 API 契约完全兼容（见 `docs/api.yaml`）
- 笔记内容存储格式为 Markdown（非 HTML）
- 笔记 AI 总结使用系统配置的 DeepSeek API Key
- API Key 必须加密存储

**利益相关者**:
- 前端开发者（需要稳定的 API 契约）
- 终端用户（需要安全、快速的服务）

## Goals / Non-Goals

**Goals:**
- 实现完整的 RESTful API，与 `docs/api.yaml` 定义完全兼容
- 实现安全的用户认证（JWT + Refresh Token）
- 实现 SSE 流式聊天，支持多种 LLM 提供商
- 实现 API Key AES-256-GCM 加密存储
- 实现笔记 AI 自动总结功能
- 实现 PostgreSQL 全文搜索
- 提供 Docker Compose 本地开发环境

**Non-Goals:**
- 不实现 WebSocket（使用 SSE 即可）
- 不实现用户权限系统（单用户场景）
- 不实现 API 限流（MVP 阶段）
- 不实现分布式部署（单体应用即可）

## Decisions

### 1. 项目结构：分层架构

**选择**: 采用 Handler → Service → Repository 三层架构

**原因**:
- 清晰的职责分离
- 便于单元测试（可 mock 每一层）
- 符合 Go 项目最佳实践

**目录结构**:
```
backend/
├── cmd/server/main.go        # 入口
├── internal/
│   ├── config/               # 配置
│   ├── handlers/             # HTTP handlers
│   ├── services/             # 业务逻辑
│   ├── repository/           # 数据访问
│   ├── models/               # GORM 模型
│   ├── middleware/           # 中间件
│   ├── crypto/               # 加密模块
│   └── utils/                # 工具函数
├── migrations/               # SQL 迁移
└── docker-compose.yml
```

### 2. 数据库主键策略

**选择**: 混合使用 SERIAL 和 UUID
- `users`, `conversations`, `messages`, `notes`, `folders` 使用 SERIAL（自增整数）
- `providers`, `provider_models` 使用 UUID

**原因**:
- SERIAL 便于调试，性能好，适合内部实体
- UUID 适合可能需要跨系统共享的实体（提供商配置）
- 与 `docs/database.sql` 保持一致

### 3. JWT 认证方案

**选择**: Access Token + Refresh Token 双令牌机制

**参数**:
- Access Token: HS256, 24h 有效期
- Refresh Token: 随机字符串, 7d 有效期, 存储于数据库

**原因**:
- Access Token 短期有效，减少泄露风险
- Refresh Token 支持无感知续期
- 数据库存储支持主动撤销

**替代方案考虑**:
- ~~仅 Access Token~~: 无法主动撤销，安全性较低
- ~~RS256 非对称加密~~: 单体应用不需要，增加复杂度

### 4. API Key 加密方案

**选择**: AES-256-GCM

**实现**:
- 32 字节密钥（从环境变量获取）
- 每次加密使用随机 nonce
- 密文格式: `enc:` + base64(nonce + ciphertext)
- GCM 模式提供认证，防篡改

**原因**:
- AES 是业界标准对称加密算法
- GCM 模式同时提供加密和认证
- 随机 nonce 保证相同明文产生不同密文

### 5. 流式聊天实现

**选择**: Server-Sent Events (SSE)

**实现**:
- 前端发送 `Accept: text/event-stream`
- 后端调用 LLM API 时 `stream: true`
- 实时转发 OpenAI 格式的 SSE 数据
- 流结束后保存完整消息到数据库

**原因**:
- SSE 比 WebSocket 更简单，适合单向数据流
- 前端已有 SSE 解析逻辑
- 与 OpenAI API 响应格式兼容

**替代方案考虑**:
- ~~WebSocket~~: 过于复杂，需要双向通信场景
- ~~长轮询~~: 延迟高，资源浪费

### 6. 笔记 AI 总结

**选择**: 使用系统配置的 DeepSeek API Key

**原因**:
- 用户无需额外配置即可使用
- DeepSeek 成本低、效果好
- 统一管理便于监控和控制成本

**Prompt 设计**:
- 输入: 完整对话历史
- 输出: JSON 格式（title, content, tags）
- 使用 JSON 模式确保解析稳定

### 7. 全文搜索

**选择**: PostgreSQL 内置 tsvector + GIN 索引

**原因**:
- 无需引入额外依赖（如 Elasticsearch）
- 数据量预期不大，PG 搜索足够
- 触发器自动更新搜索向量

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| LLM API 调用失败 | 返回友好错误信息，支持重新生成 |
| API Key 泄露 | AES 加密存储，环境变量管理密钥 |
| 流式响应中断 | 前端支持重连，后端超时控制 60s |
| 数据库迁移 | 使用版本化 SQL 脚本，支持回滚 |
| JWT 密钥泄露 | 环境变量存储，定期轮换 |
| DeepSeek API 限流 | 添加重试机制，显示加载状态 |

## Migration Plan

1. **开发阶段**: 使用 Docker Compose 启动本地 PostgreSQL
2. **测试阶段**: 部署到测试环境，前端切换 `USE_MOCK = false`
3. **生产部署**:
   - 启动后端服务
   - 运行数据库迁移
   - 配置环境变量
   - 更新前端 API URL

**回滚策略**:
- 前端可快速切换回 `USE_MOCK = true`
- 数据库迁移使用可逆脚本

## Open Questions

无（所有关键决策已在设计文档中确定）
