import type { StreamChunk } from '@/types'

export interface SSEMessage {
  id: string
  content: string
  done: boolean
  error?: string
}

export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEMessage> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const message = parseSSEMessage(buffer)
          if (message) {
            yield message
          }
        }
        yield { id: '', content: '', done: true }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Process complete messages (separated by double newlines)
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || '' // Keep incomplete message in buffer

      for (const line of lines) {
        const message = parseSSEMessage(line)
        if (message) {
          yield message
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSSEMessage(data: string): SSEMessage | null {
  if (!data.trim() || !data.startsWith('data: ')) {
    return null
  }

  const jsonStr = data.slice(6).trim() // Remove 'data: ' prefix

  if (jsonStr === '[DONE]') {
    return { id: '', content: '', done: true }
  }

  try {
    const chunk: StreamChunk = JSON.parse(jsonStr)
    const content = chunk.choices[0]?.delta?.content || ''
    const id = chunk.id

    return {
      id,
      content,
      done: chunk.choices[0]?.finish_reason === 'stop',
    }
  } catch {
    console.error('Failed to parse SSE message:', jsonStr)
    return null
  }
}

export function createSSEConnection(
  url: string,
  body: object,
  token: string
): Promise<ReadableStream<Uint8Array>> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    if (!response.body) {
      throw new Error('No response body')
    }
    return response.body
  })
}
