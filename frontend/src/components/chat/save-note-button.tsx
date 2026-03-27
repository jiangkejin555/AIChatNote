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
      className={`
        gap-1.5 cursor-pointer
        bg-gradient-to-r from-blue-50 to-sky-50
        dark:from-blue-950/30 dark:to-sky-950/30
        border-blue-200 dark:border-blue-800/50
        hover:from-blue-100 hover:to-sky-100
        dark:hover:from-blue-900/40 dark:hover:to-sky-900/40
        hover:border-blue-300 dark:hover:border-blue-700
        hover:shadow-sm hover:shadow-blue-200/50
        dark:hover:shadow-blue-900/30
        text-blue-700 dark:text-blue-300
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:shadow-none
      `}
    >
      <FileDown className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{t('chat.saveAsNote')}</span>
    </Button>
  )
}
