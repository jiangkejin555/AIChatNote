'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { authApi } from '@/lib/api/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

interface ChangePasswordFormData {
  code: string
  newPassword: string
  confirmPassword: string
}

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak'

  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

  if (score <= 2) return 'weak'
  if (score <= 4) return 'medium'
  return 'strong'
}

function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-destructive'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-500'
    case 'strong':
      return 'text-green-600 dark:text-green-500'
  }
}

function getPasswordStrengthBarColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-destructive'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  email,
}: ChangePasswordDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const t = useTranslations()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')
  const confirmPassword = watch('confirmPassword')
  const passwordStrength = getPasswordStrength(newPassword)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (!open) {
      reset()
      setCountdown(0)
    }
  }, [open, reset])

  const handleSendCode = useCallback(async () => {
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

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error(t('auth.passwordMismatch'))
      return
    }

    if (data.newPassword.length < 8) {
      toast.error(t('auth.registerPage.passwordMinLength'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.changePassword({
        email,
        code: data.code,
        new_password: data.newPassword,
      })

      toast.success(t('common.confirm') + '成功')
      onOpenChange(false)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || '修改密码失败'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('auth.email')}</label>
            <Input
              type="email"
              value={email}
              readOnly
              className="h-11 bg-muted cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="change-password-code" className="text-sm font-medium">
              {t('auth.verificationCode.code')}
            </label>
            <div className="flex gap-3">
              <Input
                id="change-password-code"
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

          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium">
              新密码
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="请输入新密码"
                className="h-11 pr-10"
                {...register('newPassword', {
                  required: '请输入新密码',
                  minLength: {
                    value: 8,
                    message: t('auth.registerPage.passwordMinLength'),
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t('auth.passwordStrength.label')}：
                  </span>
                  <span className={cn('text-sm font-medium', getPasswordStrengthColor(passwordStrength))}>
                    {t(`auth.passwordStrength.${passwordStrength}`)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength === 'weak'
                        ? getPasswordStrengthBarColor('weak')
                        : 'bg-muted'
                    )}
                  />
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength !== 'weak'
                        ? getPasswordStrengthBarColor(passwordStrength)
                        : 'bg-muted'
                    )}
                  />
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      passwordStrength === 'strong'
                        ? getPasswordStrengthBarColor('strong')
                        : 'bg-muted'
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="请再次输入新密码"
                className="h-11 pr-10"
                {...register('confirmPassword', {
                  required: t('auth.confirmPasswordRequired'),
                  validate: (value) =>
                    value === newPassword || t('auth.passwordMismatch'),
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-sm text-destructive">{t('auth.passwordMismatch')}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                '确认修改'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
