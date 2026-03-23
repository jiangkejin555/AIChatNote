## 1. Infrastructure Setup

- [x] 1.1 Add `getT()` function in `src/i18n/index.ts` for non-component translation access
- [x] 1.2 Add font size and font family state to `src/stores/ui-store.ts`
- [x] 1.3 Create CSS variables for font settings in `src/app/globals.css`
- [x] 1.4 Add font settings UI keys to `messages/zh.json` and `messages/en.json`

## 2. Font Settings Implementation

- [x] 2.1 Update Settings page with font size selection UI (Small/Medium/Large)
- [x] 2.2 Update Settings page with font family dropdown UI
- [x] 2.3 Implement CSS variable application based on font settings
- [x] 2.4 Add preset font family options (System Default, Inter, Roboto, Noto Sans SC)

## 3. i18n Fix - Layout Components

- [x] 3.1 Fix `src/components/layout/header.tsx` - user menu text

## 4. i18n Fix - Auth Pages

- [x] 4.1 Fix `src/app/(auth)/login/page.tsx` - all hardcoded Chinese text
- [x] 4.2 Fix `src/app/(auth)/register/page.tsx` - all hardcoded Chinese text

## 5. i18n Fix - Chat Components

- [x] 5.1 Fix `src/components/chat/message-input.tsx` - placeholder text
- [x] 5.2 Fix `src/components/chat/conversation-list.tsx` - empty state, dialog text, menu items
- [ ] 5.3 Fix `src/components/chat/message-item.tsx` - copy button, action labels
- [ ] 5.4 Fix `src/components/chat/model-selector.tsx` - placeholder and labels
- [ ] 5.5 Fix `src/components/chat/save-note-dialog.tsx` - dialog text
- [ ] 5.6 Fix `src/components/chat/message-selector.tsx` - selection labels

## 6. i18n Fix - Notes Components

- [x] 6.1 Fix `src/components/notes/folder-list.tsx` - folder labels, dialog text
- [x] 6.2 Fix `src/components/notes/notes-list.tsx` - empty state, delete dialog
- [x] 6.3 Fix `src/components/notes/note-editor.tsx` - placeholder text
- [ ] 6.4 Fix `src/components/notes/note-viewer.tsx` - viewer labels
- [ ] 6.5 Fix `src/components/notes/note-card.tsx` - card labels
- [ ] 6.6 Fix `src/components/notes/note-detail.tsx` - detail view labels
- [ ] 6.7 Fix `src/components/notes/tag-cloud.tsx` - tag filter labels
- [ ] 6.8 Fix `src/components/notes/tag-selector.tsx` - selector labels
- [ ] 6.9 Fix `src/components/notes/tag-filter-dropdown.tsx` - dropdown labels
- [ ] 6.10 Fix `src/components/notes/create-note-button.tsx` - button text
- [ ] 6.11 Fix `src/components/notes/editor-toolbar.tsx` - toolbar button labels
- [ ] 6.12 Fix `src/components/notes/toc-sidebar.tsx` - TOC labels
- [ ] 6.13 Fix `src/components/notes/notes-sidebar.tsx` - sidebar labels
- [ ] 6.14 Fix `src/components/notes/folder-tree.tsx` - tree labels
- [ ] 6.15 Fix `src/components/notes/folder-tree-selector.tsx` - selector labels

## 7. i18n Fix - Note Dialogs

- [x] 7.1 Fix `src/components/notes/dialogs/rename-dialog.tsx` - dialog text
- [x] 7.2 Fix `src/components/notes/dialogs/move-dialog.tsx` - dialog text
- [ ] 7.3 Fix `src/components/notes/dialogs/import-markdown-dialog.tsx` - dialog text

## 8. i18n Fix - Provider Management

- [x] 8.1 Fix `src/components/provider-management/provider-card.tsx` - card labels
- [ ] 8.2 Fix `src/components/provider-management/provider-list.tsx` - list labels
- [ ] 8.3 Fix `src/components/provider-management/provider-form-dialog.tsx` - form labels
- [ ] 8.4 Fix `src/components/provider-management/model-selection-dialog.tsx` - dialog labels

## 9. i18n Fix - Hooks (Toast Messages)

- [x] 9.1 Fix `src/hooks/use-notes.ts` - toast messages
- [ ] 9.2 Fix `src/hooks/use-folders.ts` - toast messages
- [ ] 9.3 Fix `src/hooks/use-models.ts` - toast messages
- [ ] 9.4 Fix `src/hooks/use-providers.ts` - toast messages
- [ ] 9.5 Fix `src/hooks/use-conversations.ts` - toast messages

## 10. i18n Fix - Pages

- [ ] 10.1 Fix `src/app/(main)/models/page.tsx` - page text
- [ ] 10.2 Fix `src/app/(main)/notes/page.tsx` - page text
- [ ] 10.3 Fix `src/app/(main)/page.tsx` - main chat page text

## 11. i18n Fix - Common Components

- [ ] 11.1 Fix `src/components/common/copy-button.tsx` - button text
- [ ] 11.2 Fix `src/components/common/empty-state.tsx` - empty state text
- [ ] 11.3 Fix `src/components/common/loading-skeleton.tsx` - loading text

## 12. Translation File Updates

- [x] 12.1 Add all missing keys to `messages/zh.json` (partial)
- [x] 12.2 Add all missing keys to `messages/en.json` (partial)
- [ ] 12.3 Verify all translation keys are used correctly

## 13. Verification

- [ ] 13.1 Test language switching - verify all UI text changes
- [ ] 13.2 Test font size settings - verify UI text scaling
- [ ] 13.3 Test font family settings - verify font changes
- [ ] 13.4 Verify settings persistence across page refreshes
- [ ] 13.5 Verify user content (chat, notes) is NOT affected by font settings
