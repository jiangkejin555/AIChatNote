'use client'

import { useState, useEffect } from 'react'
import { Provider, AvailableModel, PredefinedModel } from '@/types'
import { PROVIDER_PRESETS } from '@/constants/providers'
import {
  useAvailableModels,
  useBatchAddProviderModels,
} from '@/hooks'
import { providersApi, ConnectionTestResult } from '@/lib/api/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Plus, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'

interface ModelSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: Provider | null
  onSuccess?: () => void
  isNewProvider?: boolean
}

export function ModelSelectionDialog({
  open,
  onOpenChange,
  provider,
  onSuccess,
  isNewProvider = false,
}: ModelSelectionDialogProps) {
  const t = useTranslations()
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null)
  const [manualModelId, setManualModelId] = useState('')
  const [manualDisplayName, setManualDisplayName] = useState('')

  // Connection test state
  const [testModelId, setTestModelId] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const { data, isLoading, error, refetch, isFetching } = useAvailableModels(
    provider?.id || ''
  )

  const batchAddModels = useBatchAddProviderModels()

  const preset = provider ? PROVIDER_PRESETS[provider.type] : null

  // Reset selection when dialog opens
  useEffect(() => {
    if (open && provider) {
      const existingModelIds = new Set(provider.models.map((m) => m.model_id))
      setSelectedModels(existingModelIds)
      const defaultModel = provider.models.find((m) => m.is_default)
      setDefaultModelId(defaultModel?.model_id || null)
      setManualModelId('')
      setManualDisplayName('')
      setTestResult(null)
      setTestModelId(null)
    }
  }, [open, provider])

  const handleToggleModel = (modelId: string) => {
    const newSelected = new Set(selectedModels)
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId)
      if (defaultModelId === modelId) {
        setDefaultModelId(null)
      }
    } else {
      newSelected.add(modelId)
    }
    setSelectedModels(newSelected)
  }

  const handleSetDefault = (modelId: string) => {
    setDefaultModelId(defaultModelId === modelId ? null : modelId)
  }

  const handleAddManualModel = () => {
    if (!manualModelId.trim()) {
      toast.error(t('provider.enterModelId'))
      return
    }
    if (selectedModels.has(manualModelId.trim())) {
      toast.error(t('provider.modelAlreadyExists'))
      return
    }
    setSelectedModels(new Set([...selectedModels, manualModelId.trim()]))
    if (!defaultModelId) {
      setDefaultModelId(manualModelId.trim())
    }
    setManualModelId('')
    setManualDisplayName('')
  }

  const handleTestConnection = async (modelId: string) => {
    if (!provider) return

    setIsTesting(true)
    setTestModelId(modelId)
    setTestResult(null)

    try {
      const result = await providersApi.testConnection(provider.id, modelId)
      setTestResult(result)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      const result = { success: false, message: t('provider.testFailed') }
      setTestResult(result)
      toast.error(result.message)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!provider) return

    const existingModelIds = new Set(provider.models.map((m) => m.model_id))
    const newModels = [...selectedModels]
      .filter((id) => !existingModelIds.has(id))
      .map((id) => {
        // Check if it's a predefined model to get display name
        const predefined = preset?.predefinedModels.find((m) => m.model_id === id)
        return {
          model_id: id,
          display_name: predefined?.display_name || id,
        }
      })

    if (newModels.length === 0) {
      toast.info(t('provider.noNewModels'))
      onOpenChange(false)
      return
    }

    try {
      await batchAddModels.mutateAsync({
        providerId: provider.id,
        data: {
          models: newModels,
          default_model_id: defaultModelId || undefined,
        },
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error handled in mutation
    }
  }

  const models = data?.models || []
  const isPredefined = data?.isPredefined || false

  // Use predefined models if dynamic fetch failed or not supported
  const displayModels: (AvailableModel | PredefinedModel)[] =
    error || !data
      ? preset?.predefinedModels || []
      : models.length > 0
        ? models
        : preset?.predefinedModels || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isNewProvider ? t('provider.selectModelsForProvider') : t('provider.selectModelsFor', { name: provider?.name || '' })}
          </DialogTitle>
          <DialogDescription>
            {isNewProvider
              ? t('provider.selectModelsDesc')
              : preset?.supportsDynamicModels
                ? t('provider.fetchOrAddModels')
                : t('provider.selectFromPredefined')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{t('provider.fetchModelsFailed')}</span>
            </div>
          )}

          {/* Model list header with fetch button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('provider.availableModels')}</Label>
              {preset?.supportsDynamicModels && (
                <div className="flex items-center gap-2">
                  {isPredefined && (
                    <span className="text-xs text-muted-foreground">
                      {t('provider.usingPredefined')}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    {t('provider.fetchModels')}
                  </Button>
                </div>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : displayModels.length > 0 ? (
              <ScrollArea className="h-[250px] border rounded-md p-2">
                <div className="space-y-1">
                  {displayModels.map((model) => {
                    const modelId = 'id' in model ? model.id : model.model_id
                    const displayName =
                      'name' in model ? model.name : model.display_name
                    const isSelected = selectedModels.has(modelId)
                    const isDefault = defaultModelId === modelId

                    return (
                      <div
                        key={modelId}
                        className="flex items-center justify-between p-2 rounded hover:bg-accent"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleModel(modelId)}
                          />
                          <div>
                            <p className="text-sm font-medium">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{modelId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Test result indicator */}
                          {testModelId === modelId && testResult && (
                            <div
                              className={cn(
                                'flex items-center gap-1 text-xs',
                                testResult.success ? 'text-green-600' : 'text-red-500'
                              )}
                            >
                              {testResult.success ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>{testResult.latency}ms</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                </>
                              )}
                            </div>
                          )}
                          {/* Test button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestConnection(modelId)}
                            disabled={isTesting && testModelId === modelId}
                            className="h-7 px-2"
                          >
                            {isTesting && testModelId === modelId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              t('provider.test')
                            )}
                          </Button>
                          {isSelected && (
                            <Button
                              variant={isDefault ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleSetDefault(modelId)}
                              className="h-7"
                            >
                              {isDefault ? t('provider.defaultModel') : t('provider.setAsDefault')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
                {t('provider.noAvailableModels')}
              </div>
            )}
          </div>

          {/* Manual add */}
          <div className="space-y-2">
            <Label>{t('provider.manualAdd')}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={t('provider.modelIdPlaceholder')}
                value={manualModelId}
                onChange={(e) => setManualModelId(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder={t('provider.displayNamePlaceholder')}
                value={manualDisplayName}
                onChange={(e) => setManualDisplayName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddManualModel}
                disabled={!manualModelId.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {isNewProvider ? t('provider.configureLater') : t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={batchAddModels.isPending || selectedModels.size === 0}
          >
            {batchAddModels.isPending
              ? t('provider.saving')
              : isNewProvider
                ? t('provider.completeSetup')
                : t('provider.saveSelected')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
