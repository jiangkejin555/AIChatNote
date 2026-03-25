## ADDED Requirements

### Requirement: 自动生成聊天标题

系统 SHALL 在用户发送第一条消息后，根据消息内容自动生成聊天标题。

#### Scenario: 首条消息触发标题生成
- **WHEN** 用户在新对话中发送第一条消息
- **THEN** 系统异步调用 AI 生成标题
- **AND** 标题生成完成后自动更新对话列表

#### Scenario: 标题长度限制
- **WHEN** AI 生成标题
- **THEN** 标题长度 SHALL 不超过 50 个字符

### Requirement: 标题生成 API

系统 SHALL 提供标题生成 API 端点。

#### Scenario: 调用标题生成 API
- **WHEN** 客户端调用 `POST /api/conversations/:id/generate-title`
- **THEN** 系统 SHALL 返回新生成的标题
- **AND** 对话的 title 字段 SHALL 被更新

#### Scenario: 对话不存在
- **WHEN** 对话 ID 不存在
- **THEN** 系统 SHALL 返回 404 错误

#### Scenario: 对话无消息
- **WHEN** 对话没有任何用户消息
- **THEN** 系统 SHALL 返回 400 错误，提示"对话无消息"

### Requirement: 前端集成

前端 SHALL 在发送首条消息后自动调用标题生成。

#### Scenario: 新对话首条消息
- **WHEN** 用户在新对话中发送首条消息
- **THEN** 前端 SHALL 在消息发送成功后异步调用 `generateTitle` API
- **AND** 不阻塞聊天流程

#### Scenario: 标题更新后刷新列表
- **WHEN** 标题生成成功
- **THEN** 前端 SHALL 刷新对话列表以显示新标题
