## Why

当前应用存在两个关键的设置功能缺陷：

1. **国际化不完整**：界面语言切换后，大量 UI 文本仍显示为硬编码的中文（涉及 50+ 文件），导致英语用户无法获得完整的多语言体验
2. **缺少字体设置**：用户无法自定义界面字体大小和字体样式，影响不同设备和视觉偏好的用户体验

## What Changes

### i18n 全量修复

- 修复 50+ 文件中硬编码的中文文本，统一使用 `useI18n()` 或 `useTranslations()` hook
- 涉及的文件类别：
  - 页面组件：`login/page.tsx`, `register/page.tsx`, `models/page.tsx`, `notes/page.tsx`
  - 布局组件：`header.tsx`
  - 聊天组件：`conversation-list.tsx`, `message-input.tsx`, `message-item.tsx`
  - 笔记组件：`folder-list.tsx`, `notes-list.tsx`, `note-editor.tsx`, 对话框组件等
  - Provider 组件：`provider-card.tsx`, `provider-form-dialog.tsx` 等
  - Hooks：`use-notes.ts`, `use-folders.ts`, `use-models.ts` 等（toast 消息）
- 补充 `messages/en.json` 中缺失的翻译 key
- 生效范围：所有 UI 文字（不含用户输入的聊天内容、笔记内容、LLM 返回内容）

### 字体设置功能

- **字体大小**：支持三档切换（小、中、大）
- **字体样式**：提供预设字体列表供用户选择
- 生效范围：与 i18n 相同，仅影响 UI 文字，不影响用户内容
- 持久化：保存到 localStorage，刷新后保持设置

## Capabilities

### New Capabilities

- `i18n-support`: 完整的界面国际化支持，包含中英文切换，覆盖所有 UI 文本
- `font-settings`: 字体设置能力，支持字体大小（小/中/大）和字体样式的自定义

### Modified Capabilities

无（这是新功能添加，不修改现有 spec 的需求）

## Impact

### 代码影响

| 文件类别 | 文件数量 | 改动类型 |
|---------|---------|---------|
| 页面组件 | ~8 | i18n 修复 |
| 布局组件 | ~2 | i18n 修复 |
| 聊天组件 | ~8 | i18n 修复 |
| 笔记组件 | ~15 | i18n 修复 |
| Provider 组件 | ~5 | i18n 修复 |
| Hooks | ~5 | i18n 修复 (toast 消息) |
| UI Store | 1 | 新增字体设置状态 |
| 设置页面 | 1 | 新增字体设置 UI |
| 翻译文件 | 2 | 补充缺失 key |
| 全局样式 | 1 | CSS 变量支持字体设置 |

### API 影响

无后端 API 变更，所有设置仅存储在客户端 localStorage

### 依赖影响

无新增外部依赖
