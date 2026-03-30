'use client'

import { Suspense } from 'react'
import { NotesSidebar, NoteDetail, TocSidebar } from '@/components/notes'
import { useNotesStore } from '@/stores'
import { useNote } from '@/hooks'
import { useTranslations } from '@/i18n'
import { PanelLeftClose, PanelLeft } from 'lucide-react'

function NotesPageContent() {
  const t = useTranslations()
  const { selectedNoteId, isEditing, editingContent, notesListCollapsed, toggleNotesList } = useNotesStore()
  const { data: note } = useNote(selectedNoteId)

  // Use editing content when in edit mode, otherwise use saved content
  const tocContent = isEditing ? editingContent : (note?.content || '')

  return (
    <div className="h-full flex relative">
      {/* Left Sidebar - Notes List with TOC */}
      <div
        className={`flex flex-col shrink-0 relative transition-all duration-200 ${notesListCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-64'
          }`}
      >
        <NotesSidebar />
        {/* TOC - absolute positioned to the right of sidebar */}
        {!notesListCollapsed && (note || isEditing) && tocContent && (
          <div className="absolute left-full top-40 pl-4 hidden xl:block">
            <TocSidebar content={tocContent} className="w-36" />
          </div>
        )}
      </div>

      {/* Toggle button - floats on the edge between sidebar and content */}
      <button
        onClick={toggleNotesList}
        className="absolute top-3 z-10 h-7 w-7 flex items-center justify-center rounded-md bg-background border shadow-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
        style={{ left: notesListCollapsed ? 8 : 260 }}
        aria-label={notesListCollapsed ? '展开笔记列表' : '收起笔记列表'}
      >
        {notesListCollapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

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
