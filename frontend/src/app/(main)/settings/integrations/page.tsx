'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Blocks, AlertCircle, Loader2 } from 'lucide-react'
import { integrationService } from '@/services/integration'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'

export default function IntegrationsPage() {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const status = await integrationService.getNotionStatus()
      setConnected(status.connected)
    } catch (err: any) {
      console.error('Failed to fetch Notion status:', err)
      setError('Failed to load integration status. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchStatus()
  }, [fetchStatus])

  const handleConnectNotion = async () => {
    try {
      setActionLoading(true)
      const { url } = await integrationService.getNotionAuthUrl()
      window.location.href = url
    } catch (err: any) {
      console.error('Failed to get auth URL:', err)
      toast.error('Failed to start Notion connection')
      setActionLoading(false)
    }
  }

  const handleDisconnectNotion = async () => {
    try {
      setActionLoading(true)
      await integrationService.disconnectNotion()
      toast.success('Notion disconnected successfully')
      setConnected(false)
    } catch (err: any) {
      console.error('Failed to disconnect Notion:', err)
      toast.error('Failed to disconnect Notion')
    } finally {
      setActionLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 sticky top-0 z-10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Blocks className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#000000]/10 to-[#000000]/5 dark:from-white/20 dark:to-white/5 text-foreground">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M4.459 4.208c.745-.636 1.815-.745 3.32-.745h9.44c1.171 0 2.235.109 2.98.745.745.637.745 1.705.745 2.876v9.832c0 1.171 0 2.239-.745 2.876-.745.636-1.809.745-2.98.745H7.78c-1.505 0-2.575-.109-3.32-.745-.745-.637-.745-1.705-.745-2.876V7.084c0-1.171 0-2.239.744-2.876zm2.84 2.84v9.904h2.15v-6.72l4.87 6.72h1.92V7.048h-2.15v6.72l-4.87-6.72h-1.92z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">Notion</CardTitle>
                  <CardDescription className="mt-1">
                    Connect your Notion account to export notes directly to your Notion workspace.
                  </CardDescription>
                </div>
                {connected === true && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    {connected 
                      ? 'Your Notion account is currently connected. You can now export notes to Notion.'
                      : 'Notion is not connected. Connect your account to enable Notion export.'}
                  </div>
                  <Button
                    onClick={connected ? handleDisconnectNotion : handleConnectNotion}
                    disabled={actionLoading}
                    variant={connected ? "outline" : "default"}
                    className={cn(
                      "shrink-0 min-w-[140px]",
                      connected && "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    )}
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {connected ? 'Disconnect' : 'Connect Notion'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}