import { create } from 'zustand';
import { api } from '@/lib/api';
import { isMockMode, MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/mocks';
import type { Conversation, Message } from '@/types/messages';

interface MessageState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  totalUnread: number;
  isLoading: boolean;
  activeConversationId: string | null;

  fetchConversations: (currentUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, senderName: string, body: string) => Promise<void>;
  markConversationRead: (conversationId: string, userId: string) => void;
  setActiveConversation: (id: string | null) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: {},
  totalUnread: 0,
  isLoading: false,
  activeConversationId: null,

  fetchConversations: async (currentUserId) => {
    set({ isLoading: true });
    if (isMockMode()) {
      const convs = MOCK_CONVERSATIONS.filter((c) =>
        c.participants.some((p) => p.userId === currentUserId)
      );
      const unread = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      set({ conversations: convs, totalUnread: unread, isLoading: false });
      return;
    }
    try {
      const res = await api.get<{ data: Conversation[] }>('/messages/conversations');
      const convs = res.data.data ?? [];
      const unread = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      set({ conversations: convs, totalUnread: unread, isLoading: false });
    } catch {
      const convs = MOCK_CONVERSATIONS.filter((c) =>
        c.participants.some((p) => p.userId === currentUserId)
      );
      const unread = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      set({ conversations: convs, totalUnread: unread, isLoading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    if (get().messages[conversationId]) return;
    if (isMockMode()) {
      const msgs = MOCK_MESSAGES.filter((m) => m.conversationId === conversationId);
      set((state) => ({ messages: { ...state.messages, [conversationId]: msgs } }));
      return;
    }
    try {
      const res = await api.get<{ data: Message[] }>(`/messages/conversations/${conversationId}`);
      const msgs = res.data.data ?? [];
      set((state) => ({ messages: { ...state.messages, [conversationId]: msgs } }));
    } catch {
      const msgs = MOCK_MESSAGES.filter((m) => m.conversationId === conversationId);
      set((state) => ({ messages: { ...state.messages, [conversationId]: msgs } }));
    }
  },

  sendMessage: async (conversationId, senderId, senderName, body) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      senderName,
      senderAvatar: null,
      body,
      sentAt: new Date().toISOString(),
      readBy: [senderId],
    };

    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const updatedConvs = state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: newMsg, updatedAt: newMsg.sentAt } : c
      );
      return {
        messages: { ...state.messages, [conversationId]: [...existing, newMsg] },
        conversations: updatedConvs,
      };
    });

    try {
      await api.post(`/messages/conversations/${conversationId}`, { body });
    } catch {
      // optimistic update stays — offline graceful degradation
    }
  },

  markConversationRead: (conversationId, userId) => {
    set((state) => {
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (!conv || conv.unreadCount === 0) return state;
      const delta = conv.unreadCount;
      const updatedMsgs = (state.messages[conversationId] ?? []).map((m) =>
        m.readBy.includes(userId) ? m : { ...m, readBy: [...m.readBy, userId] }
      );
      return {
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
        messages: { ...state.messages, [conversationId]: updatedMsgs },
        totalUnread: Math.max(0, state.totalUnread - delta),
      };
    });
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
