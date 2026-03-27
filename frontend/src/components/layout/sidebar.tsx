'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore, useChatStore } from '@/stores'
import { useTranslations } from '@/i18n'
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversation, useProviders, useSearchConversations } from '@/hooks'
import {
  MessageSquare,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Cpu,
  ChevronUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Info,
  HelpCircle,
  Search,
  Loader2,
  User,
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
import AccountManagementDialog from '@/components/auth/account-management-dialog'

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

  // Search state
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, isSearching, clearResults } = useSearchConversations(searchQuery)

  // Account management state
  const [showAccountManagement, setShowAccountManagement] = useState(false)

  const navItems = [
    { href: '/notes', label: t('sidebar.knowledgeBase'), icon: FileText },
    { href: '/models', label: t('sidebar.modelManagement'), icon: Cpu },
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
        'group relative flex flex-col h-full border-r transition-all duration-300 ease-out overflow-hidden',
        'bg-sidebar',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-transparent to-sidebar/50 pointer-events-none opacity-60" />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-150" />
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              AI Chat Note
            </h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapse}
          className={cn(
            'relative rounded-lg transition-all duration-200',
            'hover:bg-sidebar-accent/80 hover:scale-105 active:scale-95',
            sidebarCollapsed ? 'ml-0 mx-auto' : 'ml-auto'
          )}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="shrink-0 opacity-50" />

      {/* New Chat Button */}
      <div className="relative p-3 shrink-0">
        <Button
          className={cn(
            'relative w-full overflow-hidden transition-all duration-200',
            'hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]',
            sidebarCollapsed ? 'px-2' : 'px-4'
          )}
          onClick={handleNewConversation}
          disabled={createConversation.isPending}
        >
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/newchat:translate-x-full transition-transform duration-700" />
          <Plus className={cn('h-4 w-4 transition-transform duration-200 group-hover/newchat:rotate-90', !sidebarCollapsed && 'mr-2')} />
          {!sidebarCollapsed && <span>{t('sidebar.newChat')}</span>}
        </Button>
      </div>

      <Separator className="shrink-0 opacity-50" />

      {/* Navigation */}
      <nav className="relative p-3 space-y-1.5 shrink-0">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group/nav relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                'hover:bg-sidebar-accent/70 hover:translate-x-1',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm shadow-sidebar-accent/50'
                  : 'text-sidebar-foreground/80 hover:text-sidebar-foreground'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                'group-hover/nav:scale-110',
                isActive && 'text-primary'
              )} />
              {!sidebarCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Conversation History - only show on chat page when not collapsed */}
      {showConversationList && (
        <>
          <Separator className="shrink-0 opacity-50" />
          <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Search Header */}
            <div className="px-3 py-3 flex items-center gap-2 shrink-0">
              {searchExpanded ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('chat.searchPlaceholder')}
                      className="h-8 text-sm pl-9 pr-3 bg-sidebar-accent/50 border-sidebar-border/50 focus:border-primary/50 rounded-lg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchExpanded(false)
                          setSearchQuery('')
                          clearResults()
                        }
                      }}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-sidebar-foreground/40" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg hover:bg-sidebar-accent"
                    onClick={() => {
                      setSearchExpanded(false)
                      setSearchQuery('')
                      clearResults()
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest flex-1">
                    {t('chat.conversationHistory')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
                    onClick={() => setSearchExpanded(true)}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            {/* Search Results or Normal List */}
            <ScrollArea className="flex-1 h-0">
              {searchExpanded && searchQuery ? (
                // Search Results
                <div className="p-2 space-y-1">
                  {isSearching ? (
                    <div className="p-6 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-sidebar-foreground/40" />
                      <p className="text-xs text-sidebar-foreground/40 mt-2">{t('chat.searching')}</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center">
                      <Search className="h-6 w-6 mx-auto text-sidebar-foreground/20 mb-2" />
                      <p className="text-xs text-sidebar-foreground/40">{t('chat.noSearchResults')}</p>
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <div
                        key={result.id}
                        className={cn(
                          'group/result flex flex-col gap-1.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200',
                          'hover:bg-sidebar-accent/60 hover:translate-x-1',
                          currentConversationId === result.id && 'bg-sidebar-accent shadow-sm'
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => {
                          setIsPendingNewChat(false)
                          setCurrentConversation(result.id)
                          setSearchExpanded(false)
                          setSearchQuery('')
                          clearResults()
                          if (pathname !== '/') {
                            router.push('/')
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                            currentConversationId === result.id
                              ? 'bg-primary/10 text-primary'
                              : 'bg-sidebar-accent/50 text-sidebar-foreground/50 group-hover/result:bg-sidebar-accent group-hover/result:text-sidebar-foreground/70'
                          )}>
                            <MessageSquare className="h-3 w-3" />
                          </div>
                          <span className="truncate text-sm flex-1 font-medium">
                            {result.title || t('chat.newChat')}
                          </span>
                          <span className="text-[10px] text-sidebar-foreground/30 shrink-0 uppercase font-medium">
                            {result.matched_in === 'title' ? t('chat.matchedInTitle') : t('chat.matchedInContent')}
                          </span>
                        </div>
                        {result.snippet && (
                          <div
                            className="text-xs text-sidebar-foreground/50 line-clamp-2 ml-[30px] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: result.snippet }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : conversationsLoading ? (
                <div className="p-2 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-sidebar-accent/30 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : groupedConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-sidebar-accent/30 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-sidebar-foreground/30" />
                  </div>
                  <p className="text-sm text-sidebar-foreground/40">{t('chat.noConversations')}</p>
                  <p className="text-xs text-sidebar-foreground/30 mt-1">开始你的第一个对话吧</p>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {groupedConversations.map(({ label, conversations: groupItems }, groupIndex) => (
                    <div key={label}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-widest">
                        {label}
                      </div>
                      <div className="space-y-1">
                        {groupItems.map((conversation, index) => (
                          <div
                            key={conversation.id}
                            className={cn(
                              'group/conv flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200',
                              'hover:bg-sidebar-accent/60 hover:translate-x-1',
                              currentConversationId === conversation.id && 'bg-sidebar-accent shadow-sm'
                            )}
                            style={{ animationDelay: `${(groupIndex * 5 + index) * 20}ms` }}
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
                            <div className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              currentConversationId === conversation.id
                                ? 'bg-primary/10 text-primary'
                                : 'bg-sidebar-accent/50 text-sidebar-foreground/50 group-hover/conv:bg-sidebar-accent group-hover/conv:text-sidebar-foreground/70'
                            )}>
                              <MessageSquare className="h-3 w-3" />
                            </div>

                            {editingId === conversation.id ? (
                              <div className="flex-1 flex items-center gap-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="h-7 text-sm bg-background border-sidebar-border"
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
                                  className="h-6 w-6 rounded-lg hover:bg-primary/10 hover:text-primary"
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
                                  className="h-6 w-6 rounded-lg hover:bg-destructive/10 hover:text-destructive"
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
                                  <div className="truncate text-sm font-medium">
                                    {conversation.title || t('chat.newChat')}
                                  </div>
                                  <div className="text-[11px] text-sidebar-foreground/40 truncate mt-0.5">
                                    {formatTime(conversation.updated_at)}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-sidebar-accent opacity-0 group-hover/conv:opacity-100 transition-all duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem
                                      className="rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStartEdit(conversation.id, conversation.title)
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      {t('chat.rename')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="rounded-lg text-destructive focus:text-destructive"
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
            <DropdownMenuItem>
              <Link href="/about" className="flex items-center w-full">
                <Info className="mr-2 h-4 w-4" />
                <span>{t('about.title')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAccountManagement(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>{t('accountManagement.title')}</span>
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

      {/* Account Management Dialog */}
      <AccountManagementDialog
        open={showAccountManagement}
        onOpenChange={setShowAccountManagement}
      />
    </aside>
  )
}
