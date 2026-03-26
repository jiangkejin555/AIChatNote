'use client'

import { useEffect, useMemo } from 'react'
import { useProviders } from '@/hooks'
import { getProviderIcon } from '@/constants/providers'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ProviderModel } from '@/types'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  value?: string // provider_model_id
  onChange?: (providerModelId: string) => void
  // For displaying deleted model info
  deletedModelId?: string // model_id snapshot when provider_model_id is null
  isModelDeleted?: boolean // indicates if the current model is deleted
  // Only auto-select default model when creating new chat, not during conversation switch
  isNewChat?: boolean
}

export function ModelSelector({
  value,
  onChange,
  deletedModelId,
  isModelDeleted,
  isNewChat = false
}: ModelSelectorProps) {
  const { data: providers, isLoading } = useProviders()
  const t = useTranslations()

  // Compute all enabled models with their provider info
  const { allModels, defaultModel } = useMemo(() => {
    const models: Array<ProviderModel & { providerName: string; providerType: string }> = []
    let defaultModel: (ProviderModel & { providerName: string; providerType: string }) | null = null

    if (providers) {
      for (const provider of providers) {
        for (const model of provider.models) {
          if (model.enabled) {
            const modelWithProvider = {
              ...model,
              providerName: provider.name,
              providerType: provider.type,
            }
            models.push(modelWithProvider)
            if (model.is_default && !defaultModel) {
              defaultModel = modelWithProvider
            }
          }
        }
      }
    }

    return { allModels: models, defaultModel }
  }, [providers])

  const currentValue = value || defaultModel?.id || allModels[0]?.id

  // Sync default value to parent ONLY when creating new chat
  // This prevents triggering during conversation switch transitions
  useEffect(() => {
    if (!value && currentValue && onChange && !isModelDeleted && isNewChat) {
      onChange(currentValue)
    }
  }, [value, currentValue, onChange, isModelDeleted, isNewChat])

  if (isLoading) {
    return <Skeleton className="h-9 w-48" />
  }

  // Show deleted model state
  if (isModelDeleted && deletedModelId) {
    return (
      <div
        className={cn(
          "h-9 px-3 py-2 rounded-md border border-dashed",
          "flex items-center gap-1.5 text-sm",
          "text-muted-foreground bg-muted/30"
        )}
      >
        <span className="line-through">{t('provider.modelDeleted')}</span>
        <span className="text-muted-foreground/50">/</span>
        <span>{deletedModelId}</span>
      </div>
    )
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('provider.pleaseAddProvider')}
      </div>
    )
  }

  if (allModels.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('provider.noModels')}
      </div>
    )
  }

  const selectedModel = allModels.find((m) => m.id === value)

  // Group models by provider
  const groupedModels = new Map<string, typeof allModels>()
  for (const model of allModels) {
    const key = `${model.provider_id}-${model.providerName}`
    if (!groupedModels.has(key)) {
      groupedModels.set(key, [])
    }
    groupedModels.get(key)!.push(model)
  }

  return (
    <Select
      value={currentValue}
      onValueChange={(val) => val && onChange?.(val)}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('chat.selectModel')}>
          {selectedModel
            ? (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{selectedModel.providerName}</span>
                <span className="text-muted-foreground/50">/</span>
                <span>{selectedModel.display_name || selectedModel.model_id}</span>
              </span>
            )
            : defaultModel
              ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{defaultModel.providerName}</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span>{defaultModel.display_name || defaultModel.model_id}</span>
                </span>
              )
              : t('chat.selectModel')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Array.from(groupedModels.entries()).map(([key, models]) => {
          const firstModel = models[0]
          const icon = getProviderIcon(firstModel.providerType as any)

          return (
            <SelectGroup key={key}>
              <SelectLabel className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{firstModel.providerName}</span>
              </SelectLabel>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.display_name || model.model_id}</span>
                    {model.is_default && (
                      <span className="text-xs text-muted-foreground">({t('provider.defaultModel')})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  )
}
