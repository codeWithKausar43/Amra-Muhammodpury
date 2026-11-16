'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Landmark,
  Plus,
  Bell,
  User,
  MessageSquare,
  PenSquare,
  Sparkles,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { useFeedModal } from '../context/FeedModalContext';

interface BottomNavProps {
  onCreatePostClick?: () => void;
}

export function BottomNav({ onCreatePostClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openCreatePost, openAuthModal } = useFeedModal();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isHome = pathname === '/' || pathname === '/feed';
  const isOrganization = pathname.startsWith('/organization');
  const isNotifications = pathname === '/notifications';
  const isProfile = pathname.startsWith('/profile') || pathname.startsWith('/dashboard');

  const handleCenterPlusClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleActionPost = () => {
    setIsMenuOpen(false);
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

  const handleActionMessage = () => {
    setIsMenuOpen(false);
    router.push('/messages');
  };

  const handleActionComingSoon = () => {
    setIsMenuOpen(false);
    alert('এই চমৎকার ফিচারটি খুব শীঘ্রই আসছে!');
  };

  return (
    <>
      {/* Backdrop for speed dial menu */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none"
      >
        <div className="max-w-md mx-auto pointer-events-auto relative">
          {/* Animated Speed Dial / Fan-out Popup Menu */}
          {isMenuOpen && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 flex items-center justify-around z-50 pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200">
              {/* Option 1: Messenger (Left) */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleActionMessage}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-emerald/30 active:scale-90 transition-transform cursor-pointer ring-2 ring-white dark:ring-brand-charcoal"
                  title="ইনবক্স ও বার্তা"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                  বার্তা
                </span>
              </div>

              {/* Option 2: Create Post (Center / Top) */}
              <div className="flex flex-col items-center gap-1 -translate-y-3">
                <button
                  type="button"
                  onClick={handleActionPost}
                  className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-teal-600/30 active:scale-90 transition-transform cursor-pointer ring-2 ring-white dark:ring-brand-charcoal"
                  title="নতুন পোস্ট করুন"
                >
                  <PenSquare className="w-6 h-6 stroke-[2.2]" />
                </button>
                <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                  পোস্ট
                </span>
              </div>

              {/* Option 3: 3rd Feature Placeholder (Right) */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleActionComingSoon}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-90 transition-transform cursor-pointer ring-2 ring-white dark:ring-brand-charcoal"
                  title="আসছে..."
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm">
                  আসছে...
                </span>
              </div>
            </div>
          )}

          {/* Navigation Bar Shell */}
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

            {/* Organization */}
            <Link
              href="/organization"
              className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
                isOrganization
                  ? 'text-brand-emerald dark:text-brand-mint font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="মোহাম্মদপুর কমিউনিটি সংগঠন"
            >
              <Landmark className="w-5 h-5" />
              <span className="text-[11px] leading-none">সংগঠন</span>
            </Link>

            {/* Elevated Center Floating Action Button (+) with rotation toggle */}
            <div className="relative -top-5 flex flex-col items-center">
              <button
                type="button"
                onClick={handleCenterPlusClick}
                aria-label={isMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
                title={isMenuOpen ? 'মেনু বন্ধ করুন' : 'অপশন খুলুন'}
                className={`w-12 h-12 rounded-full bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-emerald/40 ring-4 ring-white dark:ring-brand-charcoal-dark active:scale-90 transition-all duration-200 cursor-pointer ${
                  isMenuOpen ? 'rotate-45 bg-rose-600 from-rose-500 to-rose-600 shadow-rose-500/40' : ''
                }`}
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Notifications */}
            <Link
              href="/notifications"
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
                isNotifications
                  ? 'text-brand-emerald dark:text-brand-mint font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-brand-charcoal" />
              </div>
              <span className="text-[11px] leading-none">বিজ্ঞপ্তি</span>
            </Link>

            {/* Profile or Login */}
            <Link
              href={session?.user ? `/profile/${session.user.id}` : '/login'}
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
    </>
  );
}
