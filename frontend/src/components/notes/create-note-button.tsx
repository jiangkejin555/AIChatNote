'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useNotesStore } from '@/stores'
import { useTranslations } from '@/i18n'

export function CreateNoteButton() {
  const t = useTranslations()
  const { startCreating, selectedFolderId } = useNotesStore()

  const handleCreate = () => {
    startCreating()
  }

  return (
    <Button
      onClick={handleCreate}
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs gap-1 cursor-pointer"
    >
      <Plus className="h-3 w-3" />
      {t('notes.newNote')}
    </Button>
  )
}
