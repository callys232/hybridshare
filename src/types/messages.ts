export interface MessageParticipant {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  body: string;
  sentAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  participants: MessageParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}
