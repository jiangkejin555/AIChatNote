'use client'

import { useTags } from '@/hooks'
import { useNotesStore } from '@/stores'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'

export function TagCloud() {
  const { data: tags, isLoading } = useTags()
  const { selectedTag, setSelectedTag } = useNotesStore()
  const t = useTranslations()

  if (isLoading) {
    return (
      <div className="p-2 flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
    )
  }

  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="p-2">
      <span className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
        {t('notes.tags')}
      </span>
      <ScrollArea className="max-h-40">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag.name}
              variant={selectedTag === tag.name ? 'default' : 'secondary'}
              className={cn(
                'cursor-pointer transition-colors',
                'hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={() => {
                setSelectedTag(selectedTag === tag.name ? null : tag.name)
              }}
            >
              {tag.name}
              <span className="ml-1 text-xs opacity-60">{tag.count}</span>
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
