'use client'

import { useTranslations } from '@/i18n'
import { MarkdownContent } from '@/components/common/markdown-content'
import { ScrollText } from 'lucide-react'

export default function TermsPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      <MarkdownContent
        type="terms"
        title={t('about.legal.termsOfService')}
        icon={<ScrollText className="h-5 w-5" />}
      />
    </div>
  )
}
