'use client'

import { ProviderList } from '@/components/provider-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu } from 'lucide-react'
import { useTranslations } from '@/i18n'

export default function ModelsSettingsPage() {
  const t = useTranslations()

  return (
    <div className="flex items-start justify-center h-full p-4 pt-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            {t('sidebar.modelManagement')}
          </CardTitle>
          <CardDescription>
            {t('provider.managementDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderList />
        </CardContent>
      </Card>
    </div>
  )
}
