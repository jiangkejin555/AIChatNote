## Why

当前系统的模型管理采用扁平结构（一个配置 = 一个模型），存在以下问题：
1. 同一提供商的多个模型需要重复配置 API Key
2. 无法动态获取提供商支持的模型列表
3. 缺少预设提供商配置，用户配置门槛高

通过引入 Provider-Model 分层结构，可以：
- 一次配置 API Key，管理多个模型
- 动态从 API 获取可用模型列表
- 提供预设提供商模板，降低配置门槛

## What Changes

- **新增** Provider（提供商）数据模型和 API
- **新增** ProviderModel（提供商模型）数据模型和 API
- **新增** 动态获取可用模型的 API
- **新增** 预设提供商配置（OpenAI、火山引擎、深度求索、Anthropic、Google Gemini、月之暗面、智谱AI、自定义）
- **新增** 前端提供商管理页面
- **新增** 前端 API 客户端和类型定义
- **修改** 对话创建 API，使用 provider_model_id 替代 model_id
- **BREAKING** 移除旧的 `/models` API（迁移至新的 Provider-Model 结构）

## Capabilities

### New Capabilities

- `provider-management`: 提供商管理功能，包括创建、编辑、删除提供商，配置 API Key 和 Base URL
- `provider-model-selection`: 提供商模型选择功能，支持动态获取可用模型列表，多选模型配置

### Modified Capabilities

- `model-management`: 数据模型从扁平结构变更为 Provider-Model 分层结构，API 接口完全重构

## Impact

- **后端 API**：新增 Provider 和 ProviderModel 相关 API，移除旧 Model API
- **数据库**：新增 providers 和 provider_models 表，迁移旧 models 数据
- **前端**：重构模型管理页面，更新类型定义和 API 客户端
- **聊天功能**：对话创建时使用新的 provider_model_id
