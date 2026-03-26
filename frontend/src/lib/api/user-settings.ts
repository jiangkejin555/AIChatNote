import { apiClient } from './client'

export interface UserSettings {
  context_mode: 'summary' | 'simple'
  memory_level: 'short' | 'normal' | 'long'
}

export interface UpdateUserSettingsRequest {
  context_mode?: 'summary' | 'simple'
  memory_level?: 'short' | 'normal' | 'long'
}

export async function getUserSettings(): Promise<UserSettings> {
  const response = await apiClient.get<{ data: UserSettings }>('/user/settings')
  return response.data.data
}

export async function updateUserSettings(
  settings: UpdateUserSettingsRequest
): Promise<UserSettings> {
  const response = await apiClient.put<{ data: UserSettings }>('/user/settings', settings)
  return response.data.data
}
