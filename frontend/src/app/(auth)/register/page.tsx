'use client'

import { useState, Suspense, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface RegisterForm {
  email: string
  code: string
  password: string
  confirmPassword: string
}

function RegisterFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const t = useTranslations()

  const redirect = searchParams.get('redirect') || '/'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const email = watch('email')
  const password = watch('password')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = useCallback(async () => {
    if (!email) {
      toast.error(t('auth.verificationCode.emailRequired'))
      return
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(email)) {
      toast.error(t('auth.emailInvalid'))
      return
    }

    if (countdown > 0) return

    setIsSendingCode(true)
    try {
      await authApi.sendVerificationCode({ email })
      toast.success(t('auth.verificationCode.sendSuccess'))
      setCountdown(60)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.verificationCode.sendFailed')
      toast.error(message)
    } finally {
      setIsSendingCode(false)
    }
  }, [email, countdown, t])

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++

    if (score <= 2) return { score, label: t('auth.passwordStrength.weak'), color: 'text-red-500' }
    if (score <= 3) return { score, label: t('auth.passwordStrength.medium'), color: 'text-yellow-500' }
    return { score, label: t('auth.passwordStrength.strong'), color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        code: data.code,
      })
      login(response.user, response.token)
      toast.success(t('auth.registerSuccess'))
      router.push(decodeURIComponent(redirect))
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || axiosError.message || t('auth.registerFailed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('auth.registerTitle')}
        </h2>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {t('auth.registerDesc')}
        </p>
      </div>

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
          <label htmlFor="code" className="text-sm font-medium">
            {t('auth.verificationCode.code')}
          </label>
          <div className="flex gap-3">
            <Input
              id="code"
              type="text"
              maxLength={6}
              placeholder={t('auth.verificationCode.codePlaceholder')}
              className="h-11 flex-1"
              {...register('code', {
                required: t('auth.registerPage.codeRequired'),
                pattern: {
                  value: /^\d{6}$/,
                  message: t('auth.verificationCode.codeInvalid'),
                },
              })}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isSendingCode || countdown > 0}
              onClick={handleSendCode}
              className="h-11 px-4 font-medium whitespace-nowrap"
            >
              {isSendingCode ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : (
                t('auth.registerPage.sendCode')
              )}
            </Button>
          </div>
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
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
          {password && !errors.password && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('auth.passwordStrength.label')}:</span>
              <span className={passwordStrength.color}>{passwordStrength.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            {t('auth.confirmPassword')}
          </label>
          <Input
            id="confirmPassword"
            type="password"
            className="h-11"
            {...register('confirmPassword', {
              required: t('auth.confirmPasswordRequired'),
              validate: (value) =>
                value === password || t('auth.passwordMismatch'),
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
            t('auth.register')
          )}
        </Button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          {t('auth.goLogin')}
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const t = useTranslations()

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('auth.registerTitle')}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {t('common.loading')}
          </p>
        </div>
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  )
}
