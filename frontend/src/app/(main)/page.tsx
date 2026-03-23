'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChatStore, useAuthStore } from '@/stores'
import {
  useConversations,
  useCreateConversation,
  useMessages,
  useStreamChat,
  useMarkAsSaved,
} from '@/hooks'
import { ConversationList, MessageList, MessageInput, ModelSelector, SaveNoteDialog, SaveNoteButton } from '@/components/chat'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from '@/i18n'
import type { Message } from '@/types'

export default function ChatPage() {
  const t = useTranslations()
  const { currentConversationId, setCurrentConversation } = useChatStore()
  const { isAuthenticated } = useAuthStore()
  const { data: conversations } = useConversations()
  const createConversation = useCreateConversation()
  const markAsSaved = useMarkAsSaved()
  const queryClient = useQueryClient()
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [streamingContent, setStreamingContent] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [saveNoteDialogOpen, setSaveNoteDialogOpen] = useState(false)

  const { streamMessage, isStreaming } = useStreamChat({
    conversationId: currentConversationId!,
    onMessageChunk: (content) => {
      setStreamingContent((prev) => prev + content)
    },
    onMessageEnd: (message) => {
      // Clear streaming content and optimistic messages
      setStreamingContent('')
      setOptimisticMessages([])
      // Invalidate messages to refetch
      if (currentConversationId) {
        queryClient.invalidateQueries({
          queryKey: ['conversations', currentConversationId, 'messages'],
        })
      }
    },
    onError: (error) => {
      setStreamingContent('')
      setOptimisticMessages([])
      toast.error(error.message || t('chat.sendFailed'))
    },
  })

  // Set initial conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      setCurrentConversation(conversations[0].id)
    }
  }, [conversations, currentConversationId, setCurrentConversation])

  // Set initial model from default
  useEffect(() => {
    if (conversations && currentConversationId) {
      const conv = conversations.find((c) => c.id === currentConversationId)
      if (conv) {
        setSelectedModelId(conv.provider_model_id || String(conv.model_id))
      }
    }
  }, [conversations, currentConversationId])

  const handleNewConversation = async () => {
    if (!selectedModelId) {
      toast.error(t('chat.configureProviderFirst'))
      return
    }
    createConversation.mutate({ provider_model_id: selectedModelId })
  }

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add optimistic user message
      const optimisticUserMessage: Message = {
        id: Date.now(),
        conversation_id: currentConversationId || 0,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setOptimisticMessages((prev) => [...prev, optimisticUserMessage])

      if (!currentConversationId) {
        // Create new conversation first
        if (!selectedModelId) {
          toast.error(t('chat.configureProviderFirst'))
          setOptimisticMessages([])
          return
        }
        const conv = await createConversation.mutateAsync({ provider_model_id: selectedModelId })
        setCurrentConversation(conv.id)

        // Then send message to new conversation
        setStreamingContent('')
        streamMessage(content)
      } else {
        setStreamingContent('')
        streamMessage(content)
      }
    },
    [currentConversationId, selectedModelId, createConversation, setCurrentConversation, streamMessage, t]
  )

  const handleSaveNote = () => {
    setSaveNoteDialogOpen(true)
  }

  const handleSaveNoteSuccess = () => {
    if (currentConversationId) {
      markAsSaved.mutate(currentConversationId)
    }
  }

  return (
    <div className="h-full flex relative">
      {/* Left Sidebar - Conversation List */}
      <div className="w-64 border-r flex flex-col bg-muted h-full min-h-0">
        <div className="p-3 shrink-0">
          <Button onClick={handleNewConversation} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('chat.newConversation')}
          </Button>
        </div>
        <Separator className="shrink-0" />
        <div className="flex-1 min-h-0">
          <ConversationList />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
          <ModelSelector value={selectedModelId} onChange={setSelectedModelId} />
          <SaveNoteButton
            onClick={handleSaveNote}
            disabled={!currentConversationId}
          />
        </div>

        {/* Messages */}
        <MessageList
          streamingContent={isStreaming ? streamingContent : undefined}
          optimisticMessages={optimisticMessages}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          isLoading={isStreaming}
          disabled={!selectedModelId}
        />
      </div>

      {/* Save Note Dialog */}
      <SaveNoteDialog
        open={saveNoteDialogOpen}
        onOpenChange={setSaveNoteDialogOpen}
        conversationId={currentConversationId}
        onSuccess={handleSaveNoteSuccess}
      />
    </div>
  )
}
