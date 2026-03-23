## Context

当前后端有两处 LLM 调用点：
1. **AIService** (`internal/services/ai.go`) - 用于从对话生成笔记摘要，使用全局配置的 DeepSeek API Key
2. **ConversationHandler** (`internal/handlers/conversation.go`) - 用于对话聊天，使用用户在数据库中配置的 Provider API Key

两者目前都没有 Mock 支持，在无 API Key 环境下无法工作。

## Goals / Non-Goals

**Goals:**
- 添加全局 Mock 开关，可通过 config.yaml 配置或环境变量 `MOCK_ENABLED` 覆盖
- AIService 的 `GenerateNoteFromConversation` 在 Mock 模式下返回固定笔记数据
- ConversationHandler 的 `SendMessage` 和 `Regenerate` 在 Mock 模式下返回固定响应（支持流式和非流式）
- 启动时日志清晰显示 Mock 模式状态

**Non-Goals:**
- 不实现延迟模拟（Mock 响应立即返回）
- 不实现基于输入内容的动态 Mock
- 不修改现有非 LLM 相关功能

## Decisions

### D1: 配置方式 - config.yaml + 环境变量覆盖

**决定**: 在 config.yaml 中添加 `mock.enabled` 字段，同时支持环境变量 `MOCK_ENABLED` 覆盖

**理由**:
- config.yaml 方便本地开发持久化配置
- 环境变量方便 CI/CD 和容器化部署时动态切换
- 与现有配置模式保持一致（参考 `applyEnvOverrides` 的实现）

**配置结构**:
```yaml
mock:
  enabled: false  # 默认关闭
```

### D2: Mock 数据 - 固定响应

**决定**: 使用硬编码的固定字符串作为 Mock 响应

**理由**:
- 简单直接，无需额外依赖
- 固定响应便于前端开发和自动化测试
- 不需要模拟延迟，响应立即返回

**Mock 数据**:
- 笔记生成: 返回包含标题、Markdown 内容、标签的固定 JSON
- 对话响应: 返回固定的提示文本，说明这是 Mock 数据

### D3: 实现位置 - 在现有代码中添加分支

**决定**: 不引入新抽象层，在现有代码中直接添加 `if mockEnabled` 分支

**理由**:
- 改动范围最小，风险低
- 不影响现有代码结构
- Mock 是临时测试手段，不需要过度设计

**替代方案**: 引入 `AIProvider` 接口 + `MockProvider` / `RealProvider` 实现
- **不选择理由**: 对于简单的 Mock 需求来说过度设计，增加维护成本

### D4: 流式响应 - 模拟 SSE 格式

**决定**: Mock 流式响应按字符拆分，模拟真实 SSE 数据格式

**理由**:
- 前端流式处理逻辑可以正常测试
- 保持与非 Mock 模式一致的 API 契约

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Mock 模式被误开启到生产环境 | 默认值设为 `false`，日志启动时醒目提示 |
| 固定响应无法覆盖所有测试场景 | 文档说明 Mock 模式仅用于基础功能验证，复杂场景仍需真实 API |

## Migration Plan

1. 部署新代码后，Mock 模式默认关闭，不影响现有行为
2. 测试环境设置 `MOCK_ENABLED=true` 环境变量启用 Mock
3. 无需数据迁移
