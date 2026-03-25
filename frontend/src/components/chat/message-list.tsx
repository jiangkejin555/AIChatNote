'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useMessages, useProviders } from '@/hooks'
import { useChatStore } from '@/stores'
import { MessageItem } from './message-item'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'
import type { Message } from '@/types'

interface ModelInfo {
  providerName: string
  displayName: string
  modelId: string
}

interface MessageListProps {
  streamingContent?: string
  optimisticMessages?: Message[]
  isThinking?: boolean
  isTimeout?: boolean
  onRetry?: () => void
  lastUserMessage?: string
}

export function MessageList({
  streamingContent,
  optimisticMessages = [],
  isThinking,
  isTimeout,
  onRetry,
}: MessageListProps) {
  const t = useTranslations()
  const { currentConversationId } = useChatStore()
  const { data: messages, isLoading } = useMessages(currentConversationId)
  const { data: providers } = useProviders()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Build a map of provider_model_id -> model info for displaying model attribution
  const modelsMap = useMemo(() => {
    const map = new Map<string, ModelInfo>()
    if (providers) {
      for (const provider of providers) {
        for (const model of provider.models) {
          map.set(model.id, {
            providerName: provider.name,
            displayName: model.display_name || model.model_id,
            modelId: model.model_id,
          })
        }
      }
    }
    return map
  }, [providers])

  // Detect if user scrolled to bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setShouldAutoScroll(isAtBottom)
  }, [])

  // Scroll to bottom when new content arrives (only if shouldAutoScroll)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, optimisticMessages, shouldAutoScroll])

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">{t('chat.selectConversation')}</p>
          <p className="text-sm">{t('chat.conversationHistoryHint')}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Combine server messages with optimistic messages
  const allMessages = [...(messages || []), ...optimisticMessages]

  return (
    <div className="flex-1 overflow-auto p-4" ref={scrollContainerRef} onScroll={handleScroll}>
      <div className="max-w-3xl mx-auto space-y-4">
        {allMessages.map((message) => (
          <MessageItem key={message.id} message={message} modelsMap={modelsMap} />
        ))}

        {streamingContent && (
          <MessageItem
            message={{
              id: -1,
              conversation_id: currentConversationId,
              role: 'assistant',
              content: streamingContent,
              created_at: new Date().toISOString(),
            }}
            isStreaming
            modelsMap={modelsMap}
          />
        )}

        {/* Thinking state - show when waiting for response */}
        {isThinking && !streamingContent && !isTimeout && (
          <MessageItem
            message={{
              id: -2,
              conversation_id: currentConversationId,
              role: 'assistant',
              content: '',
              created_at: new Date().toISOString(),
            }}
            isThinking
            modelsMap={modelsMap}
          />
        )}

        {/* Timeout state - show when request timed out */}
        {isTimeout && (
          <MessageItem
            message={{
              id: -3,
              conversation_id: currentConversationId,
              role: 'assistant',
              content: '',
              created_at: new Date().toISOString(),
            }}
            isTimeout
            onRetry={onRetry}
            modelsMap={modelsMap}
          />
        )}

        {/* Sentinel element for scroll-to-bottom */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
