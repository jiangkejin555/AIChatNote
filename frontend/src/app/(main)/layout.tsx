'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuthStore, useUIStore } from '@/stores'
import { Sidebar } from '@/components/layout'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, toggleSidebar, fontSize, fontFamily } = useUIStore()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Apply font settings to document
  useEffect(() => {
    if (fontSize) document.documentElement.setAttribute('data-font-size', fontSize)
    if (fontFamily) document.documentElement.setAttribute('data-font-family', fontFamily)
  }, [fontSize, fontFamily])

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      const redirect = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams}` : ''))
      router.push(`/login?redirect=${redirect}`)
    }
  }, [_hasHydrated, isAuthenticated, router, pathname, searchParams])

  if (!_hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - only show on mobile */}
        <header className="h-14 border-b bg-background flex items-center px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    }>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  )
}
