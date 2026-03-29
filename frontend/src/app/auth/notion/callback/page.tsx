'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { integrationService } from '@/services/integration'
import { Button } from '@/components/ui/button'

function NotionCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const hasCalled = useRef(false)

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        setErrorMessage(searchParams.get('error_description') || 'Authentication failed or was cancelled.')
        return
      }

      if (!code) {
        setStatus('error')
        setErrorMessage('No authorization code provided by Notion.')
        return
      }

      try {
        await integrationService.handleNotionCallback(code)
        setStatus('success')
        // Redirect back to integrations page after a short delay
        setTimeout(() => {
          router.push('/settings/integrations')
        }, 2000)
      } catch (err: any) {
        console.error('Failed to handle Notion callback:', err)
        setStatus('error')
        setErrorMessage(err.response?.data?.error || 'Failed to connect Notion. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-card border shadow-xl flex flex-col items-center text-center">
        {status === 'loading' && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150" />
              <div className="relative w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Connecting to Notion</h1>
            <p className="text-muted-foreground">Please wait while we complete the authentication...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150" />
              <div className="relative w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Connection Successful!</h1>
            <p className="text-muted-foreground">Redirecting you back to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full scale-150" />
              <div className="relative w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                <AlertCircle className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <Button onClick={() => router.push('/settings/integrations')} className="w-full">
              Return to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function NotionCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <NotionCallbackContent />
    </Suspense>
  )
}