'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/stores'
import { useTranslations } from '@/i18n'
import {
  MessageSquare,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Cpu,
  LogOut,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { user, logout } = useAuthStore()
  const t = useTranslations()

  const navItems = [
    { href: '/', label: t('sidebar.chat'), icon: MessageSquare },
    { href: '/notes', label: t('sidebar.knowledgeBase'), icon: FileText },
    { href: '/models', label: t('sidebar.modelManagement'), icon: Cpu },
    { href: '/settings', label: t('sidebar.settings'), icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            AI Chat Notes
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapse}
          className="ml-auto"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* New Chat Button */}
      <div className="p-3">
        <Link href="/" className="block">
          <Button className={cn('w-full', sidebarCollapsed && 'px-2')}>
            <Plus className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">{t('sidebar.newChat')}</span>}
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Area at Bottom */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg p-2 transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'cursor-pointer',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 truncate text-sm text-sidebar-foreground text-left">
                    {user?.email}
                  </span>
                  <ChevronUp className="h-4 w-4 text-sidebar-foreground" />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align={sidebarCollapsed ? 'center' : 'end'}
            className="w-56"
          >
            <DropdownMenuItem>
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('sidebar.settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('sidebar.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
