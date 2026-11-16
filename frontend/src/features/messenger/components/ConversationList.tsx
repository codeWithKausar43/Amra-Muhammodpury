'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Pin,
  BellOff,
  MoreVertical,
  Archive,
  Trash2,
  Bell,
  Loader2,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { ConversationItem } from '../types/messenger.types';

interface ConversationListProps {
  conversations: ConversationItem[];
  activeConvId: string | null;
  onSelectConversation: (id: string) => void;
  activeTab: 'primary' | 'requests' | 'archived';
  onTabChange: (tab: 'primary' | 'requests' | 'archived') => void;
  searchFilter: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onOpenNewChat: () => void;
  onOpenCreateGroup: () => void;
  onTogglePin: (convId: string) => void;
  onToggleMute: (convId: string) => void;
  onToggleArchive: (convId: string) => void;
  onDeleteFromInbox: (convId: string) => void;
  onlineUserIds?: Set<string>;
  pendingRequestsCount?: number;
  currentUserId?: string;
}

function formatMessengerTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'গতকাল';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('bn-BD', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    }
  } catch {
    return '';
  }
}

export function ConversationList({
  conversations,
  activeConvId,
  onSelectConversation,
  activeTab,
  onTabChange,
  searchFilter,
  onSearchChange,
  isLoading,
  onOpenNewChat,
  onOpenCreateGroup,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onDeleteFromInbox,
  onlineUserIds = new Set(),
  pendingRequestsCount = 0,
  currentUserId,
}: ConversationListProps) {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  // Close context menu on outside click
  React.useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleOutside);
    }
    return () => window.removeEventListener('click', handleOutside);
  }, [activeMenuId]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-brand-charcoal-dark/70">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-emerald" />
            <span>ইনবক্স ও বার্তা</span>
          </h1>

          {/* Action buttons: New Chat, Create Group */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenNewChat}
              className="px-2.5 py-1.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="নতুন চ্যাট শুরু করুন"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden min-[400px]:inline">নতুন বার্তা</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateGroup}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="নতুন গ্রুপ তৈরি করুন"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs: Primary, Requests, Archived */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => onTabChange('primary')}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'primary'
                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            সব বার্তা
          </button>
          <button
            type="button"
            onClick={() => onTabChange('requests')}
            className={`relative flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>রিকোয়েস্ট</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('archived')}
            className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            আর্কাইভ
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="কথোপকথন খুঁজুন..."
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-white focus:border-brand-emerald"
          />
        </div>

        {/* Pending Request Notification Bar */}
        {pendingRequestsCount > 0 && activeTab !== 'requests' && (
          <div
            onClick={() => onTabChange('requests')}
            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingRequestsCount}টি নতুন মেসেজ রিকোয়েস্ট এসেছে</span>
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline">
              দেখুন →
            </span>
          </div>
        )}

        {/* Messenger Stories / Active Friends Carousel */}
        {activeTab === 'primary' && conversations.length > 0 && !searchFilter && (
          <div className="pt-1 pb-1 overflow-x-auto flex items-center gap-3 no-scrollbar scrollbar-none">
            {/* New Chat circle button */}
            <button
              type="button"
              onClick={onOpenNewChat}
              className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-brand-emerald/40 hover:border-brand-emerald flex items-center justify-center bg-emerald-50/50 dark:bg-brand-emerald/10 text-brand-emerald transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate w-14 text-center">
                নতুন চ্যাট
              </span>
            </button>

            {/* Recent Contacts Avatars */}
            {conversations.slice(0, 10).map((conv) => {
              const name = conv.isGroup
                ? conv.title || 'গ্রুপ'
                : conv.otherUser?.name || 'সদস্য';
              const image = conv.isGroup ? conv.image : conv.otherUser?.image;
              const otherUserId = conv.otherUser?.id;
              const isOnline = Boolean(otherUserId && onlineUserIds.has(otherUserId));

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
                >
                  <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/30 group-hover:ring-brand-emerald transition-all">
                    {image ? (
                      <Image src={image} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                        {conv.isGroup ? <Users className="w-5 h-5" /> : name.charAt(0)}
                      </div>
                    )}
                    {!conv.isGroup && isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-charcoal" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate w-14 text-center">
                    {name.split(' ')[0] || name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
        {isLoading && conversations.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
            <p className="text-xs text-slate-400">কথোপকথন লোড হচ্ছে...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-3">
            <Inbox className="w-9 h-9 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
              {activeTab === 'requests'
                ? 'কোনো নতুন বার্তা রিকোয়েস্ট নেই'
                : activeTab === 'archived'
                ? 'কোনো আর্কাইভ করা কথোপকথন নেই'
                : 'কোনো পূর্ববর্তী চ্যাট নেই'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              যেকোনো সদস্যের সাথে চ্যাট শুরু করতে নিচের বাটনে চাপুন।
            </p>
            {activeTab === 'primary' && (
              <button
                type="button"
                onClick={onOpenNewChat}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন বার্তা শুরু করুন</span>
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = activeConvId === conv.id;
            const title = conv.isGroup
              ? conv.title || 'গ্রুপ চ্যাট'
              : conv.otherUser?.name || 'মুহাম্মদপুরী সদস্য';
            const avatar = conv.isGroup ? conv.image : conv.otherUser?.image;
            const otherUserId = conv.otherUser?.id;
            const isOnline = Boolean(otherUserId && onlineUserIds.has(otherUserId));

            // Format message preview Facebook Messenger style
            let preview = 'কথোপকথন শুরু হয়েছে';
            if (conv.lastMessage) {
              const isMine = conv.lastMessage.senderId === currentUserId;
              const prefix = isMine ? 'আপনি: ' : '';
              if (conv.lastMessage.type === 'IMAGE') preview = prefix + '📷 ছবি';
              else if (conv.lastMessage.type === 'AUDIO') preview = prefix + '🎵 ভয়েস বার্তা';
              else if (conv.lastMessage.type === 'FILE') preview = prefix + '📁 ফাইল';
              else if (conv.lastMessage.content) preview = prefix + conv.lastMessage.content;
            }

            return (
              <div
                key={conv.id}
                className={`group relative flex items-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-brand-emerald/10 dark:bg-brand-emerald/20'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {/* Main conversation item button */}
                <button
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className="flex-1 p-3 sm:p-3.5 flex items-center gap-3 text-left min-w-0"
                >
                  {/* Avatar + Online indicator */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                    {avatar ? (
                      <Image src={avatar} alt={title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-base">
                        {conv.isGroup ? <Users className="w-5 h-5" /> : title.charAt(0)}
                      </div>
                    )}
                    {!conv.isGroup && isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-charcoal" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <p
                          className={`text-xs sm:text-sm truncate ${
                            conv.unreadCount > 0
                              ? 'font-extrabold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {title}
                        </p>
                        {conv.isPinned && (
                          <Pin className="w-3 h-3 text-brand-emerald shrink-0 fill-brand-emerald" />
                        )}
                        {conv.isMuted && (
                          <BellOff className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </div>

                      <span
                        className={`text-[10px] shrink-0 ${
                          conv.unreadCount > 0
                            ? 'font-bold text-brand-emerald'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatMessengerTime(conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={`text-xs truncate ${
                          conv.unreadCount > 0
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {preview}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-emerald text-white text-[11px] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* More options 3 dots button */}
                <div className="relative pr-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === conv.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-full mt-1 w-36 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-1 z-30 text-xs animate-in fade-in zoom-in-95"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onTogglePin(conv.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Pin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{conv.isPinned ? 'আনপিন করুন' : 'পিন করুন'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleMute(conv.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        {conv.isMuted ? (
                          <>
                            <Bell className="w-3.5 h-3.5 text-slate-400" />
                            <span>আনমিউট করুন</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>মিউট করুন</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onToggleArchive(conv.id);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        <span>{conv.isArchived ? 'আনআর্কাইভ' : 'আর্কাইভ'}</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          if (confirm('ইনবক্স থেকে মুছে ফেলতে চান?')) {
                            onDeleteFromInbox(conv.id);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
