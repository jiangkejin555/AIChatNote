import apiClient from './client'
import type {
  Provider,
  ProviderModel,
  CreateProviderRequest,
  UpdateProviderRequest,
  CreateProviderModelRequest,
  UpdateProviderModelRequest,
  BatchAddProviderModelsRequest,
  AvailableModel,
  PredefinedModel,
  SyncModelsRequest,
  SyncModelsResponse,
} from '@/types'

// Connection test result type
export interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
}

// Provider API
export const providersApi = {
  // Get all providers
  getAll: async (): Promise<Provider[]> => {
    const response = await apiClient.get<{ providers: Provider[] }>('/providers')
    return response.data.providers
  },

  // Get provider by ID
  getById: async (id: string): Promise<Provider> => {
    const response = await apiClient.get<{ data: Provider }>(`/providers/${id}`)
    return response.data.data
  },

  // Create provider
  create: async (data: CreateProviderRequest): Promise<Provider> => {
    const response = await apiClient.post<{ provider: Provider }>('/providers', data)
    return response.data.provider
  },

  // Update provider
  update: async (id: string, data: UpdateProviderRequest): Promise<Provider> => {
    const response = await apiClient.put<{ provider: Provider }>(`/providers/${id}`, data)
    return response.data.provider
  },

  // Delete provider
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/providers/${id}`)
  },

  // Get available models from provider API
  getAvailableModels: async (id: string): Promise<{ models: AvailableModel[]; isPredefined: boolean }> => {
    const response = await apiClient.get<{
      models: AvailableModel[]
      is_predefined: boolean
    }>(`/providers/${id}/available-models`)
    return {
      models: response.data.models,
      isPredefined: response.data.is_predefined,
    }
  },

  // Get predefined models for provider type
  getPredefinedModels: async (id: string): Promise<PredefinedModel[]> => {
    const response = await apiClient.get<{ models: PredefinedModel[] }>(
      `/providers/${id}/predefined-models`
    )
    return response.data.models
  },

  // Test connection to provider
  testConnection: async (id: string, modelId?: string): Promise<ConnectionTestResult> => {
    const response = await apiClient.post<ConnectionTestResult>(
      `/providers/${id}/test-connection`,
      { model_id: modelId }
    )
    return response.data
  },
}

// Provider Model API
export const providerModelsApi = {
  // Get all models for a provider
  getAll: async (providerId: string): Promise<ProviderModel[]> => {
    const response = await apiClient.get<{ models: ProviderModel[] }>(
      `/providers/${providerId}/models`
    )
    return response.data.models
  },

  // Add model to provider
  add: async (providerId: string, data: CreateProviderModelRequest): Promise<ProviderModel> => {
    const response = await apiClient.post<{ model: ProviderModel }>(
      `/providers/${providerId}/models`,
      data
    )
    return response.data.model
  },

  // Update provider model
  update: async (
    providerId: string,
    modelId: string,
    data: UpdateProviderModelRequest
  ): Promise<ProviderModel> => {
    const response = await apiClient.put<{ model: ProviderModel }>(
      `/providers/${providerId}/models/${modelId}`,
      data
    )
    return response.data.model
  },

  // Delete provider model
  delete: async (providerId: string, modelId: string): Promise<void> => {
    await apiClient.delete(`/providers/${providerId}/models/${modelId}`)
  },

  // Batch add models
  batchAdd: async (
    providerId: string,
    data: BatchAddProviderModelsRequest
  ): Promise<ProviderModel[]> => {
    const response = await apiClient.post<{ models: ProviderModel[] }>(
      `/providers/${providerId}/models/batch`,
      data
    )
    return response.data.models
  },

  // Set default model
  setDefault: async (providerId: string, modelId: string): Promise<ProviderModel> => {
    const response = await apiClient.put<{ model: ProviderModel }>(
      `/providers/${providerId}/models/${modelId}`,
      { is_default: true }
    )
    return response.data.model
  },

  // Toggle model enabled status
  toggleEnabled: async (
    providerId: string,
    modelId: string,
    enabled: boolean
  ): Promise<ProviderModel> => {
    const response = await apiClient.put<{ model: ProviderModel }>(
      `/providers/${providerId}/models/${modelId}`,
      { enabled }
    )
    return response.data.model
  },

  // Sync models (add, delete, update default in one request)
  sync: async (providerId: string, data: SyncModelsRequest): Promise<SyncModelsResponse> => {
    const response = await apiClient.post<SyncModelsResponse>(
      `/providers/${providerId}/models/sync`,
      data
    )
    return response.data
  },
}
