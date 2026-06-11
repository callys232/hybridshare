'use client';

import { useEffect, useRef, useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMessageStore } from '@/store/message.store';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation } from '@/types/messages';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    totalUnread,
    isLoading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markConversationRead,
    setActiveConversation,
    activeConversationId,
  } = useMessageStore();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user?.id) fetchConversations(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      if (user?.id) markConversationRead(activeConversationId, user.id);
    }
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];
  const otherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.userId !== user?.id) ?? conv.participants[0];

  const handleSend = async () => {
    if (!draft.trim() || !activeConversationId || !user) return;
    setSending(true);
    try {
      await sendMessage(activeConversationId, user.id, user.name, draft.trim());
      setDraft('');
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 overflow-hidden bg-white dark:bg-dark-surface-1">
      {/* Sidebar — conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-brand-gray dark:border-dark-border flex flex-col">
        <div className="px-4 py-4 border-b border-brand-gray dark:border-dark-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-brand-black dark:text-dark-text text-base">Messages</h1>
            {totalUnread > 0 && (
              <span className="text-[10px] font-bold bg-brand-red text-white px-1.5 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-brand-gray-dark border-t-transparent animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = otherParticipant(conv);
              const isActive = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-brand-gray/50 dark:border-dark-border/50 transition-colors',
                    isActive
                      ? 'bg-brand-white-soft dark:bg-dark-surface-2'
                      : 'hover:bg-brand-white-soft dark:hover:bg-dark-surface-2'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={other.name} src={other.avatar} size="sm" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold text-brand-black dark:text-dark-text' : 'font-medium text-brand-black dark:text-dark-text')}>
                        {other.name}
                      </p>
                      {conv.updatedAt && (
                        <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted flex-shrink-0">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'text-brand-black dark:text-dark-text font-medium' : 'text-brand-gray-dark dark:text-dark-text-muted')}>
                        {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conv.lastMessage.body}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-full bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-brand-gray-dark dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-dark-text mb-1">Select a conversation</p>
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted max-w-xs">Choose a conversation from the left to read and reply to messages.</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-5 py-3.5 border-b border-brand-gray dark:border-dark-border flex items-center gap-3 flex-shrink-0 bg-white dark:bg-dark-surface-1">
              <Avatar name={otherParticipant(activeConv).name} src={otherParticipant(activeConv).avatar} size="sm" />
              <div>
                <p className="font-semibold text-sm text-brand-black dark:text-dark-text">
                  {otherParticipant(activeConv).name}
                </p>
                <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted">
                  {activeConv.participants.length} participants
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeMessages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-brand-gray-dark border-t-transparent animate-spin" />
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn('flex gap-2.5', isMine && 'flex-row-reverse')}>
                      {!isMine && (
                        <Avatar name={msg.senderName} src={msg.senderAvatar} size="xs" className="flex-shrink-0 mt-0.5" />
                      )}
                      <div className={cn('max-w-[70%]', isMine && 'items-end flex flex-col')}>
                        {!isMine && (
                          <p className="text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted mb-1 ml-0.5">
                            {msg.senderName}
                          </p>
                        )}
                        <div className={cn(
                          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMine
                            ? 'bg-brand-black dark:bg-dark-border text-white rounded-tr-sm'
                            : 'bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border text-brand-black dark:text-dark-text rounded-tl-sm'
                        )}>
                          {msg.body}
                        </div>
                        <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted mt-1 mx-0.5">
                          {formatRelativeTime(msg.sentAt)}
                          {isMine && (
                            <span className="ml-1.5">
                              {msg.readBy.length > 1 ? (
                                <span className="text-emerald-500">Read</span>
                              ) : (
                                <span>Sent</span>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="px-5 py-4 border-t border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1 flex-shrink-0">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-brand-gray dark:border-dark-border bg-brand-white-soft dark:bg-dark-surface-2 px-3.5 py-2.5 text-sm text-brand-black dark:text-dark-text placeholder:text-brand-gray-dark dark:placeholder:text-dark-text-muted focus:outline-none focus:border-brand-black dark:focus:border-dark-border-soft transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="btn-primary h-10 px-4 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                >
                  {sending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
