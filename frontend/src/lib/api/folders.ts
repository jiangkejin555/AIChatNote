import apiClient from './client'
import { mockFoldersApi } from './mock-data'
import type {
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  ApiResponse,
} from '@/types'

// Set to true to use mock data, false to use real API
const USE_MOCK = true

export const foldersApi = {
  getAll: async (): Promise<Folder[]> => {
    if (USE_MOCK) {
      return mockFoldersApi.getAll()
    }
    const response = await apiClient.get<ApiResponse<Folder[]>>('/folders')
    return response.data.data
  },

  getById: async (id: number): Promise<Folder> => {
    if (USE_MOCK) {
      const folders = await mockFoldersApi.getAll()
      const folder = folders.find(f => f.id === id)
      if (!folder) throw new Error('Folder not found')
      return folder
    }
    const response = await apiClient.get<ApiResponse<Folder>>(`/folders/${id}`)
    return response.data.data
  },

  create: async (data: CreateFolderRequest): Promise<Folder> => {
    if (USE_MOCK) {
      return mockFoldersApi.create(data)
    }
    const response = await apiClient.post<ApiResponse<Folder>>('/folders', data)
    return response.data.data
  },

  update: async (id: number, data: UpdateFolderRequest): Promise<Folder> => {
    if (USE_MOCK) {
      return mockFoldersApi.update(id, data)
    }
    const response = await apiClient.put<ApiResponse<Folder>>(`/folders/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      return mockFoldersApi.delete(id)
    }
    await apiClient.delete(`/folders/${id}`)
  },

  // New API functions for redesign
  copyFolder: async (id: number): Promise<Folder> => {
    if (USE_MOCK) {
      return mockFoldersApi.copyFolder(id)
    }
    const response = await apiClient.post<ApiResponse<Folder>>(`/folders/${id}/copy`)
    return response.data.data
  },
}
