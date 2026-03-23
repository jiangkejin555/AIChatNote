import apiClient from './client'
import { mockTagsApi } from './mock-data'
import type { Tag, ApiResponse } from '@/types'

// Set to true to use mock data, false to use real API
const USE_MOCK = true

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    if (USE_MOCK) {
      return mockTagsApi.getAll()
    }
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags')
    return response.data.data
  },
}
