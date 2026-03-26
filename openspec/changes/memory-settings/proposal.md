## Why

当前系统的上下文处理方式单一（仅支持滑动窗口+摘要压缩），且参数硬编码不可配置。用户无法根据自身需求选择不同的上下文处理策略或调整记忆长度。此外，当前实现每次发送消息都查询所有历史消息，在长对话场景下存在性能问题。

本变更旨在提供灵活的会话记忆配置能力，让用户可以自主选择上下文处理模式和记忆等级，同时优化数据库查询性能。

## What Changes

- **新增**：用户级别的上下文处理模式配置（智能摘要 / 直接传递）
- **新增**：用户级别的记忆等级配置（短期 / 普通 / 长期）
- **新增**：`config.yaml` 中的 `context` 配置节，支持自定义各等级参数
- **新增**：用户设置 API（GET/PUT `/api/user/settings`）
- **优化**：消息查询逻辑，按需查询而非全量查询
- **新增**：前端设置页面的"会话记忆设置"配置区域
- **新增**：中英文 i18n 支持

## Capabilities

### New Capabilities

- `user-context-settings`: 用户上下文设置能力，包括上下文处理模式和记忆等级的存储、API 接口、以及与消息处理流程的集成

### Modified Capabilities

- `conversation-summary`: 扩展现有摘要能力，使其参数可配置化，并根据用户设置动态调整行为

## Impact

### 后端
- `config.yaml` - 新增 context 配置节
- `internal/models/` - 新增 UserSettings 模型
- `internal/repository/` - 新增 UserSettingsRepository
- `internal/services/` - 新增 ContextConfigService，修改 SummaryService
- `internal/handlers/` - 新增 UserSettingsHandler，修改 ConversationHandler
- `internal/migrations/` - 新增 user_settings 表迁移

### 前端
- `src/app/(main)/settings/page.tsx` - 新增会话记忆设置 UI
- `src/lib/api/` - 新增 user-settings API 调用
- `src/hooks/` - 新增 useUserSettings hook
- `src/i18n/locales/` - 新增中英文文案

### 数据库
- 新增 `user_settings` 表
