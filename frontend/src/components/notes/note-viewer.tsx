'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from '@/i18n'

interface NoteViewerProps {
  content: string
  className?: string
}

export function NoteViewer({ content, className }: NoteViewerProps) {
  // Parse HTML content and render it
  // The content is stored as HTML from TipTap editor
  return (
    <div
      className={cn('note-viewer', className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// Tag display component for read-only mode
interface TagListProps {
  tags: string[]
  className?: string
}

export function TagList({ tags, className }: TagListProps) {
  const t = useTranslations()

  if (!tags || tags.length === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground italic', className)}>
        {t('notes.noTags')}
      </span>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-default"
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
