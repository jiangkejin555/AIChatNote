'use client'

import { useFolders } from '@/hooks'
import { useNotesStore } from '@/stores'
import { Folder, FolderOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateFolder } from '@/hooks'
import { useTranslations } from '@/i18n'

export function FolderList() {
  const { data: folders, isLoading } = useFolders()
  const { selectedFolderId, setSelectedFolder } = useNotesStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const createFolder = useCreateFolder()
  const t = useTranslations()

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder.mutate(
      { name: newFolderName.trim() },
      {
        onSuccess: () => {
          setNewFolderName('')
          setShowCreateDialog(false)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-1 px-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5 px-2">
      {/* All Notes */}
      <button
        onClick={() => setSelectedFolder(null)}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer',
          selectedFolderId === null
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <FolderOpen className="h-4 w-4" />
        <span>{t('notes.allNotes')}</span>
      </button>

      {/* Folder List */}
      {folders?.map((folder) => (
        <button
          key={folder.id}
          onClick={() => setSelectedFolder(folder.id)}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer',
            selectedFolderId === folder.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Folder className="h-4 w-4" />
          <span className="truncate">{folder.name}</span>
        </button>
      ))}

      {/* Create Folder */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>{t('notes.newFolder')}</span>
      </button>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('notes.newFolder')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={t('notes.dialogs.fileName')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
