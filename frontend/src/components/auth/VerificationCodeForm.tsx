'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface VerificationCodeForm {
  email: string
  code: string
}

interface VerificationCodeFormProps {
  onSuccess?: () => void
}

export default function VerificationCodeForm({ onSuccess }: VerificationCodeFormProps) {
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
  } = useForm<VerificationCodeForm>({
    defaultValues: {
      email: '',
      code: '',
    },
  })

  const email = watch('email')

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

  const onSubmit = async (data: VerificationCodeForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.verifyCodeAndLogin({
        email: data.email,
        code: data.code,
      })

      login(response.user, response.token)
      toast.success(t('auth.loginSuccess'))

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(decodeURIComponent(redirect))
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.verificationCode.verifyFailed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="verification-email" className="text-sm font-medium">
          {t('auth.email')}
        </label>
        <Input
          id="verification-email"
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
        <label htmlFor="verification-code" className="text-sm font-medium">
          {t('auth.verificationCode.code')}
        </label>
        <div className="flex gap-3">
          <Input
            id="verification-code"
            type="text"
            maxLength={6}
            placeholder={t('auth.verificationCode.codePlaceholder')}
            className="h-11 flex-1"
            {...register('code', {
              required: t('auth.verificationCode.codeRequired'),
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
              t('auth.verificationCode.sendCode')
            )}
          </Button>
        </div>
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code.message}</p>
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
          t('auth.verificationCode.login')
        )}
      </Button>
    </form>
  )
}
