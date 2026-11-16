export interface ConversationListItem {
  id: string;
  isGroup: boolean;
  title: string;
  image: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | string;
  creatorId: string | null;
  otherUser?: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    isOnline: boolean;
    isFriend: boolean;
  } | null;
  members?: Array<{
    id: string;
    name: string;
    image: string | null;
    role: string;
  }>;
  lastMessage: {
    id: string;
    content: string;
    type: string;
    createdAt: Date;
    senderId: string;
    senderName: string;
    isRead: boolean;
    isDeleted: boolean;
  } | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: Date;
}

export interface UserSearchItem {
  id: string;
  name: string;
  image: string | null;
  role: string;
  phone?: string | null;
  bio?: string | null;
  isFriend: boolean;
  existingConversationId?: string | null;
}
