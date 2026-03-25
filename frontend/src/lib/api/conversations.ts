import apiClient from './client'
import type {
  Conversation,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
  ApiResponse,
} from '@/types'

export const conversationsApi = {
  getAll: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<ApiResponse<Conversation[]>>('/conversations')
    return response.data.data
  },

  getById: async (id: number): Promise<Conversation> => {
    const response = await apiClient.get<ApiResponse<Conversation>>(`/conversations/${id}`)
    return response.data.data
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/conversations/${conversationId}/messages`
    )
    return response.data.data
  },

  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await apiClient.post<ApiResponse<Conversation>>('/conversations', data)
    return response.data.data
  },

  update: async (
    id: number,
    data: { title?: string }
  ): Promise<Conversation> => {
    const response = await apiClient.put<ApiResponse<Conversation>>(`/conversations/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`)
  },

  sendMessage: async (
    conversationId: number,
    data: SendMessageRequest
  ): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages`,
      { ...data, stream: false }  // Non-streaming for now
    )
    return response.data.data
  },

  regenerate: async (conversationId: number, messageId: number): Promise<Message> => {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/conversations/${conversationId}/messages/${messageId}/regenerate`,
      { stream: false }  // Non-streaming for now
    )
    return response.data.data
  },

  markAsSaved: async (id: number): Promise<Conversation> => {
    const response = await apiClient.put<ApiResponse<Conversation>>(
      `/conversations/${id}/saved`
    )
    return response.data.data
  },

  generateTitle: async (id: number): Promise<{ title: string }> => {
    const response = await apiClient.post<ApiResponse<{ title: string }>>(
      `/conversations/${id}/generate-title`
    )
    return response.data.data
  },

  updateModel: async (
    id: number,
    data: { provider_model_id?: string; model_id?: string }
  ): Promise<Conversation> => {
    const response = await apiClient.put<ApiResponse<Conversation>>(
      `/conversations/${id}/model`,
      data
    )
    return response.data.data
  },
}
