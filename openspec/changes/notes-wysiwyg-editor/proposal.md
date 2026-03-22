## Why

当前笔记（知识库）页面存在两个主要问题：

1. **笔记创建入口受限**：用户只能从聊天对话中创建笔记，无法在笔记页面直接创建独立的空白笔记
2. **编辑体验不佳**：当前使用纯文本编辑器 + Markdown 渲染预览，缺少所见即所得的编辑体验

参考 cherry-studio 的知识库实现，需要重新设计笔记页面的布局和编辑器，提供更直观的笔记创建和编辑体验。

## What Changes

- **BREAKING** 布局重构：从三栏布局（侧边栏 + 笔记列表 + 详情）改为两栏布局（笔记列表 + 编辑区）
- 新增「新建笔记」按钮，支持直接创建空白笔记
- 新增文件夹选择逻辑：选中文件夹时创建笔记自动归入该文件夹
- 集成 Tiptap WYSIWYG 编辑器，替换当前的 Textarea 编辑器
- 新增标题编辑功能，标题变更同步更新笔记显示名称
- 新增标签选择器组件，支持添加/移除标签
- 移除独立的 TagCloud 组件（标签选择整合到编辑区）
- 简化 FolderTree 组件（整合到笔记列表顶部）

## Capabilities

### New Capabilities

- `note-editor`: WYSIWYG Markdown 笔记编辑器，支持工具栏、快捷键、实时渲染
- `note-creation`: 独立笔记创建功能，支持文件夹归属、标题设置、标签选择

### Modified Capabilities

- `notes-page`: 笔记页面布局从三栏改为两栏，整合文件夹、标签、笔记列表、编辑区

## Impact

**前端代码变更：**
- `src/app/(main)/notes/page.tsx` - 页面布局重构
- `src/components/notes/` - 组件重构和新增
  - 新增 `note-editor.tsx` - Tiptap 编辑器组件
  - 新增 `create-note-dialog.tsx` - 创建笔记对话框
  - 重构 `notes-list.tsx` - 整合文件夹和创建按钮
  - 简化 `note-detail.tsx` - 使用新的编辑器
  - 移除 `folder-tree.tsx`, `tag-cloud.tsx` - 功能整合到其他组件

**新增依赖：**
- `@tiptap/react` - Tiptap 核心包
- `@tiptap/starter-kit` - Tiptap 基础扩展
- `@tiptap/extension-placeholder` - 占位符扩展
- `@tiptap/extension-link` - 链接扩展

**状态管理变更：**
- `notes-store.ts` - 新增 `creatingFolderId` 状态用于文件夹选择逻辑
