'use client'

import { useState } from 'react'
import type { Message } from '@/types'
import { cn, formatMessageTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, Check, Loader2, User, Bot, Clock, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRegenerateMessage } from '@/hooks'
import { MarkdownContent } from './markdown-content'
import { useTranslations } from '@/i18n'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  isThinking?: boolean
  isTimeout?: boolean
  onRetry?: () => void
}

export function MessageItem({ message, isStreaming, isThinking, isTimeout, onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const regenerate = useRegenerateMessage()
  const t = useTranslations()

  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    toast.success(t('chat.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    regenerate.mutate({
      conversationId: message.conversation_id,
      messageId: message.id,
    })
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary/80 text-primary-foreground'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Role Label */}
        <span
          className={cn(
            'text-xs text-muted-foreground mb-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {isUser ? t('common.me') : t('common.ai')}
        </span>

        {/* Message Bubble - Full width for AI, auto for user */}
        <div
          className={cn(
            isUser ? 'flex justify-end' : ''
          )}
        >
          <div
            className={cn(
              'rounded-2xl px-4 py-3',
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm max-w-[85%]'
                : 'bg-muted rounded-tl-sm border border-border/50 w-full'
            )}
          >
            {isUser ? (
              // User message: plain text with whitespace preservation
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            ) : isTimeout ? (
              // Timeout state: show error and retry button
              <div className="text-sm">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{t('chat.timeout')}</span>
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-8 gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t('chat.retry')}
                  </Button>
                )}
              </div>
            ) : isThinking ? (
              // Thinking state: show animated text
              <div className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="animate-pulse">{t('chat.thinking')}</span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              </div>
            ) : (
              // AI message: rendered markdown, full width
              <div className="text-sm leading-relaxed">
                <MarkdownContent content={message.content} />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        {!isStreaming && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1 px-1',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <Clock className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[11px] text-muted-foreground/60">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {!isStreaming && (
          <div
            className={cn(
              'flex gap-1 mt-1.5 opacity-0 hover:opacity-100 transition-opacity',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              title={t('common.copy')}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>

            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleRegenerate}
                disabled={regenerate.isPending}
                title={t('common.regenerate')}
              >
                {regenerate.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
