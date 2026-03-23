'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/lib/api'
import { useChatStore } from '@/stores'
import { toast } from 'sonner'
import { getT } from '@/i18n'
import type { CreateConversationRequest, SendMessageRequest } from '@/types'

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
      toast.success(t('chat.conversationCreateSuccess'))
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
    onSuccess: () => {
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
