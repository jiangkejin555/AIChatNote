/**
 * @deprecated Use providersApi and providerModelsApi instead
 * This file will be removed in a future version
 */
import apiClient from './client'
import type {
  Model,
  CreateModelRequest,
  UpdateModelRequest,
  ApiResponse,
} from '@/types'

/** @deprecated Use providersApi instead */
export const modelsApi = {
  getAll: async (): Promise<Model[]> => {
    const response = await apiClient.get<ApiResponse<Model[]>>('/models')
    return response.data.data
  },

  getById: async (id: number): Promise<Model> => {
    const response = await apiClient.get<ApiResponse<Model>>(`/models/${id}`)
    return response.data.data
  },

  create: async (data: CreateModelRequest): Promise<Model> => {
    const response = await apiClient.post<ApiResponse<Model>>('/models', data)
    return response.data.data
  },

  update: async (id: number, data: UpdateModelRequest): Promise<Model> => {
    const response = await apiClient.put<ApiResponse<Model>>(`/models/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/models/${id}`)
  },

  setDefault: async (id: number): Promise<Model> => {
    const response = await apiClient.put<ApiResponse<Model>>(`/models/${id}/default`)
    return response.data.data
  },
}
