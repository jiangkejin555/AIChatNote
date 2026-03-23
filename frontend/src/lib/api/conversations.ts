import apiClient from './client'
import { mockConversationsApi } from './mock-data'
import type {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  ApiResponse,
} from '@/types'

// Toggle mock mode - set to false when backend is ready
const USE_MOCK = true

export const conversationsApi = {
  getAll: async (): Promise<Conversation[]> => {
    if (USE_MOCK) {
      return mockConversationsApi.getAll()
    }
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/conversations')
    return response.data.data
  },

  getById: async (id: number): Promise<Conversation> => {
    if (USE_MOCK) {
      return mockConversationsApi.getById(id)
    }
    const response = await apiClient.get<ApiResponse<Conversation>>(`/conversations/${id}`)
    return response.data.data
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    if (USE_MOCK) {
      return mockConversationsApi.getMessages(conversationId)
    }
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/conversations/${conversationId}/messages`
    )
    return response.data.data
  },

  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    if (USE_MOCK) {
      return mockConversationsApi.create(data)
    }
    const response = await apiClient.post<ApiResponse<Conversation>>('/conversations', data)
    return response.data.data
  },

  update: async (
    id: number,
    data: { title?: string }
  ): Promise<Conversation> => {
    if (USE_MOCK) {
      return mockConversationsApi.update(id, data)
    }
    const response = await apiClient.put<ApiResponse<Conversation>>(`/conversations/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      return mockConversationsApi.delete(id)
    }
    await apiClient.delete(`/conversations/${id}`)
  },

  sendMessage: async (
    conversationId: number,
    data: SendMessageRequest
  ): Promise<Message> => {
    if (USE_MOCK) {
      return mockConversationsApi.sendMessage(conversationId, data)
    }
    const response = await apiClient.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      data
    )
    return response.data.data
  },

  regenerate: async (conversationId: number, messageId: number): Promise<Message> => {
    if (USE_MOCK) {
      return mockConversationsApi.regenerate(conversationId, messageId)
    }
    const response = await apiClient.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages/${messageId}/regenerate`
    )
    return response.data.data
  },

  markAsSaved: async (id: number): Promise<Conversation> => {
    if (USE_MOCK) {
      return mockConversationsApi.markAsSaved(id)
    }
    const response = await apiClient.put<ApiResponse<Conversation>>(
      `/conversations/${id}/saved`
    )
    return response.data.data
  },
}
