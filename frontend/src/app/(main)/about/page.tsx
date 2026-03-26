'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, MessageSquare, Package } from 'lucide-react'
import { useTranslations } from '@/i18n'

export default function AboutPage() {
  const t = useTranslations()

  const modules = [
    {
      href: '/about/help',
      icon: BookOpen,
      title: t('about.help.title'),
      description: t('about.help.description'),
    },
    {
      href: '/about/feedback',
      icon: MessageSquare,
      title: t('about.feedback.title'),
      description: t('about.feedback.description'),
    },
    {
      href: '/about/version',
      icon: Package,
      title: t('about.version.title'),
      description: t('about.version.description'),
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">AI Chat Notes</h1>
          <p className="text-xl text-muted-foreground">{t('about.tagline')}</p>
          <p className="text-muted-foreground">{t('about.productIntro')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href}>
                <Card className="h-full hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
