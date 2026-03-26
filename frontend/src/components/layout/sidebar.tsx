'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore, useChatStore } from '@/stores'
import { useTranslations } from '@/i18n'
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation, useProviders } from '@/hooks'
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
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Info,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import type { Conversation } from '@/types'

// Helper function to format time
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`

  // Format as HH:mm
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// Helper function to group conversations by date
function groupConversationsByDate(conversations: Conversation[]): { label: string; conversations: Conversation[] }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const groups: { [key: string]: Conversation[] } = {
    '今天': [],
    '昨天': [],
    '过去7天': [],
    '更早': [],
  }

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at)
    convDate.setHours(0, 0, 0, 0)

    if (convDate.getTime() >= today.getTime()) {
      groups['今天'].push(conv)
    } else if (convDate.getTime() >= yesterday.getTime()) {
      groups['昨天'].push(conv)
    } else if (convDate.getTime() >= lastWeek.getTime()) {
      groups['过去7天'].push(conv)
    } else {
      groups['更早'].push(conv)
    }
  })

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, conversations]) => ({ label, conversations }))
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore()
  const { user, logout } = useAuthStore()
  const { currentConversationId, setCurrentConversation, isPendingNewChat, setIsPendingNewChat } = useChatStore()
  const t = useTranslations()

  // Conversation hooks
  const { data: conversations, isLoading: conversationsLoading } = useConversations()
  const { data: providers } = useProviders()
  const createConversation = useCreateConversation()
  const deleteConversation = useDeleteConversation()
  const updateConversation = useUpdateConversation()

  // Local state for editing and deleting
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null)

  const navItems = [
    { href: '/notes', label: t('sidebar.knowledgeBase'), icon: FileText },
    { href: '/models', label: t('sidebar.modelManagement'), icon: Cpu },
    { href: '/settings', label: t('sidebar.settings'), icon: Settings },
  ]

  // Sort conversations by updated_at (most recent first)
  const sortedConversations = useMemo(() => {
    if (!conversations) return []
    return [...conversations].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [conversations])

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(sortedConversations)
  }, [sortedConversations])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Handle new conversation creation - just set pending state, don't call backend
  const handleNewConversation = async () => {
    // If already in pending state, ignore click (reuse current start page)
    if (isPendingNewChat) {
      return
    }

    // Check if there's at least one enabled model available
    if (providers) {
      const hasEnabledModel = providers.some(p => p.models.some(m => m.enabled))
      if (!hasEnabledModel) {
        toast.error(t('chat.configureProviderFirst'))
        return
      }
    } else {
      toast.error(t('chat.configureProviderFirst'))
      return
    }

    // Set pending state to show start page
    setIsPendingNewChat(true)
    setCurrentConversation(null)

    // Navigate to chat page if not already there
    if (pathname !== '/') {
      router.push('/')
    }
  }

  const handleStartEdit = (id: number, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle || t('chat.newChat'))
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateConversation.mutate({ id: editingId, data: { title: editTitle.trim() } })
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDeleteClick = (id: number) => {
    setConversationToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation.mutate(conversationToDelete)
    }
    setDeleteDialogOpen(false)
    setConversationToDelete(null)
  }

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  // Don't show conversation list when sidebar is collapsed
  const showConversationList = !sidebarCollapsed

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0">
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

      <Separator className="shrink-0" />

      {/* New Chat Button */}
      <div className="p-3 shrink-0">
        <Button
          className={cn('w-full', sidebarCollapsed && 'px-2')}
          onClick={handleNewConversation}
          disabled={createConversation.isPending}
        >
          <Plus className="h-4 w-4" />
          {!sidebarCollapsed && <span className="ml-2">{t('sidebar.newChat')}</span>}
        </Button>
      </div>

      <Separator className="shrink-0" />

      {/* Navigation */}
      <nav className="p-3 space-y-1 shrink-0">
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

      {/* Conversation History - only show on chat page when not collapsed */}
      {showConversationList && (
        <>
          <Separator className="shrink-0" />
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider shrink-0">
              {t('chat.conversationHistory')}
            </div>
            <ScrollArea className="flex-1 h-0">
              {conversationsLoading ? (
                <div className="p-2 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-sidebar-accent/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : groupedConversations.length === 0 ? (
                <div className="p-4 text-center text-sidebar-foreground/50 text-sm">
                  {t('chat.noConversations')}
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {groupedConversations.map(({ label, conversations: groupItems }) => (
                    <div key={label}>
                      <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/50">
                        {label}
                      </div>
                      <div className="space-y-1">
                        {groupItems.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={cn(
                              'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              currentConversationId === conversation.id && 'bg-sidebar-accent text-sidebar-accent-foreground'
                            )}
                            onClick={() => {
                              if (editingId !== conversation.id) {
                                // Clear pending new chat state when switching to existing conversation
                                setIsPendingNewChat(false)
                                setCurrentConversation(conversation.id)
                                // Navigate to chat page if not already there
                                if (pathname !== '/') {
                                  router.push('/')
                                }
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />

                            {editingId === conversation.id ? (
                              <div className="flex-1 flex items-center gap-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="h-7 text-sm bg-background"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveEdit()
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit()
                                    }
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSaveEdit()
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCancelEdit()
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-sm">
                                    {conversation.title || t('chat.newChat')}
                                  </div>
                                  <div className="text-xs text-sidebar-foreground/50 truncate">
                                    {formatTime(conversation.updated_at)}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-sidebar-accent/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStartEdit(conversation.id, conversation.title)
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {t('chat.rename')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteClick(conversation.id)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t('chat.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}

      {/* User Area at Bottom */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
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
            <DropdownMenuItem>
              <Link href="/help" className="flex items-center w-full">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{t('helpFeedback.title')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/about" className="flex items-center w-full">
                <Info className="mr-2 h-4 w-4" />
                <span>{t('about.title')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('sidebar.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chat.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
