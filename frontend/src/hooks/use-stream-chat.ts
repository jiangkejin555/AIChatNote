'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuthStore, useChatStore } from '@/stores'
import { parseSSEStream } from '@/lib/stream'
import type { Message } from '@/types'

interface UseStreamChatOptions {
  conversationId: number
  onMessageStart?: (messageId: string) => void
  onMessageChunk?: (content: string) => void
  onMessageEnd?: (message: Message) => void
  onError?: (error: Error) => void
}

export function useStreamChat({
  conversationId,
  onMessageStart,
  onMessageChunk,
  onMessageEnd,
  onError,
}: UseStreamChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const { token } = useAuthStore()
  const { setIsStreaming: setGlobalStreaming } = useChatStore()
  const stopRef = useRef(false)

  const stopStreaming = useCallback(() => {
    stopRef.current = true
    setIsStreaming(false)
    setGlobalStreaming(false)
  }, [setGlobalStreaming])

  const streamMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return

      setIsStreaming(true)
      setGlobalStreaming(true)
      stopRef.current = false

      try {
        if (!token) {
          onError?.(new Error('未登录'))
          return
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

        try {
          const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            body: JSON.stringify({
              content,
              stream: true,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            // Try to parse error message from response body
            let errorMessage = `HTTP error! status: ${response.status}`
            try {
              const errorData = await response.json()
              if (errorData.message) {
                errorMessage = errorData.message
              } else if (errorData.error) {
                errorMessage = errorData.error
              }
            } catch {
              // Ignore JSON parse errors
            }
            throw new Error(errorMessage)
          }

          if (!response.body) {
            throw new Error('No response body')
          }

          let fullContent = ''
          let messageId = ''

          for await (const chunk of parseSSEStream(response.body)) {
            if (stopRef.current || chunk.done) {
              break
            }

            if (chunk.id && !messageId) {
              messageId = chunk.id
              onMessageStart?.(messageId)
            }

            fullContent += chunk.content
            onMessageChunk?.(chunk.content)
          }

          // Create a temporary message object for the UI
          const tempMessage: Message = {
            id: parseInt(messageId) || Date.now(),
            conversation_id: conversationId,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          }

          onMessageEnd?.(tempMessage)
        } finally {
          clearTimeout(timeoutId)
        }
      } catch (error) {
        console.error('Stream error:', error)
        const err = error as Error

        // Return user-friendly error message
        if (err.name === 'AbortError') {
          onError?.(new Error('请求超时，请稍后重试'))
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          onError?.(new Error('大模型服务不可用，请检查网络连接或稍后重试'))
        } else {
          onError?.(new Error('大模型不可用：' + err.message))
        }
      } finally {
        setIsStreaming(false)
        setGlobalStreaming(false)
      }
    },
    [isStreaming, token, conversationId, onMessageStart, onMessageChunk, onMessageEnd, onError, setGlobalStreaming]
  )

  return {
    isStreaming,
    streamMessage,
    stopStreaming,
  }
}
