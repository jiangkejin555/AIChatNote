'use client'

import { Bell, Sparkles, AlertCircle, ExternalLink, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Notification, NotificationType } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useTranslations } from '@/i18n'

interface NotificationDetailDialogProps {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: () => void
}

const typeConfig: Record<NotificationType, {
  icon: typeof Bell
  color: string
  bgColor: string
  borderColor: string
  ringColor: string
  labelKey: string
}> = {
  system: {
    icon: Bell,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderColor: 'border-blue-500/20',
    ringColor: 'ring-1 ring-blue-500/10',
    labelKey: 'notifications.types.system',
  },
  ai_task: {
    icon: Sparkles,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderColor: 'border-emerald-500/20',
    ringColor: 'ring-1 ring-emerald-500/10',
    labelKey: 'notifications.types.aiTask',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-500/10 dark:bg-red-500/15',
    borderColor: 'border-red-500/20',
    ringColor: 'ring-1 ring-red-500/10',
    labelKey: 'notifications.types.error',
  },
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onNavigate,
}: NotificationDetailDialogProps) {
  const t = useTranslations()

  if (!notification) return null

  const config = typeConfig[notification.type]
  const Icon = config.icon
  const isUnread = !notification.read_at

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  const fullDate = format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm:ss')

  const hasResource = notification.payload?.resource_type && notification.payload?.resource_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-5">
        <DialogHeader>
          <div className="flex items-start gap-3.5">
            {/* Icon with glass effect */}
            <div className={cn(
              'shrink-0 p-2.5 rounded-xl border backdrop-blur-sm',
              config.bgColor, config.borderColor
            )}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <DialogTitle className="!leading-snug">
                  {notification.title}
                </DialogTitle>
                {isUnread && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/10">
                    New
                  </span>
                )}
              </div>
              <DialogDescription className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
                  config.bgColor, config.color, config.ringColor
                )}>
                  {t(config.labelKey)}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content area with glass-like background */}
        <div className={cn(
          'rounded-xl border p-4',
          'bg-muted/30 dark:bg-muted/20',
          'backdrop-blur-sm',
          'border-border/60 dark:border-border/30'
        )}>
          {notification.content ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {notification.content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t('notifications.noContent')}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('notifications.createdAt')} {fullDate}
          </span>
          {notification.read_at && (
            <span>{t('notifications.readAt')} {format(new Date(notification.read_at), 'yyyy-MM-dd HH:mm:ss')}</span>
          )}
        </div>

        {/* Footer with action */}
        {hasResource && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigate}
              className={cn(
                'gap-2 cursor-pointer',
                'transition-all duration-200',
                'hover:shadow-sm'
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('notifications.viewDetail')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
