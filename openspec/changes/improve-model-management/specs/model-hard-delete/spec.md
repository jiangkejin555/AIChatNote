## ADDED Requirements

### Requirement: 硬删除模型
系统 SHALL 支持硬删除模型，删除时自动处理关联会话的 `provider_model_id`。

#### Scenario: 删除无关联会话的模型
- **WHEN** 管理员删除一个没有被任何会话引用的模型
- **THEN** 系统直接从数据库中删除该模型记录

#### Scenario: 删除有关联会话的模型
- **WHEN** 管理员删除一个被会话引用的模型
- **THEN** 系统将该模型关联的所有会话的 `provider_model_id` 设置为 NULL
- **AND** 系统保留会话的 `model_id` 字段不变
- **AND** 系统从数据库中删除该模型记录

### Requirement: 会话模型ID快照
系统 SHALL 在创建会话时同时保存 `provider_model_id` 和 `model_id` 快照。

#### Scenario: 创建会话时保存模型快照
- **WHEN** 用户使用模型 "gpt-4o" 创建新会话
- **THEN** 系统保存 `provider_model_id` 为模型的 UUID
- **AND** 系统保存 `model_id` 为 "gpt-4o"

#### Scenario: 模型删除后显示历史模型名
- **WHEN** 会话关联的模型被删除
- **THEN** 系统显示 "已删除 / gpt-4o" 格式的模型名称
- **AND** `model_id` 字段保留原始值 "gpt-4o"

### Requirement: 发消息时检查模型存在性
系统 SHALL 在发送消息前检查会话关联的模型是否存在。

#### Scenario: 模型存在时正常发送消息
- **WHEN** 用户向模型存在的会话发送消息
- **THEN** 系统正常处理消息请求

#### Scenario: 模型已删除时阻止发送消息
- **WHEN** 用户向模型已删除的会话发送消息
- **THEN** 系统返回错误 "该会话使用的模型已删除，无法继续对话"
- **AND** 系统不创建新的消息记录

### Requirement: 现有数据迁移
系统 SHALL 在部署时迁移现有会话数据，回填 `model_id` 字段。

#### Scenario: 迁移现有会话数据
- **WHEN** 执行数据库迁移
- **THEN** 系统为所有现有会话通过 `provider_model_id` 关联查询并填充 `model_id`
- **AND** 如果关联的模型已不存在，`model_id` 设置为 NULL
