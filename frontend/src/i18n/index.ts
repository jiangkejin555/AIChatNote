export { I18nProvider, useI18n, useTranslations } from './context'
export { locales, defaultLocale, getSavedLocale, saveLocale, localeNames, type Locale } from './config'

// Import for local use
import { getSavedLocale, type Locale } from './config'

// Import messages for getT function
import zhMessages from '../../messages/zh.json'
import enMessages from '../../messages/en.json'

const messages: Record<Locale, typeof zhMessages> = {
  zh: zhMessages,
  en: enMessages,
}

/**
 * Get translation function for use outside of React components
 * Useful for toast messages in hooks
 */
export function getT() {
  const locale = getSavedLocale()

  return (key: string, params?: Record<string, string>): string => {
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
  }
}
