'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/lib/api'
import { useChatStore, useAuthStore } from '@/stores'
import { parseSSEStream } from '@/lib/stream'
import { toast } from 'sonner'
import { getT } from '@/i18n'
import type { CreateConversationRequest, SendMessageRequest, ConversationSearchResult, Message } from '@/types'

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Search conversations hook with debounce
export function useSearchConversations(query: string, debounceMs: number = 300) {
  const debouncedQuery = useDebounce(query, debounceMs)
  const [results, setResults] = useState<ConversationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    conversationsApi.search(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setIsSearching(false))
  }, [debouncedQuery])

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  return { results, isSearching, clearResults }
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsApi.getAll,
  })
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => (id ? conversationsApi.getById(id) : null),
    enabled: !!id,
  })
}

export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => (conversationId ? conversationsApi.getMessages(conversationId) : []),
    enabled: !!conversationId,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { setCurrentConversation } = useChatStore()
  const t = getT()

  return useMutation({
    mutationFn: (data: CreateConversationRequest) => conversationsApi.create(data),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setCurrentConversation(conversation.id)
      // toast.success(t('chat.conversationCreateSuccess'))
    },
    onError: () => {
      toast.error(t('chat.conversationCreateFailed'))
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string } }) =>
      conversationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => {
      toast.error(t('chat.conversationUpdateFailed'))
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const { setCurrentConversation } = useChatStore()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => conversationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Clear the messages cache for the deleted conversation first
      // This prevents stale messages from being displayed
      queryClient.removeQueries({ queryKey: ['conversations', deletedId, 'messages'] })
      // Then invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setCurrentConversation(null)
      toast.success(t('chat.conversationDeleteSuccess'))
    },
    onError: () => {
      toast.error(t('chat.conversationDeleteFailed'))
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: number
      data: SendMessageRequest
    }) => conversationsApi.sendMessage(conversationId, data),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', conversationId, 'messages'],
      })
    },
    onError: () => {
      toast.error(t('chat.sendMessageFailed'))
    },
  })
}

export function useRegenerateMessage() {
  const queryClient = useQueryClient()
  const { token } = useAuthStore()
  const { startStreaming, stopStreaming, updateStreamingState, clearStreamingState, getStreamingState } = useChatStore()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const t = getT()

  const regenerateStream = useCallback(
    async ({ conversationId, messageId }: { conversationId: number; messageId: number }) => {
      if (!token) {
        toast.error(t('chat.regenerateFailed'))
        return
      }

      setIsRegenerating(true)
      startStreaming(conversationId)

      // Get current messages count as base (minus the message being regenerated)
      const currentMessages = queryClient.getQueryData<Message[]>(['conversations', conversationId, 'messages'])
      const baseMessageCount = currentMessages ? currentMessages.filter(m => m.id !== messageId).length : 0

      // Set initial streaming state
      updateStreamingState(conversationId, {
        content: '',
        optimisticMessages: [],
        baseMessageCount,
        isThinking: true,
        isTimeout: false,
        isCancelled: false,
        lastUserMessage: '',
        requestId: null,
      })

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
        const response = await fetch(`${API_URL}/conversations/${conversationId}/messages/${messageId}/regenerate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ stream: true }),
          signal: controller.signal,
        })

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch {
            // Ignore JSON parse errors
          }
          throw new Error(errorMessage)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        let fullContent = ''

        for await (const chunk of parseSSEStream(response.body)) {
          if (chunk.done) {
            if (chunk.error) {
              throw new Error(chunk.error)
            }
            break
          }

          fullContent += chunk.content
          updateStreamingState(conversationId, {
            content: fullContent,
            isThinking: false,
          })
        }

        // Success - clear streaming state and refetch
        clearStreamingState(conversationId)
        queryClient.invalidateQueries({
          queryKey: ['conversations', conversationId, 'messages'],
        })
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        })
      } catch (error) {
        const err = error as Error
        if (err.name === 'AbortError') {
          console.log('Regenerate stream aborted')
        } else {
          console.error('Regenerate stream error:', error)
          toast.error(err.message || t('chat.regenerateFailed'))
        }
        clearStreamingState(conversationId)
      } finally {
        setIsRegenerating(false)
        stopStreaming(conversationId)
        abortControllerRef.current = null
      }
    },
    [token, queryClient, startStreaming, stopStreaming, updateStreamingState, clearStreamingState, t]
  )

  const stopRegenerate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsRegenerating(false)
  }, [])

  return {
    regenerate: regenerateStream,
    stopRegenerate,
    isPending: isRegenerating,
  }
}

export function useMarkAsSaved() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => conversationsApi.markAsSaved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useGenerateTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => conversationsApi.generateTitle(id),
    onSuccess: () => {
      // Refresh conversations list to show new title
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useUpdateConversationModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { provider_model_id?: string; model_id?: string } }) =>
      conversationsApi.updateModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
