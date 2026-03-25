'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGenerateNote, useCreateNote, useFolders, useTags, useMessages } from '@/hooks'
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
import { X, Sparkles, FileText, Loader2, Folder } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n'
import { MessageSelector } from './message-selector'
import { markdownToHtml, formatMessagesAsHtml } from '@/lib/markdown-utils'
import type { Message, Folder as FolderType } from '@/types'

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

  // Hooks
  const generateNote = useGenerateNote()
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

    // Close dialog immediately
    onOpenChange(false)
    toast.info(t('saveNote.aiSaving'))

    try {
      // First generate AI summary
      const result = await generateNote.mutateAsync({ conversation_id: conversationId })

      // Convert Markdown to HTML for consistent storage
      const htmlContent = await markdownToHtml(result.content)

      // Then create note with AI-generated or user-provided title/tags
      await createNote.mutateAsync({
        title: title.trim() || result.title,
        content: htmlContent,
        tags: tags.length > 0 ? tags : result.tags,
        folder_id: folderId ?? undefined,
        source_conversation_id: conversationId,
      })
      onSuccess?.()
    } catch {
      toast.error(t('saveNote.saveFailed'))
    }
  }

  const isSaving = createNote.isPending || generateNote.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-0 -mb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {t('saveNote.selectMessagesToSave')}
          </DialogTitle>
          <div className="flex items-center justify-between">
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
              className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer mr-3"
            >
              {messages && messages.length > 0 && selectedMessageIds.length === messages.length ? t('saveNote.deselectAll') : t('saveNote.selectAll')}
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Message Selector */}
          <MessageSelector
            messages={messages || []}
            selectedIds={selectedMessageIds}
            onSelectionChange={setSelectedMessageIds}
          />

          {/* Form Fields - Horizontal Layout */}
          <div className="space-y-3 border-t pt-4">
            {/* Folder Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0 w-16">{t('saveNote.folder')}</span>
                <span className="text-sm flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedFolderPath || t('saveNote.rootFolder')}
                </span>
              </div>
              <FolderTreeSelector
                folders={folders || []}
                value={folderId}
                onChange={setFolderId}
                maxHeight="160px"
              />
            </div>

            {/* Title Row */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0 w-16">
                {t('saveNote.fileName')}<span className="text-destructive">*</span>
              </span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('saveNote.fileNameRequired')}
                disabled={isSaving}
                className="flex-1 min-w-[60px] bg-transparent outline-none text-sm placeholder:text-xs placeholder:text-muted-foreground"
              />
            </div>

            {/* Tags Row */}
            <div className="flex items-start gap-3">
              <span className="text-sm text-muted-foreground shrink-0 w-16 pt-1">{t('saveNote.tags')}</span>
              <div className="flex-1 space-y-2">
                {/* Tag Input with inline tags */}
                <div
                  className="flex flex-wrap items-center gap-1.5 px-2 py-1 min-h-[28px] rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-primary/50"
                >
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-0.5 text-xs py-0 px-1.5 h-5"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 hover:text-destructive cursor-pointer"
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
                      className="flex-1 min-w-[60px] bg-transparent outline-none text-sm placeholder:text-xs placeholder:text-muted-foreground"
                    />
                  )}
                </div>
                {/* Suggested Tags */}
                {suggestedTags.length > 0 && tags.length < MAX_TAGS && (
                  <div className="flex flex-wrap gap-1">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        disabled={isSaving}
                        className="px-2 py-0.5 text-xs rounded-full border border-border bg-background hover:bg-accent hover:border-primary/30 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-10 pt-2 border-t">
          <Button
            variant="outline"
            onClick={handleDirectSave}
            disabled={isSaving}
            className="cursor-pointer min-w-[110px] transition-all duration-200"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {t('saveNote.directSaveBtn')}
          </Button>
          <Button
            onClick={handleAiSummarySave}
            disabled={isSaving}
            className="cursor-pointer min-w-[110px] transition-all duration-200"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {t('saveNote.aiSummaryBtn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
