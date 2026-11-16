'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messengerService } from '../services/messenger.service';
import {
  ConversationItem,
  MessageItem,
  FileMetadata,
} from '../types/messenger.types';
import { realtimeClient } from '@/lib/realtime/websocket-client';
import { notificationAudio } from '@/lib/audio/notificationSound';
import { useSession } from '@/lib/auth/auth-client';

export const messengerQueryKeys = {
  conversations: (tab: string, search?: string) =>
    ['messenger', 'conversations', tab, search || ''] as const,
  messages: (convId: string, search?: string) =>
    ['messenger', 'messages', convId, search || ''] as const,
  userSearch: (query: string) => ['messenger', 'searchUsers', query] as const,
  presence: (ids: string) => ['messenger', 'presence', ids] as const,
};

/**
 * Conversations list hook with automatic caching
 */
export function useMessengerConversations(
  tab: 'primary' | 'requests' | 'archived' = 'primary',
  search?: string,
) {
  return useQuery({
    queryKey: messengerQueryKeys.conversations(tab, search),
    queryFn: () => messengerService.getConversations(tab, search),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Single conversation messages hook
 */
export function useMessengerMessages(
  conversationId: string | null,
  search?: string,
) {
  return useQuery({
    queryKey: messengerQueryKeys.messages(conversationId || '', search),
    queryFn: async () => {
      if (!conversationId) {
        return {
          conversation: null as unknown as ConversationItem,
          messages: [] as MessageItem[],
          nextCursor: null as string | null,
        };
      }
      return messengerService.getConversationMessages(conversationId, undefined, search);
    },
    enabled: Boolean(conversationId),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * User search hook
 */
export function useUserSearch(query: string) {
  const cleanQuery = query.trim();
  return useQuery({
    queryKey: messengerQueryKeys.userSearch(cleanQuery),
    queryFn: () => messengerService.searchUsers(cleanQuery),
    enabled: cleanQuery.length >= 1,
    staleTime: 30 * 1000,
  });
}

/**
 * Presence hook for a list of user IDs
 */
export function usePresenceStatus(userIds: string[]) {
  const idsKey = React.useMemo(() => [...userIds].sort().join(','), [userIds]);
  return useQuery({
    queryKey: messengerQueryKeys.presence(idsKey),
    queryFn: () => messengerService.getPresence(userIds),
    enabled: userIds.length > 0,
    refetchInterval: 30 * 1000, // Poll presence every 30s
  });
}

/**
 * Typing state hook: manages incoming typing indicators and broadcasting outgoing typing status
 */
export function useTypingState(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = React.useState<Map<string, { name: string; expiresAt: number }>>(
    new Map(),
  );
  const typingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = React.useRef(false);

  // Clean expired typing indicators
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [userId, val] of next.entries()) {
          if (val.expiresAt <= now) {
            next.delete(userId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen to incoming TYPING_STATUS events
  React.useEffect(() => {
    if (!conversationId) return;

    const unbind = realtimeClient.on('TYPING_STATUS', (payload: any) => {
      if (!payload || payload.conversationId !== conversationId) return;

      const { userId, isTyping, user } = payload;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) {
          next.set(userId, {
            name: user?.name || 'ব্যবহারকারী',
            expiresAt: Date.now() + 4000,
          });
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      unbind();
    };
  }, [conversationId]);

  // Send outgoing typing indicator with auto-reset after 3 seconds
  const notifyTyping = React.useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;

      if (isTyping) {
        if (!isTypingRef.current) {
          isTypingRef.current = true;
          realtimeClient.sendTyping(conversationId, true);
        }

        // Reset debounce timer
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          isTypingRef.current = false;
          realtimeClient.sendTyping(conversationId, false);
        }, 2500);
      } else {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        isTypingRef.current = false;
        realtimeClient.sendTyping(conversationId, false);
      }
    },
    [conversationId],
  );

  return {
    typingUsers: Array.from(typingUsers.values()),
    notifyTyping,
  };
}

/**
 * Real-time event listener hook for Messenger
 */
export function useMessengerRealtime(activeConvId: string | null) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  React.useEffect(() => {
    // 1. New Message Received
    const unbindReceived = realtimeClient.on('MESSAGE_RECEIVED', (data: any) => {
      if (!data?.message) return;
      const msg: MessageItem = data.message;
      const convId = msg.conversationId;

      // Optimistically insert message if viewing this thread
      if (activeConvId === convId) {
        queryClient.setQueryData(
          messengerQueryKeys.messages(convId, ''),
          (old: any) => {
            if (!old) return old;
            const exists = old.messages.some((m: MessageItem) => m.id === msg.id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, msg],
            };
          },
        );
      }

      // Play soft chime sound if incoming message is from someone else
      if (msg.senderId !== currentUserId) {
        try {
          notificationAudio.play(0.8);
        } catch {
          // ignore
        }
      }

      // Update conversations list query caches (primary & requests)
      queryClient.setQueriesData({ queryKey: ['messenger', 'conversations'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        const exists = old.some((c: ConversationItem) => c.id === convId);
        if (!exists) {
          queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
          return old;
        }

        return old
          .map((c: ConversationItem) => {
            if (c.id === convId) {
              const isCurrentThread = activeConvId === convId;
              return {
                ...c,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  type: msg.type,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId,
                  isRead: isCurrentThread,
                },
                unreadCount: isCurrentThread ? 0 : c.unreadCount + 1,
                updatedAt: msg.createdAt,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    // 2. Message Sent (Device sync)
    const unbindSent = realtimeClient.on('MESSAGE_SENT', (data: any) => {
      if (!data?.message) return;
      const msg: MessageItem = data.message;
      const convId = msg.conversationId;

      if (activeConvId === convId) {
        queryClient.setQueryData(
          messengerQueryKeys.messages(convId, ''),
          (old: any) => {
            if (!old) return old;
            const exists = old.messages.some((m: MessageItem) => m.id === msg.id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, msg],
            };
          },
        );
      }

      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    });

    // 3. Message Edited
    const unbindEdited = realtimeClient.on('MESSAGE_EDITED', (data: any) => {
      if (!data?.message) return;
      const editedMsg: MessageItem = data.message;
      const convId = editedMsg.conversationId;

      queryClient.setQueryData(
        messengerQueryKeys.messages(convId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) =>
              m.id === editedMsg.id
                ? { ...m, content: editedMsg.content, isEdited: true, editedAt: editedMsg.editedAt }
                : m,
            ),
          };
        },
      );
    });

    // 4. Message Deleted
    const unbindDeleted = realtimeClient.on('MESSAGE_DELETED', (data: any) => {
      if (!data?.messageId || !data?.conversationId) return;
      const { messageId, conversationId } = data;

      queryClient.setQueryData(
        messengerQueryKeys.messages(conversationId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) =>
              m.id === messageId
                ? {
                    ...m,
                    isDeleted: true,
                    content: 'এই বার্তাটি মুছে ফেলা হয়েছে',
                    mediaUrl: null,
                    fileMeta: null,
                  }
                : m,
            ),
          };
        },
      );
    });

    // 5. Message Reaction
    const unbindReaction = realtimeClient.on('MESSAGE_REACTION', (data: any) => {
      if (!data?.messageId || !data?.conversationId) return;
      const { messageId, conversationId, reactions } = data;

      queryClient.setQueryData(
        messengerQueryKeys.messages(conversationId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) =>
              m.id === messageId ? { ...m, reactions: reactions || [] } : m,
            ),
          };
        },
      );
    });

    // 6. Message Read Receipt
    const unbindRead = realtimeClient.on('MESSAGE_READ', (data: any) => {
      if (!data?.conversationId) return;
      const { conversationId } = data;

      queryClient.setQueryData(
        messengerQueryKeys.messages(conversationId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) => ({ ...m, isRead: true })),
          };
        },
      );
    });

    // 7. Request Received / Updated
    const unbindRequest = realtimeClient.on('MESSAGE_REQUEST_RECEIVED', () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    });

    const unbindRequestUpdated = realtimeClient.on('MESSAGE_REQUEST_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    });

    // 8. Conversation Updated (Pin, Mute, Archive, Group changes)
    const unbindConvUpdated = realtimeClient.on('CONVERSATION_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    });

    return () => {
      unbindReceived();
      unbindSent();
      unbindEdited();
      unbindDeleted();
      unbindReaction();
      unbindRead();
      unbindRequest();
      unbindRequestUpdated();
      unbindConvUpdated();
    };
  }, [activeConvId, currentUserId, queryClient]);
}

/**
 * All Messenger mutations unified
 */
export function useMessengerMutations() {
  const queryClient = useQueryClient();

  // Send message
  const sendMessage = useMutation({
    mutationFn: (data: {
      conversationId?: string;
      recipientId?: string;
      content?: string;
      mediaUrl?: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
      fileMeta?: FileMetadata;
      replyToId?: string;
    }) => messengerService.sendMessage(data),
    onSuccess: (newMsg) => {
      // Optimistically push to active chat
      if (newMsg.conversationId) {
        queryClient.setQueryData(
          messengerQueryKeys.messages(newMsg.conversationId, ''),
          (old: any) => {
            if (!old) return old;
            const exists = old.messages.some((m: MessageItem) => m.id === newMsg.id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, newMsg],
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Edit message
  const editMessage = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messengerService.editMessage(messageId, content),
    onSuccess: (updatedMsg) => {
      queryClient.setQueryData(
        messengerQueryKeys.messages(updatedMsg.conversationId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) =>
              m.id === updatedMsg.id ? updatedMsg : m,
            ),
          };
        },
      );
    },
  });

  // Delete message
  const deleteMessage = useMutation({
    mutationFn: (variables: {
      messageId: string;
      conversationId: string;
    }) => messengerService.deleteMessage(variables.messageId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        messengerQueryKeys.messages(variables.conversationId, ''),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m: MessageItem) =>
              m.id === variables.messageId
                ? {
                    ...m,
                    isDeleted: true,
                    content: 'এই বার্তাটি মুছে ফেলা হয়েছে',
                    mediaUrl: null,
                    fileMeta: null,
                  }
                : m,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Reaction
  const toggleReaction = useMutation({
    mutationFn: (variables: {
      messageId: string;
      conversationId: string;
      emoji: string;
    }) => messengerService.toggleReaction(variables.messageId, variables.emoji),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: messengerQueryKeys.messages(variables.conversationId, ''),
      });
    },
  });

  // Accept request
  const acceptRequest = useMutation({
    mutationFn: (conversationId: string) => messengerService.acceptRequest(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
      queryClient.invalidateQueries({
        queryKey: messengerQueryKeys.messages(conversationId, ''),
      });
    },
  });

  // Decline request
  const declineRequest = useMutation({
    mutationFn: (conversationId: string) => messengerService.declineRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Block request
  const blockRequest = useMutation({
    mutationFn: (conversationId: string) => messengerService.blockFromRequest(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Toggle Pin
  const togglePin = useMutation({
    mutationFn: (conversationId: string) => messengerService.togglePin(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Toggle Mute
  const toggleMute = useMutation({
    mutationFn: (conversationId: string) => messengerService.toggleMute(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Toggle Archive
  const toggleArchive = useMutation({
    mutationFn: (conversationId: string) => messengerService.toggleArchive(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Delete from inbox
  const deleteFromInbox = useMutation({
    mutationFn: (conversationId: string) => messengerService.deleteFromInbox(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  // Create Group
  const createGroup = useMutation({
    mutationFn: (data: { title: string; image?: string; memberIds?: string[] }) =>
      messengerService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messenger', 'conversations'] });
    },
  });

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    acceptRequest,
    declineRequest,
    blockRequest,
    togglePin,
    toggleMute,
    toggleArchive,
    deleteFromInbox,
    createGroup,
  };
}
