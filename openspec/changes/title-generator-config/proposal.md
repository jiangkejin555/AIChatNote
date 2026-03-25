## Why

当用户选择推理模型（如 deepseek-reasoner）进行对话时，系统使用该模型自动生成对话标题。但推理模型的 token 预算大部分用于内部推理过程，导致实际输出为空，标题生成失败。

需要一个独立配置的标题生成器，使用轻量级模型（如 deepseek-chat）专门处理标题生成任务，避免推理模型的兼容性问题，同时降低成本。

## What Changes

- 新增 `TitleGeneratorConfig` 配置结构，支持独立配置 API Base、API Key、Model、Max Tokens
- 配置支持 YAML 文件和环境变量两种方式，环境变量优先级更高
- 修改 `generateTitleWithAI` 函数，使用独立配置而非用户选择的对话模型
- 当标题生成器未配置或禁用时，fallback 为 "前 10 字符 + ..." 格式

## Capabilities

### New Capabilities

- `title-generator`: 独立的对话标题生成器配置，支持通过 YAML 或环境变量配置专用的 AI 模型来生成对话标题

### Modified Capabilities

（无现有 capability 需要修改）

## Impact

- **配置文件**: `config.yaml` 新增 `title_generator` 配置块
- **代码文件**:
  - `backend/internal/config/config.go` - 新增 `TitleGeneratorConfig` 结构体
  - `backend/internal/handlers/conversation.go` - 修改 `generateTitleWithAI` 逻辑
- **环境变量**: 新增 `TITLE_GENERATOR_*` 系列环境变量
