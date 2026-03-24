import apiClient from './client'
import type { Tag, ApiResponse } from '@/types'

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags')
    return response.data.data
  },
}
