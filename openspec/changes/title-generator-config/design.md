## Context

当前系统中，`generateTitleWithAI` 函数使用用户选择的对话模型来生成标题。当用户选择推理模型（如 deepseek-reasoner）时，由于推理模型的 token 预算主要用于内部推理，导致标题生成失败（`finish_reason: "length"`, `content: ""`）。

系统已有的配置结构：
- `Config` 结构体通过 YAML 文件加载
- 支持环境变量覆盖（如 `JWT_SECRET` 覆盖 `jwt.secret`）
- `ConversationHandler` 当前只接收 `mockEnabled` 参数，不持有 config 引用

## Goals / Non-Goals

**Goals:**
- 提供独立的标题生成器配置，与用户选择的对话模型解耦
- 支持 YAML 配置和环境变量覆盖（环境变量优先）
- 配置未启用时使用简单 fallback（前 10 字符 + "..."）
- 最小化对现有代码的改动

**Non-Goals:**
- 不提供数据库存储的配置方式
- 不支持通过 UI 配置标题生成器
- 不修改现有的 provider/model 管理功能

## Decisions

### 1. 配置结构设计

**决策**: 新增 `TitleGeneratorConfig` 结构体，包含完整的 API 配置

```go
type TitleGeneratorConfig struct {
    Enabled   bool   `yaml:"enabled"`
    APIBase   string `yaml:"api_base"`
    APIKey    string `yaml:"api_key"`
    Model     string `yaml:"model"`
    MaxTokens int    `yaml:"max_tokens"`
}
```

**原因**: 完全独立于数据库中的 provider 配置，避免循环依赖。用户可能使用不同的 API Key 或 API Base 用于标题生成。

**备选方案**:
- 只配置 Model ID，引用数据库中的 provider → 需要数据库预先配置，增加耦合
- 使用固定的 fallback 逻辑 → 无法利用 AI 生成更好的标题

### 2. 配置优先级

**决策**: YAML 配置作为默认值，环境变量可覆盖

| 配置项 | YAML 字段 | 环境变量 |
|--------|-----------|----------|
| 是否启用 | `title_generator.enabled` | `TITLE_GENERATOR_ENABLED` |
| API Base | `title_generator.api_base` | `TITLE_GENERATOR_API_BASE` |
| API Key | `title_generator.api_key` | `TITLE_GENERATOR_API_KEY` |
| Model | `title_generator.model` | `TITLE_GENERATOR_MODEL` |
| Max Tokens | `title_generator.max_tokens` | `TITLE_GENERATOR_MAX_TOKENS` |

**原因**: 与现有配置模式保持一致（参见 `applyEnvOverrides` 函数）

### 3. Handler 依赖注入

**决策**: 修改 `ConversationHandler` 构造函数，注入完整的 `Config`

```go
func NewConversationHandler(cfg *config.Config, aesCrypto *crypto.AESCrypto) *ConversationHandler
```

**原因**: `generateTitleWithAI` 需要访问 `TitleGeneratorConfig`，通过依赖注入比全局变量更清晰

### 4. Fallback 策略

**决策**: 当标题生成器未配置或调用失败时，使用 "前 10 字符 + ..." 格式

**原因**: 简单可靠，不依赖外部服务

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| API Key 在 YAML 中明文存储 | 推荐使用环境变量 `TITLE_GENERATOR_API_KEY` |
| 标题生成 API 调用失败 | 已有 fallback 机制，不影响主流程 |
| 新增配置增加运维复杂度 | 配置为可选，不配置时使用 fallback |
