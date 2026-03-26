'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Sparkles, Wrench, Bug } from 'lucide-react'
import { feedbackApi, Version } from '@/lib/api/feedback'

export default function VersionPage() {
  const t = useTranslations()
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)

  useEffect(() => {
    loadVersions()
  }, [])

  const loadVersions = async () => {
    try {
      const [verRes, curRes] = await Promise.all([
        feedbackApi.getVersions(),
        feedbackApi.getCurrentVersion(),
      ])
      setVersions(verRes.data)
      setCurrentVersion(curRes)
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4 text-green-500" />
      case 'improvement':
        return <Wrench className="h-4 w-4 text-blue-500" />
      case 'fix':
        return <Bug className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getChangeTypeLabel = (type: string) => {
    return t(`about.version.changeTypes.${type}` as const)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10 shrink-0">
        <div className="flex items-center justify-center gap-4 p-4 max-w-4xl mx-auto relative">
          <Link href="/about" className="absolute left-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('about.backToAbout')}
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{t('about.version.title')}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {currentVersion && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('about.version.currentVersion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{currentVersion.version}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('about.version.releaseDate')}: {currentVersion.release_date}
                  </p>
                  {currentVersion.changes && currentVersion.changes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {currentVersion.changes.map((change, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {getChangeIcon(change.type)}
                          <div>
                            <Badge variant="outline" className="mr-2">
                              {getChangeTypeLabel(change.type)}
                            </Badge>
                            <span className="text-sm">{change.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('about.version.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('about.version.noVersions')}</p>
              ) : (
                <div className="space-y-6">
                  {versions.map((version) => (
                    <div key={version.id} className="border-l-2 border-muted pl-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{version.version}</span>
                        <span className="text-sm text-muted-foreground">{version.release_date}</span>
                      </div>
                      {version.changes && version.changes.length > 0 && (
                        <div className="space-y-1">
                          {version.changes.map((change, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              {getChangeIcon(change.type)}
                              <span>{change.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
