'use client'

import { useRouter } from 'next/navigation'
import { BellRing, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, useUnreadCount } from '@/hooks/use-notifications'
import { NotificationItem } from './notification-item'
import { cn } from '@/lib/utils'
import { getT } from '@/i18n'

interface NotificationPopoverProps {
  children: React.ReactNode
  triggerClassName?: string
}

export function NotificationPopover({ children, triggerClassName }: NotificationPopoverProps) {
  const router = useRouter()
  const t = getT()
  const { data: unreadCount } = useUnreadCount()
  const { data, isLoading } = useNotifications({ page_size: 5 })

  const notifications = data?.data ?? []
  const hasUnread = (unreadCount ?? 0) > 0

  const handleViewAll = () => {
    router.push('/notifications')
  }

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger className={cn('text-muted-foreground hover:text-foreground', triggerClassName)}>
          {children}
        </PopoverTrigger>
        {hasUnread && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex items-center justify-center',
              'min-w-4 h-4 px-1 text-[10px] font-bold',
              'bg-destructive text-destructive-foreground rounded-full',
              'animate-in fade-in zoom-in duration-200 pointer-events-none'
            )}
          >
            {unreadCount && unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <PopoverContent
        align="end"
        className={cn(
          'w-80 p-0 rounded-xl',
          'bg-popover/95 backdrop-blur-xl',
          'border border-border/50 shadow-xl'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">{t('notifications.title')}</h4>
          {hasUnread && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellRing className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={handleViewAll}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
