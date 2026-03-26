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
  useUpdateConversationModel,
} from '@/hooks'
import { MessageList, MessageInput, ModelSelector, SaveNoteDialog, SaveNoteButton, ChatStartPage, ModelSwitchConfirmDialog } from '@/components/chat'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from '@/i18n'
import type { Message, ProviderModel } from '@/types'

export default function ChatPage() {
  const t = useTranslations()
  const {
    currentConversationId,
    setCurrentConversation,
    isPendingNewChat,
    setIsPendingNewChat,
    streamingStates,
    updateStreamingState,
    clearStreamingState,
    getStreamingState,
    streamingConversationIds,
  } = useChatStore()
  const { data: conversations } = useConversations()
  const { data: providers } = useProviders()
  const createConversation = useCreateConversation()
  const markAsSaved = useMarkAsSaved()
  const generateTitle = useGenerateTitle()
  const updateConversationModel = useUpdateConversationModel()
  const queryClient = useQueryClient()
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [saveNoteDialogOpen, setSaveNoteDialogOpen] = useState(false)
  const [modelSwitchDialogOpen, setModelSwitchDialogOpen] = useState(false)
  const [pendingModelId, setPendingModelId] = useState<string | null>(null)
  const [pendingModelName, setPendingModelName] = useState<string>('')

  // Get current conversation's streaming state (with defaults)
  const currentStreamingState = useMemo(() => {
    if (!currentConversationId) return null
    return getStreamingState(currentConversationId)
  }, [currentConversationId, getStreamingState, streamingStates])

  // Check if current conversation is streaming
  const isCurrentConversationStreaming = useMemo(() => {
    if (!currentConversationId) return false
    return streamingConversationIds.has(currentConversationId)
  }, [currentConversationId, streamingConversationIds])

  // Track the actual conversation ID being streamed (to avoid stale closure issues)
  const streamingConversationIdRef = useRef<number | null>(null)

  // Track if we need to generate title after message ends (for new conversations)
  const needGenerateTitleRef = useRef<boolean>(false)

  const { streamMessage, isStreaming } = useStreamChat({
    conversationId: currentConversationId!,
    onMessageChunk: (content) => {
      // Get the conversation ID being streamed
      const convId = streamingConversationIdRef.current
      if (!convId) return

      // Get current state for this conversation
      const currentState = getStreamingState(convId)

      // Update streaming content for the specific conversation
      updateStreamingState(convId, {
        // Clear thinking state when we receive actual content
        isThinking: content ? false : currentState?.isThinking,
        content: (currentState?.content || '') + content,
      })
    },
    onMessageEnd: (message) => {
      // Use the conversation ID from the message or the ref to avoid stale closure
      const conversationIdToInvalidate = message?.conversation_id || streamingConversationIdRef.current

      // Clear streaming state for the specific conversation
      if (conversationIdToInvalidate) {
        clearStreamingState(conversationIdToInvalidate)

        // Invalidate messages to refetch
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
      const convId = streamingConversationIdRef.current
      if (convId) {
        clearStreamingState(convId)
      }
      streamingConversationIdRef.current = null
      const errorMsg = error.message || t('chat.sendFailed')

      // Check if it's a timeout error - set timeout state for the streaming conversation
      if (error.name === 'AbortError' || errorMsg.includes('超时') || errorMsg.includes('timeout')) {
        if (convId) {
          updateStreamingState(convId, { isTimeout: true, isThinking: false })
        }
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

    // If current_provider_model_id is null but model_id exists, model is deleted
    const isDeleted = currentConversation.current_provider_model_id === null && !!currentConversation.model_id
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
    // Only update selectedModelId if:
    // 1. No conversation is selected (new chat state)
    // 2. Conversation changed and has a valid model (not deleted)
    if (!currentConversationId) {
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
    } else if (currentConversation?.current_provider_model_id) {
      // Conversation has a valid model, sync it it selectedModelId
      setSelectedModelId(currentConversation.current_provider_model_id)
    }
    // Note: When model is deleted (current_provider_model_id is null), don't auto-select
    // User needs to manually select a new model
  }, [currentConversationId, currentConversation?.current_provider_model_id, providers])

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Check if model is deleted
      if (modelStatus.isDeleted) {
        toast.error(t('provider.modelDeletedDesc'))
        return
      }

      // Generate a new request ID for this message
      const requestId = crypto.randomUUID()

      // Check if we need to create conversation first (from pending state or no conversation)
      const needCreateConversation = isPendingNewChat || !currentConversationId

      if (needCreateConversation) {
        if (!selectedModelId) {
          toast.error(t('chat.configureProviderFirst'))
          return
        }

        // Clear pending state
        setIsPendingNewChat(false)

        // Create new conversation first
        const conv = await createConversation.mutateAsync({ provider_model_id: selectedModelId })
        setCurrentConversation(conv.id)

        // Add optimistic user message and set thinking state for the new conversation
        const optimisticUserMessage: Message = {
          id: Date.now(),
          conversation_id: conv.id,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        updateStreamingState(conv.id, {
          optimisticMessages: [optimisticUserMessage],
          isThinking: true,
          isTimeout: false,
          lastUserMessage: content,
          requestId,
        })

        // Track the conversation ID for streaming (to avoid stale closure in onMessageEnd)
        streamingConversationIdRef.current = conv.id

        // Invalidate conversations list to update sidebar
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        })

        // Then send message to new conversation
        streamMessage(content, conv.id, requestId)

        // Mark that we need to generate title after message ends
        needGenerateTitleRef.current = true
      } else {
        // Add optimistic user message and set thinking state for existing conversation
        const optimisticUserMessage: Message = {
          id: Date.now(),
          conversation_id: currentConversationId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }

        // Get existing optimistic messages for this conversation
        const existingState = getStreamingState(currentConversationId)
        const existingOptimisticMessages = existingState?.optimisticMessages || []

        updateStreamingState(currentConversationId, {
          optimisticMessages: [...existingOptimisticMessages, optimisticUserMessage],
          isThinking: true,
          isTimeout: false,
          lastUserMessage: content,
          requestId,
          content: '', // Reset content for new message
        })

        // Track the conversation ID for streaming (to avoid stale closure in onMessageEnd)
        streamingConversationIdRef.current = currentConversationId

        streamMessage(content, currentConversationId, requestId)
      }
    },
    [currentConversationId, selectedModelId, createConversation, setCurrentConversation, streamMessage, modelStatus.isDeleted, isPendingNewChat, setIsPendingNewChat, updateStreamingState, getStreamingState, t]
  )

  // Retry handler - resend the last user message with the same request_id
  const handleRetry = useCallback(() => {
    if (!currentConversationId || !currentStreamingState?.lastUserMessage || !currentStreamingState?.requestId) return

    updateStreamingState(currentConversationId, {
      isTimeout: false,
      isThinking: true,
      content: '',
    })

    // Reuse the same request_id for deduplication
    streamMessage(currentStreamingState.lastUserMessage, currentConversationId, currentStreamingState.requestId)
  }, [currentConversationId, currentStreamingState, streamMessage, updateStreamingState])

  const handleSaveNote = () => {
    setSaveNoteDialogOpen(true)
  }

  const handleSaveNoteSuccess = () => {
    if (currentConversationId) {
      markAsSaved.mutate(currentConversationId)
    }
  }

  // Compute all enabled models with their provider info for model name lookup
  const allModelsMap = useMemo(() => {
    const map = new Map<string, { model: ProviderModel; providerName: string }>()
    if (providers) {
      for (const provider of providers) {
        for (const model of provider.models) {
          if (model.enabled) {
            map.set(model.id, { model, providerName: provider.name })
          }
        }
      }
    }
    return map
  }, [providers])

    // Handle model change - show confirmation dialog for existing conversations
  const handleModelChange = useCallback((newModelId: string) => {
    // For new conversations (pending new chat) or when model is deleted, switch directly without confirmation
    if (isPendingNewChat || modelStatus.isDeleted) {
      setSelectedModelId(newModelId)
      return
    }

    // For existing conversations with a different model, show confirmation dialog
    if (currentConversationId && currentConversation?.current_provider_model_id !== newModelId) {
      const modelInfo = allModelsMap.get(newModelId)
      const modelName = modelInfo
        ? `${modelInfo.providerName}/${modelInfo.model.display_name || modelInfo.model.model_id}`
        : newModelId

      setPendingModelId(newModelId)
      setPendingModelName(modelName)
      setModelSwitchDialogOpen(true)
    }
  }, [isPendingNewChat, modelStatus.isDeleted, currentConversationId, currentConversation, allModelsMap])

  // Confirm model switch
  const handleConfirmModelSwitch = useCallback(async () => {
    if (!pendingModelId || !currentConversationId) return

    const modelInfo = allModelsMap.get(pendingModelId)
    try {
      await updateConversationModel.mutateAsync({
        id: currentConversationId,
        data: {
          provider_model_id: pendingModelId,
          model_id: modelInfo?.model.model_id,
        },
      })
      setSelectedModelId(pendingModelId)
      setModelSwitchDialogOpen(false)
      setPendingModelId(null)
      toast.success(t('chat.switchModelSuccess'))
    } catch {
      toast.error(t('chat.switchModelFailed'))
    }
  }, [pendingModelId, currentConversationId, allModelsMap, updateConversationModel, t])

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
                onChange={handleModelChange}
                isNewChat={isPendingNewChat}
              />
            </div>
            {/* Start Page */}
            <ChatStartPage
              onSend={handleSendMessage}
              isLoading={isCurrentConversationStreaming}
              disabled={!selectedModelId}
            />
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
              <ModelSelector
                value={selectedModelId}
                onChange={handleModelChange}
                isModelDeleted={modelStatus.isDeleted}
                deletedModelId={modelStatus.deletedModelId}
                isNewChat={false}
              />
              <SaveNoteButton
                onClick={handleSaveNote}
                disabled={!currentConversationId}
              />
            </div>

            {/* Messages */}
            <MessageList
              streamingContent={isCurrentConversationStreaming && currentStreamingState ? currentStreamingState.content : undefined}
              optimisticMessages={currentStreamingState?.optimisticMessages || []}
              isThinking={currentStreamingState?.isThinking && !currentStreamingState?.content}
              isTimeout={currentStreamingState?.isTimeout}
              onRetry={handleRetry}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              isLoading={isCurrentConversationStreaming}
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

      {/* Model Switch Confirmation Dialog */}
      <ModelSwitchConfirmDialog
        open={modelSwitchDialogOpen}
        onOpenChange={setModelSwitchDialogOpen}
        modelName={pendingModelName}
        onConfirm={handleConfirmModelSwitch}
        isLoading={updateConversationModel.isPending}
      />
    </div>
  )
}
