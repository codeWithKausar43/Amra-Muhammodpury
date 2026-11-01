import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post } from '@/features/feed/types';

export interface FriendSummary {
  id: string;
  name: string;
  image: string | null;
  phone: string | null;
  role: string;
  bio: string | null;
  mutualFriendsCount?: number;
}

export interface FriendRequestsData {
  incoming: Array<{
    id: string;
    senderId: string;
    createdAt: string;
    sender: FriendSummary;
  }>;
  sent: Array<{
    id: string;
    receiverId: string;
    createdAt: string;
    receiver: FriendSummary;
  }>;
}

export interface GroupData {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  coverImage: string | null;
  privacy: 'PUBLIC' | 'PRIVATE';
  rules: string | null;
  creatorId: string;
  createdAt: string;
  membershipRole: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
  pendingRequest?: boolean;
  _count: {
    members: number;
    posts: number;
  };
  creator: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    image: string | null;
  };
  members?: Array<{
    id: string;
    role: string;
    user: FriendSummary;
  }>;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: string;
  title: string;
  content: string;
  entityId: string | null;
  entityType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  otherUser: FriendSummary | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface UserProfileData {
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    image: string | null;
    coverImage: string | null;
    bio: string | null;
    role: string;
    createdAt: string;
    friendsCount: number;
    postsCount: number;
    groupsCount: number;
  };
  posts: Post[];
  isSelf: boolean;
  isFriend: boolean;
}

export const socialService = {
  // ---------------- Friends ----------------
  async getFriends(): Promise<FriendSummary[]> {
    try {
      const res = await apiClient<ApiResponse<FriendSummary[]>>('/friends');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getRequests(): Promise<FriendRequestsData> {
    try {
      const res = await apiClient<ApiResponse<FriendRequestsData>>('/friends/requests');
      return res.data || { incoming: [], sent: [] };
    } catch {
      return { incoming: [], sent: [] };
    }
  },

  async getSuggestions(): Promise<FriendSummary[]> {
    try {
      const res = await apiClient<ApiResponse<FriendSummary[]>>('/friends/suggestions');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getFriendshipStatus(targetUserId: string): Promise<{ status: string; requestId?: string }> {
    try {
      const res = await apiClient<ApiResponse<{ status: string; requestId?: string }>>(
        `/friends/status/${targetUserId}`,
      );
      return res.data || { status: 'NONE' };
    } catch {
      return { status: 'NONE' };
    }
  },

  async sendFriendRequest(targetUserId: string) {
    return apiClient<ApiResponse<unknown>>(`/friends/request/${targetUserId}`, { method: 'POST' });
  },

  async acceptFriendRequest(requestId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  async rejectFriendRequest(requestId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/friends/requests/${requestId}/reject`, {
      method: 'POST',
    });
  },

  async cancelFriendRequest(requestId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/friends/requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },

  async removeFriend(friendId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  },

  // ---------------- Groups ----------------
  async getGroups(): Promise<{ joined: GroupData[]; discover: GroupData[] }> {
    try {
      const res = await apiClient<ApiResponse<{ joined: GroupData[]; discover: GroupData[] }>>(
        '/groups',
      );
      return res.data || { joined: [], discover: [] };
    } catch {
      return { joined: [], discover: [] };
    }
  },

  async getGroup(groupId: string): Promise<GroupData | null> {
    try {
      const res = await apiClient<ApiResponse<GroupData>>(`/groups/${groupId}`);
      return res.data || null;
    } catch {
      return null;
    }
  },

  async createGroup(data: {
    name: string;
    description?: string;
    privacy?: 'PUBLIC' | 'PRIVATE';
    rules?: string;
    image?: string;
    coverImage?: string;
  }) {
    return apiClient<ApiResponse<GroupData>>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async joinGroup(groupId: string) {
    return apiClient<ApiResponse<{ status: string; message: string }>>(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  },

  async leaveGroup(groupId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  },

  async getGroupPosts(groupId: string): Promise<Post[]> {
    try {
      const res = await apiClient<ApiResponse<Post[]>>(`/groups/${groupId}/posts`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createGroupPost(groupId: string, data: { content: string; location?: string; mediaIds?: string[] }) {
    return apiClient<ApiResponse<Post>>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ---------------- Notifications ----------------
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    try {
      const res = await apiClient<
        ApiResponse<{ notifications: NotificationItem[]; unreadCount: number }>
      >('/notifications');
      return res.data || { notifications: [], unreadCount: 0 };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },

  async markNotificationRead(id: string) {
    return apiClient<ApiResponse<unknown>>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead() {
    return apiClient<ApiResponse<{ message: string }>>('/notifications/read-all', {
      method: 'POST',
    });
  },

  // ---------------- Messages ----------------
  async getConversations(): Promise<ConversationSummary[]> {
    try {
      const res = await apiClient<ApiResponse<ConversationSummary[]>>('/messages/conversations');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getMessages(conversationId: string): Promise<{ messages: ChatMessage[]; otherUser: FriendSummary | null }> {
    try {
      const res = await apiClient<ApiResponse<{ messages: ChatMessage[]; otherUser: FriendSummary | null }>>(
        `/messages/conversations/${conversationId}`,
      );
      return res.data || { messages: [], otherUser: null };
    } catch {
      return { messages: [], otherUser: null };
    }
  },

  async sendMessage(recipientId: string, content: string, mediaUrl?: string) {
    return apiClient<ApiResponse<ChatMessage>>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, mediaUrl }),
    });
  },

  // ---------------- Saved Posts ----------------
  async getSavedPosts(): Promise<Array<{ savedAt: string; post: Post }>> {
    try {
      const res = await apiClient<ApiResponse<Array<{ savedAt: string; post: Post }>>>('/saved');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async toggleSavePost(postId: string) {
    return apiClient<ApiResponse<{ isSaved: boolean; message: string }>>(`/saved/${postId}`, {
      method: 'POST',
    });
  },

  // ---------------- Social Search ----------------
  async search(query: string, type: 'ALL' | 'PEOPLE' | 'POSTS' | 'GROUPS' = 'ALL') {
    try {
      const res = await apiClient<
        ApiResponse<{ people: FriendSummary[]; posts: Post[]; groups: GroupData[] }>
      >(`/search?q=${encodeURIComponent(query)}&type=${type}`);
      return res.data || { people: [], posts: [], groups: [] };
    } catch {
      return { people: [], posts: [], groups: [] };
    }
  },

  // ---------------- User Profile ----------------
  async getProfile(userId: string): Promise<UserProfileData | null> {
    try {
      const res = await apiClient<ApiResponse<UserProfileData>>(`/profile/${userId}`);
      return res.data || null;
    } catch {
      return null;
    }
  },

  async updateProfile(data: { name?: string; email?: string; phone?: string; bio?: string; image?: string; coverImage?: string }) {
    return apiClient<ApiResponse<FriendSummary>>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ---------------- Safety & Moderation ----------------
  async getBlockedUsers(): Promise<FriendSummary[]> {
    try {
      const res = await apiClient<ApiResponse<FriendSummary[]>>('/safety/blocked');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async blockUser(userId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/safety/block/${userId}`, {
      method: 'POST',
    });
  },

  async unblockUser(userId: string) {
    return apiClient<ApiResponse<{ message: string }>>(`/safety/unblock/${userId}`, {
      method: 'DELETE',
    });
  },

  async reportContent(data: {
    targetType: 'POST' | 'COMMENT' | 'USER' | 'GROUP';
    targetId: string;
    reason: string;
    details?: string;
  }) {
    return apiClient<ApiResponse<unknown>>('/safety/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ---------------- Post Interactions ----------------
  async sharePost(postId: string, caption?: string) {
    return apiClient<ApiResponse<Post>>(`/feed/posts/${postId}/share`, {
      method: 'POST',
      body: JSON.stringify({ caption }),
    });
  },

  async editPost(postId: string, data: { content?: string; location?: string; privacy?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME' }) {
    return apiClient<ApiResponse<Post>>(`/feed/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteComment(commentId: string) {
    return apiClient<ApiResponse<null>>(`/feed/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
