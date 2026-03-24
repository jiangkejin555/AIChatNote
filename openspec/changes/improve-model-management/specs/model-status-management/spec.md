## ADDED Requirements

### Requirement: 模型启用状态管理
系统 SHALL 支持通过 Sync API 批量启用或禁用模型。

#### Scenario: 批量启用模型
- **WHEN** 管理员在模型选择对话框中启用多个模型并保存
- **THEN** 系统将指定模型的 `enabled` 字段设置为 `true`
- **AND** 启用的模型在聊天界面可选

#### Scenario: 批量禁用模型
- **WHEN** 管理员在模型选择对话框中禁用多个模型并保存
- **THEN** 系统将指定模型的 `enabled` 字段设置为 `false`
- **AND** 禁用的模型在聊天界面不可选

### Requirement: Sync API 扩展
Sync API SHALL 支持 `enable` 和 `disable` 参数用于批量状态更新。

#### Scenario: Sync API 接收启用参数
- **WHEN** 调用 `PUT /api/v1/providers/:id/models/sync` 并传入 `enable` 数组
- **THEN** 系统将数组中指定的模型设置为启用状态

#### Scenario: Sync API 接收禁用参数
- **WHEN** 调用 `PUT /api/v1/providers/:id/models/sync` 并传入 `disable` 数组
- **THEN** 系统将数组中指定的模型设置为禁用状态

### Requirement: 启用状态与删除的独立性
系统 SHALL 确保启用/禁用操作与删除操作相互独立。

#### Scenario: 禁用模型后仍可删除
- **WHEN** 管理员禁用一个模型后再次删除它
- **THEN** 系统正常执行硬删除操作
- **AND** 删除逻辑不受 `enabled` 状态影响

#### Scenario: 同一模型不能同时出现在启用和禁用列表
- **WHEN** Sync API 请求中同一模型同时出现在 `enable` 和 `disable` 数组
- **THEN** 系统返回错误 "模型不能同时被启用和禁用"
