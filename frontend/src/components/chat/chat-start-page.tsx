'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface ChatStartPageProps {
  onSend: (content: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function ChatStartPage({
  onSend,
  isLoading,
  disabled
}: ChatStartPageProps) {
  const [content, setContent] = useState('')
  const t = useTranslations()

  const handleSubmit = () => {
    if (!content.trim() || isLoading || disabled) return
    onSend(content.trim())
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        {/* Welcome Message */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('chat.welcomeMessage')}
          </h2>
        </div>

        {/* Input Area */}
        <div className="w-full flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
    </div>
  )
}
