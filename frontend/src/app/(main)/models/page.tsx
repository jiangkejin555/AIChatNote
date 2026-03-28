'use client'

import { ProviderList } from '@/components/provider-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Cpu } from 'lucide-react'
import { useTranslations } from '@/i18n'

export default function ModelsSettingsPage() {
  const t = useTranslations()

  return (
    <div className="flex items-start justify-center h-full p-6 pt-16">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            {t('sidebar.modelManagement')}
          </CardTitle>
          <CardDescription className="text-sm">
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
