'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foldersApi } from '@/lib/api'
import { toast } from 'sonner'
import type { CreateFolderRequest, UpdateFolderRequest } from '@/types'
import { getT } from '@/i18n'

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: foldersApi.getAll,
  })
}

export function useFolder(id: number) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => foldersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (data: CreateFolderRequest) => foldersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success(t('notes.folderCreateSuccess'))
    },
    onError: () => {
      toast.error(t('notes.folderCreateFailed'))
    },
  })
}

export function useUpdateFolder() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFolderRequest }) =>
      foldersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success(t('notes.folderUpdateSuccess'))
    },
    onError: () => {
      toast.error(t('notes.folderUpdateFailed'))
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => foldersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(t('notes.folderDeleteSuccess'))
    },
    onError: () => {
      toast.error(t('notes.folderDeleteFailed'))
    },
  })
}

// New hooks for redesign
export function useCopyFolder() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => foldersApi.copyFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(t('notes.folderCopySuccess'))
    },
    onError: () => {
      toast.error(t('notes.folderCopyFailed'))
    },
  })
}

export function useMoveFolder() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, parentId }: { id: number; parentId: number | null }) =>
      foldersApi.update(id, { parent_id: parentId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      toast.success(t('notes.folderMoveSuccess'))
    },
    onError: () => {
      toast.error(t('notes.folderMoveFailed'))
    },
  })
}
