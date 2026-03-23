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

// Toggle mock mode - set to false when backend is ready
const USE_MOCK = true

// Mock responses for demo
const MOCK_RESPONSES = [
  '这是一个模拟的 AI 响应。在实际环境中，这里会调用真实的 LLM API 并流式返回内容。\n\n如果你看到这条消息，说明 mock 模式正在正常工作。',
  '好的，我来帮你解答这个问题。\n\n在 mock 模式下，我会返回预设的响应内容。要使用真实的 AI 功能，需要启动后端服务并设置 `USE_MOCK = false`。',
  '这是一个演示响应。\n\nMock 模式允许你在没有后端服务的情况下测试前端功能。',
]

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
        if (USE_MOCK) {
          // === Mock Stream Implementation ===
          const messageId = Date.now().toString()
          onMessageStart?.(messageId)

          // Simulate streaming with random response
          const responseText = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]

          // Stream character by character to simulate real streaming
          let fullContent = ''
          const chars = responseText.split('')

          for (const char of chars) {
            // Check if stopped
            if (stopRef.current) break

            await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30))
            fullContent += char
            onMessageChunk?.(char)
          }

          // Create message object
          const tempMessage: Message = {
            id: parseInt(messageId),
            conversation_id: conversationId,
            role: 'assistant',
            content: fullContent,
            created_at: new Date().toISOString(),
          }

          onMessageEnd?.(tempMessage)
        } else {
          // === Real Stream Implementation ===
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
              throw new Error(`HTTP error! status: ${response.status}`)
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
