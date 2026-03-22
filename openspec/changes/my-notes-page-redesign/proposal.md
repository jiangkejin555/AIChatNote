## Why

当前笔记页面（"知识库"）的交互体验不够清晰，文件夹只支持单层结构，缺乏直观的文件夹操作入口，且标签筛选功能未在 UI 中实现。需要重新设计页面布局和交互，使其更接近 Notion 的用户体验，支持多级文件夹管理和更便捷的笔记操作。

## What Changes

### 设计实现要求

**重要**：所有 UI 组件的实现必须先使用 `/ui-ux-pro-max` skill 进行设计分析，确保界面美观和适用性。

设计工作流程：
1. 使用 `/ui-ux-pro-max` 生成设计系统
2. 遵循设计规范实现组件
3. 检查可访问性和交互体验

### 标题修改
- 将 "知识库" 改为 "我的笔记"
- 涉及侧边栏导航和笔记页面标题

### 文件夹系统重构
- **BREAKING** 支持多级文件夹（树形结构）
- "全部笔记" 作为根目录，新建用户默认在此目录下
- 文件夹支持展开/收缩
- 选中文件夹时只显示当前文件夹下的笔记（不含子文件夹）
- 删除文件夹时弹窗选择要删除的笔记，未选的移到根目录

### 文件夹操作
- 每个文件夹项右侧显示 "+" 和 "..." 按钮
- "+" 按钮：新建子文件夹 / 新建笔记
- "..." 按钮：重命名 / 拷贝 / 移动文件夹 / 导入 Markdown / 删除文件夹

### 笔记操作
- 笔记卡片右下角添加 "..." 按钮
- "..." 按钮：重命名 / 拷贝 / 移动笔记 / 导出 Markdown / 删除笔记

### 搜索与筛选
- 标签筛选与搜索放在同一栏
- 支持按标签筛选笔记

### 笔记编辑页优化
- 显示当前选中的文件夹路径
- 标题输入框前方添加 "文件名称" 标签
- 文件名称为必填项，保存时需要校验

### 导入功能
- 支持导入 Markdown 文件到指定文件夹

## Capabilities

### New Capabilities
- `folder-tree`: 多级文件夹树形结构，支持展开/收缩、新建子文件夹
- `folder-actions`: 文件夹操作（重命名、拷贝、移动、导入、删除）
- `note-actions`: 笔记操作（重命名、拷贝、移动、导出、删除）
- `tag-filter`: 标签筛选功能
- `markdown-import`: Markdown 文件导入功能

### Modified Capabilities
- `notes-sidebar`: 侧边栏布局和交互重新设计

## Impact

### 代码变更
- `src/components/notes/notes-sidebar.tsx` - 重新设计布局
- `src/components/notes/folder-list.tsx` - 重构为树形结构
- `src/components/notes/notes-list.tsx` - 添加操作按钮
- `src/components/notes/note-card.tsx` - 添加 "..." 菜单
- `src/components/notes/note-editor.tsx` - 添加路径显示和标题校验
- `src/hooks/use-folders.ts` - 添加文件夹操作 hooks
- `src/hooks/use-notes.ts` - 添加笔记操作 hooks
- `src/lib/api/notes.ts` - 添加导入 API
- `src/stores/notes-store.ts` - 添加展开状态管理

### 翻译文件
- `messages/zh.json` - 更新中文翻译
- `messages/en.json` - 更新英文翻译

### 新增组件
- `FolderTreeItem` - 树形文件夹项组件
- `FolderActionMenu` - 文件夹操作菜单
- `NoteActionMenu` - 笔记操作菜单
- `DeleteFolderDialog` - 删除文件夹确认对话框
- `MoveDialog` - 移动文件夹/笔记对话框
- `MarkdownImporter` - Markdown 导入组件
