'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from '@/lib/auth/auth-client';
import {
  MessageSquare,
  Send,
  Loader2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import {
  useConversationsQuery,
  useChatMessagesQuery,
  useSocialMutations,
} from '@/features/social/hooks/useSocialQueries';

export default function MessagesPage() {
  const { data: session } = useSession();
  const { data: conversations = [], isLoading: isConvLoading } = useConversationsQuery();
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const { data: chatData, isLoading: isChatLoading } = useChatMessagesQuery(activeConvId);
  const mutations = useSocialMutations();

  const activeChat = chatData || { messages: [], otherUser: null };
  const isInitialLoading = isConvLoading && conversations.length === 0;

  const [messageText, setMessageText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [searchFilter, setSearchFilter] = React.useState('');

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // default select first conversation on desktop
  React.useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActiveConvId(conversations[0]?.id || null);
      }
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom when new message arrives
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat.otherUser) return;

    setSending(true);
    const content = messageText.trim();
    setMessageText('');

    try {
      await mutations.sendMessage.mutateAsync({
        recipientId: activeChat.otherUser.id,
        content,
      });
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.name.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 py-2 sm:py-4 h-[calc(100vh-5.5rem)] flex flex-col">
      <div className="glass-panel flex-1 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft overflow-hidden flex flex-col md:flex-row">
        {/* Left Pane: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-white/10 flex flex-col ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5 space-y-3">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-emerald" />
              <span>ইনবক্স ও বার্তা</span>
            </h1>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="কথোপকথন খুঁজুন..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
            {isInitialLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
                <p className="text-xs text-slate-400">লোড হচ্ছে...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p>কোনো বার্তা বা কথোপকথন নেই।</p>
                <p>যেকোনো বন্ধুর প্রোফাইলে গিয়ে বার্তা পাঠাতে পারেন।</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConvId === conv.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-brand-emerald/10 dark:bg-brand-emerald/20'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                      {conv.otherUser?.image ? (
                        <Image
                          src={conv.otherUser.image}
                          alt={conv.otherUser.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                          {conv.otherUser?.name?.charAt(0) || 'ম'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {conv.otherUser?.name || 'মোহাম্মদপুরী সদস্য'}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.updatedAt).toLocaleTimeString('bn-BD', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.lastMessage?.content || 'কথোপকথন শুরু হয়েছে'}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-brand-emerald text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-brand-charcoal-dark/40 ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConvId && activeChat.otherUser ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-brand-charcoal-dark/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/profile/${activeChat.otherUser.id}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                      {activeChat.otherUser.image ? (
                        <Image
                          src={activeChat.otherUser.image}
                          alt={activeChat.otherUser.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-xs">
                          {activeChat.otherUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors leading-tight">
                        {activeChat.otherUser.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">সদস্য প্রোফাইল দেখুন</span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Message Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isChatLoading && activeChat.messages.length === 0 ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
                  </div>
                ) : activeChat.messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    এখনই একটি বার্তা পাঠিয়ে কথোপকথন শুরু করুন!
                  </div>
                ) : (
                  activeChat.messages.map((msg) => {
                    const isMine = msg.senderId === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-brand-emerald text-white rounded-br-xs shadow-sm'
                              : 'bg-white dark:bg-white/10 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-white/5 shadow-xs'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span
                            className={`text-[9px] mt-1 block ${
                              isMine ? 'text-emerald-100 text-right' : 'text-slate-400'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('bn-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-white dark:bg-brand-charcoal-dark flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="একটি বার্তা লিখুন..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="w-10 h-10 rounded-2xl bg-brand-emerald hover:bg-emerald-800 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                কোনো চ্যাট নির্বাচিত নেই
              </h3>
              <p className="text-xs max-w-xs">
                বাম পাশের তালিকা থেকে যেকোনো কথোপকথন নির্বাচন করে চ্যাট শুরু করুন।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
