'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Provider, ProviderType, CreateProviderRequest, UpdateProviderRequest } from '@/types'
import { PROVIDER_TYPE_OPTIONS, PROVIDER_PRESETS } from '@/constants/providers'
import {
  useCreateProvider,
  useUpdateProvider,
} from '@/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from '@/i18n'

interface ProviderFormData {
  name: string
  type: ProviderType
  api_base: string
  api_key: string
}

interface ProviderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: Provider | null
  onSuccess?: () => void
  onCreated?: (provider: Provider) => void
}

export function ProviderFormDialog({
  open,
  onOpenChange,
  provider,
  onSuccess,
  onCreated,
}: ProviderFormDialogProps) {
  const t = useTranslations()
  const createProvider = useCreateProvider()
  const updateProvider = useUpdateProvider()

  const isEditing = !!provider

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormData>({
    defaultValues: {
      name: provider?.name || '',
      type: provider?.type || 'openai',
      api_base: provider?.api_base || '',
      api_key: '',
    },
  })

  const selectedType = watch('type')

  // Update api_base when type changes (only for new providers)
  useEffect(() => {
    if (!isEditing && selectedType) {
      const preset = PROVIDER_PRESETS[selectedType]
      if (preset) {
        setValue('api_base', preset.defaultApiBase)
      }
    }
  }, [selectedType, isEditing, setValue])

  // Reset form when dialog opens/closes or provider changes
  useEffect(() => {
    if (open) {
      reset({
        name: provider?.name || '',
        type: provider?.type || 'openai',
        api_base: provider?.api_base || PROVIDER_PRESETS['openai'].defaultApiBase,
        api_key: '',
      })
    }
  }, [open, provider, reset])

  const onSubmit = async (data: ProviderFormData) => {
    try {
      if (isEditing && provider) {
        const updateData: UpdateProviderRequest = {
          name: data.name,
          api_base: data.api_base,
        }
        // Only include api_key if it was changed
        if (data.api_key && data.api_key !== '***') {
          updateData.api_key = data.api_key
        }
        await updateProvider.mutateAsync({ id: provider.id, data: updateData })
      } else {
        const createData: CreateProviderRequest = {
          name: data.name,
          type: data.type,
          api_base: data.api_base,
          api_key: data.api_key,
        }
        const newProvider = await createProvider.mutateAsync(createData)
        reset()
        onOpenChange(false)
        onCreated?.(newProvider)
        return
      }
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('provider.editProvider') : t('provider.addProvider')}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('provider.editProviderDesc')
              : t('provider.addProviderDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('provider.providerName')}</Label>
              <Input
                id="name"
                placeholder={t('provider.namePlaceholder')}
                {...register('name', { required: t('provider.nameRequired') })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="type">{t('provider.providerType')}</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => value && setValue('type', value as ProviderType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('provider.selectProviderType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {PROVIDER_PRESETS[option.value].icon} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api_base">{t('provider.apiBase')}</Label>
              <Input
                id="api_base"
                placeholder="https://api.openai.com/v1"
                {...register('api_base', { required: t('provider.apiBaseRequired') })}
              />
              {errors.api_base && (
                <p className="text-sm text-destructive">{errors.api_base.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">{t('provider.apiKey')}</Label>
              <Input
                id="api_key"
                type="password"
                placeholder={isEditing ? t('provider.apiKeyPlaceholder') : 'sk-...'}
                {...register('api_key', {
                  required: isEditing ? false : t('provider.apiKeyRequired'),
                })}
              />
              {errors.api_key && (
                <p className="text-sm text-destructive">{errors.api_key.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('provider.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
