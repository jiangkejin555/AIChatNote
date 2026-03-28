'use client'

import { useRouter } from 'next/navigation'
import { Bell, Sparkles, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Notification, NotificationType } from '@/types'
import { useMarkAsRead, useDeleteNotification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  compact?: boolean
  onAction?: () => void
  onViewDetail?: (notification: Notification) => void
}

const typeConfig: Record<NotificationType, {
  icon: typeof Bell
  color: string
  bgColor: string
  hoverBorder: string
}> = {
  system: {
    icon: Bell,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
    hoverBorder: 'hover:border-blue-500/25 dark:hover:border-blue-400/20',
  },
  ai_task: {
    icon: Sparkles,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    hoverBorder: 'hover:border-emerald-500/25 dark:hover:border-emerald-400/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/15',
    hoverBorder: 'hover:border-red-500/25 dark:hover:border-red-400/20',
  },
}

export function NotificationItem({ notification, compact = false, onAction, onViewDetail }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMarkAsRead()
  const deleteNotification = useDeleteNotification()

  const config = typeConfig[notification.type]
  const Icon = config.icon
  const isUnread = !notification.read_at

  const handleClick = () => {
    if (isUnread) {
      markAsRead.mutate(notification.id)
    }

    if (onViewDetail) {
      onViewDetail(notification)
      return
    }

    // Navigate to related resource (fallback when no onViewDetail)
    if (notification.payload?.resource_type && notification.payload?.resource_id) {
      const { resource_type, resource_id } = notification.payload
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

    onAction?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification.mutate(notification.id)
    onAction?.()
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg cursor-pointer',
          'hover:bg-accent/50 transition-colors duration-200',
          isUnread && 'bg-accent/30'
        )}
      >
        <div className={cn('shrink-0 p-1.5 rounded-md', config.bgColor)}>
          <Icon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
            <p className={cn('text-sm truncate', isUnread && 'font-medium')}>
              {notification.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 rounded-xl cursor-pointer',
        'border backdrop-blur-sm transition-all duration-200 ease-out',
        config.hoverBorder,
        isUnread
          ? 'bg-primary/[0.03] dark:bg-primary/[0.06] border-primary/15 hover:bg-primary/[0.06] dark:hover:bg-primary/[0.1] hover:border-primary/25 dark:hover:border-primary/20 hover:shadow-sm'
          : 'bg-card/80 dark:bg-card/60 border-border/70 hover:bg-accent/50 hover:border-border hover:shadow-sm'
      )}
      onClick={handleClick}
    >
      <div className={cn('shrink-0 p-2 rounded-lg', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isUnread && <div className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />}
          <p className={cn('font-medium', isUnread && 'text-foreground')}>
            {notification.title}
          </p>
        </div>
        {notification.content && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {notification.content}
          </p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-2.5">{timeAgo}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hover:bg-destructive/10 hover:text-destructive cursor-pointer'
        )}
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
