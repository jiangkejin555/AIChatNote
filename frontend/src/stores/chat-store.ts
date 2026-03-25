import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  currentConversationId: number | null
  drafts: Record<number, string>
  isStreaming: boolean
  isPendingNewChat: boolean
  setCurrentConversation: (id: number | null) => void
  setIsPendingNewChat: (value: boolean) => void
  setDraft: (conversationId: number, draft: string) => void
  clearDraft: (conversationId: number) => void
  setIsStreaming: (isStreaming: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      currentConversationId: null,
      drafts: {},
      isStreaming: false,
      isPendingNewChat: false,
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
      setIsStreaming: (isStreaming) =>
        set({
          isStreaming,
        }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        drafts: state.drafts,
      }),
    }
  )
)
