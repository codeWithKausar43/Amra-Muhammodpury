'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  Search,
  BellOff,
  Bell,
  Archive,
  Trash2,
  Users,
  User,
  X,
} from 'lucide-react';
import { ConversationItem } from '../types/messenger.types';

interface ChatHeaderProps {
  conversation: ConversationItem;
  currentUserId?: string;
  isOnline?: boolean;
  typingText?: string | null;
  onBack: () => void;
  onSearchToggle: () => void;
  isSearching: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onToggleMute: () => void;
  onToggleArchive: () => void;
  onDeleteChat: () => void;
  onOpenMembersModal?: () => void;
}

export function ChatHeader({
  conversation,
  isOnline,
  typingText,
  onBack,
  onSearchToggle,
  isSearching,
  searchQuery,
  onSearchQueryChange,
  onToggleMute,
  onToggleArchive,
  onDeleteChat,
  onOpenMembersModal,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [menuOpen]);

  const title = conversation.isGroup
    ? conversation.title || 'গ্রুপ চ্যাট'
    : conversation.otherUser?.name || 'মোহাম্মদপুরী সদস্য';

  const avatar = conversation.isGroup
    ? conversation.image
    : conversation.otherUser?.image;

  return (
    <div className="p-3 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-brand-charcoal-dark/90 backdrop-blur-md flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {/* Left: Back button + Avatar + Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar with Online Dot */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
            {avatar ? (
              <Image src={avatar} alt={title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                {conversation.isGroup ? <Users className="w-5 h-5" /> : title.charAt(0)}
              </div>
            )}
            {!conversation.isGroup && isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-charcoal" />
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h2>

            {/* Subtitle / Typing indicator */}
            {typingText ? (
              <p className="text-[11px] font-semibold text-brand-emerald animate-pulse">
                {typingText}
              </p>
            ) : conversation.isGroup ? (
              <p className="text-[10px] text-slate-400">
                {conversation.members?.length || 2} জন সদস্য
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>সক্রিয় আছেন</span>
                  </>
                ) : (
                  <span>অফলাইন</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search in thread & Action Dropdown */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSearchToggle}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isSearching
                ? 'bg-brand-emerald/15 text-brand-emerald'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-300'
            }`}
            title="বার্তায় খুঁজুন"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-300 transition-colors cursor-pointer"
              title="অপশন"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-1.5 z-30 text-xs animate-in fade-in zoom-in-95">
                {!conversation.isGroup && conversation.otherUser && (
                  <Link
                    href={`/profile/${conversation.otherUser.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>প্রোফাইল দেখুন</span>
                  </Link>
                )}

                {conversation.isGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenMembersModal?.();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>সদস্য তালিকা</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleMute();
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {conversation.isMuted ? (
                    <>
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      <span>আনমিউট করুন</span>
                    </>
                  ) : (
                    <>
                      <BellOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>মিউট করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleArchive();
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-500" />
                  <span>{conversation.isArchived ? 'ইনবক্সে ফেরত নিন' : 'আর্কাইভ করুন'}</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm('আপনি কি নিশ্চিতভাবে এই চ্যাটটি আপনার ইনবক্স থেকে মুছে ফেলতে চান?')) {
                      onDeleteChat();
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>চ্যাট মুছে ফেলুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-chat search bar expander */}
      {isSearching && (
        <div className="relative w-full flex items-center animate-in fade-in">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="এই কথোপকথনে বার্তা খুঁজুন..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 text-slate-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
