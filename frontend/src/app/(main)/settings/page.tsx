'use client'

import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sun, Moon, Monitor, Settings, Languages, Type, CaseSensitive } from 'lucide-react'
import { useI18n, localeNames } from '@/i18n'
import { useUIStore, FONT_OPTIONS, type FontSize } from '@/stores/ui-store'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { fontSize, fontFamily, setFontSize, setFontFamily } = useUIStore()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply font settings to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-font-size', fontSize)
      document.documentElement.style.setProperty('--font-family-base', fontFamily)
    }
  }, [mounted, fontSize, fontFamily])

  const handleLanguageChange = (value: string | null) => {
    if (value && (value === 'zh' || value === 'en')) {
      setLocale(value)
    }
  }

  const handleFontSizeChange = (value: string | null) => {
    if (value && ['small', 'medium', 'large'].includes(value)) {
      setFontSize(value as FontSize)
    }
  }

  const handleFontFamilyChange = (value: string | null) => {
    if (value) {
      setFontFamily(value)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  const themeOptions = [
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
    { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
  ]

  const fontSizeOptions = [
    { value: 'small', label: t('settings.fontSizeSmall') },
    { value: 'medium', label: t('settings.fontSizeMedium') },
    { value: 'large', label: t('settings.fontSizeLarge') },
  ]

  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.appearanceDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection - Compact Button Group */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Label>{t('settings.theme')}</Label>
            </div>
            <div className="flex border rounded-lg p-1 gap-1">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'gap-1.5',
                      !isActive && 'hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Language Selection - Compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Label>{t('settings.interfaceLanguage')}</Label>
            </div>
            <Select value={locale} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[100px]">
                {locale ? localeNames[locale as keyof typeof localeNames] : t('settings.selectLanguage')}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">{localeNames.zh}</SelectItem>
                <SelectItem value="en">{localeNames.en}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label>{t('settings.fontSize')}</Label>
            </div>
            <div className="flex border rounded-lg p-1 gap-1">
              {fontSizeOptions.map((option) => {
                const isActive = fontSize === option.value
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFontSize(option.value as FontSize)}
                    className={cn(
                      'px-3',
                      !isActive && 'hover:bg-accent'
                    )}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Font Family Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CaseSensitive className="h-4 w-4 text-muted-foreground" />
              <Label>{t('settings.fontFamily')}</Label>
            </div>
            <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('settings.fontFamily')} />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
