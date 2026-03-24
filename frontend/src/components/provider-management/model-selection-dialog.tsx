'use client'

import { useState, useEffect, useCallback } from 'react'
import { Provider, ProviderModel, AvailableModel, PredefinedModel } from '@/types'
import { PROVIDER_PRESETS } from '@/constants/providers'
import {
  useAvailableModels,
  useSyncProviderModels,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  Download,
  X,
} from 'lucide-react'
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

// Local state for managing changes before sync
interface LocalModelState {
  models: ProviderModel[]  // Local copy of configured models
  pendingAdd: { model_id: string; display_name: string }[]
  pendingDelete: string[]  // ProviderModel IDs to delete
  pendingDefaultId: string | null  // ProviderModel ID to set as default
}

export function ModelSelectionDialog({
  open,
  onOpenChange,
  provider,
  onSuccess,
  isNewProvider = false,
}: ModelSelectionDialogProps) {
  const t = useTranslations()

  // Local state management
  const [localState, setLocalState] = useState<LocalModelState>({
    models: [],
    pendingAdd: [],
    pendingDelete: [],
    pendingDefaultId: null,
  })
  const [manualModelId, setManualModelId] = useState('')
  const [manualDisplayName, setManualDisplayName] = useState('')

  // Available models dialog state
  const [availableModelsDialogOpen, setAvailableModelsDialogOpen] = useState(false)
  const [selectedAvailableModels, setSelectedAvailableModels] = useState<Set<string>>(new Set())

  // Connection test state
  const [testModelId, setTestModelId] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  // Unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)

  // Queries and mutations
  const { data: availableModelsData, isLoading: isLoadingAvailable, refetch: refetchAvailable, isFetching } = useAvailableModels(
    provider?.id || ''
  )
  const syncModels = useSyncProviderModels()

  const preset = provider ? PROVIDER_PRESETS[provider.type] : null

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open && provider) {
      const models = provider.models || []
      const defaultModel = models.find((m) => m.is_default)
      setLocalState({
        models: [...models],
        pendingAdd: [],
        pendingDelete: [],
        pendingDefaultId: defaultModel?.id || null,
      })
      setManualModelId('')
      setManualDisplayName('')
      setTestResult(null)
      setTestModelId(null)
      setSelectedAvailableModels(new Set())
    }
  }, [open, provider])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return (
      localState.pendingAdd.length > 0 ||
      localState.pendingDelete.length > 0 ||
      (localState.pendingDefaultId !== null &&
        localState.pendingDefaultId !== (provider?.models?.find((m) => m.is_default)?.id || null))
    )
  }, [localState, provider?.models])

  // Handle dialog close with unsaved changes check
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges()) {
      setPendingClose(true)
      setShowUnsavedDialog(true)
    } else {
      onOpenChange(newOpen)
    }
  }

  // Confirm discard changes
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false)
    if (pendingClose) {
      onOpenChange(false)
      setPendingClose(false)
    }
  }

  // Cancel close
  const handleKeepEditing = () => {
    setShowUnsavedDialog(false)
    setPendingClose(false)
  }

  // Add model locally
  const handleAddModel = (modelId: string, displayName: string) => {
    const name = displayName || modelId

    // Check if model was previously deleted (in pendingDelete)
    // If so, restore it instead of adding as new
    const originalModel = provider?.models?.find((m) => m.model_id === modelId)
    const wasDeleted = originalModel && localState.pendingDelete.includes(originalModel.id)

    if (wasDeleted && originalModel) {
      // Restore the deleted model: remove from pendingDelete and add back to models
      setLocalState((prev) => ({
        ...prev,
        pendingDelete: prev.pendingDelete.filter((id) => id !== originalModel.id),
        models: [...prev.models, originalModel],
      }))
      return true
    }

    // Check if already exists in current models or pending adds
    const existsInModels = localState.models.some((m) => m.model_id === modelId)
    const existsInPending = localState.pendingAdd.some((m) => m.model_id === modelId)

    if (existsInModels || existsInPending) {
      toast.error(t('provider.modelAlreadyExists'))
      return false
    }

    setLocalState((prev) => ({
      ...prev,
      pendingAdd: [...prev.pendingAdd, { model_id: modelId, display_name: name }],
    }))
    return true
  }

  // Remove model locally
  const handleRemoveModel = (modelId: string, isPending: boolean) => {
    if (isPending) {
      // Remove from pending add
      setLocalState((prev) => ({
        ...prev,
        pendingAdd: prev.pendingAdd.filter((m) => m.model_id !== modelId),
      }))
    } else {
      // Mark for deletion
      setLocalState((prev) => ({
        ...prev,
        pendingDelete: [...prev.pendingDelete, modelId],
        models: prev.models.filter((m) => m.id !== modelId),
        pendingDefaultId: prev.pendingDefaultId === modelId ? null : prev.pendingDefaultId,
      }))
    }
  }

  // Set default model
  const handleSetDefault = (modelId: string) => {
    setLocalState((prev) => ({
      ...prev,
      pendingDefaultId: prev.pendingDefaultId === modelId ? null : modelId,
    }))
  }

  // Add manual model
  const handleAddManualModel = () => {
    if (!manualModelId.trim()) {
      toast.error(t('provider.pleaseEnterModelId'))
      return
    }
    if (handleAddModel(manualModelId.trim(), manualDisplayName.trim())) {
      setManualModelId('')
      setManualDisplayName('')
    }
  }

  // Test connection
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
    } catch {
      const result = { success: false, message: t('provider.testFailed') }
      setTestResult(result)
      toast.error(result.message)
    } finally {
      setIsTesting(false)
    }
  }

  // Handle available models selection
  const handleToggleAvailableModel = (modelId: string, isAlreadyAdded: boolean) => {
    if (isAlreadyAdded) return

    const newSelected = new Set(selectedAvailableModels)
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId)
    } else {
      newSelected.add(modelId)
    }
    setSelectedAvailableModels(newSelected)
  }

  // Add selected available models to local state
  const handleAddSelectedAvailableModels = () => {
    const models = availableModelsData?.models || []
    let addedCount = 0

    selectedAvailableModels.forEach((modelId) => {
      const model = models.find((m) => m.id === modelId)
      if (model && handleAddModel(modelId, model.name || modelId)) {
        addedCount++
      }
    })

    if (addedCount > 0) {
      toast.success(t('provider.addSelectedModels') + ` (${addedCount})`)
    }
    setSelectedAvailableModels(new Set())
    setAvailableModelsDialogOpen(false)
  }

  // Save all changes
  const handleSave = async () => {
    if (!provider) return

    const hasChanges =
      localState.pendingAdd.length > 0 ||
      localState.pendingDelete.length > 0 ||
      localState.pendingDefaultId !== null

    if (!hasChanges) {
      toast.info(t('provider.noNewModels'))
      onOpenChange(false)
      return
    }

    // Check if the default model is a pending add (has pending- prefix)
    const isPendingDefault = localState.pendingDefaultId?.startsWith('pending-')
    const pendingDefaultIndex = isPendingDefault
      ? parseInt(localState.pendingDefaultId!.replace('pending-', ''), 10)
      : -1

    // Build add list with is_default flag for pending models
    const modelsToAdd = localState.pendingAdd.map((m, index) => ({
      ...m,
      is_default: index === pendingDefaultIndex,
    }))

    // default_model_id only for existing models (real UUID)
    const defaultModelId =
      localState.pendingDefaultId && !isPendingDefault
        ? localState.pendingDefaultId
        : undefined

    try {
      await syncModels.mutateAsync({
        providerId: provider.id,
        data: {
          add: modelsToAdd.length > 0 ? modelsToAdd : undefined,
          delete: localState.pendingDelete.length > 0 ? localState.pendingDelete : undefined,
          default_model_id: defaultModelId,
        },
      })
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled in mutation
    }
  }

  // Get display models for available models dialog
  const availableModels = availableModelsData?.models || []
  const isPredefined = availableModelsData?.isPredefined || false
  const displayAvailableModels: (AvailableModel | PredefinedModel)[] =
    availableModels.length > 0
      ? availableModels
      : preset?.predefinedModels || []

  // Get all configured model IDs (including pending adds)
  const configuredModelIds = new Set([
    ...localState.models.map((m) => m.model_id),
    ...localState.pendingAdd.map((m) => m.model_id),
  ])

  // Render model item
  const renderModelItem = (
    modelId: string,
    displayName: string,
    id: string,
    isDefault: boolean,
    isPending: boolean = false
  ) => {
    // If a new default is being set, only show default for that model
    // Otherwise, show default for the original default model
    const isCurrentDefault = localState.pendingDefaultId === id
    const showDefault = localState.pendingDefaultId
      ? isCurrentDefault
      : isDefault

    return (
      <div
        key={id}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          'hover:bg-accent/50',
          localState.pendingDelete.includes(id) && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {showDefault && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <Star className="h-3 w-3 mr-1" />
                  {t('provider.defaultModel')}
                </Badge>
              )}
              {isPending && (
                <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
                  {t('provider.addSelectedModels')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{modelId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
                <XCircle className="h-3.5 w-3.5" />
              )}
            </div>
          )}
          {/* Test button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTestConnection(modelId)}
            disabled={isTesting && testModelId === modelId}
            className="h-8 px-2"
          >
            {isTesting && testModelId === modelId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              t('provider.test')
            )}
          </Button>
          {/* Set as default button */}
          {!showDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetDefault(id)}
              className="h-8"
            >
              {t('provider.setAsDefault')}
            </Button>
          )}
          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveModel(isPending ? modelId : id, isPending)}
            className="h-8 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {isNewProvider
                ? t('provider.selectModelsForProvider')
                : t('provider.selectModelsFor', { name: provider?.name || '' })}
            </DialogTitle>
            <DialogDescription>
              {isNewProvider
                ? t('provider.selectModelsDescNew')
                : t('provider.manageModels')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Header with fetch button */}
            <div className="flex items-center justify-between">
              <Label className="text-base">{t('provider.configuredModels')}</Label>
              {preset?.supportsDynamicModels && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvailableModelsDialogOpen(true)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('provider.fetchAvailableModels')}
                </Button>
              )}
            </div>

            {/* Configured models list */}
            <div className="space-y-2">
              {localState.models.length > 0 || localState.pendingAdd.length > 0 ? (
                <ScrollArea className="h-[280px] border rounded-lg p-2">
                  <div className="space-y-2">
                    {/* Existing models */}
                    {localState.models
                      .filter((m) => !localState.pendingDelete.includes(m.id))
                      .map((model) =>
                        renderModelItem(
                          model.model_id,
                          model.display_name,
                          model.id,
                          model.is_default
                        )
                      )}
                    {/* Pending add models */}
                    {localState.pendingAdd.map((model, index) =>
                      renderModelItem(
                        model.model_id,
                        model.display_name,
                        `pending-${index}`,
                        false,
                        true
                      )
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('provider.noConfiguredModels')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAvailableModelsDialogOpen(true)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t('provider.fetchAvailableModels')}
                  </Button>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualModel()}
                />
                <Input
                  placeholder={t('provider.displayNamePlaceholder')}
                  value={manualDisplayName}
                  onChange={(e) => setManualDisplayName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddManualModel()}
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
              onClick={() => handleOpenChange(false)}
            >
              {isNewProvider ? t('provider.configureLater') : t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                syncModels.isPending ||
                (localState.models.length === 0 && localState.pendingAdd.length === 0)
              }
            >
              {syncModels.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('provider.saving')}
                </>
              ) : (
                t('provider.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Available Models Dialog */}
      <Dialog open={availableModelsDialogOpen} onOpenChange={setAvailableModelsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t('provider.availableModelsList')}</DialogTitle>
            <DialogDescription>
              {t('provider.selectModelsDescNew')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Select all / deselect all */}
            {displayAvailableModels.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allIds = displayAvailableModels
                        .filter((m) => {
                          const id = 'id' in m ? m.id : m.model_id
                          return !configuredModelIds.has(id)
                        })
                        .map((m) => ('id' in m ? m.id : m.model_id))
                      setSelectedAvailableModels(new Set(allIds))
                    }}
                  >
                    {t('provider.selectAll')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAvailableModels(new Set())}
                  >
                    {t('provider.deselectAll')}
                  </Button>
                </div>
                {selectedAvailableModels.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {t('provider.selectedCount').replace('{count}', String(selectedAvailableModels.size))}
                  </span>
                )}
              </div>
            )}

            {/* Loading state */}
            {isLoadingAvailable ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : displayAvailableModels.length > 0 ? (
              <ScrollArea className="h-[260px] border rounded-lg p-2">
                <div className="space-y-1">
                  {displayAvailableModels.map((model) => {
                    const modelId = 'id' in model ? model.id : model.model_id
                    const displayName = 'name' in model ? model.name : model.display_name
                    const isAlreadyAdded = configuredModelIds.has(modelId)
                    const isSelected = selectedAvailableModels.has(modelId)

                    return (
                      <div
                        key={modelId}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg transition-colors',
                          isAlreadyAdded
                            ? 'bg-muted/50 opacity-60'
                            : isSelected
                              ? 'bg-accent'
                              : 'hover:bg-accent/50'
                        )}
                      >
                        <Checkbox
                          checked={isSelected || isAlreadyAdded}
                          disabled={isAlreadyAdded}
                          onCheckedChange={() =>
                            handleToggleAvailableModel(modelId, isAlreadyAdded)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{modelId}</p>
                        </div>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="text-xs">
                            {t('provider.alreadyAdded')}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('provider.noAvailableModelsToAdd')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailableModelsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              {t('common.close')}
            </Button>
            <Button
              onClick={handleAddSelectedAvailableModels}
              disabled={selectedAvailableModels.size === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('provider.addSelectedModels')}
              {selectedAvailableModels.size > 0 && ` (${selectedAvailableModels.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('provider.unsavedChanges')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('provider.unsavedChangesDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepEditing}>
              {t('provider.keepEditing')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>
              {t('provider.discardChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
