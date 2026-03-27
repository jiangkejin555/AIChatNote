'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { LogOut, Key, Trash2, User } from 'lucide-react'
import { useTranslations } from '@/i18n'
import ChangePasswordDialog from './change-password-dialog'
import DeleteAccountDialog from './delete-account-dialog'

interface AccountManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AccountManagementDialog({
  open,
  onOpenChange,
}: AccountManagementDialogProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const t = useTranslations()

  const isOAuthUser = !user?.email || (user as { password_hash?: string })?.password_hash === '' || (user as { password_hash?: string })?.password_hash === undefined

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutConfirm(false)
    onOpenChange(false)
    router.push('/login')
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('accountManagement.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                {t('accountManagement.email')}
              </label>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>

            <div className="space-y-2">
              {!isOAuthUser && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowChangePassword(true)}
                >
                  <Key className="h-4 w-4" />
                  {t('accountManagement.changePassword')}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogoutClick}
              >
                <LogOut className="h-4 w-4" />
                {t('accountManagement.logout')}
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => setShowDeleteAccount(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('accountManagement.deleteAccount')}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        email={user?.email || ''}
      />

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
        email={user?.email || ''}
      />

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accountManagement.logout')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accountManagement.logoutConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              {t('accountManagement.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
