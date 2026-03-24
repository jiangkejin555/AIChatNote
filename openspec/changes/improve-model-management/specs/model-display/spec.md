## ADDED Requirements

### Requirement: ProviderCard 启用模型下拉展示
ProviderCard SHALL 使用下拉选择器展示启用的模型列表，默认收起。

#### Scenario: 默认收起模型列表
- **WHEN** 用户查看模型管理页面
- **THEN** ProviderCard 显示 "启用模型" 下拉选择器，默认收起状态
- **AND** 收起状态下只显示启用模型数量

#### Scenario: 展开查看启用模型
- **WHEN** 用户点击 "启用模型" 下拉选择器
- **THEN** 系统展开显示该 Provider 的所有启用模型
- **AND** 列表中标记默认模型（如 "gpt-4o (默认)"）

#### Scenario: 多模型 Provider 不造成页面混乱
- **WHEN** Provider 有大量启用模型（如 20 个以上）
- **THEN** 下拉选择器限制最大高度并支持滚动
- **AND** 页面布局保持整洁

## REMOVED Requirements

### Requirement: ProviderCard 星星按钮设置默认
**Reason**: 统一到模型选择对话框管理，避免功能分散导致用户困惑
**Migration**: 用户需在模型选择对话框中点击模型的"设置默认"按钮

## MODIFIED Requirements

### Requirement: 会话列表显示已删除模型
系统 SHALL 在会话相关位置清晰标识已删除的模型。

#### Scenario: ModelSelector 显示已删除模型
- **WHEN** 会话关联的模型已被删除
- **THEN** ModelSelector 显示 "已删除 / gpt-4o"
- **AND** 使用灰色或删除线样式标识

#### Scenario: 会话标题显示已删除模型
- **WHEN** 会话列表中的会话关联模型已被删除
- **THEN** 会话副标题显示 "已删除 / gpt-4o"
- **AND** 视觉上区分于正常会话
