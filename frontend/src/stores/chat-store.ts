import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message } from '@/types'

// Streaming state per conversation to support concurrent chats
export interface ConversationStreamingState {
  content: string
  optimisticMessages: Message[]
  baseMessageCount?: number
  isThinking: boolean
  isTimeout: boolean
  isCancelled: boolean
  lastUserMessage: string
  requestId: string | null
}

interface ChatState {
  currentConversationId: number | null
  drafts: Record<number, string>
  isPendingNewChat: boolean
  // Per-conversation streaming states (keyed by conversation ID)
  streamingStates: Record<number, ConversationStreamingState>
  // Set of conversation IDs currently streaming
  streamingConversationIds: Set<number>

  setCurrentConversation: (id: number | null) => void
  setIsPendingNewChat: (value: boolean) => void
  setDraft: (conversationId: number, draft: string) => void
  clearDraft: (conversationId: number) => void

  // Streaming state management
  startStreaming: (conversationId: number) => void
  stopStreaming: (conversationId: number) => void
  isConversationStreaming: (conversationId: number) => boolean
  updateStreamingState: (conversationId: number, updates: Partial<ConversationStreamingState>) => void
  clearStreamingState: (conversationId: number) => void
  getStreamingState: (conversationId: number) => ConversationStreamingState | null
}

const DEFAULT_STREAMING_STATE: ConversationStreamingState = {
  content: '',
  optimisticMessages: [],
  baseMessageCount: 0,
  isThinking: false,
  isTimeout: false,
  isCancelled: false,
  lastUserMessage: '',
  requestId: null,
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentConversationId: null,
      drafts: {},
      isPendingNewChat: false,
      streamingStates: {},
      streamingConversationIds: new Set(),

      setCurrentConversation: (id) =>
        set({
          currentConversationId: id,
        }),
      setIsPendingNewChat: (value) =>
        set({
          isPendingNewChat: value,
        }),
      setDraft: (conversationId, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [conversationId]: draft,
          },
        })),
      clearDraft: (conversationId) =>
        set((state) => {
          const { [conversationId]: _, ...rest } = state.drafts
          return { drafts: rest }
        }),

      // Streaming state management
      startStreaming: (conversationId) =>
        set((state) => ({
          streamingConversationIds: new Set(state.streamingConversationIds).add(conversationId),
        })),
      stopStreaming: (conversationId) =>
        set((state) => {
          const newSet = new Set(state.streamingConversationIds)
          newSet.delete(conversationId)
          return { streamingConversationIds: newSet }
        }),
      isConversationStreaming: (conversationId) => {
        return get().streamingConversationIds.has(conversationId)
      },
      updateStreamingState: (conversationId, updates) =>
        set((state) => ({
          streamingStates: {
            ...state.streamingStates,
            [conversationId]: {
              ...(state.streamingStates[conversationId] || DEFAULT_STREAMING_STATE),
              ...updates,
            },
          },
        })),
      clearStreamingState: (conversationId) =>
        set((state) => {
          const { [conversationId]: _, ...rest } = state.streamingStates
          return { streamingStates: rest }
        }),
      getStreamingState: (conversationId) => {
        return get().streamingStates[conversationId] || null
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        drafts: state.drafts,
      }),
    }
  )
)
