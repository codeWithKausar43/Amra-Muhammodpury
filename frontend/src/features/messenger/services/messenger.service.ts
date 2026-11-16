import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import {
  ConversationItem,
  MessageItem,
  UserSearchItem,
  FileMetadata,
} from '../types/messenger.types';

export const messengerService = {
  /**
   * Get conversations list filtered by tab (primary | requests | archived)
   */
  async getConversations(
    tab: 'primary' | 'requests' | 'archived' = 'primary',
    search?: string,
  ): Promise<ConversationItem[]> {
    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (search && search.trim()) {
        params.set('search', search.trim());
      }
      const res = await apiClient<ApiResponse<ConversationItem[]>>(
        `/messages/conversations?${params.toString()}`,
      );
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Search registered users with friend status
   */
  async searchUsers(query: string): Promise<UserSearchItem[]> {
    if (!query || !query.trim()) return [];
    try {
      const res = await apiClient<ApiResponse<UserSearchItem[]>>(
        `/messages/users/search?q=${encodeURIComponent(query.trim())}`,
      );
      return res.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Start or fetch direct conversation
   */
  async getOrCreateDirect(recipientId: string): Promise<ConversationItem> {
    const res = await apiClient<ApiResponse<ConversationItem>>('/messages/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
    return res.data!;
  },

  /**
   * Create group chat
   */
  async createGroup(data: {
    title: string;
    image?: string;
    memberIds?: string[];
  }): Promise<ConversationItem> {
    const res = await apiClient<ApiResponse<ConversationItem>>('/messages/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  /**
   * Add members to group
   */
  async addGroupMembers(conversationId: string, memberIds: string[]) {
    return apiClient<ApiResponse<unknown>>(`/messages/groups/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberIds }),
    });
  },

  /**
   * Remove member from group
   */
  async removeGroupMember(conversationId: string, targetUserId: string) {
    return apiClient<ApiResponse<unknown>>(
      `/messages/groups/${conversationId}/members/${targetUserId}`,
      { method: 'DELETE' },
    );
  },

  /**
   * Get messages in conversation with optional cursor pagination and search
   */
  async getConversationMessages(
    conversationId: string,
    cursor?: string,
    search?: string,
  ): Promise<{
    conversation: ConversationItem;
    messages: MessageItem[];
    nextCursor: string | null;
  }> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (search && search.trim()) params.set('search', search.trim());

    const res = await apiClient<
      ApiResponse<{
        conversation: ConversationItem;
        messages: MessageItem[];
        nextCursor: string | null;
      }>
    >(`/messages/conversations/${conversationId}?${params.toString()}`);

    return res.data || { conversation: {} as any, messages: [], nextCursor: null };
  },

  /**
   * Send a message
   */
  async sendMessage(data: {
    conversationId?: string;
    recipientId?: string;
    content?: string;
    mediaUrl?: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
    fileMeta?: FileMetadata;
    replyToId?: string;
  }): Promise<MessageItem> {
    const res = await apiClient<ApiResponse<MessageItem>>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<MessageItem> {
    const res = await apiClient<ApiResponse<MessageItem>>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return res.data!;
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string) {
    return apiClient<ApiResponse<{ success: boolean }>>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle emoji reaction
   */
  async toggleReaction(messageId: string, emoji: string) {
    return apiClient<ApiResponse<unknown>>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  /**
   * Accept message request
   */
  async acceptRequest(conversationId: string) {
    return apiClient<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${conversationId}/accept`,
      { method: 'POST' },
    );
  },

  /**
   * Decline message request
   */
  async declineRequest(conversationId: string) {
    return apiClient<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${conversationId}/decline`,
      { method: 'POST' },
    );
  },

  /**
   * Block user from request
   */
  async blockFromRequest(conversationId: string) {
    return apiClient<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${conversationId}/block`,
      { method: 'POST' },
    );
  },

  /**
   * Toggle Pin conversation
   */
  async togglePin(conversationId: string) {
    return apiClient<ApiResponse<{ isPinned: boolean }>>(
      `/messages/conversations/${conversationId}/pin`,
      { method: 'POST' },
    );
  },

  /**
   * Toggle Mute conversation
   */
  async toggleMute(conversationId: string) {
    return apiClient<ApiResponse<{ isMuted: boolean }>>(
      `/messages/conversations/${conversationId}/mute`,
      { method: 'POST' },
    );
  },

  /**
   * Toggle Archive conversation
   */
  async toggleArchive(conversationId: string) {
    return apiClient<ApiResponse<{ isArchived: boolean }>>(
      `/messages/conversations/${conversationId}/archive`,
      { method: 'POST' },
    );
  },

  /**
   * Delete conversation from inbox
   */
  async deleteFromInbox(conversationId: string) {
    return apiClient<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${conversationId}/inbox`,
      { method: 'DELETE' },
    );
  },

  /**
   * Get presence status for user IDs
   */
  async getPresence(
    userIds: string[],
  ): Promise<Record<string, { isOnline: boolean; lastActive?: string }>> {
    if (!userIds || userIds.length === 0) return {};
    try {
      const res = await apiClient<
        ApiResponse<Record<string, boolean | { isOnline: boolean; lastActive?: string }>>
      >(`/messages/presence?userIds=${userIds.join(',')}`);
      const raw = res.data || {};
      const result: Record<string, { isOnline: boolean; lastActive?: string }> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === 'boolean') {
          result[k] = { isOnline: v };
        } else if (v && typeof v === 'object') {
          result[k] = { isOnline: Boolean(v.isOnline), lastActive: v.lastActive };
        }
      }
      return result;
    } catch {
      return {};
    }
  },

  /**
   * Upload media or audio to Cloudinary using signed upload
   */
  async uploadMedia(
    file: File,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<{ secure_url: string; original_filename?: string; bytes?: number }> {
    // 1. Get upload signature
    const sigRes = await apiClient<
      ApiResponse<{
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        cloudName: string;
        resourceType: string;
      }>
    >('/uploads/signature', {
      method: 'POST',
      body: JSON.stringify({
        folder: 'messenger',
        resourceType: resourceType === 'raw' ? 'raw' : resourceType === 'video' ? 'video' : 'auto',
        isRegistration: false,
      }),
    });

    const signData = sigRes.data;
    if (!signData) {
      throw new Error('আপলোড সিগনেচার গ্রহণ করা সম্ভব হয়নি');
    }

    // 2. Upload file directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.apiKey);
    formData.append('timestamp', signData.timestamp.toString());
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);

    const actualResourceType = signData.resourceType || 'auto';
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/${actualResourceType}/upload`,
      { method: 'POST', body: formData },
    );

    const asset = await res.json();
    if (!res.ok || asset.error || !asset.secure_url) {
      throw new Error(asset.error?.message || 'ফাইল আপলোড সম্পন্ন হয়নি');
    }

    return asset;
  },
};
