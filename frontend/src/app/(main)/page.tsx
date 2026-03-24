'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useChatStore, useAuthStore } from '@/stores'
import {
  useConversations,
  useCreateConversation,
  useMessages,
  useStreamChat,
  useMarkAsSaved,
  useProviders,
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
  const { data: providers } = useProviders()
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
      const errorMsg = error.message || t('chat.sendFailed')
      // Check for model deleted error (backend returns 'model_deleted' code in response)
      const isModelDeleted = (error as any).code === 'model_deleted' ||
        errorMsg.includes('已删除') ||
        errorMsg.includes('deleted')
      if (isModelDeleted) {
        toast.error(t('provider.modelDeletedDesc'))
      } else {
        toast.error(errorMsg)
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
      setCurrentConversation(conversations[0].id)
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

  const handleNewConversation = async () => {
    // Find a valid model for new conversation
    let modelIdToUse = selectedModelId
    if (!modelIdToUse && providers) {
      for (const provider of providers) {
        const defaultModel = provider.models.find(m => m.is_default && m.enabled)
        if (defaultModel) {
          modelIdToUse = defaultModel.id
          break
        }
        const anyEnabled = provider.models.find(m => m.enabled)
        if (anyEnabled) {
          modelIdToUse = anyEnabled.id
          break
        }
      }
    }

    if (!modelIdToUse) {
      toast.error(t('chat.configureProviderFirst'))
      return
    }
    createConversation.mutate({ provider_model_id: modelIdToUse })
  }

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Check if model is deleted
      if (modelStatus.isDeleted) {
        toast.error(t('provider.modelDeletedDesc'))
        return
      }

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
    [currentConversationId, selectedModelId, createConversation, setCurrentConversation, streamMessage, modelStatus.isDeleted, t]
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
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          isLoading={isStreaming}
          disabled={modelStatus.isDeleted || !selectedModelId}
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
