'use client'

import { useState } from 'react'
import { Provider } from '@/types'
import { getProviderIcon } from '@/constants/providers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Pencil, Trash2, ChevronDown, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'

interface ProviderCardProps {
  provider: Provider
  onEdit: (provider: Provider) => void
  onDelete: (provider: Provider) => void
  onManageModels: (provider: Provider) => void
}

export function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onManageModels,
}: ProviderCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const icon = getProviderIcon(provider.type)
  const enabledModels = provider.models.filter((m) => m.enabled)
  const defaultModel = provider.models.find((m) => m.is_default)
  const hasNoModels = enabledModels.length === 0
  const t = useTranslations()

  return (
    <Card className={cn(hasNoModels && 'border-dashed')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold text-lg">{provider.name}</h3>
            {defaultModel && (
              <Badge variant="secondary" className="text-xs">
                {defaultModel.display_name || defaultModel.model_id}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(provider)}
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(provider)}
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p className="truncate" title={provider.api_base}>
            API: {provider.api_base}
          </p>
        </div>

        {/* Combined row: model dropdown + manage button */}
        <div className="flex items-center gap-2">
          {/* Model dropdown selector */}
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-between gap-2 h-8 px-3 py-2 text-sm font-medium border rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <span className="truncate">
                {t('provider.enabledModels')} ({enabledModels.length})
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform',
                  isOpen && 'transform rotate-180'
                )}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="max-h-60 overflow-y-auto !w-auto min-w-[200px]"
              align="start"
            >
              {hasNoModels ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t('provider.noModels')}
                </div>
              ) : (
                enabledModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    className="whitespace-nowrap"
                    disabled
                  >
                    {model.display_name || model.model_id}
                    {model.is_default && (
                      <span className="text-muted-foreground ml-1">({t('provider.defaultModel')})</span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Manage models button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageModels(provider)}
            className="h-8 text-xs ml-auto shrink-0"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1" />
            {t('provider.manageModels')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
