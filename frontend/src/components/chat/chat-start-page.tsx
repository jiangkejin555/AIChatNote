'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square, Sparkles } from 'lucide-react'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

interface ChatStartPageProps {
  onSend: (content: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
}

const suggestions = [
  '帮我写一篇关于人工智能的笔记',
  '解释什么是机器学习',
  '如何高效管理我的时间？',
  '给我一些创意写作的灵感',
]

export function ChatStartPage({
  onSend,
  onStop,
  isLoading,
  disabled
}: ChatStartPageProps) {
  const [content, setContent] = useState('')
  const t = useTranslations()

  const handleSubmit = () => {
    if (!content.trim() || isLoading || disabled) return
    onSend(content.trim())
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Subtle dot pattern */}
        <div
          className={cn(
            'absolute inset-0 opacity-[0.03]',
            'dark:opacity-[0.02]'
          )}
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      {/* Main content - centered */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Welcome Message */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>{t('chat.aiAssistantReady')}</span>
          </div>

          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            {t('chat.welcomeMessage')}
          </h2>
          <p className="text-base text-muted-foreground max-w-md mx-auto mt-2">
            {t('chat.startChattingDesc')}
          </p>
        </div>

        {/* Input Area */}
        <div className="w-full flex gap-3 items-center">
          <div className="flex-1 relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.inputPlaceholder')}
              disabled={disabled}
              className={cn(
                'min-h-[52px] max-h-40 resize-none px-4 py-[14px]',
                'leading-[24px]',
                'bg-background/80 backdrop-blur-sm',
                'border border-border/50 rounded-2xl',
                'focus:border-primary/30 focus:ring-2 focus:ring-primary/20',
                'transition-all duration-200',
                'placeholder:text-muted-foreground/50'
              )}
              rows={1}
            />
          </div>
          <Button
            onClick={isLoading ? onStop : handleSubmit}
            disabled={!isLoading && (!content.trim() || disabled)}
            className={cn(
              'h-[52px] w-[52px] shrink-0 rounded-2xl',
              'transition-all duration-200',
              'hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
          >
            {isLoading ? (
              <Square className="h-5 w-5 fill-current" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setContent(suggestion)}
              className={cn(
                'group relative px-4 py-2 rounded-xl text-sm transition-all duration-200',
                'bg-muted/50 hover:bg-muted border border-border/30 hover:border-border/50',
                'hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0',
                'text-muted-foreground hover:text-foreground'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="relative z-10">{suggestion}</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-muted-foreground/40 text-center mt-4">
          {t('chat.sendHint')}
        </p>
      </div>
    </div>
  )
}
