// frontend/src/lib/api/notifications.ts

import apiClient from './client'
import type {
  Notification,
  NotificationsQueryParams,
  NotificationsListResponse,
  NotificationPayload,
} from '@/types'
import type { ApiResponse } from '@/types'

export const notificationsApi = {
  getAll: async (params?: NotificationsQueryParams): Promise<NotificationsListResponse> => {
    const response = await apiClient.get<ApiResponse<NotificationsListResponse>>(
      '/notifications',
      { params }
    )
    return response.data.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count'
    )
    return response.data.data.count
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.put<ApiResponse<{ affected: number }>>(
      '/notifications/read-all'
    )
    return response.data.data.affected
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },

  deleteAll: async (type?: string): Promise<number> => {
    const response = await apiClient.delete<ApiResponse<{ affected: number }>>(
      '/notifications',
      { params: type ? { type } : undefined }
    )
    return response.data.data.affected
  },

  createTest: async (params: {
    template_code: string
    vars?: Record<string, string>
    payload?: NotificationPayload
  }): Promise<Notification> => {
    const response = await apiClient.post<ApiResponse<Notification>>(
      '/notifications/test',
      params
    )
    return response.data.data
  },
}
