import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FontSize = 'small' | 'medium' | 'large'

export interface FontOption {
  value: string
  labelKey: string // Translation key for the label
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'system-ui, -apple-system, sans-serif', labelKey: 'settings.fontSystem' },
  { value: 'Inter, system-ui, sans-serif', labelKey: 'settings.fontInter' },
  { value: 'Roboto, system-ui, sans-serif', labelKey: 'settings.fontRoboto' },
  { value: '"Noto Sans SC", system-ui, sans-serif', labelKey: 'settings.fontNotoSans' },
  { value: '"PingFang SC", system-ui, sans-serif', labelKey: 'settings.fontPingFang' },
  { value: 'Georgia, serif', labelKey: 'settings.fontGeorgia' },
]

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
}

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  fontSize: FontSize
  fontFamily: string
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setFontSize: (size: FontSize) => void
  setFontFamily: (family: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      fontSize: 'medium',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),
      toggleSidebarCollapse: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSidebarCollapsed: (collapsed) =>
        set({
          sidebarCollapsed: collapsed,
        }),
      setFontSize: (size) =>
        set({
          fontSize: size,
        }),
      setFontFamily: (family) =>
        set({
          fontFamily: family,
        }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
      }),
    }
  )
)
