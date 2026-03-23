'use client'

import { useTags } from '@/hooks'
import { useNotesStore } from '@/stores'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tag, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TagFilterDropdown() {
  const { data: tags, isLoading } = useTags()
  const { selectedTag, setSelectedTag } = useNotesStore()

  if (isLoading || !tags || tags.length === 0) {
    return null
  }

  const hasSelection = selectedTag !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center justify-center gap-1 h-9 px-3 text-sm rounded-md border transition-colors cursor-pointer',
          hasSelection
            ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Tag className="h-3.5 w-3.5" />
        <span className="max-w-20 truncate">
          {hasSelection ? selectedTag : '标签'}
        </span>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            按标签筛选
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* All Tags option */}
        <DropdownMenuItem
          className={cn(!hasSelection && 'bg-accent')}
          onClick={() => setSelectedTag(null)}
        >
          <span className="flex-1">全部标签</span>
          {!hasSelection && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {tags.reduce((sum, t) => sum + t.count, 0)}
            </Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Tag list */}
        <div className="max-h-60 overflow-y-auto">
          {tags
            .sort((a, b) => b.count - a.count)
            .map((tag) => (
              <DropdownMenuItem
                key={tag.name}
                className={cn(selectedTag === tag.name && 'bg-accent')}
                onClick={() => setSelectedTag(tag.name)}
              >
                <span className="flex-1 truncate">{tag.name}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tag.count}
                </Badge>
              </DropdownMenuItem>
            ))}
        </div>

        {/* Clear selection */}
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-muted-foreground"
              onClick={() => setSelectedTag(null)}
            >
              <X className="mr-2 h-4 w-4" />
              清除筛选
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
