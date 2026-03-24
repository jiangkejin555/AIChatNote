## Why

当前模型管理功能存在多个问题：
1. **删除模型失败** - 使用软删除策略（`enabled=false`），无法真正删除模型，因为会话引用了模型
2. **设置默认功能有 bug** - 在模型管理页面点击星星后，模型直接消失
3. **用户体验混乱** - "设置默认"功能分散在多处，模型管理页面和模型选择对话框功能重叠
4. **已删除模型会话无法正常使用** - 缺乏对已删除模型的友好提示

## What Changes

### 数据模型变更
- **BREAKING**: `conversations` 表新增 `model_id` 字段，存储模型ID快照（如 "gpt-4o"）
- **BREAKING**: 模型删除从软删除改为硬删除，关联会话的 `provider_model_id` 置为 NULL
- **BREAKING**: 现有会话数据需要迁移，回填 `model_id` 字段

### 前端界面变更
- **移除**: 模型管理页面的"设置默认"星星按钮
- **改进**: `ProviderCard` 的启用模型列表改为下拉选择器形式，默认收起
- **新增**: `ModelSelectionDialog` 增加启用/禁用开关功能
- **改进**: 删除功能改为硬删除，点击保存时统一提交

### API 变更
- **BREAKING**: `SyncProviderModels` API 新增 `enable` 和 `disable` 参数
- **BREAKING**: 删除操作改为硬删除，不再是设置 `enabled=false`
- **新增**: 创建会话时同时保存 `model_id` 快照
- **新增**: 发消息时检查模型是否存在，不存在则返回错误

### 用户体验改进
- 模型已删除的会话，显示 "已删除 / gpt-4o"（灰色标记）
- 发消息时模型已删除，提示 "该会话使用的模型已删除，无法继续对话"

## Capabilities

### New Capabilities
- `model-hard-delete`: 模型硬删除策略，包含会话关联处理和模型ID快照
- `model-status-management`: 模型启用/禁用状态管理

### Modified Capabilities
- `model-selection`: 模型选择对话框增强，支持启用/禁用/删除操作
- `model-display`: 模型显示优化，支持下拉列表展示和已删除模型标记

## Impact

### 后端影响
- `backend/migrations/` - 新增数据库迁移文件
- `backend/internal/models/conversation.go` - 新增 `ModelID` 字段
- `backend/internal/repository/provider_model.go` - 硬删除逻辑
- `backend/internal/repository/conversation.go` - 查询时处理模型已删除情况
- `backend/internal/handlers/provider_model.go` - Sync API 扩展
- `backend/internal/handlers/conversation.go` - 创建会话保存 model_id，发消息检查模型

### 前端影响
- `frontend/src/app/(main)/models/page.tsx` - 模型管理页面
- `frontend/src/components/provider-management/provider-card.tsx` - 去掉星星，改为下拉列表
- `frontend/src/components/provider-management/model-selection-dialog.tsx` - 新增启用/禁用功能
- `frontend/src/hooks/use-models.ts` - 处理模型已删除状态
- `frontend/src/components/chat/model-selector.tsx` - 显示已删除模型标记
- `frontend/src/lib/api/providers.ts` - API 调用更新
