## Why

当前应用布局存在几个用户体验问题：用户账户信息在右上角落不够突出、模型管理入口深（隐藏在设置中）、设置页面功能单薄（只有模型管理）、夜间模式切换分散在 Header 而非统一在设置中。此外，"保存为笔记"作为核心功能，入口不够显眼，且缺少批量保存和异步保存的能力。

## What Changes

### Layout 改造
- **Sidebar 底部用户区**：将用户头像和信息从 Header 右上角移至 Sidebar 底部，包含下拉菜单（设置、退出登录）
- **模型管理独立**：从设置页面分离，成为 Sidebar 独立导航项
- **移除全局 Header**：简化布局，聊天页面内的 ModelSelector 保持原位

### 设置页面重构
- **新建偏好设置页面** (`/settings`)：包含主题切换（浅色/深色/跟随系统）、语言切换
- **模型管理保持** (`/settings/models`)：保持现有模型管理功能

### 国际化支持
- **UI 文案国际化**：支持中文和英文切换（仅 UI 文案，聊天内容保持原样）
- **使用 next-intl**：实现语言切换功能

### 保存笔记功能增强
- **浮动按钮**：右下角显眼位置放置"保存为笔记"浮动按钮
- **多对话选择**：支持选择当前对话、多个对话或全部对话
- **保存方式**：支持 AI 智能总结 或 直接保存原始对话
- **异步保存**：点击确认后立即返回，后台异步处理
- **Toast 通知**：保存成功后推送系统消息

## Capabilities

### New Capabilities
- `i18n`: UI 国际化支持，包含中英文切换能力
- `save-notes-enhanced`: 增强的保存笔记功能，支持多对话选择、保存方式选择、异步保存

### Modified Capabilities
- (无现有 specs，全部为新 capabilities)

## Impact

### 前端文件
- `components/layout/sidebar.tsx` - 添加底部用户区、模型管理导航
- `components/layout/header.tsx` - 移除（或保留用于移动端）
- `app/(main)/layout.tsx` - 移除 Header
- `app/(main)/settings/page.tsx` - 新建偏好设置页面
- `components/chat/save-note-dialog.tsx` - 重构支持多对话和异步保存
- `components/chat/save-note-fab.tsx` - 新建浮动按钮组件

### 新增文件
- `messages/zh.json` - 中文翻译
- `messages/en.json` - 英文翻译
- `i18n/config.ts` - i18n 配置

### Mock API
- 批量保存笔记 API（后端未实现，先 mock）
- 直接保存原始对话 API（后端未实现，先 mock）
