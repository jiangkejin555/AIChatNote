// frontend/src/types/notification.ts

export type NotificationType = 'system' | 'ai_task' | 'error'

export interface NotificationPayload {
  resource_type: 'note' | 'model' | 'conversation' | 'announcement' | null
  resource_id?: string
  url?: string
}

export interface Notification {
  id: number
  user_id: number
  template_code: string
  type: NotificationType
  title: string
  content: string | null
  payload: NotificationPayload | null
  read_at: string | null
  created_at: string
}

export interface NotificationsQueryParams {
  type?: NotificationType
  unread?: boolean
  page?: number
  page_size?: number
}

export interface NotificationsListResponse {
  data: Notification[]
  total: number
  unread_count: number
}
