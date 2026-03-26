'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  Building2,
  Users,
  Mail,
  Github,
  Scale,
  Package,
  ExternalLink
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
        return <Sparkles className="h-4 w-4 text-green-500" />
      case 'improvement':
        return <Sparkles className="h-4 w-4 text-blue-500" />
      case 'fix':
        return <Sparkles className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold">{t('about.title')}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 py-8">
            <h2 className="text-3xl font-bold">AI Chat Note</h2>
            <p className="text-xl text-muted-foreground">{t('about.tagline')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('about.companyInfo.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('about.companyInfo.companyName')}</span>
                <span className="font-medium">AI Chat Note Team</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('about.companyInfo.foundedDate')}</span>
                <span className="font-medium">2024</span>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground">{t('about.companyInfo.mission')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('about.teamIntro.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.teamIntro.content')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('about.contact.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('about.contact.email')}
                </span>
                <a href="mailto:support@aichatnotes.com" className="text-primary hover:underline">
                  {t('about.contact.emailValue')}
                </a>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  {t('about.contact.github')}
                </span>
                <a
                  href="https://github.com/aichatnotes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {t('about.contact.githubValue')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {t('about.legal.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    {t('about.legal.termsOfService')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    {t('about.legal.privacyPolicy')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('about.version.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentVersion ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('about.version.currentVersion')}</span>
                    <Badge variant="secondary">{currentVersion.version}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('about.version.releaseDate')}</span>
                    <span className="font-medium">{currentVersion.release_date}</span>
                  </div>
                  {currentVersion.changes && currentVersion.changes.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {currentVersion.changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            {getChangeIcon(change.type)}
                            <span>{change.description}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('about.version.currentVersion')}: v1.0.0
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
