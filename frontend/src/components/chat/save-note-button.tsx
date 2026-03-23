'use client'

import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/i18n'

interface SaveNoteButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function SaveNoteButton({ onClick, disabled }: SaveNoteButtonProps) {
  const t = useTranslations()

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="gap-2 cursor-pointer transition-colors duration-200"
    >
      <FileDown className="h-4 w-4" />
      <span>{t('chat.saveAsNote')}</span>
    </Button>
  )
}
