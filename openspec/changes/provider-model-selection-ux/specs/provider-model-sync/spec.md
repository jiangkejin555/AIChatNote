# Provider Model Sync Specification

## Overview

提供商模型批量同步 API，支持在一次请求中完成添加、删除、更新默认模型操作，保证数据一致性。

## ADDED Requirements

### Requirement: Sync provider models atomically

系统 SHALL 支持通过单个 API 调用批量同步提供商模型配置。

#### Scenario: Add multiple models in one request
- **WHEN** 用户发送 sync 请求包含多个待添加模型
- **THEN** 系统在事务中添加所有模型并返回成功结果

#### Scenario: Delete multiple models in one request
- **WHEN** 用户发送 sync 请求包含多个待删除模型 ID
- **THEN** 系统在事务中删除所有指定模型并返回成功结果

#### Scenario: Update default model in sync request
- **WHEN** 用户发送 sync 请求指定新的默认模型
- **THEN** 系统取消旧默认模型标记，设置新默认模型

#### Scenario: Mixed operations in one request
- **WHEN** 用户发送 sync 请求同时包含添加、删除、更新默认操作
- **THEN** 系统按顺序执行所有操作，任一失败则全部回滚

#### Scenario: Sync fails on invalid model
- **WHEN** 用户发送 sync 请求包含无效的模型 ID 或重复添加
- **THEN** 系统返回错误信息，所有操作不生效

#### Scenario: Sync returns operation summary
- **WHEN** sync 操作成功完成
- **THEN** 系统返回更新后的模型列表及操作统计（added/deleted/updated 数量）

### Requirement: Configured models display in main list

前端 SHALL 在模型选择对话框主列表中展示已配置模型，而非可用模型。

#### Scenario: Display configured models on dialog open
- **WHEN** 用户打开模型选择对话框
- **THEN** 系统从 provider_model 表获取已配置模型并显示在主列表

#### Scenario: Mark default model in list
- **WHEN** 已配置模型列表中存在默认模型
- **THEN** 默认模型显示特殊标记（如星标或"默认"标签）

### Requirement: Available models as add source

前端 SHALL 提供"获取可用模型"功能，展示提供商 API 返回的可用模型列表。

#### Scenario: Fetch available models on button click
- **WHEN** 用户点击"获取可用模型"按钮
- **THEN** 系统调用提供商 API 获取可用模型列表并显示在子对话框中

#### Scenario: Mark already added models
- **WHEN** 可用模型列表中包含已配置的模型
- **THEN** 已配置模型显示"已添加"标记且禁用选择

#### Scenario: Batch add selected available models
- **WHEN** 用户在可用模型列表选择多个模型并点击"添加选中模型"
- **THEN** 选中的模型添加到已配置模型列表（本地状态），但未保存到后端

### Requirement: Local state management with save

前端 SHALL 使用本地状态管理模型配置，仅在用户点击保存时同步到后端。

#### Scenario: Track local changes
- **WHEN** 用户在对话框中添加、删除或更改默认模型
- **THEN** 系统更新本地状态，不立即调用后端 API

#### Scenario: Sync on save button click
- **WHEN** 用户点击"保存更改"按钮
- **THEN** 系统调用 sync API 将所有本地变更同步到后端

#### Scenario: Prompt on unsaved changes
- **WHEN** 用户有未保存的变更并尝试关闭对话框
- **THEN** 系统提示用户确认是否放弃更改
