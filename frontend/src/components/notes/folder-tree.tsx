'use client'

import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder, useCopyFolder, useNotes } from '@/hooks'
import { toast } from 'sonner'
import { useNotesStore } from '@/stores'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  FolderInput,
  FileUp,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoveDialog } from './dialogs/move-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { Folder as FolderType, Note } from '@/types'

interface FolderTreeItemProps {
  folder: FolderType
  depth: number
  folders: FolderType[]
  editingFolderId: number | null
  editName: string
  onEditNameChange: (name: string) => void
  onStartEdit: (folder: FolderType) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (folder: FolderType) => void
  onCopy: (folder: FolderType) => void
  onMove: (folder: FolderType) => void
  onImport: (folder: FolderType) => void
  onCreateSubfolder: (parentId: number) => void
  renderCreateInput: (parentId: number | null, depth: number) => React.ReactNode | null
  isCreating: boolean
  creatingParentId: number | null
}

function FolderTreeItem({
  folder,
  depth,
  folders,
  editingFolderId,
  editName,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onCopy,
  onMove,
  onImport,
  onCreateSubfolder,
  renderCreateInput,
  isCreating,
  creatingParentId,
}: FolderTreeItemProps) {
  const { selectedFolderId, setSelectedFolder, expandedFolderIds, toggleFolderExpand } = useNotesStore()
  const editInputRef = useRef<HTMLInputElement>(null)

  const children = folders.filter((f) => f.parent_id === folder.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedFolderIds.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const isEditing = editingFolderId === folder.id

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFolderExpand(folder.id)
  }

  const handleSelect = () => {
    if (!isEditing) {
      setSelectedFolder(folder.id)
    }
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200',
          'hover:bg-accent',
          isSelected && !isEditing && 'bg-accent'
        )}
        style={{ paddingLeft: `${depth * 12 + 2}px` }}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 shrink-0 cursor-pointer"
            onClick={handleToggle}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Folder Icon & Name */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {isSelected ? (
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          {isEditing ? (
            <Input
              ref={editInputRef}
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="h-6 text-sm flex-1"
              onBlur={() => {
                if (editName.trim()) {
                  onSaveEdit()
                } else {
                  onCancelEdit()
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (editName.trim()) {
                    onSaveEdit()
                  }
                }
                if (e.key === 'Escape') {
                  onCancelEdit()
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate">{folder.name}</span>
          )}
        </div>

        {/* Action Buttons - visible on hover */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Plus Button - Create subfolder */}
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                // Expand folder if not already expanded, so the create input is visible
                if (!isExpanded) {
                  toggleFolderExpand(folder.id)
                }
                onCreateSubfolder(folder.id)
              }}
              title="新建子文件夹"
            >
              <Plus className="h-3 w-3" />
            </button>

            {/* More Button - Folder actions */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onStartEdit(folder)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(folder)}>
                  <Copy className="mr-2 h-4 w-4" />
                  拷贝
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(folder)}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  移动
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onImport(folder)}>
                  <FileUp className="mr-2 h-4 w-4" />
                  导入 Markdown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(folder)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Render children */}
      {isExpanded && (
        <div>
          {hasChildren && children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              folders={folders}
              editingFolderId={editingFolderId}
              editName={editName}
              onEditNameChange={onEditNameChange}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              onMove={onMove}
              onImport={onImport}
              onCreateSubfolder={onCreateSubfolder}
              renderCreateInput={renderCreateInput}
              isCreating={isCreating}
              creatingParentId={creatingParentId}
            />
          ))}
          {/* Create input for subfolder under this folder */}
          {renderCreateInput(folder.id, depth + 1)}
        </div>
      )}
    </div>
  )
}

interface DeleteFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: FolderType | null
  notes: Note[] | undefined
  onConfirm: () => void
}

function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  notes,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(new Set())

  // Get notes in this folder
  const folderNotes = notes?.filter((n) => n.folder_id === folder?.id) || []

  // Reset and initialize when dialog opens
  useEffect(() => {
    if (open && folderNotes.length > 0) {
      setSelectedNoteIds(new Set(folderNotes.map((n) => n.id)))
    }
  }, [open, folderNotes.length])

  const toggleNote = (noteId: number) => {
    const newSelected = new Set(selectedNoteIds)
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId)
    } else {
      newSelected.add(noteId)
    }
    setSelectedNoteIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedNoteIds.size === folderNotes.length) {
      setSelectedNoteIds(new Set())
    } else {
      setSelectedNoteIds(new Set(folderNotes.map((n) => n.id)))
    }
  }

  const handleConfirm = () => {
    onConfirm()
    setSelectedNoteIds(new Set())
  }

  if (!folder) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle>删除文件夹</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除文件夹 "{folder.name}" 吗？
            {folderNotes.length > 0 && '请选择要处理的笔记：'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {folderNotes.length > 0 && (
          <div className="py-4 max-h-60 overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b mb-2">
              <Checkbox
                id="select-all"
                checked={selectedNoteIds.size === folderNotes.length}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                全选（删除选中的笔记）
              </Label>
            </div>
            <div className="space-y-2">
              {folderNotes.map((note) => (
                <div key={note.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`note-${note.id}`}
                    checked={selectedNoteIds.has(note.id)}
                    onCheckedChange={() => toggleNote(note.id)}
                  />
                  <Label htmlFor={`note-${note.id}`} className="text-sm cursor-pointer">
                    {note.title || '未命名笔记'}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              未选中的笔记将移动到根目录
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function FolderTree() {
  const { data: folders, isLoading } = useFolders()
  const { data: notes } = useNotes()
  const { selectedFolderId, setSelectedFolder } = useNotesStore()
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()
  const copyFolder = useCopyFolder()

  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [creatingParentId, setCreatingParentId] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [folderToMove, setFolderToMove] = useState<FolderType | null>(null)
  const [isRootExpanded, setIsRootExpanded] = useState(true)

  const createInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [isCreating, creatingParentId])

  const handleStartEdit = (folder: FolderType) => {
    setEditingFolderId(folder.id)
    setEditName(folder.name)
  }

  const handleSaveEdit = () => {
    if (editingFolderId !== null && editName.trim()) {
      const currentFolder = folders?.find((f) => f.id === editingFolderId)
      const parentId = currentFolder?.parent_id

      // Check for duplicate name at same level
      const duplicate = folders?.some(
        (f) => f.id !== editingFolderId &&
               f.name === editName.trim() &&
               f.parent_id === parentId
      )

      if (duplicate) {
        toast.error('同一级目录下已存在同名文件夹')
        return
      }

      updateFolder.mutate({ id: editingFolderId, data: { name: editName.trim() } })
    }
    setEditingFolderId(null)
    setEditName('')
  }

  const handleCancelEdit = () => {
    setEditingFolderId(null)
    setEditName('')
  }

  const handleStartCreate = (parentId: number | null = null) => {
    setIsCreating(true)
    setCreatingParentId(parentId)
    setNewFolderName('')
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Check for duplicate name at same level
      const duplicate = folders?.some(
        (f) => f.name === newFolderName.trim() &&
               f.parent_id === creatingParentId
      )

      if (duplicate) {
        toast.error('同一级目录下已存在同名文件夹')
        return
      }

      createFolder.mutate({
        name: newFolderName.trim(),
        parent_id: creatingParentId ?? undefined,
      })
      setNewFolderName('')
      setIsCreating(false)
      setCreatingParentId(null)
    }
  }

  const handleCancelCreate = () => {
    setNewFolderName('')
    setIsCreating(false)
    setCreatingParentId(null)
  }

  const handleDeleteClick = (folder: FolderType) => {
    setFolderToDelete(folder)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (folderToDelete) {
      deleteFolder.mutate(folderToDelete.id)
    }
    setDeleteDialogOpen(false)
    setFolderToDelete(null)
  }

  const handleCopy = (folder: FolderType) => {
    copyFolder.mutate(folder.id)
  }

  const handleMove = (folder: FolderType) => {
    setFolderToMove(folder)
    setMoveDialogOpen(true)
  }

  const handleConfirmMove = (targetFolderId: number | null) => {
    if (folderToMove) {
      updateFolder.mutate({
        id: folderToMove.id,
        data: { parent_id: targetFolderId ?? undefined },
      })
    }
    setMoveDialogOpen(false)
    setFolderToMove(null)
  }

  const handleImport = (folder: FolderType) => {
    // TODO: Open import dialog
    console.log('Import to folder:', folder.name)
  }

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Build folder tree structure
  const rootFolders = folders?.filter((f) => !f.parent_id) || []

  // Render create input for subfolder
  const renderCreateInput = (parentId: number | null, depth: number) => {
    if (!isCreating || creatingParentId !== parentId) return null

    return (
      <div
        className="flex items-center gap-2 py-1.5 px-2"
        style={{ paddingLeft: `${depth * 12 + 2}px` }}
      >
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          ref={createInputRef}
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="文件夹名称"
          className="h-6 text-sm flex-1"
          onBlur={() => {
            if (newFolderName.trim()) {
              handleCreateFolder()
            } else {
              handleCancelCreate()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreateFolder()
            }
            if (e.key === 'Escape') {
              handleCancelCreate()
            }
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-2 flex items-center justify-between shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            文件夹
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1 cursor-pointer"
            onClick={() => handleStartCreate(selectedFolderId)}
          >
            <Plus className="h-3 w-3" />
            新建文件夹
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-1">
          {/* Virtual Root Folder: 我的文件夹 */}
          <div
            className={cn(
              'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200',
              'hover:bg-accent',
              selectedFolderId === null && 'bg-accent'
            )}
            onClick={() => setSelectedFolder(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setIsRootExpanded(!isRootExpanded)
              }}
            >
              {isRootExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium flex-1">我的文件夹</span>
          </div>

          {/* Create new folder input at root level */}
          {isRootExpanded && renderCreateInput(null, 0)}

          {/* Folder tree - under 我的文件夹 */}
          {isRootExpanded && rootFolders.map((folder) => (
            <div key={folder.id}>
              <FolderTreeItem
                folder={folder}
                depth={1}
                folders={folders || []}
                editingFolderId={editingFolderId}
                editName={editName}
                onEditNameChange={setEditName}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteClick}
                onCopy={handleCopy}
                onMove={handleMove}
                onImport={handleImport}
                onCreateSubfolder={handleStartCreate}
                renderCreateInput={renderCreateInput}
                isCreating={isCreating}
                creatingParentId={creatingParentId}
              />
            </div>
          ))}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Folder Dialog */}
      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folder={folderToDelete}
        notes={notes}
        onConfirm={handleConfirmDelete}
      />

      {/* Move Folder Dialog */}
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        folders={folders || []}
        onConfirm={handleConfirmMove}
        title="移动文件夹"
        excludeFolderId={folderToMove?.id}
      />
    </>
  )
}
