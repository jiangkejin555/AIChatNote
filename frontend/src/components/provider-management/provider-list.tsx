'use client'

import { useState } from 'react'
import { Provider } from '@/types'
import {
  useProviders,
  useDeleteProvider,
} from '@/hooks'
import { ProviderCard } from './provider-card'
import { ProviderFormDialog } from './provider-form-dialog'
import { ModelSelectionDialog } from './model-selection-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
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
import { useTranslations } from '@/i18n'

export function ProviderList() {
  const t = useTranslations()
  const { data: providers, isLoading, refetch } = useProviders()
  const deleteProvider = useDeleteProvider()

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [modelSelectionProvider, setModelSelectionProvider] = useState<Provider | null>(null)
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null)
  const [newlyCreatedProvider, setNewlyCreatedProvider] = useState<Provider | null>(null)

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setFormDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingProvider(null)
    setNewlyCreatedProvider(null)
    setFormDialogOpen(true)
  }

  const handleManageModels = (provider: Provider) => {
    setModelSelectionProvider(provider)
    setModelDialogOpen(true)
  }

  const handleDelete = (provider: Provider) => {
    setProviderToDelete(provider)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (providerToDelete) {
      deleteProvider.mutate(providerToDelete.id)
      setDeleteDialogOpen(false)
      setProviderToDelete(null)
    }
  }

  // After provider is created, open model selection dialog
  const handleProviderCreated = async (provider: Provider) => {
    setNewlyCreatedProvider(provider)
    await refetch()
    setModelSelectionProvider(provider)
    setModelDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!providers || providers.length === 0) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">{t('provider.pleaseAddProvider')}</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t('provider.addFirstProvider')}
            </Button>
          </CardContent>
        </Card>

        <ProviderFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          provider={editingProvider}
          onCreated={handleProviderCreated}
        />
      </>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="relative">
            <ProviderCard
              provider={provider}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageModels={handleManageModels}
            />
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('provider.addProvider')}
        </Button>
      </div>

      <ProviderFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        provider={editingProvider}
        onCreated={handleProviderCreated}
      />

      <ModelSelectionDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        provider={modelSelectionProvider}
        isNewProvider={!!newlyCreatedProvider}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('provider.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('provider.confirmDeleteProviderDesc', { name: providerToDelete?.name || '' })}
              {providerToDelete && providerToDelete.models.length > 0 && (
                <span className="block mt-2 text-destructive">
                  {t('provider.deleteModelsWarning', { count: String(providerToDelete.models.length) })}
                </span>
              )}
              <span className="block mt-2">{t('provider.cannotUndo')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
