'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Building2,
  Users,
  Mail,
  Github,
  Scale,
  Package,
  ExternalLink,
  Heart,
  ChevronRight,
  Globe,
  Calendar,
  FileText,
} from 'lucide-react'
import { feedbackApi, Version } from '@/lib/api/feedback'

export default function AboutPage() {
  const t = useTranslations()
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)

  useEffect(() => {
    loadVersion()
  }, [])

  const loadVersion = async () => {
    try {
      const version = await feedbackApi.getCurrentVersion()
      setCurrentVersion(version)
    } catch (error) {
      console.error('Failed to load version:', error)
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      case 'improvement':
        return <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      case 'fix':
        return <Sparkles className="h-4 w-4 text-orange-500 dark:text-orange-400" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - matching other pages */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 sticky top-0 z-10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t('about.title')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
          {/* Brand Hero Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5 dark:from-card dark:via-card dark:to-primary/5 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8 md:p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-5">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                AI Chat Note
              </h2>
              <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
                {t('about.tagline')}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Badge variant="secondary" className="px-3 py-1 text-xs">
                  {currentVersion ? currentVersion.version : 'v1.0.0'}
                </Badge>
                <span className="text-xs text-muted-foreground/60">•</span>
                <span className="text-xs text-muted-foreground/60">{t('about.companyInfo.foundedDate')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Mission & Team Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('about.teamIntro.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('about.companyInfo.mission')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <div className="p-5 flex items-start gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">{t('about.companyInfo.title')}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('about.companyInfo.companyName')}
                    </p>
                  </div>
                </div>
                <div className="p-5 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-200">
                      {t('about.teamIntro.content')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('about.contact.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('about.contact.email')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('about.contact.email')}</label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        aichatnote.service@gmail.com
                      </p>
                    </div>
                  </div>
                  <a
                    href="mailto:aichatnote.service@gmail.com"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    {t('about.contact.emailValue')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Github className="h-4 w-4" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('about.contact.github')}</label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('about.contact.githubValue')}
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://github.com/aichatnotes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    {t('about.contact.githubValue')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('about.legal.title')}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{t('about.legal.termsOfService')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </a>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                      <Globe className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{t('about.legal.privacyPolicy')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Version Card */}
          <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {t('about.version.title')}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {currentVersion ? (
                <div className="divide-y divide-border/50">
                  <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{t('about.version.currentVersion')}</span>
                    </div>
                    <Badge variant="secondary" className="px-3">{currentVersion.version}</Badge>
                  </div>
                  <div className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{t('about.version.releaseDate')}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{currentVersion.release_date}</span>
                  </div>
                  {currentVersion.changes && currentVersion.changes.length > 0 && (
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">Changelog</span>
                      </div>
                      <div className="ml-11 space-y-2.5">
                        {currentVersion.changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-sm">
                            {getChangeIcon(change.type)}
                            <span className="text-muted-foreground leading-relaxed">
                              {change.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm">{t('about.version.currentVersion')}: v1.0.0</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
