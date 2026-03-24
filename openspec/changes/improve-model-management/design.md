## Context

当前 AI 聊天应用的模型管理功能存在多个问题：
1. 模型删除策略使用软删除，导致已删除模型的关联会话无法正常访问
2. 缺乏模型启用/禁用状态管理，无法灵活控制可用模型
3. "设置默认模型"功能分散在多个位置，用户体验不统一
4. 会话模型引用问题导致用户体验不佳

## Goals / Non-Goals

**Goals:**
- 实现模型硬删除策略，确保数据一致性
- 为会话添加模型ID快照，保留历史记录信息
- 构建统一的模型管理界面，支持启用/禁用/删除/测试/设置默认
- 优化用户体验，模型被删除后清晰显示状态

**Non-Goals:**
- 支持在已有会话中切换模型（保持当前行为）
- 实现模型的批量操作
- 添加模型配置的动态加载功能
- 实现模型使用量统计和分析

## Decisions

### 1. 数据模型设计

**Conversation 表结构**：
```go
type Conversation struct {
    ID              uint       `gorm:"primaryKey" json:"id"`
    UserID          uint       `gorm:"not null;index" json:"user_id"`
    ProviderModelID *uuid.UUID `gorm:"type:uuid" json:"provider_model_id"`  // 保留但移除外键
    ModelID         string     `gorm:"size:255" json:"model_id"`             // 新增：存储模型ID快照
    Title           string     `gorm:"size:255" json:"title"`
    // ... 其他字段
}
```

**决策理由**：添加 `ModelID` 字段存储快照，即使 `ProviderModelID` 指向的模型被删除，仍能显示原始模型名称。

### 2. 删除策略变更

**硬删除 + 关联处理**：
1. 删除模型前查询所有关联会话
2. 更新这些会话：`provider_model_id = NULL`
3. 硬删除模型记录

**决策理由**：软删除导致引用完整性问题，硬删除更符合数据一致性要求，同时通过快照保留历史信息。

### 3. 前端界面设计

> **⚠️ Implementation Note**: 前端 UI 实现时 **必须使用 `/ui-ux-pro-max` skill**，确保界面设计质量和用户体验一致性。

**ModelSelectionDialog 功能布局**：
```
[模型名称]    [测试] [启用/禁用] [设置默认] [删除]
```

**ProviderCard 优化**：
- 移除模型徽章上的星星按钮
- 启用模型列表改为下拉选择器形式（默认收起）
- 保留"管理模型"按钮
- 显示模型启用/禁用状态

**决策理由**：统一的管理界面减少用户困惑，集中管理所有模型相关操作。下拉选择器避免模型数量多时页面混乱。

### 4. API 设计变更

**ProviderModel API**：
- `PUT /api/v1/provider-models/:id` 支持启用/禁用切换
- `DELETE /api/v1/provider-models/:id` 改为硬删除，先处理关联会话

**Conversation API**：
- 创建会话时额外保存 `model_id` 快照
- 检测模型不存在时返回友好错误信息

## Risks / Trade-offs

### 风险 1：数据迁移复杂性
**[Risk]** 需要修改现有数据模型，可能影响现有会话数据
**Mitigation**：编写迁移脚本，在部署前进行测试备份

### 风险 2：用户体验中断
**[Risk]** 模型被删除后，用户可能无法理解会话状态变化
**Mitigation**：提供清晰的 UI 提示，显示"模型已删除，可新建会话"

### 风险 3：API 兼容性
**[Risk]** 硬删除策略可能影响客户端逻辑
**Mitigation**：确保删除操作的 API 响应包含足够的上下文信息

### 风险 4：性能影响
**[Risk]** 删除模型时需要更新大量关联会话
**Mitigation**：使用批量更新，考虑分批处理大量数据

## Migration Plan

### 1. 数据库迁移
- 新增 `conversations.model_id` 列
- 移除 `provider_models.id` 的外键约束
- 为现有会话更新 `model_id` 快照

### 2. 部署策略
- 先部署数据库变更
- 逐步发布后端变更
- 最后更新前端界面

### 3. 回滚策略
- 保留数据迁移脚本
- 保留软删除标记机制作为备选
- 准备数据恢复流程

## Open Questions

1. **模型状态显示**：是否需要为已删除模型保存额外的显示名称，还是直接显示 "ModelID (已删除)"？
2. **批量操作**：是否需要考虑批量删除模型的性能优化？
3. **缓存策略**：前端是否需要缓存模型状态，减少 API 调用？