'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/lib/api'
import { useChatStore } from '@/stores'
import { toast } from 'sonner'
import { getT } from '@/i18n'
import type { CreateConversationRequest, SendMessageRequest, ConversationSearchResult } from '@/types'

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
  const t = getT()

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: number
      messageId: number
    }) => conversationsApi.regenerate(conversationId, messageId),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', conversationId, 'messages'],
      })
    },
    onError: () => {
      toast.error(t('chat.regenerateFailed'))
    },
  })
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
