import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotesState {
  selectedFolderId: number | null
  selectedTag: string | null
  searchQuery: string
  selectedNoteId: number | null
  isCreating: boolean
  isEditing: boolean
  editingContent: string
  expandedFolderIds: Set<number>
  selectedNoteForAction: number | null
  selectedFolderForAction: number | null
  setSelectedFolder: (folderId: number | null) => void
  setSelectedTag: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  setSelectedNote: (noteId: number | null) => void
  clearFilters: () => void
  startCreating: () => void
  stopCreating: () => void
  startEditing: () => void
  stopEditing: () => void
  setEditingContent: (content: string) => void
  toggleFolderExpand: (folderId: number) => void
  expandFolder: (folderId: number) => void
  collapseFolder: (folderId: number) => void
  setSelectedNoteForAction: (noteId: number | null) => void
  setSelectedFolderForAction: (folderId: number | null) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      selectedFolderId: null,
      selectedTag: null,
      searchQuery: '',
      selectedNoteId: null,
      isCreating: false,
      isEditing: false,
      editingContent: '',
      expandedFolderIds: new Set<number>(),
      selectedNoteForAction: null,
      selectedFolderForAction: null,
      setSelectedFolder: (folderId) =>
        set({
          selectedFolderId: folderId,
        }),
      setSelectedTag: (tag) =>
        set({
          selectedTag: tag,
        }),
      setSearchQuery: (query) =>
        set({
          searchQuery: query,
        }),
      setSelectedNote: (noteId) =>
        set({
          selectedNoteId: noteId,
          isCreating: false,
          isEditing: false,
        }),
      clearFilters: () =>
        set({
          selectedFolderId: null,
          selectedTag: null,
          searchQuery: '',
        }),
      startCreating: () =>
        set({
          isCreating: true,
          selectedNoteId: null,
          isEditing: false,
        }),
      stopCreating: () =>
        set({
          isCreating: false,
          isEditing: false,
        }),
      startEditing: () =>
        set({
          isEditing: true,
        }),
      stopEditing: () =>
        set({
          isEditing: false,
        }),
      setEditingContent: (content) =>
        set({
          editingContent: content,
        }),
      toggleFolderExpand: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds)
          if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId)
          } else {
            newExpanded.add(folderId)
          }
          return { expandedFolderIds: newExpanded }
        }),
      expandFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds)
          newExpanded.add(folderId)
          return { expandedFolderIds: newExpanded }
        }),
      collapseFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds)
          newExpanded.delete(folderId)
          return { expandedFolderIds: newExpanded }
        }),
      setSelectedNoteForAction: (noteId) =>
        set({
          selectedNoteForAction: noteId,
        }),
      setSelectedFolderForAction: (folderId) =>
        set({
          selectedFolderForAction: folderId,
        }),
    }),
    {
      name: 'notes-store',
      partialize: (state) => ({
        expandedFolderIds: Array.from(state.expandedFolderIds),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as unknown as { expandedFolderIds: number[] }).expandedFolderIds)) {
          state.expandedFolderIds = new Set((state as unknown as { expandedFolderIds: number[] }).expandedFolderIds)
        }
      },
    }
  )
)
