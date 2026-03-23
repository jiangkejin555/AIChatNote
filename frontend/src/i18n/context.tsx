'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { locales, defaultLocale, getSavedLocale, saveLocale, type Locale } from './config'

// Import messages
import zhMessages from '../../messages/zh.json'
import enMessages from '../../messages/en.json'

const messages: Record<Locale, typeof zhMessages> = {
  zh: zhMessages,
  en: enMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLocale = getSavedLocale()
    setLocaleState(savedLocale)
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    saveLocale(newLocale)
  }, [])

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const keys = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if not found
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters like {name} with values
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey] ?? `{${paramKey}}`
      })
    }

    return value
  }, [locale])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: defaultLocale, setLocale: () => {}, t: (key) => key }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Convenience hook for translations only
export function useTranslations() {
  const { t } = useI18n()
  return t
}
