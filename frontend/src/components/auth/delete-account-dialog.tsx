'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

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
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { logout } = useAuthStore()
  const t = useTranslations()

  const codeString = code.join('')

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
      setCode(['', '', '', '', '', ''])
      setCountdown(0)
      setFocusedIndex(null)
      // Focus first input after animation
      setTimeout(() => inputRefs.current[0]?.focus(), 300)
    }
  }, [open])

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    if (!digit && value !== '') return // Allow only digits

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData) {
      const newCode = [...code]
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i]
      }
      setCode(newCode)
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

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

  const handleDeleteAccount = async (e?: React.MouseEvent) => {
    // Prevent default dialog close behavior
    e?.preventDefault?.()
    e?.stopPropagation?.()

    if (codeString.length !== 6) {
      toast.error(t('auth.deleteAccount.codePlaceholder'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.deleteAccount({ code: codeString })
      toast.success(t('auth.deleteAccount.success'))
      logout()
      onOpenChange(false)
      router.push('/login')
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.deleteAccount.failed')
      toast.error(message)
      // Don't close dialog on error - let user retry
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCode(['', '', '', '', '', ''])
    setCountdown(0)
    setFocusedIndex(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="!max-w-[450px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
        {/* Main Card with Glass Effect */}
        <div className="relative rounded-2xl bg-background/95 backdrop-blur-xl shadow-2xl ring-1 ring-destructive/10 dark:ring-destructive/20 overflow-hidden">
          {/* Subtle Danger Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-destructive/[0.03] via-transparent to-destructive/[0.02] pointer-events-none" />

          {/* Animated Top Border Glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />

          {/* Content Container */}
          <div className="relative p-10">
            {/* Header Section - Staggered Animation */}
            <div className="flex flex-col items-center text-center mb-6 animate-in fade-in-0 zoom-in-95 duration-300">
              {/* Warning Icon with Pulse Animation */}
              <div className="relative mb-5">
                {/* Outer Pulse Ring */}
                <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping [animation-duration:2s]" />
                {/* Middle Glow */}
                <div className="absolute -inset-3 rounded-full bg-destructive/10 animate-pulse" />
                {/* Icon Container */}
                <div className="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-destructive/15 to-destructive/5 ring-1 ring-destructive/20">
                  <AlertTriangle className="size-7 text-destructive animate-in zoom-in-50 duration-500 delay-100" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
                {t('auth.deleteAccount.confirmDialogTitle')}
              </h2>
            </div>

            {/* Warning Info - Animated Card */}
            <div className="relative rounded-xl bg-muted/30 dark:bg-muted/10 p-5 mb-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300 delay-200 overflow-hidden">
              {/* Decorative Corner Accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-destructive/5 to-transparent rounded-bl-full" />

              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                {t('auth.deleteAccount.description')}
              </p>

              {/* Divider with Gradient */}
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

              <p className="text-xs text-muted-foreground/80 leading-relaxed relative z-10">
                {t('auth.deleteAccount.warning')}
              </p>
            </div>

            {/* Verification Code Section */}
            <div className="mb-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-300">
              <label className="text-sm font-medium text-foreground block mb-4">
                {t('auth.deleteAccount.codeLabel')}
              </label>

              {/* Code Input + Send Button Row */}
              <div className="flex items-center justify-center gap-3">
                {/* Six Digit Input Boxes */}
                <div className="flex gap-1.5">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      disabled={isLoading}
                      className={cn(
                        "size-10 text-center text-base font-mono font-medium",
                        "rounded-lg border-2 transition-all duration-200",
                        "bg-background/50 backdrop-blur-sm",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        // Default state
                        "border-border/60 hover:border-border",
                        // Focused state
                        "focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20",
                        // Filled state
                        digit && "border-primary/40 bg-primary/5",
                        // Focus animation
                        focusedIndex === index && "scale-110 shadow-lg shadow-destructive/5"
                      )}
                    />
                  ))}
                </div>

                {/* Send Code Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 px-3 text-xs rounded-lg shrink-0",
                    "transition-all duration-300",
                    "hover:bg-primary/5 hover:border-primary/30 hover:text-primary",
                    countdown > 0 && "bg-muted/30"
                  )}
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || isLoading}
                >
                  {isSendingCode ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : countdown > 0 ? (
                    <span className="text-muted-foreground tabular-nums">{countdown}s</span>
                  ) : (
                    t('auth.deleteAccount.sendCode')
                  )}
                </Button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-center gap-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 delay-400">
              <AlertDialogCancel
                onClick={handleClose}
                disabled={isLoading}
                className={cn(
                  "h-11 px-8 text-sm rounded-full",
                  "bg-muted/50 hover:bg-muted border-border/50",
                  "transition-all duration-200",
                  "hover:scale-105 active:scale-95"
                )}
              >
                {t('auth.deleteAccount.cancelButton')}
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isLoading || codeString.length !== 6}
                className={cn(
                  "h-11 px-8 text-sm rounded-full",
                  "bg-destructive text-destructive-foreground",
                  "transition-all duration-300",
                  "hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20",
                  "hover:scale-105 active:scale-95",
                  "disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.deleteAccount.confirmButton')
                )}
              </AlertDialogAction>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
