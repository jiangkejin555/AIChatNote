'use client'

import { useEffect, useState, Suspense, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { integrationService } from '@/services/integration'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/i18n'

// Notion-style logo SVG
function NotionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 126" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.6927 21.9315L64.8992 18.1029C68.0272 17.8266 68.8563 17.9496 70.7758 19.3145L85.4185 29.594C86.7408 30.5552 87.1884 30.8248 87.1884 31.9049V104.222C87.1884 106.302 86.4286 107.485 83.8527 107.704L33.1642 111.431C31.168 111.581 30.2142 111.238 29.1596 109.868L17.0366 94.1105C15.8581 92.5379 15.3952 91.3392 15.3952 89.9499V24.7359C15.3952 22.9818 16.1679 22.0995 20.6927 21.9315Z"
        fill="white"
        stroke="#E0E0E0"
        strokeWidth="0.5"
      />
      <path
        d="M64.8992 18.1029L20.6927 21.9315C16.1679 22.0995 15.3952 22.9818 15.3952 24.7359V89.9499C15.3952 91.3392 15.8581 92.5379 17.0366 94.1105L29.1596 109.868C30.2142 111.238 31.168 111.581 33.1642 111.431L83.8527 107.704C86.4286 107.485 87.1884 106.302 87.1884 104.222V31.9049C87.1884 30.8861 86.8004 30.5889 85.6606 29.7782L70.7758 19.3145C68.8563 17.9496 68.0272 17.8266 64.8992 18.1029Z"
        fill="white"
      />
      <path
        d="M64.8992 18.1029L20.6927 21.9315C16.1679 22.0995 15.3952 22.9818 15.3952 24.7359V89.9499C15.3952 91.3392 15.8581 92.5379 17.0366 94.1105L29.1596 109.868C30.2142 111.238 31.168 111.581 33.1642 111.431L83.8527 107.704C86.4286 107.485 87.1884 106.302 87.1884 104.222V31.9049C87.1884 30.8861 86.8004 30.5889 85.6606 29.7782L70.7758 19.3145C68.8563 17.9496 68.0272 17.8266 64.8992 18.1029Z"
        fill="white"
      />
      <path
        d="M52.7622 59.8788L68.8895 55.2456C71.9473 54.3513 72.8957 53.8906 72.8957 51.9849V40.8974C72.8957 38.7245 71.5572 37.749 69.5156 38.3083L52.7622 43.0593C50.6844 43.6489 49.9552 44.5254 49.9552 46.3961V57.0327C49.9552 58.9385 50.8498 59.5615 52.7622 59.8788Z"
        fill="black"
      />
      <path
        d="M50.2962 65.0432L47.3777 65.9082C46.4676 66.1776 46.1257 66.5364 46.1257 67.3647V72.7371C46.1257 73.5306 46.6373 73.9378 47.3777 73.7222L50.2962 72.8572C51.2063 72.5878 51.5482 72.229 51.5482 71.4007V66.0283C51.5482 65.2348 51.0366 64.8276 50.2962 65.0432Z"
        fill="black"
      />
      <path
        d="M32.6385 62.7572L53.6048 56.5553C54.1973 56.381 54.4787 55.8248 54.4787 55.0663V48.8296C54.4787 47.8649 53.8395 47.4172 53.0479 47.6491L32.0817 53.851C31.4892 54.0253 31.2078 54.5815 31.2078 55.34V61.5767C31.2078 62.5414 31.8469 62.9891 32.6385 62.7572Z"
        fill="black"
      />
      <path
        d="M34.8551 83.0237L53.6048 77.0917C54.1973 76.9174 54.4787 76.3612 54.4787 75.6027V69.366C54.4787 68.4013 53.8395 67.9536 53.0479 68.1855L34.2982 74.1175C33.7057 74.2918 33.4243 74.848 33.4243 75.6065V81.8432C33.4243 82.8079 34.0635 83.2556 34.8551 83.0237Z"
        fill="black"
      />
      <path
        d="M64.8992 18.1029L20.6927 21.9315C16.1679 22.0995 15.3952 22.9818 15.3952 24.7359V89.9499C15.3952 91.3392 15.8581 92.5379 17.0366 94.1105L29.1596 109.868C30.2142 111.238 31.168 111.581 33.1642 111.431L83.8527 107.704C86.4286 107.485 87.1884 106.302 87.1884 104.222V31.9049C87.1884 30.8861 86.8004 30.5889 85.6606 29.7782L70.7758 19.3145C68.8563 17.9496 68.0272 17.8266 64.8992 18.1029Z"
        fill="white"
        stroke="#E0E0E0"
        strokeWidth="0.5"
      />
      <path
        d="M52.7622 59.8788L68.8895 55.2456C71.9473 54.3513 72.8957 53.8906 72.8957 51.9849V40.8974C72.8957 38.7245 71.5572 37.749 69.5156 38.3083L52.7622 43.0593C50.6844 43.6489 49.9552 44.5254 49.9552 46.3961V57.0327C49.9552 58.9385 50.8498 59.5615 52.7622 59.8788Z"
        fill="black"
      />
      <path
        d="M50.2962 65.0432L47.3777 65.9082C46.4676 66.1776 46.1257 66.5364 46.1257 67.3647V72.7371C46.1257 73.5306 46.6373 73.9378 47.3777 73.7222L50.2962 72.8572C51.2063 72.5878 51.5482 72.229 51.5482 71.4007V66.0283C51.5482 65.2348 51.0366 64.8276 50.2962 65.0432Z"
        fill="black"
      />
      <path
        d="M32.6385 62.7572L53.6048 56.5553C54.1973 56.381 54.4787 55.8248 54.4787 55.0663V48.8296C54.4787 47.8649 53.8395 47.4172 53.0479 47.6491L32.0817 53.851C31.4892 54.0253 31.2078 54.5815 31.2078 55.34V61.5767C31.2078 62.5414 31.8469 62.9891 32.6385 62.7572Z"
        fill="black"
      />
      <path
        d="M34.8551 83.0237L53.6048 77.0917C54.1973 76.9174 54.4787 76.3612 54.4787 75.6027V69.366C54.4787 68.4013 53.8395 67.9536 53.0479 68.1855L34.2982 74.1175C33.7057 74.2918 33.4243 74.848 33.4243 75.6065V81.8432C33.4243 82.8079 34.0635 83.2556 34.8551 83.0237Z"
        fill="black"
      />
    </svg>
  )
}

// Animated pulse ring
function PulseRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="absolute w-24 h-24 rounded-full animate-[ping_2s_ease-out_infinite]"
        style={{ backgroundColor: color, opacity: 0.15 }}
      />
      <div
        className="absolute w-32 h-32 rounded-full animate-[ping_2.5s_ease-out_0.5s_infinite]"
        style={{ backgroundColor: color, opacity: 0.08 }}
      />
    </div>
  )
}

// Animated dots for loading state
function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  )
}

// Floating particles background
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; size: number
    duration: number; delay: number; opacity: number
  }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * -20,
        opacity: Math.random() * 0.15 + 0.05,
      }))
    )
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-foreground"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

// Success checkmark animation
function SuccessCheckmark() {
  return (
    <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 52 52">
      <circle
        className="animate-[stroke_0.6s_ease-out_forwards]"
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="157"
        strokeDashoffset="157"
      />
      <path
        className="animate-[checkmark_0.4s_0.4s_ease-out_forwards]"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="48"
        strokeDashoffset="48"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
      />
    </svg>
  )
}

// Error X animation
function ErrorCross() {
  return (
    <svg className="w-10 h-10 text-red-500" viewBox="0 0 52 52">
      <circle
        className="animate-[stroke_0.6s_ease-out_forwards]"
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="157"
        strokeDashoffset="157"
      />
      <path
        className="animate-[cross_0.4s_0.4s_ease-out_forwards]"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M16 16 36 36M36 16 16 36"
        strokeDasharray="57"
        strokeDashoffset="57"
      />
    </svg>
  )
}

// Spinner that matches Notion's style
function NotionSpinner() {
  return (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-[2.5px] border-muted-foreground/10" />
      <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-foreground/70 animate-spin" />
    </div>
  )
}

// Progress bar for loading state
function ProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-foreground/60 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 90)}%` }}
      />
    </div>
  )
}

function NotionCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [countdown, setCountdown] = useState(3)
  const hasCalled = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleError = useCallback(
    (message: string) => {
      setErrorMessage(message)
      setStatus('error')
    },
    []
  )

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        handleError(
          searchParams.get('error_description') || t('notionCallback.authCancelled')
        )
        return
      }

      if (!code) {
        handleError(t('notionCallback.noCode'))
        return
      }

      try {
        await integrationService.handleNotionCallback(code)
        setStatus('success')
      } catch (err: any) {
        console.error('Failed to handle Notion callback:', err)
        handleError(
          err.response?.data?.error || t('notionCallback.failedDesc')
        )
      }
    }

    handleCallback()
  }, [searchParams, t, handleError])

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status !== 'success') return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (status === 'success' && countdown === 0) {
      router.push('/settings')
    }
  }, [status, countdown, router])

  const opacityClass = mounted ? 'opacity-100' : 'opacity-0'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <FloatingParticles />

      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-foreground/[0.02] to-transparent rounded-full blur-3xl" />
      </div>

      <div
        className={`relative z-10 max-w-sm w-full mx-4 transition-all duration-700 ease-out ${opacityClass}`}
      >
        {/* Main card */}
        <div className="relative p-10 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/5">
          {/* Status icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Notion logo */}
              <div
                className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  status === 'loading'
                    ? 'bg-foreground/[0.03]'
                    : status === 'success'
                      ? 'bg-emerald-500/[0.06]'
                      : 'bg-red-500/[0.06]'
                }`}
              >
                {status === 'loading' && (
                  <>
                    <PulseRing color="currentColor" />
                    <NotionLogo className="w-10 h-10 animate-pulse" />
                  </>
                )}
                {status === 'success' && <SuccessCheckmark />}
                {status === 'error' && <ErrorCross />}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            {status === 'loading' && (
              <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {t('notionCallback.connecting')}
                  <LoadingDots />
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('notionCallback.connectingDesc')}
                </p>
                <div className="pt-2 flex justify-center">
                  <ProgressBar />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {t('notionCallback.success')}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('notionCallback.successDesc')}
                </p>
                {/* Countdown indicator */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray={`${(countdown / 3) * 88} 88`}
                        className="text-emerald-500 transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {countdown}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">s</span>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {t('notionCallback.failed')}
                </h1>
                <div className="p-3 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                  <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => router.push('/settings')}
                    className="w-full h-10 font-medium rounded-xl"
                    variant="default"
                  >
                    {t('notionCallback.returnToSettings')}
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full h-10 font-medium rounded-xl"
                    variant="ghost"
                  >
                    {t('notionCallback.retryConnect')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-center mt-6 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
            <NotionLogo className="w-3.5 h-3.5" />
            <span>Notion</span>
            <span className="mx-1">×</span>
            <span className="font-medium">AI Chat Note</span>
          </div>
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          100% {
            transform: translateY(-30px) translateX(15px);
          }
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes checkmark {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes cross {
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <NotionSpinner />
      </div>
    </div>
  )
}

export default function NotionCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotionCallbackContent />
    </Suspense>
  )
}
