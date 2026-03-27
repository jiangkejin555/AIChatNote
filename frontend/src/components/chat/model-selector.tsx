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
    return (
      <div className="h-9 w-64 rounded-xl bg-muted/30 animate-pulse flex items-center gap-2 px-3">
        <div className="h-3 w-12 bg-muted-foreground/10 rounded" />
        <div className="h-3 w-1 bg-muted-foreground/10 rounded" />
        <div className="h-3 w-16 bg-muted-foreground/10 rounded" />
      </div>
    )
  }

  // Show deleted model state
  if (isModelDeleted && deletedModelId) {
    return (
      <div
        className={cn(
          "h-9 px-3 py-2 rounded-xl border border-dashed border-destructive/30",
          "flex items-center gap-2 text-sm",
          "bg-destructive/5 text-destructive/80"
        )}
      >
        <span className="line-through decoration-destructive/50">{t('provider.modelDeleted')}</span>
        <span className="text-destructive/40">·</span>
        <span className="font-medium">{deletedModelId}</span>
      </div>
    )
  }

  if (!providers || providers.length === 0) {
    return (
      <div className={cn(
        "h-9 px-3 rounded-xl border border-dashed border-border/50",
        "flex items-center gap-2 text-sm text-muted-foreground/70",
        "bg-muted/20"
      )}>
        {t('provider.pleaseAddProvider')}
      </div>
    )
  }

  if (allModels.length === 0) {
    return (
      <div className={cn(
        "h-9 px-3 rounded-xl border border-dashed border-border/50",
        "flex items-center gap-2 text-sm text-muted-foreground/70",
        "bg-muted/20"
      )}>
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
      <SelectTrigger
        className={cn(
          'w-64 h-9 rounded-xl border-border/50',
          'bg-background/60 backdrop-blur-sm',
          'hover:bg-background hover:border-border hover:shadow-sm',
          'transition-all duration-200',
          'focus:ring-2 focus:ring-primary/20 focus:border-primary/30'
        )}
      >
        <SelectValue placeholder={t('chat.selectModel')}>
          {selectedModel
            ? (
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground/70">{selectedModel.providerName}</span>
                <span className="text-muted-foreground/30">/</span>
                <span className="font-medium">{selectedModel.display_name || selectedModel.model_id}</span>
              </span>
            )
            : defaultModel
              ? (
                <span className="flex items-center gap-2">
                <span className="text-muted-foreground/70">{defaultModel.providerName}</span>
                <span className="text-muted-foreground/30">/</span>
                <span className="font-medium">{defaultModel.display_name || defaultModel.model_id}</span>
                </span>
              )
              : t('chat.selectModel')}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn(
          'rounded-xl border-border/50 shadow-lg shadow-black/5',
          'bg-popover/95 backdrop-blur-xl'
        )}
      >
        {Array.from(groupedModels.entries()).map(([key, models]) => {
          const firstModel = models[0]
          const icon = getProviderIcon(firstModel.providerType as any)

          return (
            <SelectGroup key={key}>
              <SelectLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                <span className="opacity-70">{icon}</span>
                <span>{firstModel.providerName}</span>
              </SelectLabel>
              {models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className={cn(
                    'relative rounded-lg mx-1 transition-all duration-150',
                    'hover:bg-accent/50 hover:translate-x-0.5',
                    'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1">{model.display_name || model.model_id}</span>
                    {model.is_default && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary font-medium">
                    {t('provider.defaultModel')}
                  </span>
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
