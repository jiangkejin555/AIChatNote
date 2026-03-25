'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface ModelSwitchConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelName: string // Format: "Provider/Model"
  onConfirm: () => void
  isLoading?: boolean
}

export function ModelSwitchConfirmDialog({
  open,
  onOpenChange,
  modelName,
  onConfirm,
  isLoading,
}: ModelSwitchConfirmDialogProps) {
  const t = useTranslations()

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('chat.switchModel')}</DialogTitle>
          <DialogDescription>
            {t('chat.switchModelDesc', { model: modelName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
