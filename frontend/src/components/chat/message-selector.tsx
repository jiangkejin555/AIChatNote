'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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

const PREVIEW_LENGTH = 100
const TOOLTIP_LENGTH = 300

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
    <div className="space-y-1">
      {/* Message List */}
      <ScrollArea className="w-[450px] max-h-[300px] min-h-[200px] rounded-md border">
        <div className="p-2 space-y-1">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {t('saveNote.noMessagesToSelect')}
            </div>
          ) : (
            messages.map((message) => {
              const isSelected = selectedIds.includes(message.id)
              const previewText = truncateText(message.content, PREVIEW_LENGTH)
              const tooltipText = truncateText(message.content, TOOLTIP_LENGTH)
              const showTooltip = message.content.length > PREVIEW_LENGTH

              const messageItem = (
                <div
                  onClick={() => handleToggleMessage(message.id)}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded border transition-all duration-150 cursor-pointer',
                    'hover:bg-accent',
                    isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-transparent border-transparent hover:border-border'
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleMessage(message.id)}
                    className="cursor-pointer shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Role Icon */}
                  <div className={cn(
                    'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                  </div>

                  {/* Role Label */}
                  <span className="text-xs text-muted-foreground shrink-0 w-6">
                    {message.role === 'user' ? t('common.me') : t('common.ai')}
                  </span>

                  {/* Message Preview */}
                  <span className="text-sm text-foreground/80 truncate flex-1">
                    {previewText}
                  </span>
                </div>
              )

              if (showTooltip) {
                return (
                  <Tooltip key={message.id}>
                    <TooltipTrigger render={messageItem} />
                    <TooltipContent
                      side="left"
                      sideOffset={8}
                      className="max-w-[280px] text-xs"
                    >
                      <p className="whitespace-pre-wrap">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={message.id}>{messageItem}</div>
            })
          )}
        </div>
      </ScrollArea>

      {/* Selection Summary */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{t('saveNote.totalMessages', { count: String(messages.length) })}</span>
          <span>{t('saveNote.selectedMessages', { count: String(selectedIds.length) })}</span>
        </div>
      )}
    </div>
  )
}
