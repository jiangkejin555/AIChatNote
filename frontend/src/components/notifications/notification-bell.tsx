'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationPopover } from './notification-popover'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  return (
    <NotificationPopover
      triggerClassName={cn(
        'relative rounded-lg inline-flex items-center justify-center',
        'hover:bg-sidebar-accent/80 hover:scale-105 active:scale-95',
        'transition-all duration-200 h-10 w-10',
        className
      )}
    >
      <Bell className="h-4 w-4" />
    </NotificationPopover>
  )
}
