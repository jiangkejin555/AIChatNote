'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useChatStore } from '@/stores'
import {
  useConversations,
  useCreateConversation,
  useStreamChat,
  useMarkAsSaved,
  useProviders,
  useGenerateTitle,
} from '@/hooks'
import { MessageList, MessageInput, ModelSelector, SaveNoteDialog, SaveNoteButton, ChatStartPage } from '@/components/chat'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from '@/i18n'
import type { Message } from '@/types'

export default function ChatPage() {
  const t = useTranslations()
  const { currentConversationId, setCurrentConversation, isPendingNewChat, setIsPendingNewChat } = useChatStore()
  const { data: conversations } = useConversations()
  const { data: providers } = useProviders()
  const createConversation = useCreateConversation()
  const markAsSaved = useMarkAsSaved()
  const generateTitle = useGenerateTitle()
  const queryClient = useQueryClient()
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [streamingContent, setStreamingContent] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [saveNoteDialogOpen, setSaveNoteDialogOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isTimeout, setIsTimeout] = useState(false)
  const [lastUserMessage, setLastUserMessage] = useState<string>('')

  // Track the actual conversation ID being streamed (to avoid stale closure issues)
  const streamingConversationIdRef = useRef<number | null>(null)

  // Track if we need to generate title after message ends (for new conversations)
  const needGenerateTitleRef = useRef<boolean>(false)

  // Track the current request ID for deduplication and retry
  const currentRequestIdRef = useRef<string | null>(null)

  const { streamMessage, isStreaming } = useStreamChat({
    conversationId: currentConversationId!,
    onMessageChunk: (content) => {
      // Only clear thinking state when we receive actual content
      if (content) {
        setIsThinking(false)
      }
      setStreamingContent((prev) => prev + content)
    },
    onMessageEnd: (message) => {
      // Clear streaming content, optimistic messages, and thinking state
      setStreamingContent('')
      setOptimisticMessages([])
      setIsThinking(false)
      setIsTimeout(false)

      // Use the conversation ID from the message or the ref to avoid stale closure
      const conversationIdToInvalidate = message?.conversation_id || streamingConversationIdRef.current

      // Invalidate messages to refetch
      if (conversationIdToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: ['conversations', conversationIdToInvalidate, 'messages'],
        })
      }

      // Also invalidate conversations list to update sidebar
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      // Generate title for new conversations (after message is saved to DB)
      if (needGenerateTitleRef.current && conversationIdToInvalidate) {
        generateTitle.mutate(conversationIdToInvalidate)
        needGenerateTitleRef.current = false
      }

      // Clear the ref
      streamingConversationIdRef.current = null
    },
    onError: (error) => {
      setStreamingContent('')
      setOptimisticMessages([])
      setIsThinking(false)
      streamingConversationIdRef.current = null
      const errorMsg = error.message || t('chat.sendFailed')

      // Check if it's a timeout error
      if (error.name === 'AbortError' || errorMsg.includes('超时') || errorMsg.includes('timeout')) {
        setIsTimeout(true)
      } else {
        // Check for model deleted error (backend returns 'model_deleted' code in response)
        const isModelDeleted = (error as any).code === 'model_deleted' ||
          errorMsg.includes('已删除') ||
          errorMsg.includes('deleted')
        if (isModelDeleted) {
          toast.error(t('provider.modelDeletedDesc'))
        } else {
          toast.error(errorMsg)
        }
      }
    },
  })

  // Get current conversation and check if model is deleted
  const currentConversation = useMemo(() => {
    if (conversations && currentConversationId) {
      return conversations.find((c) => c.id === currentConversationId)
    }
    return null
  }, [conversations, currentConversationId])

  // Check if the model used by current conversation is deleted
  const modelStatus = useMemo(() => {
    if (!currentConversation) {
      return { isDeleted: false, deletedModelId: undefined }
    }

    // If provider_model_id is null but model_id exists, model is deleted
    const isDeleted = currentConversation.provider_model_id === null && !!currentConversation.model_id
    const deletedModelId = isDeleted ? currentConversation.model_id : undefined

    return { isDeleted, deletedModelId }
  }, [currentConversation])

  // Set initial conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      // Only set if the conversation still exists (handles race condition during delete)
      setCurrentConversation(conversations[0].id)
    } else if (conversations && conversations.length === 0 && currentConversationId) {
      // Clear current conversation if no conversations exist (all deleted)
      setCurrentConversation(null)
    }
  }, [conversations, currentConversationId, setCurrentConversation])

  // Set initial model from conversation or default
  useEffect(() => {
    if (modelStatus.isDeleted) {
      // Don't auto-select a model if current model is deleted
      // User needs to manually select a new model
      setSelectedModelId(undefined)
    } else if (currentConversation?.provider_model_id) {
      setSelectedModelId(currentConversation.provider_model_id)
    } else {
      // For new conversation, find default model from providers
      if (providers) {
        for (const provider of providers) {
          const defaultModel = provider.models.find(m => m.is_default && m.enabled)
          if (defaultModel) {
            setSelectedModelId(defaultModel.id)
            break
          }
        }
      }
    }
  }, [currentConversation, modelStatus.isDeleted, providers])

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Check if model is deleted
      if (modelStatus.isDeleted) {
        toast.error(t('provider.modelDeletedDesc'))
        return
      }

      // Reset timeout state and save message for potential retry
      setIsTimeout(false)
      setLastUserMessage(content)

      // Generate a new request ID for this message
      const requestId = crypto.randomUUID()
      currentRequestIdRef.current = requestId

      // Check if we need to create conversation first (from pending state or no conversation)
      const needCreateConversation = isPendingNewChat || !currentConversationId

      if (needCreateConversation) {
        if (!selectedModelId) {
          toast.error(t('chat.configureProviderFirst'))
          return
        }

        // Clear pending state
        setIsPendingNewChat(false)

        // Add optimistic user message
        const optimisticUserMessage: Message = {
          id: Date.now(),
          conversation_id: 0,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        setOptimisticMessages((prev) => [...prev, optimisticUserMessage])

        // Set thinking state immediately
        setIsThinking(true)

        // Create new conversation first
        const conv = await createConversation.mutateAsync({ provider_model_id: selectedModelId })
        setCurrentConversation(conv.id)

        // Track the conversation ID for streaming (to avoid stale closure in onMessageEnd)
        streamingConversationIdRef.current = conv.id

        // Invalidate conversations list to update sidebar
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        })

        // Then send message to new conversation
        setStreamingContent('')
        streamMessage(content, conv.id, requestId)

        // Mark that we need to generate title after message ends
        needGenerateTitleRef.current = true
      } else {
        // Add optimistic user message
        const optimisticUserMessage: Message = {
          id: Date.now(),
          conversation_id: currentConversationId || 0,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        setOptimisticMessages((prev) => [...prev, optimisticUserMessage])

        // Track the conversation ID for streaming (to avoid stale closure in onMessageEnd)
        streamingConversationIdRef.current = currentConversationId

        // Set thinking state immediately
        setIsThinking(true)

        setStreamingContent('')
        streamMessage(content, currentConversationId!, requestId)
      }
    },
    [currentConversationId, selectedModelId, createConversation, setCurrentConversation, streamMessage, modelStatus.isDeleted, isPendingNewChat, setIsPendingNewChat, t]
  )

  // Retry handler - resend the last user message with the same request_id
  const handleRetry = useCallback(() => {
    if (lastUserMessage && currentConversationId && currentRequestIdRef.current) {
      setIsTimeout(false)
      setIsThinking(true)
      setStreamingContent('')
      // Reuse the same request_id for deduplication
      streamMessage(lastUserMessage, currentConversationId, currentRequestIdRef.current)
    }
  }, [lastUserMessage, currentConversationId, streamMessage])

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
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Show Start Page when in pending new chat state */}
        {isPendingNewChat ? (
          <>
            {/* Header - same layout as chat page header */}
            <div className="h-12 border-b flex items-center px-4 shrink-0">
              <ModelSelector
                value={selectedModelId}
                onChange={setSelectedModelId}
              />
            </div>
            {/* Start Page */}
            <ChatStartPage
              onSend={handleSendMessage}
              isLoading={isStreaming}
              disabled={!selectedModelId}
            />
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
              <ModelSelector
                value={selectedModelId}
                onChange={setSelectedModelId}
                isModelDeleted={modelStatus.isDeleted}
                deletedModelId={modelStatus.deletedModelId}
              />
              <SaveNoteButton
                onClick={handleSaveNote}
                disabled={!currentConversationId}
              />
            </div>

            {/* Messages */}
            <MessageList
              streamingContent={isStreaming ? streamingContent : undefined}
              optimisticMessages={optimisticMessages}
              isThinking={isThinking && !streamingContent}
              isTimeout={isTimeout}
              onRetry={handleRetry}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              isLoading={isStreaming}
              disabled={modelStatus.isDeleted || !selectedModelId}
            />
          </>
        )}
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
