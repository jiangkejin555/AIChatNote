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
} from '@/components/ui/select'
import { Sun, Moon, Monitor, Settings, Languages, Type, CaseSensitive, Brain, Info, Sparkles, Palette, Clock, Link2, AlertCircle } from 'lucide-react'
import { useI18n, localeNames } from '@/i18n'
import { useUIStore, FONT_OPTIONS, type FontSize } from '@/stores/ui-store'
import { useUserSettings } from '@/hooks/use-user-settings'
import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { integrationService } from '@/services/integration'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { fontSize, fontFamily, setFontSize, setFontFamily } = useUIStore()
  const { settings, loading, setContextMode, setMemoryLevel } = useUserSettings()
  const [mounted, setMounted] = useState(false)

  // Notion integration state
  const [notionConnected, setNotionConnected] = useState<boolean | null>(null)
  const [notionLoading, setNotionLoading] = useState(true)
  const [notionActionLoading, setNotionActionLoading] = useState(false)
  const [notionError, setNotionError] = useState<string | null>(null)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch Notion connection status
  const fetchNotionStatus = useCallback(async () => {
    try {
      setNotionLoading(true)
      setNotionError(null)
      const status = await integrationService.getNotionStatus()
      setNotionConnected(status.connected)
    } catch {
      setNotionError(t('settings.notionConnectFailed'))
    } finally {
      setNotionLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (mounted) {
      fetchNotionStatus()
    }
  }, [mounted, fetchNotionStatus])

  const handleConnectNotion = async () => {
    try {
      setNotionActionLoading(true)
      const { url } = await integrationService.getNotionAuthUrl()
      window.location.href = url
    } catch {
      toast.error(t('settings.notionConnectStartFailed'))
      setNotionActionLoading(false)
    }
  }

  const handleDisconnectNotion = async () => {
    try {
      setNotionActionLoading(true)
      await integrationService.disconnectNotion()
      toast.success(t('settings.notionDisconnectSuccess'))
      setNotionConnected(false)
    } catch {
      toast.error(t('settings.notionDisconnectFailed'))
    } finally {
      setNotionActionLoading(false)
    }
  }

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

  const handleContextModeChange = async (mode: 'summary' | 'simple') => {
    try {
      await setContextMode(mode)
    } catch (error) {
      console.error('Failed to update context mode:', error)
    }
  }

  const handleMemoryLevelChange = async (level: 'short' | 'normal' | 'long') => {
    try {
      await setMemoryLevel(level)
    } catch (error) {
      console.error('Failed to update memory level:', error)
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

  const memoryLevelOptions = [
    { value: 'short', label: t('settings.memoryShort'), icon: Clock },
    { value: 'normal', label: t('settings.memoryNormal'), icon: Clock },
    { value: 'long', label: t('settings.memoryLong'), icon: Clock },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 sticky top-0 z-10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t('header.settings')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
          {/* System Settings Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('settings.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('settings.systemDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {/* Theme Selection */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="font-medium">{t('settings.theme')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.systemDesc')}</p>
                    </div>
                  </div>
                  <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                    {themeOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = theme === option.value
                      return (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            'gap-2 px-3 rounded-lg transition-all duration-200',
                            isActive && 'bg-background shadow-sm text-primary hover:bg-background',
                            !isActive && 'hover:bg-background/50'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 transition-transform duration-200', isActive && 'scale-110')} />
                          <span className="hidden sm:inline text-sm">{option.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Languages className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="font-medium">{t('settings.interfaceLanguage')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.languageDesc')}</p>
                    </div>
                  </div>
                  <Select value={locale} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[120px] bg-muted/50 border-0 focus:ring-2 ring-primary/20 transition-all duration-200">
                      {locale ? localeNames[locale as keyof typeof localeNames] : t('settings.selectLanguage')}
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="zh">{localeNames.zh}</SelectItem>
                      <SelectItem value="en">{localeNames.en}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size Selection */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Type className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="font-medium">{t('settings.fontSize')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.systemDesc')}</p>
                    </div>
                  </div>
                  <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                    {fontSizeOptions.map((option) => {
                      const isActive = fontSize === option.value
                      return (
                        <Button
                          key={option.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => setFontSize(option.value as FontSize)}
                          className={cn(
                            'px-4 rounded-lg transition-all duration-200',
                            isActive && 'bg-background shadow-sm text-primary hover:bg-background',
                            !isActive && 'hover:bg-background/50'
                          )}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Font Family Selection */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <CaseSensitive className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="font-medium">{t('settings.fontFamily')}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('settings.systemDesc')}</p>
                    </div>
                  </div>
                  <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                    <SelectTrigger className="w-[180px] bg-muted/50 border-0 focus:ring-2 ring-primary/20 transition-all duration-200">
                      {FONT_OPTIONS.find(opt => opt.value === fontFamily)?.label || t('settings.fontFamily')}
                    </SelectTrigger>
                    <SelectContent align="end">
                      {FONT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Memory Settings Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('settings.memoryTitle')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('settings.memoryDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {/* Context Mode Selection */}
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <Label className="font-medium">{t('settings.contextMode')}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.memoryDesc')}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger
                          render={<Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10" />}
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              {t('settings.contextModeInfoTitle')}
                            </DialogTitle>
                            <DialogDescription className="pt-4 text-left block space-y-4">
                              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{t('settings.summaryMode')}</span>
                                </div>
                                <span className="text-muted-foreground text-sm leading-relaxed block">{t('settings.summaryModeDesc')}</span>
                              </div>
                              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{t('settings.simpleMode')}</span>
                                </div>
                                <span className="text-muted-foreground text-sm leading-relaxed block">{t('settings.simpleModeDesc')}</span>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContextModeChange('summary')}
                      disabled={loading}
                      className={cn(
                        'px-4 rounded-lg transition-all duration-200',
                        settings.context_mode === 'summary' && 'bg-background shadow-sm text-primary hover:bg-background',
                        settings.context_mode !== 'summary' && 'hover:bg-background/50'
                      )}
                    >
                      {t('settings.summaryMode')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContextModeChange('simple')}
                      disabled={loading}
                      className={cn(
                        'px-4 rounded-lg transition-all duration-200',
                        settings.context_mode === 'simple' && 'bg-background shadow-sm text-primary hover:bg-background',
                        settings.context_mode !== 'simple' && 'hover:bg-background/50'
                      )}
                    >
                      {t('settings.simpleMode')}
                    </Button>
                  </div>
                </div>

                {/* Memory Level Selection */}
                <div className="p-5 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                        <Clock className="h-4 w-4" />
                      </div>
                      <Label className="font-medium">{t('settings.memoryLevel')}</Label>
                    </div>
                    <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                      {memoryLevelOptions.map((option) => {
                        const isActive = settings.memory_level === option.value
                        return (
                          <Button
                            key={option.value}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMemoryLevelChange(option.value as 'short' | 'normal' | 'long')}
                            disabled={loading}
                            className={cn(
                              'px-4 rounded-lg transition-all duration-200',
                              isActive && 'bg-background shadow-sm text-primary hover:bg-background',
                              !isActive && 'hover:bg-background/50'
                            )}
                          >
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Description shown directly below the selection */}
                  <div className="mt-3 ml-11">
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {settings.context_mode === 'simple' ? (
                        <>
                          {settings.memory_level === 'short' && t('settings.simpleShortDesc')}
                          {settings.memory_level === 'normal' && t('settings.simpleNormalDesc')}
                          {settings.memory_level === 'long' && t('settings.simpleLongDesc')}
                        </>
                      ) : (
                        <>
                          {settings.memory_level === 'short' && t('settings.summaryShortDesc')}
                          {settings.memory_level === 'normal' && t('settings.summaryNormalDesc')}
                          {settings.memory_level === 'long' && t('settings.summaryLongDesc')}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-party Connections Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('settings.integrationsTitle')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('settings.integrationsDesc')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {/* Notion Integration */}
                <div className="p-5 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                          <path d="M4.459 4.208c.745-.636 1.815-.745 3.32-.745h9.44c1.171 0 2.235.109 2.98.745.745.637.745 1.705.745 2.876v9.832c0 1.171 0 2.239-.745 2.876-.745.636-1.809.745-2.98.745H7.78c-1.505 0-2.575-.109-3.32-.745-.745-.637-.745-1.705-.745-2.876V7.084c0-1.171 0-2.239.744-2.876zm2.84 2.84v9.904h2.15v-6.72l4.87 6.72h1.92V7.048h-2.15v6.72l-4.87-6.72h-1.92z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{t('settings.notionTitle')}</Label>
                          {notionConnected === true && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {t('settings.notionConnected')}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.notionDesc')}</p>
                      </div>
                    </div>
                    <Button
                      onClick={notionConnected ? handleDisconnectNotion : handleConnectNotion}
                      disabled={notionActionLoading}
                      variant={notionConnected ? 'outline' : 'default'}
                      className={cn(
                        'shrink-0 min-w-[120px]',
                        notionConnected && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                      )}
                    >
                      {notionActionLoading && <span className="mr-2 h-4 w-4 animate-spin inline-block border-2 border-current border-t-transparent rounded-full" />}
                      {notionConnected ? t('settings.disconnect') : t('settings.connectNotion')}
                    </Button>
                  </div>
                  {notionError && (
                    <div className="flex items-start gap-3 mt-3 ml-11 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="leading-relaxed">{notionError}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
