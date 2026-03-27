// frontend/src/hooks/use-notifications.ts

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import type { NotificationsQueryParams, NotificationPayload } from '@/types'
import { toast } from 'sonner'
import { getT } from '@/i18n'

export function useNotifications(params?: NotificationsQueryParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchOnWindowFocus: true,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: (affected) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (affected > 0) {
        toast.success(t('notifications.allRead'))
      }
    },
    onError: () => {
      toast.error(t('notifications.markReadFailed'))
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(t('notifications.deleteSuccess'))
    },
    onError: () => {
      toast.error(t('notifications.deleteFailed'))
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (type?: string) => notificationsApi.deleteAll(type),
    onSuccess: (affected) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (affected > 0) {
        toast.success(t('notifications.clearSuccess'))
      }
    },
    onError: () => {
      toast.error(t('notifications.clearFailed'))
    },
  })
}

export function useCreateTestNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      template_code: string
      vars?: Record<string, string>
      payload?: NotificationPayload
    }) => notificationsApi.createTest(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
