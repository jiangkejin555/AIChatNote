'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Mail, KeyRound } from 'lucide-react'
import { useTranslations } from '@/i18n'
import VerificationCodeForm from '@/components/auth/VerificationCodeForm'
import { cn } from '@/lib/utils'

type OAuthProvider = 'google' | 'github' | 'qq'

interface OAuthProviderConfig {
  id: OAuthProvider
  name: string
  icon: React.ReactNode
  bgColor: string
  hoverColor: string
}

const oauthProviders: OAuthProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    bgColor: 'bg-white dark:bg-slate-800',
    hoverColor: 'hover:bg-slate-50 dark:hover:bg-slate-700',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
    bgColor: 'bg-slate-900 dark:bg-slate-700 text-white',
    hoverColor: 'hover:bg-slate-800 dark:hover:bg-slate-600',
  },
  {
    id: 'qq',
    name: 'QQ',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.213 0 6.29.256 6.29-.43 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z"/>
      </svg>
    ),
    bgColor: 'bg-[#12B7F5] text-white',
    hoverColor: 'hover:bg-[#00A5E5]',
  },
]

interface LoginForm {
  email: string
  password: string
}

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const [activeTab, setActiveTab] = useState<'password' | 'code'>('password')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const t = useTranslations()

  const redirect = searchParams.get('redirect') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      login(response.user, response.token)
      toast.success(t('auth.loginSuccess'))
      router.push(decodeURIComponent(redirect))
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || axiosError.message || t('auth.loginFailed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider)
    try {
      const response = await authApi.getOAuthURL(provider)
      window.location.href = response.auth_url
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.oauth.failed')
      toast.error(message)
      setOauthLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('auth.loginTitle')}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {t('auth.loginDesc')}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/50">
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={cn(
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden',
            activeTab === 'password'
              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Mail className={cn(
            'w-4 h-4 transition-transform duration-300',
            activeTab === 'password' && 'scale-110'
          )} />
          <span>{t('auth.verificationCode.passwordTab')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={cn(
            'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden',
            activeTab === 'code'
              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <KeyRound className={cn(
            'w-4 h-4 transition-transform duration-300',
            activeTab === 'code' && 'scale-110'
          )} />
          <span>{t('auth.verificationCode.codeTab')}</span>
        </button>
      </div>

      {/* Password Login Form */}
      {activeTab === 'password' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t('auth.email')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="h-11"
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid'),
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              className="h-11"
              {...register('password', {
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 8,
                  message: t('auth.passwordMinLength'),
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.login')
            )}
          </Button>
        </form>
      )}

      {/* Verification Code Login */}
      {activeTab === 'code' && (
        <VerificationCodeForm />
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">
            {t('auth.oauth.or')}
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {oauthProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className={cn(
              'h-11 px-0 font-medium border-0 shadow-sm transition-all duration-200',
              provider.bgColor,
              provider.hoverColor
            )}
            disabled={oauthLoading !== null}
            onClick={() => handleOAuthLogin(provider.id)}
          >
            {oauthLoading === provider.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              provider.icon
            )}
          </Button>
        ))}
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          {t('auth.goRegister')}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  const t = useTranslations()

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('auth.loginTitle')}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {t('common.loading')}
          </p>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
