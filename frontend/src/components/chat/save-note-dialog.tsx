'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAsyncNoteGeneration, useCreateNote, useFolders, useTags, useMessages } from '@/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FolderTreeSelector } from '@/components/notes/folder-tree-selector'
import { X, Sparkles, FileText, Loader2, Folder, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n'
import { MessageSelector } from './message-selector'
import { formatMessagesAsHtml } from '@/lib/markdown-utils'
import type { Message, Folder as FolderType } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { integrationService } from '@/services/integration'
import { cn } from '@/lib/utils'

interface SaveNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: number | null
  onSuccess?: () => void
}

const MAX_TAGS = 5

export function SaveNoteDialog({
  open,
  onOpenChange,
  conversationId,
  onSuccess,
}: SaveNoteDialogProps) {
  const t = useTranslations()

  // Form state
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([])
  const [syncToNotion, setSyncToNotion] = useState(false)

  // Notion status query
  const { data: notionStatus } = useQuery({
    queryKey: ['notion-status'],
    queryFn: () => integrationService.getNotionStatus(),
    enabled: open,
  })

  // Hooks
  const { startGeneration } = useAsyncNoteGeneration()
  const createNote = useCreateNote()
  const { data: folders } = useFolders()
  const { data: existingTags } = useTags()
  const { data: messages } = useMessages(conversationId)

  // Build folder path
  const getFolderPath = useMemo(() => {
    return (folderList: FolderType[] | undefined, targetId: number | null): string => {
      if (!folderList || targetId === null) return ''

      const buildPath = (folder: FolderType, path: string[]): string[] => {
        path.unshift(folder.name)
        if (folder.parent_id) {
          const parent = folderList.find(f => f.id === folder.parent_id)
          if (parent) {
            return buildPath(parent, path)
          }
        }
        return path
      }

      const targetFolder = folderList.find(f => f.id === targetId)
      if (targetFolder) {
        return buildPath(targetFolder, []).join(' / ')
      }
      return ''
    }
  }, [])

  // Get selected folder path
  const selectedFolderPath = useMemo(() => {
    return getFolderPath(folders, folderId)
  }, [folders, folderId, getFolderPath])

  // Filter suggested tags (exclude already selected)
  const suggestedTags = useMemo(() => {
    if (!existingTags) return []
    return existingTags
      .filter(tag => !tags.includes(tag.name))
      .slice(0, 6)
      .map(tag => tag.name)
  }, [existingTags, tags])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMessageIds([])
      setTitle('')
      setTags([])
      setTagInput('')
      setFolderId(null)
      setSyncToNotion(false)
    }
  }, [open])

  // Select all messages by default when messages load
  useEffect(() => {
    if (open && messages && messages.length > 0 && selectedMessageIds.length === 0) {
      setSelectedMessageIds(messages.map(m => m.id))
    }
  }, [open, messages])

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < MAX_TAGS) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  const validateForm = (requireTitle: boolean): boolean => {
    if (selectedMessageIds.length === 0) {
      toast.error(t('saveNote.pleaseSelectMessage'))
      return false
    }
    if (requireTitle && !title.trim()) {
      toast.error(t('saveNote.pleaseEnterFileName'))
      return false
    }
    return true
  }

  const handleDirectSave = async () => {
    if (!validateForm(true)) return

    const selectedMessages = messages?.filter(m => selectedMessageIds.includes(m.id)) || []
    const htmlContent = await formatMessagesAsHtml(selectedMessages, {
      me: t('common.me'),
      ai: t('common.ai'),
    })

    // Close dialog immediately
    onOpenChange(false)
    toast.info(t('saveNote.saving'))

    try {
      await createNote.mutateAsync({
        title: title.trim(),
        content: htmlContent,
        tags,
        folder_id: folderId ?? undefined,
        source_conversation_id: conversationId || undefined,
        sync_to_notion: syncToNotion,
      })
      onSuccess?.()
    } catch {
      toast.error(t('saveNote.saveFailed'))
    }
  }

  const handleAiSummarySave = async () => {
    if (!validateForm(false)) return
    if (!conversationId) {
      toast.error(t('saveNote.cannotGetConversation'))
      return
    }

    // Close dialog immediately — generation runs async in the background
    onOpenChange(false)

    try {
      await startGeneration(conversationId)
      onSuccess?.()
    } catch {
      toast.error(t('saveNote.saveFailed'))
    }
  }

  const isSaving = createNote.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <FileText className="h-4 w-4 text-blue-500" />
            {t('saveNote.selectMessagesToSave')}
          </DialogTitle>
          <div className="flex items-center justify-between mt-1">
            <DialogDescription className="text-xs">
              {t('saveNote.selectMessagesDesc')}
            </DialogDescription>
            <button
              onClick={() => {
                if (messages && messages.length > 0) {
                  if (selectedMessageIds.length === messages.length) {
                    setSelectedMessageIds([])
                  } else {
                    setSelectedMessageIds(messages.map(m => m.id))
                  }
                }
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
            >
              {messages && messages.length > 0 && selectedMessageIds.length === messages.length ? t('saveNote.deselectAll') : t('saveNote.selectAll')}
            </button>
          </div>
        </DialogHeader>

        {/* Message Selector - Fixed height scrollable area */}
        <div className="px-5 shrink-0">
          <MessageSelector
            messages={messages || []}
            selectedIds={selectedMessageIds}
            onSelectionChange={setSelectedMessageIds}
          />
        </div>

        {/* Form Fields - Scrollable if needed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Folder Row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0 w-14">{t('saveNote.folder')}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {selectedFolderPath ? `我的文件夹 / ${selectedFolderPath}` : '我的文件夹（根目录）'}
              </span>
            </div>
            <FolderTreeSelector
              folders={folders || []}
              value={folderId}
              onChange={setFolderId}
              maxHeight="120px"
            />
          </div>

          {/* Title Row */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0 w-14">
              {t('saveNote.fileName')}<span className="text-red-500 ml-0.5">*</span>
            </span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('saveNote.fileNameRequired')}
              disabled={isSaving}
              className="flex-1 h-8 text-sm bg-background"
            />
          </div>

          {/* Tags Row */}
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium text-muted-foreground shrink-0 w-14 pt-1.5">{t('saveNote.tags')}</span>
            <div className="flex-1 space-y-2">
              <div
                className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 min-h-[32px] rounded-md border bg-background text-sm
                  focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50
                  transition-all duration-150"
              >
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-0.5 text-xs py-0 px-1.5 h-5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-red-500 transition-colors cursor-pointer"
                      type="button"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                {tags.length < MAX_TAGS && (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder={tags.length === 0 ? t('saveNote.enterTagPlaceholder') : ''}
                    disabled={isSaving}
                    className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-xs placeholder:text-muted-foreground"
                  />
                )}
              </div>
              {suggestedTags.length > 0 && tags.length < MAX_TAGS && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      disabled={isSaving}
                      className="px-2 py-0.5 text-xs rounded-full border border-dashed border-muted-foreground/30
                        hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400
                        hover:bg-blue-50 dark:hover:bg-blue-950/30
                        transition-all duration-150 cursor-pointer disabled:opacity-50"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="shrink-0 relative flex items-center justify-center px-5 py-3.5 border-t bg-muted/30">
          {/* Buttons - truly centered */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDirectSave}
              disabled={isSaving}
              className="cursor-pointer min-w-[100px] h-7 text-[11px] transition-all duration-200
                hover:bg-primary/10 hover:text-primary hover:border-primary/40
                dark:hover:bg-primary/20 dark:hover:text-primary dark:hover:border-primary/50"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <FileText className="h-3 w-3 mr-1" />
              )}
              {t('saveNote.directSaveBtn')}
            </Button>
            <Button
              onClick={handleAiSummarySave}
              disabled={isSaving}
              className="cursor-pointer min-w-[100px] h-7 text-[11px]
                bg-gradient-to-r from-primary/90 to-primary
                hover:from-primary hover:to-primary
                text-primary-foreground border-0 shadow-sm shadow-primary/20
                transition-all duration-200"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {t('saveNote.aiSummaryBtn')}
            </Button>
          </div>

          {/* Sync to Notion - 绝对定位在右侧 */}
          {notionStatus?.connected && (
            <label
              htmlFor="sync-notion"
              className="absolute right-5 flex items-center gap-2 cursor-pointer select-none group"
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center h-[18px] w-[18px] rounded-[4px] border transition-all duration-200',
                  syncToNotion
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25'
                    : 'border-muted-foreground/30 group-hover:border-primary/50 bg-background'
                )}
              >
                {syncToNotion && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <input
                id="sync-notion"
                type="checkbox"
                checked={syncToNotion}
                onChange={(e) => setSyncToNotion(e.target.checked)}
                className="sr-only"
              />
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground leading-none transition-colors duration-150">
                {t('saveNote.syncToNotion') || 'Sync to Notion'}
              </span>
            </label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
