## Context

当前笔记页面采用三栏布局（侧边栏 + 笔记列表 + 详情区），编辑器使用简单的 Textarea。这种设计存在以下问题：
- 创建笔记必须从聊天界面进入
- 编辑时无法实时看到 Markdown 渲染效果
- 文件夹和标签功能分散，操作不够直观

参考 cherry-studio 的知识库实现，需要重新设计为两栏布局，并集成 WYSIWYG 编辑器。

**技术栈约束：**
- Next.js 16.2.0 + React 19
- shadcn/ui 组件库
- Zustand 状态管理
- TanStack Query 数据管理
- 已有 react-markdown 渲染器

## Goals / Non-Goals

**Goals:**
- 实现两栏布局（笔记列表 + 编辑区），简化界面
- 集成 Tiptap WYSIWYG 编辑器，支持工具栏和 Markdown 快捷键
- 实现直接创建笔记功能，支持文件夹归属
- 实现标题编辑与笔记名称同步
- 实现标签选择器，支持添加/移除标签

**Non-Goals:**
- 不修改后端 API（现有 CRUD API 足够）
- 不实现 AI 生成笔记功能（这是 SaveNoteDialog 的功能）
- 不实现笔记导出功能重构（保持现有实现）
- 不实现笔记版本历史

## Decisions

### 1. 编辑器选型：Tiptap

**选择 Tiptap 的原因：**
- 生态成熟，文档完善，社区活跃
- 基于 ProseMirror，可扩展性强
- 支持 Markdown 快捷语法（`**` 加粗、`#` 标题等）
- 支持工具栏定制
- 与 React 集成良好

**备选方案：**
- Milkdown：更现代，但社区较小
- ByteMD：主要是分屏模式，不符合 WYSIWYG 需求
- Slate：更底层，需要更多自定义工作

**依赖包：**
```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-link": "^2.x"
}
```

### 2. 布局设计

```
┌────────────────────────────────────────────────────────────────────────┐
│                           知识库页面                                     │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┬─────────────────────────────────────────────┐│
│  │   笔记列表 (w-72)     │              编辑区 (flex-1)                 ││
│  │  ┌──────────────────┐│  ┌─────────────────────────────────────────┐││
│  │  │ 🔍 搜索框         ││  │ 标题输入框                               │││
│  │  ├──────────────────┤│  │ [___________________________]            │││
│  │  │ 📁 文件夹列表     ││  ├─────────────────────────────────────────┤││
│  │  │   全部笔记        ││  │ 标签选择器                               │││
│  │  │   ├─ 文件夹1      ││  │ [标签1 ×] [标签2 ×] [+ 添加标签]         │││
│  │  │   └─ 文件夹2      ││  ├─────────────────────────────────────────┤││
│  │  ├──────────────────┤│  │ [B] [I] [H] [链接] [代码] [列表] ...     │││
│  │  │ [+ 新建笔记]      ││  ├─────────────────────────────────────────┤││
│  │  ├──────────────────┤│  │                                         │││
│  │  │ 笔记卡片列表      ││  │    Tiptap 编辑器                        │││
│  │  │ • 笔记1 (标题+时间)││  │    (WYSIWYG)                            │││
│  │  │ • 笔记2           ││  │                                         │││
│  │  │ • 笔记3           ││  │                                         │││
│  │  └──────────────────┘│  └─────────────────────────────────────────┘││
│  └──────────────────────┴─────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### 3. 文件夹选择逻辑

```typescript
// 创建笔记时的文件夹归属逻辑
const getFolderIdForNewNote = () => {
  // 优先使用当前选中的文件夹
  if (selectedFolderId) {
    return selectedFolderId
  }
  // 否则为 null（根目录）
  return null
}
```

### 4. 标题与文件名同步

- 笔记的 `title` 字段即为显示名称
- 编辑标题时直接更新 `title`
- 笔记列表中显示 `title`
- 无需额外的"文件名"概念

### 5. 组件结构

```
src/components/notes/
├── index.ts                 # 导出
├── note-editor.tsx          # Tiptap 编辑器 (新增)
├── editor-toolbar.tsx       # 编辑器工具栏 (新增)
├── notes-sidebar.tsx        # 左侧边栏 (重构)
├── notes-list.tsx           # 笔记列表 (重构)
├── note-card.tsx            # 笔记卡片 (保留)
├── note-detail.tsx          # 编辑区整体 (重构)
├── tag-selector.tsx         # 标签选择器 (新增)
├── folder-list.tsx          # 文件夹列表 (新增，替代 folder-tree.tsx)
└── create-note-button.tsx   # 创建按钮 (新增)
```

### 6. 状态管理

扩展 `notes-store.ts`：

```typescript
interface NotesStore {
  // 现有状态
  selectedFolderId: number | null
  selectedTag: string | null
  searchQuery: string
  selectedNoteId: number | null

  // 新增状态
  isCreating: boolean           // 是否正在创建新笔记
  editingNoteId: number | null  // 当前正在编辑的笔记 ID

  // 现有方法
  setSelectedFolder: (id: number | null) => void
  setSelectedTag: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedNote: (id: number | null) => void
  clearFilters: () => void

  // 新增方法
  startCreating: () => void
  stopCreating: () => void
}
```

## Risks / Trade-offs

### 风险 1: Tiptap 包体积较大
- **影响**：可能增加页面加载时间
- **缓解**：使用动态导入 `dynamic(() => import('./note-editor'), { ssr: false })`

### 风险 2: 现有笔记数据兼容性
- **影响**：现有笔记的 Markdown 内容在 Tiptap 中显示可能有差异
- **缓解**：Tiptap 支持 Markdown 解析，测试现有数据兼容性

### 风险 3: 用户习惯变化
- **影响**：用户需要适应新的布局和编辑方式
- **缓解**：新设计更直观，学习成本低

## Migration Plan

1. **阶段 1**：安装 Tiptap 依赖，创建编辑器组件
2. **阶段 2**：重构页面布局（三栏 → 两栏）
3. **阶段 3**：实现创建笔记功能
4. **阶段 4**：实现标题和标签编辑
5. **阶段 5**：删除旧组件，清理代码

**回滚策略**：保留旧组件文件，可通过 Git 回滚

## Open Questions

- 是否需要编辑器全屏模式？
- 是否需要笔记自动保存功能（防丢失）？
