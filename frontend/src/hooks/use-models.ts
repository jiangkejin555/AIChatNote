/**
 * @deprecated Use useProviders and useProviderModels hooks instead
 * This file will be removed in a future version
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { modelsApi } from '@/lib/api'
import { toast } from 'sonner'
import { getT } from '@/i18n'
import type { CreateModelRequest, UpdateModelRequest } from '@/types'

/** @deprecated Use useProviders instead */
export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.getAll,
  })
}

export function useModel(id: number) {
  return useQuery({
    queryKey: ['models', id],
    queryFn: () => modelsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (data: CreateModelRequest) => modelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(t('model.createSuccess'))
    },
    onError: () => {
      toast.error(t('model.createFailed'))
    },
  })
}

export function useUpdateModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateModelRequest }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(t('model.updateSuccess'))
    },
    onError: () => {
      toast.error(t('model.updateFailed'))
    },
  })
}

export function useDeleteModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(t('model.deleteSuccess'))
    },
    onError: () => {
      toast.error(t('model.deleteFailed'))
    },
  })
}

export function useSetDefaultModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => modelsApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(t('model.setDefaultSuccess'))
    },
    onError: () => {
      toast.error(t('model.setDefaultFailed'))
    },
  })
}
