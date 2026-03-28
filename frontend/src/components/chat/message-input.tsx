'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square } from 'lucide-react'
import { useChatStore } from '@/stores'
import { useTranslations } from '@/i18n'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  isLoading?: boolean
  disabled?: boolean
}

export function MessageInput({ onSend, onStop, isLoading, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevConversationIdRef = useRef<number | null>(null)
  const { currentConversationId, drafts, setDraft, clearDraft } = useChatStore()
  const t = useTranslations()

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120)
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  // Load draft only when conversation changes (not on every drafts update)
  useEffect(() => {
    if (prevConversationIdRef.current !== currentConversationId) {
      prevConversationIdRef.current = currentConversationId
      if (currentConversationId) {
        setContent(drafts[currentConversationId] || '')
      } else {
        setContent('')
      }
      // Reset textarea height when switching conversations
      setTimeout(adjustTextareaHeight, 0)
    }
  }, [currentConversationId, drafts, adjustTextareaHeight])

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isLoading || disabled) return

    onSend(content.trim())
    setContent('')

    // Reset textarea height after sending
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
    }

    if (currentConversationId) {
      clearDraft(currentConversationId)
    }
  }, [content, isLoading, disabled, onSend, currentConversationId, clearDraft])

  const handleChange = useCallback((value: string) => {
    setContent(value)
    adjustTextareaHeight()
    // Save draft directly on change
    if (currentConversationId && value) {
      setDraft(currentConversationId, value)
    }
  }, [currentConversationId, setDraft, adjustTextareaHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = content.trim() && !isLoading && !disabled

  return (
    <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={disabled}
          className={cn(
            'flex-1 min-h-[44px] max-h-[120px] resize-none py-3 px-4',
            'rounded-xl border-border/50',
            'focus:border-primary/30 focus:ring-primary/10',
            'placeholder:text-muted-foreground/50',
            'transition-colors duration-150',
            // Hide scrollbar
            'scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]'
          )}
          rows={1}
        />
        <Button
          onClick={isLoading ? onStop : handleSubmit}
          disabled={!isLoading && !canSend}
          size="icon"
          className={cn(
            'h-[44px] w-[44px] shrink-0 rounded-xl',
            'transition-all duration-150',
            isLoading 
              ? 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
              : canSend
                ? 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                : 'opacity-50'
          )}
        >
          {isLoading ? (
            <Square className="h-5 w-5 fill-current" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
        {t('chat.sendHint')}
      </p>
    </div>
  )
}
