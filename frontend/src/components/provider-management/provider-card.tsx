'use client'

import { Provider, ProviderModel } from '@/types'
import { getProviderIcon } from '@/constants/providers'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Star, Check, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'

interface ProviderCardProps {
  provider: Provider
  onEdit: (provider: Provider) => void
  onDelete: (provider: Provider) => void
  onSetDefaultModel: (providerId: string, modelId: string) => void
  onManageModels: (provider: Provider) => void
}

export function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onSetDefaultModel,
  onManageModels,
}: ProviderCardProps) {
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

        {enabledModels.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{t('provider.enabledModels')}:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onManageModels(provider)}
                className="h-7 text-xs"
              >
                <Settings2 className="h-3 w-3 mr-1" />
                {t('provider.manageModels')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {enabledModels.map((model) => (
                <ModelBadge
                  key={model.id}
                  model={model}
                  isDefault={model.is_default}
                  onSetDefault={() => onSetDefaultModel(provider.id, model.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground italic">{t('provider.noModels')}</p>
            <Button
              variant="default"
              size="sm"
              onClick={() => onManageModels(provider)}
              className="h-8"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              {t('provider.selectModels')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ModelBadgeProps {
  model: ProviderModel
  isDefault: boolean
  onSetDefault: () => void
}

function ModelBadge({ model, isDefault, onSetDefault }: ModelBadgeProps) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs',
        isDefault
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground'
      )}
    >
      <span>{model.display_name || model.model_id}</span>
      {!isDefault && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onSetDefault()
          }}
          title={t('provider.setAsDefault')}
        >
          <Star className="h-3 w-3" />
        </Button>
      )}
      {isDefault && <Check className="h-3 w-3" />}
    </div>
  )
}
