## Context

当前笔记页面采用扁平的文件夹结构，虽然数据模型 (`Folder`) 已支持 `parent_id` 字段，但 UI 仅显示单层文件夹。需要重构为树形结构，并添加更完善的操作功能。

**技术栈**：
- Next.js 15 + React 19
- TanStack Query (React Query) 用于数据管理
- Zustand 用于 UI 状态管理
- shadcn/ui 组件库

**现有相关文件**：
- `src/components/notes/folder-list.tsx` - 当前文件夹列表组件
- `src/components/notes/notes-sidebar.tsx` - 侧边栏组件
- `src/lib/api/mock-data.ts` - Mock 数据，已支持 `parent_id`

## Goals / Non-Goals

**Goals:**
- 实现多级文件夹树形结构，支持无限层级
- 提供直观的文件夹和笔记操作入口
- 统一的操作菜单交互模式
- 支持文件夹展开/收缩状态持久化
- Markdown 导入功能

**Non-Goals:**
- 不支持文件夹拖拽排序
- 不支持笔记批量操作
- 不支持 Markdown 导出时的格式定制

## Decisions

### 1. 文件夹树形结构实现

**决策**：使用递归组件 `FolderTreeItem` 渲染树形结构

**方案对比**：
| 方案 | 优点 | 缺点 |
|------|------|------|
| 递归组件 | 简单直观，易于维护 | 深层级可能有性能问题 |
| 扁平化渲染 | 性能更好 | 需要手动管理缩进 |

**选择**：递归组件。考虑到文件夹层级通常不超过 3-4 层，递归组件足够用。

### 2. 展开状态管理

**决策**：使用 Zustand 管理 `expandedFolderIds: Set<number>`

**理由**：
- 展开状态是 UI 状态，与服务器数据分离
- 需要在多个组件间共享（树形组件、搜索结果跳转等）
- 可轻松持久化到 localStorage

### 3. 文件夹选中后的笔记查询

**决策**：只查询当前文件夹下的笔记，API 参数不变

**理由**：
- 符合用户预期（点击文件夹看的是该文件夹内容）
- 后端 API 已支持 `folder_id` 参数
- 不需要修改后端逻辑

### 4. 删除文件夹的笔记处理

**决策**：前端弹窗选择 + 批量 API 调用

**流程**：
1. 弹窗显示文件夹下的所有笔记（默认全选）
2. 用户选择要删除的笔记
3. 调用批量删除 API（选中的）
4. 调用批量更新 API（未选中的，移动到根目录）
5. 删除文件夹

### 5. Markdown 导入实现

**决策**：前端解析 + API 创建

**流程**：
1. 用户选择 Markdown 文件
2. 前端解析文件内容
3. 从内容中提取标题（第一个 `#` 标题）
4. 调用 `notesApi.create()` 创建笔记

**解析规则**：
- 标题：第一个 `#` 标题，若无则使用文件名
- 内容：完整 Markdown 内容
- 标签：暂不从 frontmatter 解析

### 6. 操作菜单组件设计

**决策**：使用 shadcn/ui 的 `DropdownMenu` 组件

**组件结构**：
```
FolderTreeItem
├── FolderIcon + Name
├── PlusButton → DropdownMenu (新建子文件夹/新建笔记)
└── MoreButton → DropdownMenu (重命名/拷贝/移动/导入/删除)

NoteCard
├── Title + Tags + Date
└── MoreButton → DropdownMenu (重命名/拷贝/移动/导出/删除)
```

## UI/UX Design Implementation

### 设计工具要求

**重要**：在实现任何 UI 组件之前，必须先使用 `/ui-ux-pro-max` skill 进行设计分析和规范制定。

### 设计工作流程

1. **生成设计系统**
   ```
   /ui-ux-pro-max notes productivity app sidebar tree elegant minimal --design-system
   ```
   这将生成：
   - 视觉风格定位（minimalism, professional）
   - 颜色方案
   - 字体配对
   - 动效规范

2. **组件设计规范**
   实现以下组件时需要遵循设计系统：
   - `FolderTreeItem` - 树形文件夹项
   - `TagFilter` - 标签筛选下拉
   - `NoteActionMenu` - 笔记操作菜单
   - `NotesSidebar` - 侧边栏布局

3. **设计检查清单**
   - [ ] 所有可点击元素有 `cursor-pointer`
   - [ ] 悬停状态有视觉反馈
   - [ ] 过渡动画 150-300ms
   - [ ] 图标使用 Lucide（不用 emoji）
   - [ ] 颜色对比度符合 WCAG 4.5:1
   - [ ] 触摸目标最小 44x44px
   - [ ] 深色/浅色模式均可见

### 视觉风格参考

- **风格定位**：简洁现代，参考 Notion 的视觉语言
- **圆角**：使用 `rounded-md` (6px) 保持一致性
- **间距**：遵循 4px 基准网格
- **过渡**：`transition-colors duration-200`

### 图标规范 (Lucide)

| 功能 | 图标 |
|------|------|
| 文件夹（收起） | `Folder` |
| 文件夹（展开） | `FolderOpen` |
| 展开 | `ChevronRight` / `ChevronDown` |
| 新建 | `Plus` |
| 重命名 | `Pencil` |
| 拷贝 | `Copy` |
| 移动 | `FolderInput` |
| 导入 | `FileUp` |
| 导出 | `FileDown` |
| 删除 | `Trash2` |
| 更多 | `MoreHorizontal` |

## Risks / Trade-offs

### 风险 1：深层级文件夹性能
- **风险**：用户创建过多层级可能导致渲染性能问题
- **缓解**：限制最大层级为 5 层；使用虚拟滚动（如果需要）

### 风险 2：删除文件夹的原子性
- **风险**：批量操作可能部分成功，导致数据不一致
- **缓解**：使用乐观更新 + 错误回滚；提示用户刷新页面

### 风险 3：Markdown 解析兼容性
- **风险**：不同 Markdown 编辑器导出的格式可能有差异
- **缓解**：只提取标题，保持内容原样；后续可增强解析能力

### 权衡：不使用拖拽
- **理由**：实现复杂度高，用户需求不强
- **替代**：提供"移动到..."菜单，通过对话框选择目标文件夹

## Component Architecture

```
NotesSidebar
├── SearchBar (搜索 + 标签筛选)
├── FolderTree
│   ├── AllNotesItem (全部笔记)
│   ├── FolderTreeItem (递归)
│   │   ├── FolderHeader (图标 + 名称 + 按钮)
│   │   ├── PlusMenu (新建子文件夹/笔记)
│   │   ├── MoreMenu (重命名/拷贝/移动/导入/删除)
│   │   └── FolderChildren (递归渲染子文件夹)
│   └── NewFolderButton
├── CreateNoteButton
└── NotesList
    └── NoteCard
        └── NoteMoreMenu

Dialogs:
├── CreateFolderDialog
├── RenameDialog
├── MoveDialog
├── DeleteFolderDialog
└── ImportMarkdownDialog
```

## State Management

```typescript
// notes-store.ts 新增
interface NotesState {
  // 现有...
  expandedFolderIds: Set<number>
  toggleFolderExpand: (folderId: number) => void
  expandFolder: (folderId: number) => void
  collapseFolder: (folderId: number) => void
}
```

## API Changes

### 新增 API
```typescript
// notesApi
importMarkdown: async (file: File, folderId?: number): Promise<Note>

// 批量操作
batchDeleteNotes: async (ids: number[]): Promise<void>
batchMoveNotes: async (ids: number[], targetFolderId: number | null): Promise<void>
```

### 复用现有 API
- `foldersApi.create({ name, parent_id })` - 已支持
- `foldersApi.update(id, { parent_id })` - 用于移动
- `notesApi.update(id, { folder_id })` - 用于移动笔记
