'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  const { startStreaming, stopStreaming, isConversationStreaming } = useChatStore()
  const stopRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Use refs to store callbacks to avoid stale closure issues
  // and prevent unnecessary re-renders when callbacks change
  const onMessageStartRef = useRef(onMessageStart)
  const onMessageChunkRef = useRef(onMessageChunk)
  const onMessageEndRef = useRef(onMessageEnd)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onMessageStartRef.current = onMessageStart
    onMessageChunkRef.current = onMessageChunk
    onMessageEndRef.current = onMessageEnd
    onErrorRef.current = onError
  }, [onMessageStart, onMessageChunk, onMessageEnd, onError])

  const stopStreamingCallback = useCallback(() => {
    stopRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    if (conversationId) {
      stopStreaming(conversationId)
    }
  }, [conversationId, stopStreaming])

  const streamMessage = useCallback(
    async (content: string, overrideConversationId?: number, requestId?: string) => {
      const targetConversationId = overrideConversationId || conversationId
      if (!targetConversationId) {
        onErrorRef.current?.(new Error('No conversation ID'))
        return
      }

      // Check if this specific conversation is already streaming
      if (isConversationStreaming(targetConversationId)) {
        return
      }

      setIsStreaming(true)
      startStreaming(targetConversationId)
      stopRef.current = false

      try {
        if (!token) {
          onErrorRef.current?.(new Error('未登录'))
          return
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

        const controller = new AbortController()
        abortControllerRef.current = controller
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 1 minutes timeout

        try {
          const response = await fetch(`${API_URL}/conversations/${targetConversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            body: JSON.stringify({
              content,
              stream: true,
              request_id: requestId,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            // Clear timeout before throwing error to prevent AbortError
            clearTimeout(timeoutId)
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
              // If there's an error from the stream chunk, throw it so it gets handled
              if (chunk.error) {
                throw new Error(chunk.error)
              }
              break
            }

            if (chunk.id && !messageId) {
              messageId = chunk.id
              onMessageStartRef.current?.(messageId)
            }

            fullContent += chunk.content
            onMessageChunkRef.current?.(chunk.content)
          }

          // Create a temporary message object for the UI
          const tempMessage: Message = {
            id: parseInt(messageId) || Date.now(),
            conversation_id: targetConversationId,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          }

          onMessageEndRef.current?.(tempMessage)
        } finally {
          clearTimeout(timeoutId)
        }
      } catch (error) {
        const err = error as Error
        // 如果是用户主动停止（stopRef.current 为 true）产生的 AbortError，则忽略报错
        if (err.name === 'AbortError' && stopRef.current) {
          console.log('Stream manually aborted by user.')
          // 虽然中止了，但也需要在 UI 上触发一个空或残断的消息结束事件，以确保能够重置消息列表中的状态
          onMessageEndRef.current?.({
            id: Date.now(),
            conversation_id: targetConversationId,
            role: 'assistant',
            content: '', // 这里因为在 hook 外面有状态管理，只需要通知 end 即可
            created_at: new Date().toISOString(),
          })
          return
        }

        console.error('Stream error:', error)

        // Return user-friendly error message
        if (err.name === 'AbortError') {
          onErrorRef.current?.(new Error('请求超时，请稍后重试'))
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          onErrorRef.current?.(new Error('大模型服务不可用，请检查网络连接或稍后重试'))
        } else {
          onErrorRef.current?.(new Error('大模型不可用：' + err.message))
        }
      } finally {
        setIsStreaming(false)
        if (targetConversationId) {
          stopStreaming(targetConversationId)
        }
      }
    },
    [isConversationStreaming, startStreaming, stopStreaming, token, conversationId]
  )

  return {
    isStreaming,
    streamMessage,
    stopStreaming: stopStreamingCallback,
  }
}
