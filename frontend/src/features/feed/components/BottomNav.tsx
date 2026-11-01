'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Bell, User } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { useFeedModal } from '../context/FeedModalContext';

interface BottomNavProps {
  onCreatePostClick?: () => void;
}

export function BottomNav({ onCreatePostClick }: BottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCreatePost, openAuthModal } = useFeedModal();

  const isHome = pathname === '/' || pathname === '/feed';
  const isExplore = pathname === '/explore';
  const isProfile = pathname.startsWith('/profile') || pathname.startsWith('/dashboard');

  const handleCenterPlusClick = () => {
    if (onCreatePostClick) {
      onCreatePostClick();
      return;
    }
    if (!session?.user) {
      openAuthModal();
    } else {
      openCreatePost();
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative bg-white/95 dark:bg-brand-charcoal-dark/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl px-4 py-2 flex items-center justify-between transition-colors">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isHome
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] leading-none">হোম</span>
          </Link>

          {/* Explore */}
          <Link
            href="/explore"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isExplore
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[11px] leading-none">এক্সপ্লোর</span>
          </Link>

          {/* Elevated Center Floating Action Button (+) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={handleCenterPlusClick}
              aria-label="নতুন পোস্ট তৈরি করুন"
              title="নতুন পোস্ট তৈরি করুন"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-emerald/40 ring-4 ring-white dark:ring-brand-charcoal-dark active:scale-90 transition-transform cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => alert('নোটিফিকেশন ফিচার শীঘ্রই চালু হচ্ছে!')}
            className="relative flex flex-col items-center gap-1 py-1 px-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-brand-charcoal" />
            </div>
            <span className="text-[11px] leading-none">বিজ্ঞপ্তি</span>
          </button>

          {/* Profile or Login */}
          <Link
            href={session?.user ? '/dashboard' : '/login'}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isProfile
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {session?.user ? 'প্রোফাইল' : 'লগইন'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
