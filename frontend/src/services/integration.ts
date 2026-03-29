import apiClient from '@/lib/api/client'

export interface NotionStatus {
  connected: boolean
}

export interface NotionAuthUrl {
  url: string
}

export const integrationService = {
  // Get Notion connection status
  getNotionStatus: async (): Promise<NotionStatus> => {
    const response = await apiClient.get<NotionStatus>('/integrations/notion/status')
    return response.data
  },

  // Get Notion OAuth authorization URL
  getNotionAuthUrl: async (): Promise<NotionAuthUrl> => {
    const response = await apiClient.get<NotionAuthUrl>('/integrations/notion/auth-url')
    return response.data
  },

  // Handle Notion OAuth callback
  handleNotionCallback: async (code: string): Promise<void> => {
    await apiClient.post('/integrations/notion/callback', { code })
  },

  // Disconnect Notion
  disconnectNotion: async (): Promise<void> => {
    await apiClient.delete('/integrations/notion/disconnect')
  },
}
