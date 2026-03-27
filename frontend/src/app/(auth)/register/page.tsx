'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
}

function RegisterFormContent() {
  const [isLoading, setIsLoading] = useState(false)
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

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
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
