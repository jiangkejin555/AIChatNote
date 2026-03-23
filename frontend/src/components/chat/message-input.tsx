'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useChatStore } from '@/stores'
import { useTranslations } from '@/i18n'

interface MessageInputProps {
  onSend: (content: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function MessageInput({ onSend, isLoading, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevConversationIdRef = useRef<number | null>(null)
  const { currentConversationId, drafts, setDraft, clearDraft } = useChatStore()
  const t = useTranslations()

  // Load draft only when conversation changes (not on every drafts update)
  useEffect(() => {
    if (prevConversationIdRef.current !== currentConversationId) {
      prevConversationIdRef.current = currentConversationId
      if (currentConversationId) {
        setContent(drafts[currentConversationId] || '')
      } else {
        setContent('')
      }
    }
  }, [currentConversationId, drafts])

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isLoading || disabled) return

    onSend(content.trim())
    setContent('')

    if (currentConversationId) {
      clearDraft(currentConversationId)
    }
  }, [content, isLoading, disabled, onSend, currentConversationId, clearDraft])

  const handleChange = useCallback((value: string) => {
    setContent(value)
    // Save draft directly on change
    if (currentConversationId && value) {
      setDraft(currentConversationId, value)
    }
  }, [currentConversationId, setDraft])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-4 border-t">
      <div className="max-w-3xl mx-auto flex gap-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading || disabled}
          className="shrink-0 h-[44px] w-[44px] p-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
