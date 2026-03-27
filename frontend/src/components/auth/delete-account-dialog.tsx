'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
}: DeleteAccountDialogProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { logout } = useAuthStore()
  const t = useTranslations()

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCode('')
      setCountdown(0)
    }
  }, [open])

  const handleSendCode = useCallback(async () => {
    if (countdown > 0 || isSendingCode) return

    setIsSendingCode(true)
    try {
      await authApi.sendVerificationCode({ email })
      toast.success(t('auth.deleteAccount.codeSent'))
      setCountdown(60)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.deleteAccount.failed')
      toast.error(message)
    } finally {
      setIsSendingCode(false)
    }
  }, [email, countdown, isSendingCode, t])

  const handleDeleteAccount = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      toast.error(t('auth.deleteAccount.codePlaceholder'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.deleteAccount({ code: code.trim() })
      toast.success(t('auth.deleteAccount.success'))
      logout()
      onOpenChange(false)
      router.push('/login')
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.deleteAccount.failed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCode('')
    setCountdown(0)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('auth.deleteAccount.confirmDialogTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('auth.deleteAccount.description')}
          </AlertDialogDescription>
          <div className="space-y-3 text-left mt-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-2 font-medium text-foreground">{t('settings.deleteAccount')}</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>{t('auth.deleteAccount.warning')}</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <label htmlFor="delete-code" className="text-sm font-medium text-foreground">
                {t('auth.deleteAccount.codeLabel')}
              </label>
              <div className="flex gap-2">
                <Input
                  id="delete-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.deleteAccount.codePlaceholder')}
                  className="h-10 flex-1"
                  disabled={isLoading}
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || isLoading}
                >
                  {isSendingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : countdown > 0 ? (
                    t('auth.deleteAccount.resendCode', { count: String(countdown) })
                  ) : (
                    t('auth.deleteAccount.sendCode')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            {t('auth.deleteAccount.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isLoading || code.trim().length !== 6}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.deleteAccount.confirmButton')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
