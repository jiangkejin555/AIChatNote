'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi, type NotesQueryParams } from '@/lib/api/notes'
import { useNotesStore } from '@/stores'
import { toast } from 'sonner'
import type { CreateNoteRequest, UpdateNoteRequest } from '@/types'
import { getT } from '@/i18n'

export function useNotes(params?: NotesQueryParams) {
  const { selectedFolderId, selectedTag, searchQuery } = useNotesStore()

  const queryParams: NotesQueryParams = {
    ...params,
    folder_id: selectedFolderId ?? undefined,
    tag: selectedTag ?? undefined,
    search: searchQuery || undefined,
  }

  return useQuery({
    queryKey: ['notes', queryParams],
    queryFn: () => notesApi.getAll(queryParams),
  })
}

export function useNote(id: number | null) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => (id ? notesApi.getById(id) : null),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => notesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: () => {
      const t = getT()
      toast.error(t('notes.saveFailed'))
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNoteRequest }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: () => {
      const t = getT()
      toast.error(t('notes.updateFailed'))
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const { setSelectedNote } = useNotesStore()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setSelectedNote(null)
      toast.success(t('notes.deleteSuccess'))
    },
    onError: () => {
      toast.error(t('notes.deleteFailed'))
    },
  })
}

export function useAsyncNoteGeneration() {
  const queryClient = useQueryClient()
  const t = getT()

  const startGeneration = async (conversationId: number) => {
    // Trigger async generation
    const { task_id } = await notesApi.generate({ conversation_id: conversationId })

    // Store to localStorage for recovery after refresh
    localStorage.setItem('pendingNoteTask', JSON.stringify({
      taskId: task_id,
      conversationId,
    }))

    useNotesStore.getState().setIsGeneratingNote(true)
    toast.info(t('notes.aiGenerating'))

    // Start polling
    return pollTaskStatus(task_id)
  }

  const pollTaskStatus = (taskId: number): Promise<{ status: string; note_id?: number }> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const task = await notesApi.getTask(taskId)

          if (task.status === 'generating') {
            setTimeout(poll, 3000)
          } else if (task.status === 'done') {
            localStorage.removeItem('pendingNoteTask')
            useNotesStore.getState().setIsGeneratingNote(false)
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            toast.success(t('notes.aiGenerateSuccess'))
            resolve({ status: 'done', note_id: task.note_id ?? undefined })
          } else if (task.status === 'failed') {
            localStorage.removeItem('pendingNoteTask')
            useNotesStore.getState().setIsGeneratingNote(false)
            toast.error(t('notes.aiGenerateFailed') + (task.error_message ? `: ${task.error_message}` : ''))
            reject(new Error(task.error_message || 'Generation failed'))
          }
        } catch {
          // API error during polling — retry after delay
          setTimeout(poll, 3000)
        }
      }

      poll()
    })
  }

  const recoverPendingTask = () => {
    const pending = localStorage.getItem('pendingNoteTask')
    if (pending) {
      try {
        const { taskId } = JSON.parse(pending)
        useNotesStore.getState().setIsGeneratingNote(true)
        toast.info(t('notes.aiGenerating'))
        pollTaskStatus(taskId).catch(() => {})
      } catch {
        localStorage.removeItem('pendingNoteTask')
      }
    }
  }

  return { startGeneration, recoverPendingTask }
}

export function useExportNote() {
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => notesApi.export(id),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `note-${id}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t('notes.exportSuccess'))
    },
    onError: () => {
      toast.error(t('notes.exportFailed'))
    },
  })
}

export function useExportNotes() {
  const t = getT()

  return useMutation({
    mutationFn: (ids: number[]) => notesApi.exportBatch(ids),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t('notes.batchExportSuccess'))
    },
    onError: () => {
      toast.error(t('notes.exportFailed'))
    },
  })
}

// New hooks for redesign
export function useImportMarkdown() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ file, folderId }: { file: File; folderId?: number }) =>
      notesApi.importMarkdown(file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success(t('notes.importSuccess'))
    },
    onError: () => {
      toast.error(t('notes.importFailed'))
    },
  })
}

export function useCopyNote() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => notesApi.copyNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(t('notes.copySuccess'))
    },
    onError: () => {
      toast.error(t('notes.copyFailed'))
    },
  })
}

export function useMoveNote() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, folderId }: { id: number; folderId: number | null }) =>
      notesApi.update(id, { folder_id: folderId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(t('notes.moveSuccess'))
    },
    onError: () => {
      toast.error(t('notes.moveFailed'))
    },
  })
}

export function useBatchMoveNotes() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ ids, targetFolderId }: { ids: number[]; targetFolderId: number | null }) =>
      notesApi.batchMoveNotes(ids, targetFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(t('notes.moveSuccess'))
    },
    onError: () => {
      toast.error(t('notes.moveFailed'))
    },
  })
}

export function useBatchDeleteNotes() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (ids: number[]) => notesApi.batchDeleteNotes(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success(t('notes.deleteSuccess'))
    },
    onError: () => {
      toast.error(t('notes.deleteFailed'))
    },
  })
}
