'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Folder as FolderType } from '@/types'
import { useTranslations } from '@/i18n'

interface MoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: FolderType[]
  onConfirm: (targetFolderId: number | null) => void
  title?: string
  excludeFolderId?: number // For folder move - prevent moving to self or descendants
}

export function MoveDialog({
  open,
  onOpenChange,
  folders,
  onConfirm,
  title,
  excludeFolderId,
}: MoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())
  const t = useTranslations()

  const dialogTitle = title || t('notes.dialogs.moveTitle')

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFolders(newExpanded)
  }

  // Get descendants of a folder (to exclude them)
  const getDescendants = (folderId: number): Set<number> => {
    const descendants = new Set<number>()
    const children = folders.filter((f) => f.parent_id === folderId)
    for (const child of children) {
      descendants.add(child.id)
      const childDescendants = getDescendants(child.id)
      childDescendants.forEach((id) => descendants.add(id))
    }
    return descendants
  }

  const excludedIds = excludeFolderId
    ? new Set([excludeFolderId, ...getDescendants(excludeFolderId)])
    : new Set()

  const rootFolders = folders.filter((f) => !f.parent_id && !excludedIds.has(f.id))

  const handleConfirm = () => {
    onConfirm(selectedFolderId)
    onOpenChange(false)
  }

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const children = folders.filter(
      (f) => f.parent_id === folder.id && !excludedIds.has(f.id)
    )
    const hasChildren = children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id

    return (
      <div key={folder.id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
            'hover:bg-accent',
            isSelected && 'bg-primary/10 border border-primary/50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedFolderId(folder.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="p-0.5 hover:bg-accent rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isSelected ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          <span className="text-sm truncate">{folder.name}</span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-64 border rounded-md">
          <div className="p-2">
            {/* Root option */}
            <div
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
                'hover:bg-accent',
                selectedFolderId === null && 'bg-primary/10 border border-primary/50'
              )}
              onClick={() => setSelectedFolderId(null)}
            >
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{t('notes.dialogs.moveToRoot')}</span>
            </div>

            {/* Folder tree */}
            {rootFolders.map((folder) => renderFolder(folder))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('notes.dialogs.moveHere')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
