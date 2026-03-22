## 1. Internationalization Updates

- [x] 1.1 Update `messages/zh.json`: change "知识库" to "我的笔记" in sidebar and notes sections
- [x] 1.2 Update `messages/en.json`: change "Knowledge Base" to "My Notes" in sidebar and notes sections
- [x] 1.3 Add new translation keys for folder actions (rename, copy, move, import, delete)
- [x] 1.4 Add new translation keys for note actions (rename, copy, move, export, delete)
- [x] 1.5 Add translation keys for dialogs (move dialog, delete confirmation, import progress)

## 2. Store Updates

- [x] 2.1 Add `expandedFolderIds: Set<number>` to `notes-store.ts`
- [x] 2.2 Add `toggleFolderExpand`, `expandFolder`, `collapseFolder` actions
- [x] 2.3 Persist expand state to localStorage
- [x] 2.4 Add `selectedNoteForAction` state for context menus

## 3. API Updates

- [x] 3.1 Add `importMarkdown` function to `notesApi`
- [x] 3.2 Add `batchDeleteNotes` function to `notesApi`
- [x] 3.3 Add `batchMoveNotes` function to `notesApi`
- [x] 3.4 Add `copyNote` function to `notesApi`
- [x] 3.5 Add `copyFolder` function to `foldersApi`
- [x] 3.6 Update mock data to support new API functions

## 4. Hook Updates

- [x] 4.1 Add `useImportMarkdown` hook
- [x] 4.2 Add `useCopyNote` hook
- [x] 4.3 Add `useMoveNote` hook
- [x] 4.4 Add `useCopyFolder` hook
- [x] 4.5 Add `useMoveFolder` hook

## 5. Folder Tree Components

**设计要求**：实现前必须使用 `/ui-ux-pro-max` skill 生成设计规范

- [x] 5.0 使用 `/ui-ux-pro-max` 生成组件设计系统
- [x] 5.1 Create `FolderTreeItem` component with recursive rendering
- [x] 5.2 Add expand/collapse toggle with ChevronRight/ChevronDown icons
- [x] 5.3 Add folder indentation styling (ml-4 per level)
- [x] 5.4 Add "+" button with dropdown menu (New Subfolder, New Note)
- [x] 5.5 Add "..." button with dropdown menu (Rename, Copy, Move, Import, Delete)
- [x] 5.6 Update `FolderList` to use tree structure instead of flat list
- [x] 5.7 Add "All Notes" as root entry with special styling
- [x] 5.8 验证组件符合设计规范（悬停、过渡、可访问性）

## 6. Dialog Components

**设计要求**：实现前使用 `/ui-ux-pro-max` 确保对话框设计一致

- [x] 6.1 Create `RenameDialog` component (reusable for folder and note)
- [x] 6.2 Create `MoveDialog` component with folder tree selector
- [x] 6.3 Create `DeleteFolderDialog` with note selection checkboxes
- [x] 6.4 Create `ImportMarkdownDialog` with file picker and progress indicator

## 7. Note Card Updates

**设计要求**：实现前使用 `/ui-ux-pro-max` 确保卡片和菜单设计美观

- [x] 7.1 Add "..." button to `NoteCard` component
- [x] 7.2 Create `NoteActionMenu` dropdown component
- [x] 7.3 Add action handlers (rename, copy, move, export, delete)

## 8. Sidebar Layout Updates

**设计要求**：实现前使用 `/ui-ux-pro-max` 优化侧边栏整体布局

- [x] 8.1 Update `NotesSidebar` layout structure
- [x] 8.2 Move "New Note" button below folder tree
- [x] 8.3 Create combined search + tag filter row component
- [x] 8.4 Add tag filter dropdown next to search input

## 9. Tag Filter Implementation

**设计要求**：实现前使用 `/ui-ux-pro-max` 设计标签筛选组件

- [x] 9.1 Create `TagFilterDropdown` component
- [x] 9.2 Display tags with note counts
- [x] 9.3 Implement single tag selection
- [x] 9.4 Add clear filter functionality
- [x] 9.5 Integrate with existing `useNotes` query params

## 10. Note Editor Updates

- [x] 10.1 Add folder path display at top of editor
- [x] 10.2 Add "File Name" label before title input
- [x] 10.3 Add title required validation
- [x] 10.4 Add whitespace-only validation
- [x] 10.5 Display validation error message

## 11. Markdown Import Implementation

- [x] 11.1 Create file input handler for Markdown files
- [x] 11.2 Parse Markdown to extract title from first `#` heading
- [x] 11.3 Fallback to filename if no heading found
- [x] 11.4 Handle multiple file import with progress
- [x] 11.5 Add file size validation (max 5MB)
- [x] 11.6 Display error messages for failed imports

## 12. Integration and Testing

- [x] 12.1 Test folder tree expand/collapse persistence
- [x] 12.2 Test folder delete with note selection
- [x] 12.3 Test note and folder move functionality
- [x] 12.4 Test Markdown import with various file formats
- [x] 12.5 Test combined search + tag filter
- [x] 12.6 Test note editor validation
