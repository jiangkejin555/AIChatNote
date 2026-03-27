'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import type { Folder as FolderType } from '@/types'

interface FolderTreeSelectorProps {
  folders: FolderType[]
  value?: number | null // null = root
  onChange: (folderId: number | null) => void
  maxHeight?: string
}

interface FolderTreeItemProps {
  folder: FolderType
  depth: number
  folders: FolderType[]
  selectedId: number | null
  expandedIds: Set<number>
  onSelect: (folderId: number | null) => void
  onToggleExpand: (folderId: number) => void
}

function FolderTreeItem({
  folder,
  depth,
  folders,
  selectedId,
  expandedIds,
  onSelect,
  onToggleExpand,
}: FolderTreeItemProps) {
  const children = folders.filter((f) => f.parent_id === folder.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(folder.id)
  const isSelected = selectedId === folder.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(folder.id)
    }
  }

  const handleSelect = () => {
    onSelect(folder.id)
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-150',
          'hover:bg-blue-100 dark:hover:bg-blue-900/30',
          isSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
        role="treeitem"
        aria-selected={isSelected}
      >
        {/* Expand/Collapse Button */}
        <button
          type="button"
          className={cn(
            'h-4 w-4 p-0 shrink-0 flex items-center justify-center',
            hasChildren ? 'cursor-pointer' : 'cursor-default'
          )}
          onClick={handleToggle}
          aria-label={isExpanded ? '折叠' : '展开'}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Folder Icon */}
        {isSelected ? (
          <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Folder Name */}
        <span className="text-sm truncate flex-1">{folder.name}</span>
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              folders={folders}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTreeSelector({
  folders,
  value,
  onChange,
  maxHeight = '200px',
}: FolderTreeSelectorProps) {
  // Root folders (no parent)
  const rootFolders = useMemo(
    () => folders.filter((f) => !f.parent_id),
    [folders]
  )

  // Check if root is selected
  const isRootSelected = value === null

  // Track expanded state - default to expanded
  const [isRootExpanded, setIsRootExpanded] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Auto-expand all folders by default
    return new Set(folders.filter(f => !f.parent_id).map(f => f.id))
  })

  const handleToggleExpand = useCallback((folderId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (folderId: number | null) => {
      onChange(folderId)
    },
    [onChange]
  )

  return (
    <div
      className="border rounded-md bg-muted/30"
      style={{ maxHeight }}
    >
      <ScrollArea className="h-full" style={{ height: maxHeight }}>
        <div className="p-1" role="tree">
          {/* Virtual Root: 我的文件夹 */}
          <div
            className={cn(
              'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-150',
              'hover:bg-blue-100 dark:hover:bg-blue-900/30',
              isRootSelected && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            )}
            onClick={() => handleSelect(null)}
            role="treeitem"
            aria-selected={isRootSelected}
          >
            <button
              type="button"
              className="h-4 w-4 p-0 shrink-0 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setIsRootExpanded(!isRootExpanded)
              }}
              aria-label={isRootExpanded ? '折叠全部' : '展开全部'}
            >
              {rootFolders.length > 0 ? (
                isRootExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )
              ) : (
                <span className="w-3.5" />
              )}
            </button>
            {isRootSelected ? (
              <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium truncate flex-1">
              我的文件夹
            </span>
            <span className="text-xs text-muted-foreground">根目录</span>
          </div>

          {/* Folder tree */}
          {rootFolders.length > 0 && isRootExpanded && (
            <div>
              {rootFolders.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  depth={1}
                  folders={folders}
                  selectedId={value ?? null}
                  expandedIds={expandedIds}
                  onSelect={handleSelect}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
