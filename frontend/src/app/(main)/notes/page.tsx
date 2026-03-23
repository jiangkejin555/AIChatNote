'use client'

import { Suspense } from 'react'
import { NotesSidebar, NoteDetail, TocSidebar } from '@/components/notes'
import { useNotesStore } from '@/stores'
import { useNote } from '@/hooks'
import { useTranslations } from '@/i18n'

function NotesPageContent() {
  const t = useTranslations()
  const { selectedNoteId, isEditing, editingContent } = useNotesStore()
  const { data: note } = useNote(selectedNoteId)

  // Use editing content when in edit mode, otherwise use saved content
  const tocContent = isEditing ? editingContent : (note?.content || '')

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Notes List with TOC */}
      <div className="w-64 flex flex-col shrink-0 relative">
        <NotesSidebar />
        {/* TOC - absolute positioned to the right of sidebar */}
        {(note || isEditing) && tocContent && (
          <div className="absolute left-full top-52 pl-4 hidden xl:block">
            <TocSidebar content={tocContent} className="w-36" />
          </div>
        )}
      </div>

      {/* Right - Note Editor */}
      <NoteDetail />
    </div>
  )
}

function NotesLoading() {
  const t = useTranslations()
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-muted-foreground">{t('common.loading')}</div>
    </div>
  )
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesLoading />}>
      <NotesPageContent />
    </Suspense>
  )
}
