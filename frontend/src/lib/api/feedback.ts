import apiClient from './client'

export interface SatisfactionRating {
  id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: number
  user_id: number
  type: 'bug' | 'feature' | 'other'
  title: string
  description: string
  contact: string | null
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

export interface FeatureRequest {
  id: number
  title: string
  description: string
  status: 'planned' | 'in_progress' | 'completed'
  vote_count: number
  has_voted: boolean
  created_at: string
}

export interface VersionChange {
  type: 'feature' | 'improvement' | 'fix'
  description: string
}

export interface Version {
  id: number
  version: string
  release_date: string
  changes: VersionChange[]
  created_at: string
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export const feedbackApi = {
  getSatisfaction: async (): Promise<{ rating: SatisfactionRating | null }> => {
    const response = await apiClient.get<ApiResponse<SatisfactionRating | null>>('/feedback/satisfaction')
    return { rating: response.data.data }
  },

  submitSatisfaction: async (rating: number, comment?: string): Promise<SatisfactionRating> => {
    const response = await apiClient.post<ApiResponse<SatisfactionRating>>('/feedback/satisfaction', {
      rating,
      comment,
    })
    return response.data.data
  },

  getFeedbacks: async (): Promise<{ data: Feedback[] }> => {
    const response = await apiClient.get<ApiResponse<Feedback[]>>('/feedbacks')
    return { data: response.data.data }
  },

  createFeedback: async (data: {
    type: 'bug' | 'feature' | 'other'
    title: string
    description: string
    contact?: string
  }): Promise<Feedback> => {
    const response = await apiClient.post<ApiResponse<Feedback>>('/feedbacks', data)
    return response.data.data
  },

  getFeatures: async (): Promise<{ data: FeatureRequest[] }> => {
    const response = await apiClient.get<ApiResponse<FeatureRequest[]>>('/features')
    return { data: response.data.data }
  },

  voteFeature: async (featureId: number): Promise<void> => {
    await apiClient.post(`/features/${featureId}/vote`)
  },

  unvoteFeature: async (featureId: number): Promise<void> => {
    await apiClient.delete(`/features/${featureId}/vote`)
  },

  getVersions: async (): Promise<{ data: Version[] }> => {
    const response = await apiClient.get<ApiResponse<Version[]>>('/versions')
    return { data: response.data.data }
  },

  getCurrentVersion: async (): Promise<Version> => {
    const response = await apiClient.get<ApiResponse<Version>>('/versions/current')
    return response.data.data
  },
}
