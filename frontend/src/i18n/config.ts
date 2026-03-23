export const locales = ['zh', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh'

export const localeNames: Record<Locale, string> = {
  zh: '简体中文',
  en: 'English',
}

export function getSavedLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  const saved = localStorage.getItem('language')
  if (saved && locales.includes(saved as Locale)) {
    return saved as Locale
  }

  // Try to detect browser language
  const browserLang = navigator.language.split('-')[0]
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale
  }

  return defaultLocale
}

export function saveLocale(locale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', locale)
  }
}
