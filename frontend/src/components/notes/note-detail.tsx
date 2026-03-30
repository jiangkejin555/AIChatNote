'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useNote, useUpdateNote, useDeleteNote, useCreateNote, useFolders, useNotes, useSyncNoteToNotion } from '@/hooks'
import { useNotesStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  Save,
  Pencil,
  FolderOpen,
  Calendar,
  Clock,
  FileText,
  BookOpen,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TagSelector } from './tag-selector'
import { NoteViewer, TagList } from './note-viewer'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTranslations, getSavedLocale } from '@/i18n'

// Dynamic import for editor to reduce initial load
const NoteEditor = dynamic(
  () => import('./note-editor').then((mod) => mod.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

export function NoteDetail() {
  const t = useTranslations()
  const locale = getSavedLocale()
  const { selectedNoteId, isCreating, selectedFolderId, stopCreating, setSelectedNote, startEditing: startEditingStore, stopEditing: stopEditingStore, setEditingContent } = useNotesStore()
  const { data: note, isLoading } = useNote(selectedNoteId)
  const { data: folders } = useFolders()
  const { data: allNotes } = useNotes()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const createNote = useCreateNote()
  const syncToNotion = useSyncNoteToNotion()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [folderId, setFolderId] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  // Edit mode state - default to false (read-only), true for new notes
  const [isEditing, setIsEditing] = useState(false)

  // Wrapper for setContent that also updates store for TOC
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setEditingContent(newContent)
  }, [setEditingContent])

  const MAX_TITLE_LENGTH = 50

  // Build folder path helper
  const getFolderPath = useCallback(() => {
    const currentFolder = folders?.find((f) => f.id === parseInt(folderId))
    if (!currentFolder) return t('notes.myFolders')

    const buildPath = (folder: typeof currentFolder): string[] => {
      const path: string[] = [folder.name]
      let parent = folders?.find((f) => f.id === folder.parent_id)
      while (parent) {
        path.unshift(parent.name)
        parent = folders?.find((f) => f.id === parent?.parent_id)
      }
      return path
    }

    return t('notes.myFolders') + '/' + buildPath(currentFolder).join('/')
  }, [folders, folderId, t])

  // Initialize form when note changes or creating new note
  useEffect(() => {
    if (isCreating) {
      setTitle('')
      setContent('')
      setEditingContent('') // Clear editing content in store
      setTags([])
      setFolderId(selectedFolderId?.toString() || '')
      setTitleError(null)
      setIsEditing(true) // Start in edit mode for new notes
      startEditingStore() // Notify store that editing started
    } else if (note) {
      setTitle(note.title)
      setContent(note.content)
      setEditingContent(note.content) // Set editing content in store
      setTags(note.tags)
      setFolderId(note.folder_id?.toString() || '')
      setTitleError(null)
      setIsEditing(false) // Start in read-only mode for existing notes
      stopEditingStore() // Notify store that editing stopped
    }
  }, [note, isCreating, selectedFolderId, setEditingContent, startEditingStore, stopEditingStore])

  const handleSave = useCallback(async () => {
    // Validation
    if (!title.trim()) {
      setTitleError(t('notes.enterFileName'))
      return
    }
    if (/^\s*$/.test(title)) {
      setTitleError(t('notes.fileNameWhitespace'))
      return
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setTitleError(t('notes.fileNameTooLong', { max: String(MAX_TITLE_LENGTH) }))
      return
    }

    // Check for duplicate note title in same folder
    const currentFolderId = folderId ? parseInt(folderId) : null
    const duplicateNote = allNotes?.some(
      (n) => n.id !== selectedNoteId &&
        n.title.trim() === title.trim() &&
        n.folder_id === currentFolderId
    )
    if (duplicateNote) {
      setTitleError(t('notes.duplicateNoteTitle'))
      return
    }

    setTitleError(null)
    setIsSaving(true)
    try {
      if (isCreating) {
        // Create new note
        const result = await createNote.mutateAsync({
          title: title.trim(),
          content,
          tags,
          folder_id: folderId ? parseInt(folderId) : undefined,
        })
        stopCreating()
        setSelectedNote(result.note.id)
        toast.success(t('notes.createSuccess'))
      } else if (selectedNoteId) {
        // Update existing note
        await updateNote.mutateAsync({
          id: selectedNoteId,
          data: {
            title: title.trim(),
            content,
            tags,
            folder_id: folderId ? parseInt(folderId) : undefined,
          },
        })
        toast.success(t('notes.saveSuccess'))
      }
      setIsEditing(false) // Switch back to read-only mode after save
    } catch (error) {
      toast.error(t('notes.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }, [title, content, tags, folderId, isCreating, selectedNoteId, createNote, updateNote, stopCreating, setSelectedNote, allNotes, t])

  const handleCancel = () => {
    if (isCreating) {
      stopCreating()
      stopEditingStore()
    } else if (note) {
      // Reset to original values
      setTitle(note.title)
      setContent(note.content)
      setEditingContent(note.content)
      setTags(note.tags)
      setFolderId(note.folder_id?.toString() || '')
      setIsEditing(false) // Switch back to read-only mode
      stopEditingStore()
    }
    setTitleError(null)
  }

  const handleEdit = () => {
    setIsEditing(true)
    startEditingStore()
    setEditingContent(content)
  }

  const handleDelete = () => {
    if (!selectedNoteId) return
    deleteNote.mutate(selectedNoteId)
    setDeleteDialogOpen(false)
  }

  const handleSyncNotion = () => {
    if (!selectedNoteId) return
    syncToNotion.mutate(selectedNoteId)
  }

  // Loading state
  if (!isCreating && isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b flex items-center justify-end px-4">
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Empty state
  if (!isCreating && !note) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">{t('notes.selectNoteToView')}</p>
          <p className="text-sm">{t('notes.clickNewNote')}</p>
        </div>
      </div>
    )
  }

  // Read-only mode
  if (!isEditing && !isCreating && note) {
    // Calculate word count and reading time
    const wordCount = note.content.replace(/<[^>]*>/g, '').length
    const readingTime = Math.max(1, Math.ceil(wordCount / 500))

    // Format dates
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }

    let syncStatus: 'Unsynced' | 'Synced' | 'Modified' = 'Unsynced'
    if (note.notion_page_id) {
      if (!note.notion_last_sync_at) {
        syncStatus = 'Modified'
      } else {
        const syncAt = new Date(note.notion_last_sync_at).getTime()
        const updatedAt = new Date(note.updated_at).getTime()
        syncStatus = syncAt >= updatedAt ? 'Synced' : 'Modified'
      }
    }

    const notionIconColor =
      syncStatus === 'Synced' ? 'text-blue-500 dark:text-blue-400' :
        syncStatus === 'Modified' ? 'text-orange-500 dark:text-orange-400' :
          'text-muted-foreground'

    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Header with meta info */}
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-15 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <FolderOpen className="h-4 w-4" />
              <span>{getFolderPath()}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {note.title}
            </h1>

            {/* Meta info row */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{t('notes.createdOn')} {formatDate(note.created_at)}</span>
              </div>
              {note.updated_at !== note.created_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{t('notes.updatedOn')} {formatDate(note.updated_at)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>{t('notes.wordCount', { count: String(wordCount) })}</span>
              </div>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground/80">{t('notes.readingTime', { time: String(readingTime) })}</span>
            </div>

            {/* Tags row with action buttons */}
            <div className="flex items-center justify-between gap-4 mt-4">
              <TagList tags={note.tags} />
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNotion}
                  disabled={syncToNotion.isPending}
                  className={cn(
                    'cursor-pointer gap-1.5 transition-all duration-300',
                    syncStatus === 'Synced' && 'border-blue-200 bg-blue-50/80 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50 dark:hover:border-blue-700',
                    syncStatus === 'Modified' && 'border-orange-200 bg-orange-50/80 text-orange-600 hover:bg-orange-100 hover:border-orange-300 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50 dark:hover:border-orange-700',
                  )}
                  title={t('notes.syncToNotion') || 'Sync to Notion'}
                >
                  {syncToNotion.isPending ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${notionIconColor}`} />
                  ) : syncStatus === 'Synced' ? (
                    <span className="relative">
                      <BookOpen className="h-4 w-4" />
                      <Check className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-blue-500 dark:text-blue-400 fill-blue-500 dark:fill-blue-400" />
                    </span>
                  ) : (
                    <BookOpen className={`h-4 w-4 ${notionIconColor}`} />
                  )}
                  <span className="hidden sm:inline">Notion</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className="cursor-pointer gap-1.5"
                >
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent cursor-pointer transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer focus:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-15 py-6">
            {/* Main content - same width as header */}
            <div className="border rounded-lg p-6 bg-card shadow-sm">
              <NoteViewer
                content={note.content}
                className="min-h-[60vh] note-viewer"
              />
            </div>
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('notes.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('notes.confirmDeleteDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Edit mode (for both new and existing notes)
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-15 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <FolderOpen className="h-4 w-4" />
            <span>{getFolderPath()}</span>
          </div>

          {/* Title input */}
          <div className="relative">
            <Input
              value={title}
              onChange={(e) => {
                const newValue = e.target.value.slice(0, MAX_TITLE_LENGTH)
                setTitle(newValue)
                setTitleError(null)
              }}
              placeholder={t('notes.enterFileName')}
              maxLength={MAX_TITLE_LENGTH}
              className={cn(
                'text-2xl font-bold bg-background border border-input rounded-md px-3 py-2 pr-16',
                'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary',
                'placeholder:text-muted-foreground/50',
                titleError && 'border-destructive'
              )}
            />
            <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
          {titleError && (
            <p className="text-sm text-destructive mt-1">{titleError}</p>
          )}

          {/* Tags row with action buttons */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('notes.tags')}:</span>
              <TagSelector tags={tags} onChange={setTags} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="cursor-pointer gap-1.5">
                <X className="h-4 w-4" />
                {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="cursor-pointer gap-1.5">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Edit Mode */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-15 py-6">
          {/* Editor - same width as header */}
          <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
            <NoteEditor
              content={content}
              onChange={handleContentChange}
              className="min-h-[60vh] border-0 shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
