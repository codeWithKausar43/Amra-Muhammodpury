export interface MessageReactionItem {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface FileMetadata {
  fileName?: string;
  fileSize?: number;
  duration?: number;
  mimeType?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string | null;
  content: string;
  mediaUrl?: string | null;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'SYSTEM';
  fileMeta?: FileMetadata | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    type: string;
    senderId: string;
    sender?: {
      id: string;
      name: string;
    };
  } | null;
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  reactions: MessageReactionItem[];
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  hiddenAt?: string | null;
  lastReadAt?: string | null;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
  };
}

export interface ConversationItem {
  id: string;
  isGroup: boolean;
  title: string | null;
  image: string | null;
  creatorId: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  updatedAt: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isMyRequest: boolean;
  members?: ConversationMember[];
}

export interface UserSearchItem {
  id: string;
  name: string;
  image: string | null;
  phone: string | null;
  role: string;
  isFriend: boolean;
  friendshipStatus: 'ACCEPTED' | 'PENDING' | 'NONE';
}
