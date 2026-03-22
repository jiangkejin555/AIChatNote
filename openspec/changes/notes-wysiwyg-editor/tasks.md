## 实现要求

> **⚠️ 重要**：实现此变更时，必须使用 `/ui-ux-pro-max` skill 来确保 UI 设计质量。
>
> **设计原则**：
> - 参考 cherry-studio 的简洁风格
> - 保持与项目现有 shadcn/ui 组件风格一致
> - 注重间距、颜色、字体的协调性
> - 确保响应式设计在不同屏幕尺寸下的可用性
> - 编辑器工具栏图标使用 Lucide React 图标库

---

## 1. 依赖安装与基础配置

- [x] 1.1 安装 Tiptap 相关依赖包 (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-placeholder, @tiptap/extension-link)
- [x] 1.2 更新 notes-store.ts，添加 isCreating 和 editingNoteId 状态

## 2. Tiptap 编辑器组件

- [x] 2.1 创建 NoteEditor 组件 (note-editor.tsx)，集成 Tiptap 基础功能
- [x] 2.2 创建 EditorToolbar 组件 (editor-toolbar.tsx)，实现格式化工具栏
- [x] 2.3 实现 Markdown 快捷语法支持（加粗、斜体、标题、列表等）
- [x] 2.4 实现编辑器内容与 Markdown 格式的双向转换
- [x] 2.5 添加编辑器样式，匹配项目整体设计

## 3. 笔记创建功能

- [x] 3.1 创建 CreateNoteButton 组件 (create-note-button.tsx)
- [x] 3.2 实现创建空白笔记逻辑，自动设置 folder_id
- [x] 3.3 创建笔记后自动选中新笔记并进入编辑状态

## 4. 标题和标签编辑

- [x] 4.1 创建标题输入组件，支持实时编辑
- [x] 4.2 创建 TagSelector 组件 (tag-selector.tsx)，支持添加/移除标签
- [x] 4.3 实现标签自动补全（基于已有标签）

## 5. 左侧边栏重构

- [x] 5.1 创建 NotesSidebar 组件 (notes-sidebar.tsx)，整合搜索、文件夹、笔记列表
- [x] 5.2 创建 FolderList 组件 (folder-list.tsx)，替代原 FolderTree
- [x] 5.3 重构 NotesList 组件，适配新布局
- [x] 5.4 删除废弃组件 (folder-tree.tsx, tag-cloud.tsx) - 保留文件但不再使用

## 6. 页面布局重构

- [x] 6.1 重构 notes/page.tsx，改为两栏布局
- [x] 6.2 重构 NoteDetail 组件，集成新的编辑器和标签选择器
- [x] 6.3 实现响应式布局（移动端适配）
- [x] 6.4 添加编辑器动态导入（减少首屏加载时间）

## 7. 测试与清理

- [x] 7.1 测试编辑器所有功能（工具栏、快捷键、链接、代码块）
- [x] 7.2 测试笔记创建流程（文件夹归属、标题、标签）
- [x] 7.3 测试现有笔记数据的兼容性
- [x] 7.4 清理未使用的导入和代码
