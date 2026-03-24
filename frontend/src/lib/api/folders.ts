import apiClient from './client'
import type {
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  ApiResponse,
} from '@/types'

export const foldersApi = {
  getAll: async (): Promise<Folder[]> => {
    const response = await apiClient.get<ApiResponse<Folder[]>>('/folders')
    return response.data.data
  },

  getById: async (id: number): Promise<Folder> => {
    const response = await apiClient.get<ApiResponse<Folder>>(`/folders/${id}`)
    return response.data.data
  },

  create: async (data: CreateFolderRequest): Promise<Folder> => {
    const response = await apiClient.post<ApiResponse<Folder>>('/folders', data)
    return response.data.data
  },

  update: async (id: number, data: UpdateFolderRequest): Promise<Folder> => {
    const response = await apiClient.put<ApiResponse<Folder>>(`/folders/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/folders/${id}`)
  },

  copyFolder: async (id: number): Promise<Folder> => {
    const response = await apiClient.post<ApiResponse<Folder>>(`/folders/${id}/copy`)
    return response.data.data
  },
}
