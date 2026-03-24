## Why

当前的"提供商选择模型"页面存在用户体验问题：只显示提供商 API 返回的可用模型，没有独立展示用户已配置的模型。用户无法清晰区分"已添加的模型"和"可添加的模型"，导致配置管理混乱。

## What Changes

### 前端变更

- **重构 ModelSelectionDialog 组件**：
  - 主列表从"可用模型"改为"已配置模型"，数据来源从提供商 API 改为后端 `provider_model` 表
  - 已配置模型列表支持删除、设置默认模型操作
  - 新增"获取可用模型"子对话框，展示提供商 API 返回的可用模型
  - 可用模型列表中已添加的模型标记为"已添加"并禁用选择
  - 所有操作在本地状态管理，点击"保存"时批量同步到后端

- **新增国际化文案**：
  - `configuredModels`: "已配置模型"
  - `fetchAvailableModels`: "获取可用模型"
  - `availableModelsList`: "可用模型列表"
  - `alreadyAdded`: "已添加"
  - `addSelectedModels`: "添加选中模型"
  - `saveChanges`: "保存更改"

### 后端变更

- **新增 API**: `POST /providers/:id/models/sync`
  - 支持批量添加、删除、更新默认模型
  - 一次请求完成所有操作，保证数据一致性

## Capabilities

### New Capabilities

- `provider-model-sync`: 提供商模型批量同步 API，支持原子性添加、删除、更新默认模型

### Modified Capabilities

- `model-management`: 模型选择对话框 UI/UX 优化，已配置模型独立展示，可用模型作为添加来源

## Impact

- **前端**：
  - `frontend/src/components/provider-management/model-selection-dialog.tsx` - 重构组件
  - `frontend/src/lib/api/providers.ts` - 新增 sync API 调用
  - `frontend/src/hooks/use-providers.ts` - 新增 useSyncProviderModels hook
  - `frontend/messages/zh.json` - 新增中文文案
  - `frontend/messages/en.json` - 新增英文文案

- **后端**：
  - `backend/internal/handlers/provider_model.go` - 新增 SyncModels handler
  - `backend/internal/repository/provider_model.go` - 新增 SyncModels repository 方法
  - `backend/docs/api.yaml` - 更新 API 文档
