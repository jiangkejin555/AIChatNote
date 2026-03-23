'use client'

import { useNotes, useDeleteNote, useCopyNote, useExportNote } from '@/hooks'
import { useNotesStore } from '@/stores'
import { NoteCard } from './note-card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'
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
import { useState } from 'react'
import type { Note } from '@/types'
import { useTranslations } from '@/i18n'

export function NotesList() {
  const { data: notes, isLoading } = useNotes()
  const { selectedNoteId, setSelectedNote, selectedFolderId } = useNotesStore()
  const deleteNote = useDeleteNote()
  const copyNote = useCopyNote()
  const exportNote = useExportNote()
  const t = useTranslations()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [noteToMove, setNoteToMove] = useState<Note | null>(null)

  // Filter notes by selected folder
  const filteredNotes = notes?.filter((note) => note.folder_id === selectedFolderId) || []

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteNote.mutate(noteToDelete.id)
    }
    setDeleteDialogOpen(false)
    setNoteToDelete(null)
  }

  const handleCopy = (note: Note) => {
    copyNote.mutate(note.id)
  }

  const handleExport = (note: Note) => {
    exportNote.mutate(note.id)
  }

  const handleMove = (note: Note) => {
    setNoteToMove(note)
    // TODO: Open move dialog (task 6.2)
  }

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!notes || filteredNotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('notes.noNotesInFolder')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-3 space-y-2">
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onClick={() => setSelectedNote(note.id)}
            onCopy={handleCopy}
            onMove={handleMove}
            onExport={handleExport}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notes.dialogs.deleteNoteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('notes.dialogs.deleteNoteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
