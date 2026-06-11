import type { Conversation, Message } from '@/types/messages';

const now = Date.now();
const m = (offset: number) => new Date(now - offset).toISOString();

export const MOCK_MESSAGES: Message[] = [
  // Conversation conv-1: Alex ↔ Jane
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'Alex Carter',
    senderAvatar: null,
    body: 'Hey Jane, can you review the Q4 brand guidelines I uploaded this morning?',
    sentAt: m(7200000),
    readBy: ['user-1', 'user-2'],
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    senderName: 'Jane Smith',
    senderAvatar: null,
    body: 'Sure! I saw it in the Brand Assets folder. Will go through it now and leave comments.',
    sentAt: m(6900000),
    readBy: ['user-1', 'user-2'],
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-2',
    senderName: 'Jane Smith',
    senderAvatar: null,
    body: "Done! Left a few notes on typography. The colour palette section looks great though.",
    sentAt: m(3600000),
    readBy: ['user-1', 'user-2'],
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderName: 'Alex Carter',
    senderAvatar: null,
    body: 'Perfect, thanks. I\'ll address the typography comments before the client handoff on Friday.',
    sentAt: m(1800000),
    readBy: ['user-1', 'user-2'],
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'user-2',
    senderName: 'Jane Smith',
    senderAvatar: null,
    body: 'Sounds good! Also, should we add the new logo lockup to the shared folder as well?',
    sentAt: m(600000),
    readBy: ['user-2'],
  },
  // Conversation conv-2: Alex ↔ Bob
  {
    id: 'msg-6',
    conversationId: 'conv-2',
    senderId: 'user-3',
    senderName: 'Bob Johnson',
    senderAvatar: null,
    body: 'Hi Alex, I noticed the Postgres connector is showing a sync error. Is this a known issue?',
    sentAt: m(86400000),
    readBy: ['user-1', 'user-3'],
  },
  {
    id: 'msg-7',
    conversationId: 'conv-2',
    senderId: 'user-1',
    senderName: 'Alex Carter',
    senderAvatar: null,
    body: 'Yes, we are aware. The connection credentials were rotated yesterday. I will update the connector config now.',
    sentAt: m(82800000),
    readBy: ['user-1', 'user-3'],
  },
  {
    id: 'msg-8',
    conversationId: 'conv-2',
    senderId: 'user-1',
    senderName: 'Alex Carter',
    senderAvatar: null,
    body: 'Done, the connector should be syncing correctly now. Let me know if you still see errors.',
    sentAt: m(79200000),
    readBy: ['user-1', 'user-3'],
  },
  {
    id: 'msg-9',
    conversationId: 'conv-2',
    senderId: 'user-3',
    senderName: 'Bob Johnson',
    senderAvatar: null,
    body: 'Confirmed, it\'s working now. Thanks for the quick fix!',
    sentAt: m(75600000),
    readBy: ['user-1', 'user-3'],
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      { userId: 'user-1', name: 'Alex Carter', avatar: null },
      { userId: 'user-2', name: 'Jane Smith', avatar: null },
    ],
    lastMessage: MOCK_MESSAGES.find((m) => m.id === 'msg-5') ?? null,
    unreadCount: 1,
    updatedAt: m(600000),
  },
  {
    id: 'conv-2',
    participants: [
      { userId: 'user-1', name: 'Alex Carter', avatar: null },
      { userId: 'user-3', name: 'Bob Johnson', avatar: null },
    ],
    lastMessage: MOCK_MESSAGES.find((m) => m.id === 'msg-9') ?? null,
    unreadCount: 0,
    updatedAt: m(75600000),
  },
];
