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
import { Pencil, Trash2, ChevronDown, Settings2, Globe } from 'lucide-react'
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
    <Card className={cn(
      'group transition-all duration-200 hover:shadow-md hover:border-primary/20',
      hasNoModels && 'border-dashed opacity-80 hover:opacity-100'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-2xl shrink-0 transition-transform duration-200 group-hover:scale-110">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{provider.name}</h3>
                {defaultModel && (
                  <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5 shrink-0">
                    {defaultModel.display_name || defaultModel.model_id}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(provider)}
              title={t('common.edit')}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(provider)}
              title={t('common.delete')}
              className="opacity-60 hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <p className="truncate" title={provider.api_base}>
            {provider.api_base}
          </p>
        </div>

        {/* Combined row: model dropdown + manage button */}
        <div className="flex items-center gap-2">
          {/* Model dropdown selector */}
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-between gap-2 h-8 px-3 py-2 text-xs font-medium border rounded-lg bg-background hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer hover:border-primary/30"
            >
              <span className="truncate">
                {t('provider.enabledModels')} ({enabledModels.length})
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="max-h-60 overflow-y-auto !w-auto min-w-[200px]"
              align="start"
            >
              {hasNoModels ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {t('provider.noModels')}
                </div>
              ) : (
                enabledModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    className="whitespace-nowrap text-sm"
                    disabled
                  >
                    {model.display_name || model.model_id}
                    {model.is_default && (
                      <Badge variant="secondary" className="text-[10px] ml-2 px-1.5 py-0 h-4">
                        {t('provider.defaultModel')}
                      </Badge>
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
            className="h-8 text-xs ml-auto shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            {t('provider.manageModels')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
