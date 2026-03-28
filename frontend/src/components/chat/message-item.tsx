'use client'

import { useState } from 'react'
import type { Message } from '@/types'
import { cn, formatMessageTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, Check, Loader2, User, Bot, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRegenerateMessage } from '@/hooks'
import { MarkdownContent } from './markdown-content'
import { useTranslations } from '@/i18n'

interface ModelInfo {
  providerName: string
  displayName: string
  modelId: string
}

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  isThinking?: boolean
  isTimeout?: boolean
  isCancelled?: boolean
  isLastAssistant?: boolean
  onRetry?: () => void
  modelsMap?: Map<string, ModelInfo>
}

export function MessageItem({
  message,
  isStreaming,
  isThinking,
  isTimeout,
  isCancelled,
  isLastAssistant,
  onRetry,
  modelsMap,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const { regenerate, isPending: isRegenerating } = useRegenerateMessage()
  const t = useTranslations()

  const isUser = message.role === 'user'

  // Get model info for attribution display (assistant messages only)
  const modelAttribution = !isUser && message.provider_model_id && modelsMap
    ? modelsMap.get(message.provider_model_id)
    : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    toast.success(t('chat.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    regenerate({
      conversationId: message.conversation_id,
      messageId: message.id,
    })
  }

  return (
    <div
      className={cn(
        'group flex gap-3 mb-4',
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

      {/* Content Area */}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'flex-1 min-w-0')}>
        {/* Header: Name + Time - for user, show on right; for AI, show on left */}
        <div
          className={cn(
            'flex items-center gap-2 mb-1',
            isUser ? 'flex-row' : 'flex-row'
          )}
        >
          {/* User: Name first, then time; AI: Name first, then time, then model */}
          {isUser ? (
            <>
              <span className="text-[11px] text-muted-foreground/50">
                {formatMessageTime(message.created_at)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('common.me')}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                {t('common.ai')}
              </span>
              {!isStreaming && (
                <span className="text-[11px] text-muted-foreground/50">
                  {formatMessageTime(message.created_at)}
                </span>
              )}
              {modelAttribution && (
                <span className="text-[11px] text-muted-foreground/40">
                  · {modelAttribution.providerName}/{modelAttribution.displayName}
                </span>
              )}
            </>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 transition-all duration-150',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md max-w-[85%]'
              : 'bg-muted rounded-tl-md border border-border/50 max-w-full'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : isTimeout ? (
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
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '0ms', animationDuration: '600ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '120ms', animationDuration: '600ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: '240ms', animationDuration: '600ms' }}
                />
              </div>
              <span className="text-xs">{t('chat.thinking')}</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed min-h-[20px]">
              {message.content && <MarkdownContent content={message.content} />}
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 rounded-full align-middle" />
              )}
              {(isCancelled || message.canceled) && !isUser && (
                <div className={cn('text-xs mt-2', message.content ? 'pt-2 border-t border-border/50' : '', 'text-amber-500/80')}>
                  {t('chat.replyCancelled')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons and Cancel Status */}
        <div className={cn('flex items-center', isUser ? 'justify-end' : 'justify-start', 'gap-2 mt-1.5')}>
          {!isStreaming && !isTimeout && (
            <div
              className={cn(
                'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                onClick={handleCopy}
                title={t('common.copy')}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>

              {!isUser && isLastAssistant && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  title={t('common.regenerate')}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          )}
          
          {/* Canceled status indicator - now shown inside the bubble */}
        </div>
      </div>
    </div>
  )
}
