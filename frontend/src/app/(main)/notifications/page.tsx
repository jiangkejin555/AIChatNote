'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellRing, Sparkles, AlertCircle, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotifications, useMarkAllAsRead, useDeleteAllNotifications, useMarkAsRead } from '@/hooks/use-notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import { NotificationDetailDialog } from '@/components/notifications/notification-detail-dialog'
import { getT } from '@/i18n'
import type { Notification, NotificationType } from '@/types'

export default function NotificationsPage() {
  const t = getT()
  const router = useRouter()
  const [activeType, setActiveType] = useState<NotificationType | 'all'>('all')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data, isLoading } = useNotifications(
    activeType !== 'all' ? { type: activeType } : undefined
  )
  const markAllAsRead = useMarkAllAsRead()
  const deleteAllNotifications = useDeleteAllNotifications()
  const markAsRead = useMarkAsRead()

  const notifications = data?.data ?? []
  const unreadCount = data?.unread_count ?? 0

  const handleClearAll = () => {
    deleteAllNotifications.mutate(
      activeType !== 'all' ? activeType : undefined,
      {
        onSuccess: () => setClearDialogOpen(false),
      }
    )
  }

  const handleViewDetail = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead.mutate(notification.id)
    }
    setDetailNotification(notification)
    setDetailOpen(true)
  }

  const handleNavigateFromDetail = () => {
    if (!detailNotification?.payload?.resource_type || !detailNotification?.payload?.resource_id) return

    const { resource_type, resource_id } = detailNotification.payload
    setDetailOpen(false)
    switch (resource_type) {
      case 'note':
        router.push(`/notes?noteId=${resource_id}`)
        break
      case 'conversation':
        router.push(`/?conversation=${resource_id}`)
        break
      case 'model':
        router.push('/models')
        break
    }
  }

  const typeTabs = [
    { value: 'all', label: t('notifications.types.all'), icon: Bell },
    { value: 'system', label: t('notifications.types.system'), icon: Bell },
    { value: 'ai_task', label: t('notifications.types.aiTask'), icon: Sparkles },
    { value: 'error', label: t('notifications.types.error'), icon: AlertCircle },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('notifications.title')}</h1>
            {unreadCount > 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-1.5">
                  {unreadCount}
                </span>
                {t('notifications.unread')}
              </p>
            ) : (
              notifications.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('notifications.noUnreadDesc')}
                </p>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={unreadCount === 0 || markAllAsRead.isPending}
              className="cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              disabled={notifications.length === 0}
              className="text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('notifications.clearAll')}
            </Button>
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="px-6 pb-4">
          <Tabs value={activeType} onValueChange={(v) => setActiveType(v as typeof activeType)}>
            <TabsList>
              {typeTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2 cursor-pointer">
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl bg-muted/50 p-5 mb-4">
                <BellRing className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">
                {t('notifications.empty')}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1.5 max-w-xs">
                {t('notifications.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl mx-auto">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Notification Detail Dialog */}
      <NotificationDetailDialog
        notification={detailNotification}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onNavigate={handleNavigateFromDetail}
      />

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notifications.clearConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {activeType === 'all'
                ? t('notifications.clearConfirmDesc')
                : t('notifications.clearConfirmDescType', { type: typeTabs.find(tab => tab.value === activeType)?.label ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('notifications.clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
