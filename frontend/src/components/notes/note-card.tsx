'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import type { Note } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Copy,
  FolderInput,
  FileDown,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { useTranslations, getSavedLocale } from '@/i18n'

interface NoteCardProps {
  note: Note
  isSelected: boolean
  onClick: () => void
  onCopy?: (note: Note) => void
  onMove?: (note: Note) => void
  onExport?: (note: Note) => void
  onDelete?: (note: Note) => void
}

export function NoteCard({
  note,
  isSelected,
  onClick,
  onCopy,
  onMove,
  onExport,
  onDelete,
}: NoteCardProps) {
  const t = useTranslations()
  const locale = getSavedLocale()
  const dateLocale = locale === 'zh' ? zhCN : enUS

  const formattedDate = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
    locale: dateLocale,
  })

  // Determine Notion sync status
  const isNotionSynced = !!note.notion_page_id
  const isNotionModified = isNotionSynced && note.notion_last_sync_at
    ? new Date(note.notion_last_sync_at).getTime() < new Date(note.updated_at).getTime()
    : false

  return (
    <div
      className={cn(
        'group relative w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer',
        'hover:bg-accent hover:border-primary/30 hover:shadow-sm',
        isSelected && 'border-primary/50 bg-accent shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <h3 className="font-medium text-sm line-clamp-1">
            {note.title || t('notes.untitledNote')}
          </h3>
          {isNotionSynced && !isNotionModified && (
            <BookOpen className="h-3 w-3 shrink-0 text-blue-500 dark:text-blue-400" />
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1">
        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant={isSelected ? 'default' : 'secondary'}
              className={cn(
                'text-xs px-1.5 py-0 h-5',
                isSelected && 'bg-primary/80'
              )}
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'text-xs px-1.5 py-0 h-5',
                isSelected && 'bg-primary/80'
              )}
            >
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Action Menu - bottom right, visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-acent cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onCopy?.(note)}>
                <Copy className="mr-2 h-4 w-4" />
                {t('notes.noteActions.copy')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove?.(note)}>
                <FolderInput className="mr-2 h-4 w-4" />
                {t('notes.noteActions.move')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport?.(note)}>
                <FileDown className="mr-2 h-4 w-4" />
                {t('notes.noteActions.export')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(note)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('notes.noteActions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
