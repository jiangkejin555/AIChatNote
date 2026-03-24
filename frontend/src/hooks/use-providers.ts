import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { providersApi, providerModelsApi } from '@/lib/api'
import { toast } from 'sonner'
import { getT } from '@/i18n'
import type {
  CreateProviderRequest,
  UpdateProviderRequest,
  CreateProviderModelRequest,
  UpdateProviderModelRequest,
  BatchAddProviderModelsRequest,
  SyncModelsRequest,
} from '@/types'

// Query keys
const providerKeys = {
  all: ['providers'] as const,
  lists: () => [...providerKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...providerKeys.lists(), { filters }] as const,
  details: () => [...providerKeys.all, 'detail'] as const,
  detail: (id: string) => [...providerKeys.details(), id] as const,
  models: (providerId: string) => [...providerKeys.all, 'models', providerId] as const,
  availableModels: (providerId: string) => [...providerKeys.all, 'available-models', providerId] as const,
}

// Provider hooks
export function useProviders() {
  return useQuery({
    queryKey: providerKeys.lists(),
    queryFn: () => providersApi.getAll(),
  })
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: providerKeys.detail(id),
    queryFn: () => providersApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateProvider() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (data: CreateProviderRequest) => providersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.createSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.createFailed')}: ${error.message}`)
    },
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProviderRequest }) =>
      providersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      queryClient.invalidateQueries({ queryKey: providerKeys.detail(variables.id) })
      toast.success(t('provider.updateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.updateFailed')}: ${error.message}`)
    },
  })
}

export function useDeleteProvider() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: string) => providersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.deleteFailed')}: ${error.message}`)
    },
  })
}

// Provider Model hooks
export function useProviderModels(providerId: string) {
  return useQuery({
    queryKey: providerKeys.models(providerId),
    queryFn: () => providerModelsApi.getAll(providerId),
    enabled: !!providerId,
  })
}

export function useAvailableModels(providerId: string) {
  return useQuery({
    queryKey: providerKeys.availableModels(providerId),
    queryFn: () => providersApi.getAvailableModels(providerId),
    enabled: !!providerId,
    retry: false,
  })
}

export function usePredefinedModels(providerId: string) {
  return useQuery({
    queryKey: [...providerKeys.all, 'predefined-models', providerId],
    queryFn: () => providersApi.getPredefinedModels(providerId),
    enabled: !!providerId,
  })
}

export function useAddProviderModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      data,
    }: {
      providerId: string
      data: CreateProviderModelRequest
    }) => providerModelsApi.add(providerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.modelAddSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.modelAddFailed')}: ${error.message}`)
    },
  })
}

export function useUpdateProviderModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      modelId,
      data,
    }: {
      providerId: string
      modelId: string
      data: UpdateProviderModelRequest
    }) => providerModelsApi.update(providerId, modelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.modelUpdateSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.modelUpdateFailed')}: ${error.message}`)
    },
  })
}

export function useDeleteProviderModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      modelId,
    }: {
      providerId: string
      modelId: string
    }) => providerModelsApi.delete(providerId, modelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.modelDeleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.modelDeleteFailed')}: ${error.message}`)
    },
  })
}

export function useBatchAddProviderModels() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      data,
    }: {
      providerId: string
      data: BatchAddProviderModelsRequest
    }) => providerModelsApi.batchAdd(providerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.modelBatchAddSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.modelBatchAddFailed')}: ${error.message}`)
    },
  })
}

export function useSetProviderDefaultModel() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      modelId,
    }: {
      providerId: string
      modelId: string
    }) => providerModelsApi.setDefault(providerId, modelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.defaultModelSetSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.defaultModelSetFailed')}: ${error.message}`)
    },
  })
}

export function useToggleModelEnabled() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      modelId,
      enabled,
    }: {
      providerId: string
      modelId: string
      enabled: boolean
    }) => providerModelsApi.toggleEnabled(providerId, modelId, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
    },
    onError: (error: Error) => {
      toast.error(`${t('common.operationFailed')}: ${error.message}`)
    },
  })
}

export function useSyncProviderModels() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      providerId,
      data,
    }: {
      providerId: string
      data: SyncModelsRequest
    }) => providerModelsApi.sync(providerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.models(variables.providerId) })
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() })
      toast.success(t('provider.modelSyncSuccess'))
    },
    onError: (error: Error) => {
      toast.error(`${t('provider.modelSyncFailed')}: ${error.message}`)
    },
  })
}
