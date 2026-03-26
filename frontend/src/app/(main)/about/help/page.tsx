'use client'

import Link from 'next/link'
import { useTranslations } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, HelpCircle, Lightbulb, Rocket, Sparkles } from 'lucide-react'

export default function HelpPage() {
  const t = useTranslations()

  const features = [
    { key: 'multiModel', icon: Sparkles },
    { key: 'noteSave', icon: CheckCircle },
    { key: 'knowledgeBase', icon: Lightbulb },
    { key: 'export', icon: Rocket },
  ]

  const quickStartSteps = ['step1', 'step2', 'step3']

  const faqItems = ['q1', 'q2', 'q3', 'q4']

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
          <h1 className="text-xl font-semibold">{t('about.help.title')}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                {t('about.help.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('about.help.overviewContent')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t('about.help.features')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {features.map(({ key, icon: Icon }) => (
                  <div key={key} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{t(`about.help.featuresList.${key}.title`)}</h4>
                      <p className="text-sm text-muted-foreground">{t(`about.help.featuresList.${key}.desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                {t('about.help.quickStart')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {quickStartSteps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{t(`about.help.quickStartSteps.${step}`)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                {t('about.help.faq')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item} className="space-y-1">
                    <h4 className="font-medium">{t(`about.help.faqList.${item}.q`)}</h4>
                    <p className="text-sm text-muted-foreground">{t(`about.help.faqList.${item}.a`)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
