'use client'

import { useState } from 'react'
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
  isOAuthUser: boolean
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  isOAuthUser,
}: DeleteAccountDialogProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { logout } = useAuthStore()
  const t = useTranslations()

  const handleDeleteAccount = async () => {
    if (!isOAuthUser && !password.trim()) {
      toast.error(t('auth.deleteAccount.passwordRequired'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.deleteAccount(isOAuthUser ? undefined : { password: password.trim() })
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
    setPassword('')
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
            {!isOAuthUser && (
              <div className="space-y-2">
                <label htmlFor="delete-password" className="text-sm font-medium text-foreground">
                  {t('auth.deleteAccount.passwordRequired')}
                </label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                  className="h-10"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            {t('auth.deleteAccount.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isLoading || (!isOAuthUser && !password.trim())}
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
