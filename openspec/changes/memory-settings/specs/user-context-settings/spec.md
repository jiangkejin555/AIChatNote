# User Context Settings Specification

## Overview

用户上下文设置能力允许用户配置会话的上下文处理方式和记忆长度，以满足不同场景下的使用需求。

## ADDED Requirements

### Requirement: 用户可以设置上下文处理模式

系统 SHALL 允许用户在以下两种模式中选择：
- **智能摘要模式**：长对话时自动将历史消息压缩为摘要，额外消耗少量 token 但能保留更多上下文
- **直接传递模式**：直接发送最近 N 条消息给模型，不生成摘要，无额外 token 消耗

默认值 SHALL 为"直接传递模式"。

#### Scenario: 新用户使用默认设置
- **WHEN** 新用户注册后首次使用
- **THEN** 系统使用"直接传递模式"和"普通记忆"等级

#### Scenario: 用户切换到智能摘要模式
- **WHEN** 用户在设置页面选择"智能摘要"模式
- **THEN** 后续对话使用摘要策略处理上下文
- **AND** 如果之前已存在摘要数据，系统继续使用该数据

#### Scenario: 用户切换到直接传递模式
- **WHEN** 用户在设置页面选择"直接传递"模式
- **THEN** 后续对话直接传递最近 N 条消息
- **AND** 已存在的摘要数据保留但不使用

### Requirement: 用户可以设置记忆等级

系统 SHALL 支持三级记忆等级：
- **短期记忆**：保留较少的上下文，响应更快，token 消耗更低
- **普通记忆**：平衡的上下文保留，适合大多数场景
- **长期记忆**：保留更多上下文，适合复杂对话

默认值 SHALL 为"普通记忆"。

#### Scenario: 短期记忆下的消息处理
- **WHEN** 用户选择"短期记忆"等级且使用"直接传递"模式
- **THEN** 系统只查询并传递最近 5 条消息

#### Scenario: 长期记忆下的消息处理
- **WHEN** 用户选择"长期记忆"等级且使用"智能摘要"模式
- **THEN** 系统使用 WindowAutoSize=40, KeepRecentCount=20, SummaryUpdateFrequency=10 的参数

### Requirement: 系统提供用户设置 API

系统 SHALL 提供以下 API 端点：
- `GET /api/user/settings`：获取当前用户的上下文设置
- `PUT /api/user/settings`：更新当前用户的上下文设置

API SHALL 返回并接受以下字段：
- `context_mode`：字符串，值为 "summary" 或 "simple"
- `memory_level`：字符串，值为 "short"、"normal" 或 "long"

#### Scenario: 获取用户设置
- **WHEN** 用户调用 GET /api/user/settings
- **THEN** 系统返回用户的 context_mode 和 memory_level 设置

#### Scenario: 更新用户设置
- **WHEN** 用户调用 PUT /api/user/settings 并提供有效参数
- **THEN** 系统更新用户设置并返回更新后的值

### Requirement: 参数通过配置文件配置

系统 SHALL 从 config.yaml 读取上下文处理参数：
- Summary 模式的 WindowAutoSize、KeepRecentCount、SummaryUpdateFrequency
- Simple 模式的 HistoryLimit
- 各参数按记忆等级（short/normal/long）分组

系统 SHALL 提供合理的默认值，确保配置文件缺失时系统正常运行。

#### Scenario: 使用配置文件中的参数
- **WHEN** 系统处理消息时
- **THEN** 根据用户的 context_mode 和 memory_level 从配置文件读取对应参数
- **AND** 使用这些参数控制上下文处理行为

### Requirement: 前端提供设置界面

系统 SHALL 在前端设置页面提供"会话记忆设置"区域，包括：
- 上下文处理模式选择（单选按钮组）
- 记忆长度选择（三按钮组：短期/普通/长期）
- 模式说明弹窗（点击信息图标时显示）

#### Scenario: 用户查看模式说明
- **WHEN** 用户点击上下文处理模式旁的信息图标
- **THEN** 系统显示弹窗，说明两种模式的区别和适用场景

#### Scenario: 设置界面国际化
- **WHEN** 用户切换界面语言
- **THEN** 会话记忆设置区域的所有文案跟随切换语言
