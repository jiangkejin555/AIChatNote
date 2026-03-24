## Context

当前 `ModelSelectionDialog` 组件存在 UX 问题：
- 主列表显示提供商 API 返回的可用模型，而非用户已配置的模型
- 用户无法清晰区分"已添加"和"可添加"的模型
- 每次保存需要调用多个 API（add/delete/update），缺乏原子性

## Goals / Non-Goals

**Goals:**
- 优化模型选择对话框，主列表展示已配置模型
- 提供可用模型列表作为添加来源，已添加模型标记并禁用
- 新增后端 sync API，支持原子性批量操作
- 保持本地状态管理，点击保存时统一同步

**Non-Goals:**
- 不改变 provider 的核心配置逻辑
- 不改变已有的单个模型 CRUD API（保持向后兼容）
- 不支持模型配置的导入/导出

## Decisions

### 1. 前端组件架构

```
ModelSelectionDialog
├── ConfiguredModelsList (已配置模型列表)
│   ├── ModelItem (支持删除、设为默认)
│   └── ManualAddForm (手动添加)
├── AvailableModelsDialog (可用模型列表子对话框)
│   ├── AvailableModelsList (已添加的禁用)
│   └── AddSelectedButton
└── SaveButton (调用 sync API)
```

**Rationale**: 将已配置和可用模型分离为两个独立视图，避免混淆。子对话框模式减少主界面复杂度。

### 2. 后端 Sync API 设计

```
POST /providers/:id/models/sync
Request:
{
  "add": [
    { "model_id": "gpt-4o", "display_name": "GPT-4o" }
  ],
  "delete": ["<provider_model_uuid>"],
  "default_model_id": "<provider_model_uuid>"
}

Response:
{
  "models": [<updated ProviderModel[]>],
  "added": 1,
  "deleted": 2,
  "updated": 1
}
```

**Rationale**:
- 一次请求完成所有操作，减少网络往返
- 后端可在事务中执行，保证数据一致性
- 返回操作结果统计，方便前端展示反馈

### 3. 状态管理

```typescript
interface LocalState {
  configuredModels: ProviderModel[];  // 本地已配置模型列表
  pendingAdd: string[];               // 待添加的 model_id
  pendingDelete: string[];            // 待删除的 provider_model.id
  pendingDefault: string | null;      // 待设置的默认模型
}
```

**Rationale**:
- 所有操作先更新本地状态，UI 即时响应
- 保存时将 pending 操作打包发送给 sync API
- 避免中间状态的不一致性

### 4. UI 交互流程

```
┌─────────────────────────────────────────────────────┐
│ [已配置模型]                        [获取可用模型]   │
├─────────────────────────────────────────────────────┤
│ ☑ GPT-4o                  [删除]  ⭐ 默认           │
│ ☑ GPT-4o-mini             [删除]  [设为默认]        │
└─────────────────────────────────────────────────────┘

点击 [获取可用模型]:
┌─────────────────────────────────────────────────────┐
│ 可用模型列表                                 [关闭] │
├─────────────────────────────────────────────────────┤
│ ☐ GPT-4-turbo                                      │
│ ☐ o1-preview                                       │
│ ☑ GPT-4o            (已添加)                        │
└─────────────────────────────────────────────────────┘
                    [添加选中模型]
```

## Risks / Trade-offs

### Risk: Sync API 复杂度
- **Issue**: sync API 需要处理添加、删除、更新默认的复杂组合
- **Mitigation**: 后端使用数据库事务，失败时全部回滚

### Trade-off: 本地状态 vs 实时同步
- **Choice**: 选择本地状态管理，保存时批量同步
- **Trade-off**: 用户可能忘记保存就关闭对话框
- **Mitigation**: 检测未保存更改，提示用户确认

### Risk: 可用模型列表过大
- **Issue**: 某些提供商可能返回数百个模型
- **Mitigation**: 使用虚拟滚动 (VirtualScroll) 或分页
