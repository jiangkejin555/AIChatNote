## Why

当前对话(Conversation)在创建时绑定一个模型，整个对话过程中无法切换模型。这导致以下问题：
1. 用户无法根据任务复杂度灵活切换模型（如复杂问题用 GPT-4，简单追问用 GPT-3.5）
2. 当对话使用的模型被删除后，用户无法继续该对话，只能新建对话
3. 不同模型有不同特长，用户可能想在同一对话中尝试不同模型的回答质量

## What Changes

- **Message 模型关联**：在 Message 表增加 `provider_model_id` 字段，记录每条 assistant 消息来自哪个模型
- **Conversation 模型调整**：将 `provider_model_id` 改为 `current_provider_model_id`，表示当前使用的模型（可切换）
- **模型切换功能**：支持用户在对话过程中切换模型，切换后需要确认，新消息使用新模型
- **消息模型显示**：在每条 AI 回复消息底部显示模型来源（格式：Provider/Model，如 "OpenAI/GPT-4o"）

## Capabilities

### New Capabilities

- `model-switching`: 支持在对话过程中切换模型的能力，包括切换确认弹窗、模型选择器交互
- `message-model-attribution`: 在 AI 消息上显示模型来源信息

### Modified Capabilities

- `conversation`: 对话模型关联方式从单一绑定变为可切换，数据模型调整

## Impact

- **Backend**:
  - `Message` model: 新增 `provider_model_id` 字段
  - `Conversation` model: 字段重命名 `provider_model_id` → `current_provider_model_id`
  - 数据库迁移脚本
  - 消息发送逻辑：使用对话的 `current_provider_model_id`
- **Frontend**:
  - `ModelSelector` 组件：支持在对话中切换，新增确认弹窗
  - `MessageItem` 组件：显示模型来源
  - 对话相关 API 调用适配
