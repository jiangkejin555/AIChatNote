import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FontSize = 'small' | 'medium' | 'large'

export interface FontOption {
  value: string
  label: string // Direct label for display
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'system', label: 'System Default' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'lora', label: 'Lora' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'crimson', label: 'Crimson Text' },
  { value: 'source-serif', label: 'Source Serif 4' },
  // Chinese artistic fonts
  { value: 'noto-serif-sc', label: '思源宋体' },
  { value: 'long-cang', label: '龙藏行书' },
  { value: 'ma-shan-zheng', label: '马善政楷书' },
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
      fontFamily: 'system',
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
