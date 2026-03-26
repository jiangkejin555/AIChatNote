import { useState, useEffect, useCallback } from 'react'
import {
  getUserSettings,
  updateUserSettings,
  type UserSettings,
  type UpdateUserSettingsRequest,
} from '@/lib/api/user-settings'

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    context_mode: 'simple',
    memory_level: 'normal',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await getUserSettings()
        setSettings(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Update settings
  const updateSettings = useCallback(async (updates: UpdateUserSettingsRequest) => {
    try {
      setLoading(true)
      const data = await updateUserSettings(updates)
      setSettings(data)
      setError(null)
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update settings'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update context mode
  const setContextMode = useCallback(
    async (mode: 'summary' | 'simple') => {
      return updateSettings({ context_mode: mode })
    },
    [updateSettings]
  )

  // Update memory level
  const setMemoryLevel = useCallback(
    async (level: 'short' | 'normal' | 'long') => {
      return updateSettings({ memory_level: level })
    },
    [updateSettings]
  )

  return {
    settings,
    loading,
    error,
    updateSettings,
    setContextMode,
    setMemoryLevel,
  }
}
