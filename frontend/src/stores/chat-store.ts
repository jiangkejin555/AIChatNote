import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  currentConversationId: number | null
  drafts: Record<number, string>
  isStreaming: boolean
  setCurrentConversation: (id: number | null) => void
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
      setCurrentConversation: (id) =>
        set({
          currentConversationId: id,
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
