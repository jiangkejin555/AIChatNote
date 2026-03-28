// frontend/src/lib/api/notifications.ts

import apiClient from './client'
import type {
  Notification,
  NotificationsQueryParams,
  NotificationsListResponse,
  NotificationPayload,
} from '@/types'

export const notificationsApi = {
  getAll: async (params?: NotificationsQueryParams): Promise<NotificationsListResponse> => {
    const response = await apiClient.get<NotificationsListResponse>(
      '/notifications',
      { params }
    )
    return response.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>(
      '/notifications/unread-count'
    )
    return response.data.count
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.put<{ affected: number }>(
      '/notifications/read-all'
    )
    return response.data.affected
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },

  deleteAll: async (type?: string): Promise<number> => {
    const response = await apiClient.delete<{ affected: number }>(
      '/notifications',
      { params: type ? { type } : undefined }
    )
    return response.data.affected
  },

  createTest: async (params: {
    type: string
    title: string
    content: string
    payload?: NotificationPayload
  }): Promise<Notification> => {
    const response = await apiClient.post<{ data: Notification }>(
      '/notifications/test',
      params
    )
    return response.data.data
  },
}
