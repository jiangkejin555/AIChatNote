## Why

后端代码中有多处依赖 LLM API（DeepSeek、用户配置的 Provider），但在开发和测试环境中往往没有可用的 API Key。目前如果未配置 API Key，相关功能会直接返回错误或 503 状态，无法进行端到端测试。

需要添加一个 Mock 模式开关，开启后所有 LLM 调用返回预设的 Mock 数据，方便在无 API Key 环境下进行功能测试和前端联调。

## What Changes

- 新增全局 Mock 模式配置项（config.yaml + 环境变量覆盖）
- AIService 支持 Mock 模式，返回固定的笔记生成结果
- ConversationHandler 支持 Mock 模式，返回固定的对话响应（支持流式和非流式）
- 启动时日志提示 Mock 模式状态

## Capabilities

### New Capabilities

- `mock-mode`: 全局 Mock 模式配置，用于控制所有 LLM 调用是否使用 Mock 数据返回

### Modified Capabilities

（无现有 capability 的需求变更）

## Impact

- **配置文件**: `config.yaml` 新增 `mock.enabled` 字段
- **代码文件**:
  - `internal/config/config.go` - 新增 MockConfig 结构
  - `internal/services/ai.go` - AIService 添加 Mock 支持
  - `internal/handlers/conversation.go` - ConversationHandler 添加 Mock 支持
  - `cmd/server/main.go` - 传递 Mock 配置
- **环境变量**: 新增 `MOCK_ENABLED` 支持覆盖配置
- **API 行为**: Mock 模式下 `/notes/generate`、`/conversations/:id/messages`、`/conversations/:id/messages/:id/regenerate` 返回固定数据
