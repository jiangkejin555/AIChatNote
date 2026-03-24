# Proposal: Replace Frontend Mock API with Real Backend API

## Why

前端目前使用内存中的 mock 数据模拟所有 API 调用，导致：
- 数据无法持久化，刷新页面后丢失
- 无法与后端真实服务交互
- AI 对话功能无法真正调用 LLM API

后端 API 已完成开发，需要将前端切换到使用真实后端 API，实现完整的前后端集成。

## What Changes

### 核心变更

- **禁用 Mock 模式**: 将 `providers.ts`, `conversations.ts`, `notes.ts`, `folders.ts`, `tags.ts` 中的 `USE_MOCK` 从 `true` 改为 `false`
- **响应格式适配**: 适配后端 `{ data: ... }` 包装格式与前端期望格式的差异
- **字段命名转换**: 处理 snake_case (后端) 与 camelCase (前端) 的命名差异
- **Tags 格式转换**: 将后端 `NoteTag[]` 格式转换为前端期望的 `string[]` 格式

### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/lib/api/providers.ts` | 修改 | 禁用 mock，适配响应格式 |
| `src/lib/api/conversations.ts` | 修改 | 禁用 mock，适配响应格式，处理分页 |
| `src/lib/api/notes.ts` | 修改 | 禁用 mock，适配响应格式，转换 tags |
| `src/lib/api/folders.ts` | 修改 | 禁用 mock，适配响应格式 |
| `src/lib/api/tags.ts` | 修改 | 禁用 mock，适配响应格式 |
| `src/lib/api/mock-data.ts` | 可选删除 | 如不再需要 mock 功能可删除 |

## Capabilities

### New Capabilities

- `frontend-api-integration`: 定义前端与后端 API 集成的规范，包括响应格式处理、错误处理、类型适配等

### Modified Capabilities

无需修改现有 capabilities - 这是纯实现层面的变更，不改变产品需求。

## Impact

### 受影响的代码

- **前端 API 层**: `frontend/src/lib/api/` 目录下所有 API 模块
- **React Hooks**: `use-providers.ts`, `use-conversations.ts`, `use-notes.ts`, `use-folders.ts`, `use-models.ts` 可能需要适配
- **类型定义**: `frontend/src/types/index.ts` 可能需要调整类型定义

### API 端点依赖

依赖以下后端 API（已实现）:
- `/api/providers/*` - 提供商管理
- `/api/conversations/*` - 对话管理
- `/api/notes/*` - 笔记管理
- `/api/folders/*` - 文件夹管理
- `/api/tags` - 标签管理

### 风险评估

- **低风险**: 变更仅影响前端 API 层，不涉及 UI 组件
- **可回滚**: 可通过将 `USE_MOCK` 改回 `true` 快速回滚
- **测试建议**: 需要端到端测试验证所有 API 调用
