'use client'

import { useTranslations } from '@/i18n'
import { MarkdownContent } from '@/components/common/markdown-content'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      <MarkdownContent
        type="privacy"
        title={t('about.legal.privacyPolicy')}
        icon={<Shield className="h-5 w-5" />}
      />
    </div>
  )
}
