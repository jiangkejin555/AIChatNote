'use client'

import { useNotesStore } from '@/stores'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X } from 'lucide-react'
import { FolderTree } from './folder-tree'
import { CreateNoteButton } from './create-note-button'
import { NotesList } from './notes-list'
import { TagFilterDropdown } from './tag-filter-dropdown'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NotesSidebarProps {
  className?: string
}

export function NotesSidebar({ className }: NotesSidebarProps) {
  const { searchQuery, setSearchQuery } = useNotesStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    // Debounce search
    setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }

  const clearSearch = () => {
    setLocalSearch('')
    setSearchQuery('')
  }

  return (
    <div className={cn('flex flex-col h-full bg-muted border-r', className)}>
      {/* Search + Tag Filter Row */}
      <div className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索笔记..."
            className="pl-9 pr-8"
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-muted cursor-pointer"
              aria-label="清除搜索"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <TagFilterDropdown />
      </div>

      <Separator />

      {/* Folder Tree - 1/3 height max, scrollable */}
      <div className="h-1/3 min-h-0 flex flex-col overflow-hidden">
        <FolderTree />
      </div>

      <Separator />

      {/* Notes List Header + Button */}
      <div className="p-2 flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          笔记
        </span>
        <CreateNoteButton />
      </div>

      {/* Notes List - remaining height, scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <NotesList />
      </ScrollArea>
    </div>
  )
}
