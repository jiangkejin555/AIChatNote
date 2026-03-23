'use client'

import { useRef, useEffect } from 'react'
import { useMessages } from '@/hooks'
import { useChatStore } from '@/stores'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageItem } from './message-item'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'
import type { Message } from '@/types'

interface MessageListProps {
  streamingContent?: string
  optimisticMessages?: Message[]
}

export function MessageList({ streamingContent, optimisticMessages = [] }: MessageListProps) {
  const t = useTranslations()
  const { currentConversationId } = useChatStore()
  const { data: messages, isLoading } = useMessages(currentConversationId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent, optimisticMessages])

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
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="max-w-3xl mx-auto space-y-4">
        {allMessages.map((message) => (
          <MessageItem key={message.id} message={message} />
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
          />
        )}
      </div>
    </ScrollArea>
  )
}
