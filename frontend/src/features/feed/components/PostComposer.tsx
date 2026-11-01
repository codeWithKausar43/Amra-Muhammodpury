'use client';

import * as React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { Post } from '../types';

interface PostComposerProps {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onPostCreated: (newPost: Post) => void;
  onRequireAuth?: () => void;
  onOpenModal?: () => void;
}

export function PostComposer({
  user,
  onRequireAuth,
  onOpenModal,
}: PostComposerProps) {
  const handleClick = () => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    onOpenModal?.();
  };

  return (
    <div className="w-full bg-white dark:bg-brand-charcoal-dark/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-soft mb-3.5">
      <div className="flex items-center gap-3">
        {/* User Avatar with Green Active Dot */}
        <div className="relative shrink-0 cursor-pointer" onClick={handleClick}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 relative ring-2 ring-slate-200/60 dark:ring-white/10">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-emerald text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'ম'}
              </div>
            )}
          </div>
          {/* Active Status Green Dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-charcoal-dark" />
        </div>

        {/* Pill-shaped Input Bar */}
        <button
          type="button"
          onClick={handleClick}
          className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium rounded-full py-2.5 px-4 text-left transition-colors cursor-pointer select-none"
        >
          {user?.name
            ? `আপনার মনে কী চলছে, ${user.name.split(' ')[0]}?`
            : "আপনার মনে কী চলছে? (What's on your mind?)"}
        </button>

        {/* Photo Action on the right */}
        <button
          type="button"
          onClick={handleClick}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0 cursor-pointer"
          title="ছবি বা ভিডিও যুক্ত করুন"
        >
          <div className="w-6 h-6 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Photo
          </span>
        </button>
      </div>
    </div>
  );
}
