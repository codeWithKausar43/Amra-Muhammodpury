'use client';

import * as React from 'react';
import { useSession } from '@/lib/auth/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  useMessengerConversations,
  useMessengerMessages,
  usePresenceStatus,
  useTypingState,
  useMessengerRealtime,
  useMessengerMutations,
  messengerQueryKeys,
} from '@/features/messenger/hooks/useMessenger';
import { messengerService } from '@/features/messenger/services/messenger.service';
import { MessageItem } from '@/features/messenger/types/messenger.types';

import { ConversationList } from '@/features/messenger/components/ConversationList';
import { ChatHeader } from '@/features/messenger/components/ChatHeader';
import { MessageBubble } from '@/features/messenger/components/MessageBubble';
import { MessageComposer } from '@/features/messenger/components/MessageComposer';
import { MessageRequestBanner } from '@/features/messenger/components/MessageRequestBanner';
import { NewChatModal } from '@/features/messenger/components/NewChatModal';
import { CreateGroupModal } from '@/features/messenger/components/CreateGroupModal';
import { GroupMembersModal } from '@/features/messenger/components/GroupMembersModal';
import { ImageLightbox } from '@/features/messenger/components/ImageLightbox';

function MessagesContent() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionLoading } = useSession();
  const currentUserId = session?.user?.id;
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  // Active navigation states
  const [activeTab, setActiveTab] = React.useState<'primary' | 'requests' | 'archived'>('primary');
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [searchFilter, setSearchFilter] = React.useState('');

  // In-thread message search
  const [isSearchingMessages, setIsSearchingMessages] = React.useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = React.useState('');

  // Modals state
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false);
  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);

  // Message actions: Reply and Edit
  const [replyingTo, setReplyingTo] = React.useState<MessageItem | null>(null);
  const [editingMessage, setEditingMessage] = React.useState<MessageItem | null>(null);

  // 1. Fetch Conversations
  const {
    data: conversations = [],
    isLoading: isConvLoading,
    refetch: refetchConversations,
  } = useMessengerConversations(activeTab, searchFilter);

  // Query requests count for badge
  const { data: requestConversations = [] } = useMessengerConversations('requests');
  const pendingRequestsCount = requestConversations.filter(
    (c) => c.status === 'PENDING' && !c.isMyRequest,
  ).length;

  // Auto-open chat if ?user=<userId> is passed in URL
  React.useEffect(() => {
    if (!targetUserId || !session?.user || isConvLoading) return;

    const existing = conversations.find((c) => c.otherUser?.id === targetUserId);
    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    messengerService
      .getOrCreateDirect(targetUserId)
      .then((conv) => {
        if (conv?.id) {
          queryClient.setQueryData(
            messengerQueryKeys.messages(conv.id, ''),
            {
              conversation: conv,
              messages: [],
              nextCursor: null,
            },
          );
          setActiveConvId(conv.id);
          setActiveTab('primary');
          refetchConversations();
        }
      })
      .catch((err) => {
        console.error('Error starting direct chat:', err);
      });
  }, [targetUserId, session?.user, isConvLoading, conversations, refetchConversations, queryClient]);

  // 2. Fetch Active Thread Messages
  const {
    data: threadData,
    isLoading: isThreadLoading,
    refetch: refetchMessages,
  } = useMessengerMessages(activeConvId, messageSearchQuery);

  const activeMessages = threadData?.messages || [];

  const activeConversation = React.useMemo(() => {
    if (threadData?.conversation?.id === activeConvId) {
      return {
        ...threadData.conversation,
        otherUser:
          threadData.conversation.otherUser ||
          conversations.find((c) => c.id === activeConvId)?.otherUser ||
          null,
      };
    }
    return conversations.find((c) => c.id === activeConvId) || null;
  }, [threadData, activeConvId, conversations]);

  // 3. User Presence Tracking
  const otherUserIds = React.useMemo(() => {
    const set = new Set<string>();
    conversations.forEach((c) => {
      if (c.otherUser?.id) set.add(c.otherUser.id);
    });
    return Array.from(set);
  }, [conversations]);

  const { data: presenceMap = {} } = usePresenceStatus(otherUserIds);
  const onlineUserIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const [uid, status] of Object.entries(presenceMap)) {
      if (status.isOnline) set.add(uid);
    }
    return set;
  }, [presenceMap]);

  // 4. Real-time WebSocket Sync & Typing
  useMessengerRealtime(activeConvId);
  const { typingUsers, notifyTyping } = useTypingState(activeConvId);

  // 5. Messenger Mutations
  const mutations = useMessengerMutations();

  // Scroll to bottom
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!messageSearchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length, messageSearchQuery]);

  // Default select first conversation on desktop
  React.useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActiveConvId(conversations[0]?.id || null);
      }
    }
  }, [conversations, activeConvId]);

  // Typing subtitle text
  const typingText = React.useMemo(() => {
    const otherTypers = typingUsers.filter((u) => u.name);
    if (otherTypers.length === 0) return null;
    if (otherTypers.length === 1) return `${otherTypers[0]?.name} টাইপ করছেন...`;
    return `${otherTypers.length} জন সদস্য টাইপ করছেন...`;
  }, [typingUsers]);

  // Handlers
  const handleSelectUserFromNewChat = async (userId: string) => {
    try {
      const conv = await messengerService.getOrCreateDirect(userId);
      if (conv && conv.id) {
        queryClient.setQueryData(
          messengerQueryKeys.messages(conv.id, ''),
          {
            conversation: conv,
            messages: [],
            nextCursor: null,
          },
        );
        setActiveConvId(conv.id);
        setActiveTab('primary');
        refetchConversations();
      }
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      alert(err.message || 'চ্যাট শুরু করতে সমস্যা হয়েছে');
    }
  };

  const handleCreateGroup = async (data: { title: string; memberIds: string[] }) => {
    const conv = await mutations.createGroup.mutateAsync(data);
    setActiveConvId(conv.id);
    refetchConversations();
  };

  const handleSendMessage = async (payload: {
    content?: string;
    mediaUrl?: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
    fileMeta?: any;
    replyToId?: string;
  }) => {
    if (!activeConvId) return;
    try {
      await mutations.sendMessage.mutateAsync({
        conversationId: activeConvId,
        ...payload,
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'বার্তা পাঠাতে ত্রুটি হয়েছে');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    await mutations.editMessage.mutateAsync({ messageId, content });
  };

  const handleDeleteMessage = async (message: MessageItem) => {
    if (!activeConvId) return;
    if (confirm('আপনি কি এই বার্তাটি মুছে ফেলতে চান?')) {
      await mutations.deleteMessage.mutateAsync({
        messageId: message.id,
        conversationId: activeConvId,
      });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConvId) return;
    await mutations.toggleReaction.mutateAsync({
      messageId,
      conversationId: activeConvId,
      emoji,
    });
  };

  const isPendingRequest = activeConversation?.status === 'PENDING';
  const isMyRequest = Boolean(
    activeConversation?.isMyRequest ||
      (activeConversation?.status === 'PENDING' && activeConversation?.creatorId === currentUserId),
  );

  if (isSessionLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p className="text-xs text-slate-400">মেসেঞ্জার লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ইনবক্স ব্যবহারের জন্য লগইন করুন
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          মোহাম্মদপুরী কমিউনিটির সদস্যদের সাথে ব্যক্তিগত বা গ্রুপ চ্যাট করতে আপনার একাউন্টে প্রবেশ করুন।
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 rounded-2xl bg-brand-emerald hover:bg-emerald-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          লগইন পাতায় যান
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3 h-[calc(100vh-5.5rem)] flex flex-col">
      <div className="glass-panel flex-1 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft overflow-hidden flex flex-col md:flex-row bg-white/70 dark:bg-brand-charcoal-dark/70 backdrop-blur-xl">
        {/* Left Pane: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-white/10 flex flex-col ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConversation={(id) => {
              setActiveConvId(id);
              setReplyingTo(null);
              setEditingMessage(null);
            }}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setActiveConvId(null);
            }}
            searchFilter={searchFilter}
            onSearchChange={setSearchFilter}
            isLoading={isConvLoading}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onTogglePin={(id) => mutations.togglePin.mutate(id)}
            onToggleMute={(id) => mutations.toggleMute.mutate(id)}
            onToggleArchive={(id) => mutations.toggleArchive.mutate(id)}
            onDeleteFromInbox={(id) => {
              mutations.deleteFromInbox.mutate(id);
              if (activeConvId === id) setActiveConvId(null);
            }}
            onlineUserIds={onlineUserIds}
            pendingRequestsCount={pendingRequestsCount}
            currentUserId={currentUserId}
          />
        </div>

        {/* Right Pane: Active Chat Thread */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-brand-charcoal-dark/40 ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConvId ? (
            isThreadLoading && !activeConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
                <p className="text-xs text-slate-400">কথোপকথন লোড হচ্ছে...</p>
                <button
                  type="button"
                  onClick={() => setActiveConvId(null)}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  ফিরে যান
                </button>
              </div>
            ) : activeConversation ? (
            <>
              {/* Thread Header */}
              <ChatHeader
                conversation={activeConversation}
                isOnline={
                  activeConversation.otherUser?.id
                    ? onlineUserIds.has(activeConversation.otherUser.id)
                    : false
                }
                typingText={typingText}
                onBack={() => setActiveConvId(null)}
                onSearchToggle={() => {
                  setIsSearchingMessages(!isSearchingMessages);
                  if (isSearchingMessages) setMessageSearchQuery('');
                }}
                isSearching={isSearchingMessages}
                searchQuery={messageSearchQuery}
                onSearchQueryChange={setMessageSearchQuery}
                onToggleMute={() => mutations.toggleMute.mutate(activeConversation.id)}
                onToggleArchive={() => mutations.toggleArchive.mutate(activeConversation.id)}
                onDeleteChat={() => {
                  mutations.deleteFromInbox.mutate(activeConversation.id);
                  setActiveConvId(null);
                }}
                onOpenMembersModal={() => setIsMembersModalOpen(true)}
              />

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 no-scrollbar">
                {isThreadLoading && activeMessages.length === 0 ? (
                  <div className="py-24 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      কথোপকথন শুরু করুন!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      নিচের বক্সে বার্তা লিখে পাঠান বাটনে চাপুন।
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      currentUserId={currentUserId}
                      isGroup={activeConversation.isGroup}
                      onImageClick={(url) => setLightboxSrc(url)}
                      onReply={(target) => {
                        setEditingMessage(null);
                        setReplyingTo(target);
                      }}
                      onEdit={(target) => {
                        setReplyingTo(null);
                        setEditingMessage(target);
                      }}
                      onDelete={handleDeleteMessage}
                      onReaction={handleReaction}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Request Banner if status is PENDING and already has at least 1 message, or if recipient */}
              {isPendingRequest && (!isMyRequest || activeMessages.length >= 1) && (
                <MessageRequestBanner
                  isMyRequest={isMyRequest}
                  senderName={activeConversation.otherUser?.name}
                  onAccept={async () => {
                    await mutations.acceptRequest.mutateAsync(activeConversation.id);
                  }}
                  onDecline={async () => {
                    await mutations.declineRequest.mutateAsync(activeConversation.id);
                    setActiveConvId(null);
                  }}
                  onBlock={async () => {
                    await mutations.blockRequest.mutateAsync(activeConversation.id);
                    setActiveConvId(null);
                  }}
                />
              )}

              {/* Message Composer */}
              <MessageComposer
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                editingMessage={editingMessage}
                onCancelEdit={() => setEditingMessage(null)}
                onTyping={notifyTyping}
                disabled={isPendingRequest && isMyRequest && activeMessages.length >= 1}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                কথোপকথন পাওয়া যায়নি
              </h3>
              <button
                type="button"
                onClick={() => setActiveConvId(null)}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-emerald text-white cursor-pointer"
              >
                তালিকায় ফিরে যান
              </button>
            </div>
          )) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                কোনো চ্যাট নির্বাচিত নেই
              </h3>
              <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                বাম পাশের তালিকা থেকে যেকোনো কথোপকথন নির্বাচন করুন অথবা &ldquo;নতুন চ্যাট&rdquo; বাটনে চাপুন।
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={handleSelectUserFromNewChat}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      {activeConversation && activeConversation.isGroup && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          conversation={activeConversation}
          currentUserId={currentUserId}
          onRefresh={() => {
            refetchConversations();
            refetchMessages();
          }}
        />
      )}

      {/* Lightbox Modal for Full Image View */}
      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">মেসেঞ্জার লোড হচ্ছে...</p>
        </div>
      }
    >
      <MessagesContent />
    </React.Suspense>
  );
}
