'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n'

import type { OAuthProvider } from '@/types'

export default function OAuthCallbackPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuthStore()
  const t = useTranslations()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const provider = params.provider as OAuthProvider
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (!code || !state || !provider) {
      setError(t('auth.oauth.callbackFailed'))
      setIsProcessing(false)
      return
    }

    handleCallback()
  }, [code, state, provider])

  const handleCallback = async () => {
    try {
    setIsProcessing(true)
    setError(null)

    const response = await authApi.handleOAuthCallback(provider, {
      code: code!,
      state: state!,
    })

    login(response.user, response.token)
    toast.success(t('auth.loginSuccess'))
    router.push(decodeURIComponent(redirect))
  } catch (err: {
    console.error('OAuth callback error:', err)
    const errorMessage = err instanceof Error ? err.message : t('auth.oauth.callbackFailed')
    setError(errorMessage)
    toast.error(errorMessage)
  } finally {
    setIsProcessing(false)
  }
  }

  const handleRetry = () => {
    router.push('/login')
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t('auth.oauth.processing')}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">
            <p className="text-lg font-semibold mb-2">
              {t('auth.oauth.callbackFailed')}
            </p>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            {t('auth.oauth.retry')}
          </button>
        </div>
      </div>
    )
  }

  return null
}
