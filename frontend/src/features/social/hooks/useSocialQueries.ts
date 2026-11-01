'use client';

import * as React from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { feedService } from '@/features/feed/services/feed.service';
import {
  socialService,
  type NotificationItem,
} from '@/features/social/services/social.service';
import { Post } from '@/features/feed/types';

// ==========================================
// 1. Stable, Hierarchical Query Keys
// ==========================================
export const socialQueryKeys = {
  feed: {
    all: ['feed'] as const,
    posts: (category: string) => ['feed', 'posts', category] as const,
    stories: () => ['feed', 'stories'] as const,
  },
  friends: {
    all: ['friends', 'list'] as const,
    requests: () => ['friends', 'requests'] as const,
    suggestions: () => ['friends', 'suggestions'] as const,
    status: (userId: string) => ['friends', 'status', userId] as const,
  },
  groups: {
    all: ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    posts: (id: string) => ['groups', 'posts', id] as const,
    requests: (id: string) => ['groups', 'requests', id] as const,
  },
  notifications: {
    all: ['notifications', 'list'] as const,
  },
  messages: {
    conversations: () => ['messages', 'conversations'] as const,
    chat: (convId: string) => ['messages', 'chat', convId] as const,
  },
  saved: {
    all: ['saved', 'posts'] as const,
  },
  profile: {
    detail: (userId: string) => ['profile', 'detail', userId] as const,
  },
  search: {
    query: (q: string, category: string) => ['search', q, category] as const,
  },
} as const;

// ==========================================
// 2. Tab-Specific Cache Expiration & GC Policies
// ==========================================
export const CACHE_POLICY = {
  feedPosts: {
    staleTime: 45 * 1000, // 45 seconds (frequently updated)
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
  },
  feedStories: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 15 * 60 * 1000,
  },
  friendsList: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
  },
  friendRequests: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
  },
  friendSuggestions: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  },
  groupsList: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
  },
  groupDetail: {
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
  groupPosts: {
    staleTime: 45 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  notifications: {
    staleTime: 20 * 1000, // 20 seconds
    gcTime: 10 * 60 * 1000,
  },
  messages: {
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 10 * 60 * 1000,
  },
  savedPosts: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
  },
  profile: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000,
  },
};

// ==========================================
// 3. Tab Data Hooks (Instant Render on Cached Hits)
// ==========================================

/**
 * 1. Home Feed Posts Hook
 */
export function useFeedPostsQuery(category: string = 'ALL') {
  return useQuery({
    queryKey: socialQueryKeys.feed.posts(category),
    queryFn: async () => {
      const res = await feedService.getPosts({ category, limit: 20 });
      return res.posts;
    },
    ...CACHE_POLICY.feedPosts,
  });
}

/**
 * 2. Home Feed Stories Hook
 */
export function useFeedStoriesQuery() {
  return useQuery({
    queryKey: socialQueryKeys.feed.stories(),
    queryFn: async () => {
      return await feedService.getStories();
    },
    ...CACHE_POLICY.feedStories,
  });
}

/**
 * 3. Friends List Hook
 */
export function useFriendsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.friends.all,
    queryFn: async () => {
      return await socialService.getFriends();
    },
    ...CACHE_POLICY.friendsList,
  });
}

/**
 * 4. Friend Requests Hook
 */
export function useFriendRequestsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.friends.requests(),
    queryFn: async () => {
      return await socialService.getRequests();
    },
    ...CACHE_POLICY.friendRequests,
  });
}

/**
 * 5. Friend Suggestions Hook
 */
export function useFriendSuggestionsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.friends.suggestions(),
    queryFn: async () => {
      return await socialService.getSuggestions();
    },
    ...CACHE_POLICY.friendSuggestions,
  });
}

/**
 * 6. Groups List Hook
 */
export function useGroupsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.groups.all,
    queryFn: async () => {
      return await socialService.getGroups();
    },
    ...CACHE_POLICY.groupsList,
  });
}

/**
 * 7. Group Detail Hook
 */
export function useGroupDetailQuery(groupId: string) {
  return useQuery({
    queryKey: socialQueryKeys.groups.detail(groupId),
    queryFn: async () => {
      return await socialService.getGroup(groupId);
    },
    enabled: Boolean(groupId),
    ...CACHE_POLICY.groupDetail,
  });
}

/**
 * 8. Group Posts Hook
 */
export function useGroupPostsQuery(groupId: string) {
  return useQuery({
    queryKey: socialQueryKeys.groups.posts(groupId),
    queryFn: async () => {
      return await socialService.getGroupPosts(groupId);
    },
    enabled: Boolean(groupId),
    ...CACHE_POLICY.groupPosts,
  });
}

/**
 * 9. Notifications Hook
 */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.notifications.all,
    queryFn: async () => {
      return await socialService.getNotifications();
    },
    ...CACHE_POLICY.notifications,
  });
}

/**
 * 10. Messages / Conversations List Hook
 */
export function useConversationsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.messages.conversations(),
    queryFn: async () => {
      return await socialService.getConversations();
    },
    ...CACHE_POLICY.messages,
  });
}

/**
 * 11. Chat Thread Messages Hook
 */
export function useChatMessagesQuery(conversationId: string | null) {
  return useQuery({
    queryKey: socialQueryKeys.messages.chat(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return { messages: [], otherUser: null };
      return await socialService.getMessages(conversationId);
    },
    enabled: Boolean(conversationId),
    ...CACHE_POLICY.messages,
  });
}

/**
 * 12. Saved Posts Hook
 */
export function useSavedPostsQuery() {
  return useQuery({
    queryKey: socialQueryKeys.saved.all,
    queryFn: async () => {
      return await socialService.getSavedPosts();
    },
    ...CACHE_POLICY.savedPosts,
  });
}

/**
 * 13. User Profile Hook
 */
export function useUserProfileQuery(userId: string) {
  return useQuery({
    queryKey: socialQueryKeys.profile.detail(userId),
    queryFn: async () => {
      return await socialService.getProfile(userId);
    },
    enabled: Boolean(userId),
    ...CACHE_POLICY.profile,
  });
}

// ==========================================
// 4. Background Tab Prefetcher Hook
// ==========================================
/**
 * Automatically prefetches other primary tabs in the background after the
 * initial Home feed is already rendered and idle, without delaying the visible UI.
 */
export function usePrefetchSocialTabs() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Wait until initial page is painted & browser has idle bandwidth
    const prefetchTimer = setTimeout(() => {
      // 1. Prefetch Friends data
      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.friends.all,
        queryFn: () => socialService.getFriends(),
        staleTime: CACHE_POLICY.friendsList.staleTime,
      });

      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.friends.requests(),
        queryFn: () => socialService.getRequests(),
        staleTime: CACHE_POLICY.friendRequests.staleTime,
      });

      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.friends.suggestions(),
        queryFn: () => socialService.getSuggestions(),
        staleTime: CACHE_POLICY.friendSuggestions.staleTime,
      });

      // 2. Prefetch Groups data
      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.groups.all,
        queryFn: () => socialService.getGroups(),
        staleTime: CACHE_POLICY.groupsList.staleTime,
      });

      // 3. Prefetch Notifications
      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.notifications.all,
        queryFn: () => socialService.getNotifications(),
        staleTime: CACHE_POLICY.notifications.staleTime,
      });

      // 4. Prefetch Saved Posts
      queryClient.prefetchQuery({
        queryKey: socialQueryKeys.saved.all,
        queryFn: () => socialService.getSavedPosts(),
        staleTime: CACHE_POLICY.savedPosts.staleTime,
      });
    }, 1200); // 1.2s delay ensures initial Home feed render is completely finished

    return () => clearTimeout(prefetchTimer);
  }, [queryClient]);
}

// ==========================================
// 5. Intelligent Cache Mutations & Invalidation
// ==========================================
export function useSocialMutations() {
  const queryClient = useQueryClient();

  // Create Post: adds to current feed & invalidates feed queries
  const createPost = useMutation({
    mutationFn: feedService.createPost,
    onSuccess: (newPost) => {
      queryClient.setQueriesData<Post[]>(
        { queryKey: ['feed', 'posts'] },
        (oldPosts) => (oldPosts ? [newPost, ...oldPosts] : [newPost]),
      );
      queryClient.invalidateQueries({ queryKey: ['feed', 'posts'] });
    },
  });

  // Delete Post
  const deletePost = useMutation({
    mutationFn: feedService.deletePost,
    onSuccess: (_, postId) => {
      queryClient.setQueriesData<Post[]>(
        { queryKey: ['feed', 'posts'] },
        (oldPosts) => (oldPosts ? oldPosts.filter((p) => p.id !== postId) : []),
      );
      queryClient.invalidateQueries({ queryKey: ['feed', 'posts'] });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.saved.all });
    },
  });

  // Toggle Like on Post: Optimistic update
  const toggleLike = useMutation({
    mutationFn: (postId: string) => feedService.toggleLike(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed', 'posts'] });

      // Optimistically update all feed queries containing this post
      queryClient.setQueriesData<Post[]>(
        { queryKey: ['feed', 'posts'] },
        (oldPosts) => {
          if (!oldPosts) return [];
          return oldPosts.map((p) => {
            if (p.id === postId) {
              const hasLiked = !p.hasLiked;
              const likesCount = hasLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
              return { ...p, hasLiked, likesCount };
            }
            return p;
          });
        },
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['feed', 'posts'] });
    },
  });

  // Friend Request Actions
  const sendFriendRequest = useMutation({
    mutationFn: (targetId: string) => socialService.sendFriendRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.requests() });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.suggestions() });
    },
  });

  const acceptFriendRequest = useMutation({
    mutationFn: (requestId: string) => socialService.acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.requests() });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.suggestions() });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.notifications.all });
    },
  });

  const rejectFriendRequest = useMutation({
    mutationFn: (requestId: string) => socialService.rejectFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.requests() });
    },
  });

  const cancelFriendRequest = useMutation({
    mutationFn: (requestId: string) => socialService.cancelFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.requests() });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.suggestions() });
    },
  });

  const removeFriend = useMutation({
    mutationFn: (friendId: string) => socialService.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.all });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.suggestions() });
    },
  });

  // Group Actions
  const joinGroup = useMutation({
    mutationFn: (groupId: string) => socialService.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.groups.detail(groupId) });
    },
  });

  const leaveGroup = useMutation({
    mutationFn: (groupId: string) => socialService.leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.groups.detail(groupId) });
    },
  });

  // Saved Post Action
  const toggleSavePost = useMutation({
    mutationFn: (postId: string) => socialService.toggleSavePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.saved.all });
    },
  });

  // Notification Actions
  const markNotificationRead = useMutation({
    mutationFn: (notificationId: string) => socialService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.notifications.all });
    },
  });

  const markAllNotificationsRead = useMutation({
    mutationFn: () => socialService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData(
        socialQueryKeys.notifications.all,
        (old: { notifications: NotificationItem[]; unreadCount: number } | undefined) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) => ({ ...n, unread: false })),
            unreadCount: 0,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.notifications.all });
    },
  });

  // Messages Action
  const sendMessage = useMutation({
    mutationFn: ({
      recipientId,
      content,
      mediaUrl,
    }: {
      recipientId: string;
      content: string;
      mediaUrl?: string;
    }) => socialService.sendMessage(recipientId, content, mediaUrl),
    onSuccess: (newMsg) => {
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.messages.conversations() });
      const convId = newMsg.data?.conversationId;
      if (convId) {
        queryClient.invalidateQueries({
          queryKey: socialQueryKeys.messages.chat(convId),
        });
      }
    },
  });

  return {
    createPost,
    deletePost,
    toggleLike,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    joinGroup,
    leaveGroup,
    toggleSavePost,
    markNotificationRead,
    markAllNotificationsRead,
    sendMessage,
  };
}

// ==========================================
// 6. User Isolation on Logout
// ==========================================
export function clearAllSocialCache(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.clear();
}
