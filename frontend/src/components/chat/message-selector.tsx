'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'
import type { Message } from '@/types'

interface MessageSelectorProps {
  messages: Message[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
}

const PREVIEW_LENGTH = 80
const TOOLTIP_LENGTH = 400

export function MessageSelector({
  messages,
  selectedIds,
  onSelectionChange,
}: MessageSelectorProps) {
  const t = useTranslations()

  const handleToggleMessage = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const truncateText = (text: string, length: number) => {
    const cleanText = text.replace(/\n/g, ' ').trim()
    if (cleanText.length <= length) return cleanText
    return cleanText.slice(0, length) + '...'
  }

  return (
    <TooltipProvider delay={300}>
      <div className="space-y-1.5">
        {/* Message List - Fixed height with internal scroll */}
        <div className="h-[240px] overflow-y-auto rounded-lg border bg-muted/30 overscroll-contain">
          <div className="p-1.5 space-y-0.5">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-xs">
                {t('saveNote.noMessagesToSelect')}
              </div>
            ) : (
              messages.map((message) => {
                const isSelected = selectedIds.includes(message.id)
                const previewText = truncateText(message.content, PREVIEW_LENGTH)
                const fullText = truncateText(message.content, TOOLTIP_LENGTH)

                const messageItem = (
                  <div
                    onClick={() => handleToggleMessage(message.id)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-150 cursor-pointer',
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    )}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleMessage(message.id)}
                      className={cn(
                        "cursor-pointer shrink-0 h-3.5 w-3.5",
                        isSelected && "border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Role Icon - smaller */}
                    <div className={cn(
                      'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-2.5 w-2.5" />
                      ) : (
                        <Bot className="h-2.5 w-2.5" />
                      )}
                    </div>

                    {/* Role Label */}
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-5">
                      {message.role === 'user' ? t('common.me') : t('common.ai')}
                    </span>

                    {/* Message Preview */}
                    <span className="text-xs text-foreground/80 truncate flex-1">
                      {previewText}
                    </span>
                  </div>
                )

                // Always wrap in tooltip so user can see full message on hover
                return (
                  <Tooltip key={message.id}>
                    <TooltipTrigger render={messageItem} />
                    <TooltipContent
                      side="left"
                      sideOffset={8}
                      className="max-w-[320px] text-xs whitespace-pre-wrap"
                    >
                      {fullText}
                    </TooltipContent>
                  </Tooltip>
                )
              })
            )}
          </div>
        </div>

        {/* Selection Summary */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-muted/40 rounded-md">
            <span className="text-muted-foreground">{t('saveNote.totalMessages', { count: String(messages.length) })}</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{t('saveNote.selectedMessages', { count: String(selectedIds.length) })}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
