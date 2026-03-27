'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { LogOut, Key, Trash2, User, Shield, Mail, AlertTriangle, ChevronRight } from 'lucide-react'
import { useTranslations } from '@/i18n'
import ChangePasswordDialog from '@/components/auth/change-password-dialog'
import DeleteAccountDialog from '@/components/auth/delete-account-dialog'

export default function AccountPage() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const t = useTranslations()

  const isOAuthUser = !user?.email || (user as { password_hash?: string })?.password_hash === '' || (user as { password_hash?: string })?.password_hash === undefined

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutConfirm(false)
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 sticky top-0 z-10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t('accountManagement.title')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
          {/* Account Info Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('accountManagement.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('accountManagement.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {/* User Email Display */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {t('accountManagement.email')}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('accountManagement.description')}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-muted/50 text-sm font-medium">
                    {user?.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('accountManagement.securityActions')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('accountManagement.securityDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {/* Change Password */}
                {!isOAuthUser && (
                  <div
                    className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                        <Key className="h-4 w-4" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          {t('accountManagement.changePassword')}
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('accountManagement.changePasswordDesc')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                )}

                {/* Logout */}
                <div
                  className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors duration-200">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        {t('accountManagement.logout')}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('accountManagement.logoutDesc')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>

                {/* Delete Account */}
                <div
                  className="p-5 flex items-center justify-between gap-4 group hover:bg-destructive/5 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  onClick={() => setShowDeleteAccount(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive transition-colors duration-200">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-destructive/80 group-hover:text-destructive transition-colors duration-200">
                        {t('accountManagement.deleteAccount')}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('accountManagement.deleteAccountDesc')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-destructive group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Warning */}
          <div className="w-full flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive/60 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('accountManagement.dangerZoneWarning')}
            </p>
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        email={user?.email || ''}
      />

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
        isOAuthUser={isOAuthUser}
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
    </div>
  )
}
