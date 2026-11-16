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
  MessageCircleMore,
  PenSquare,
  Users,
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

  // Close menu on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
    router.push('/friends');
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
          {/* Animated Speed Dial Menu with Exact Triangle/Arc 14px Alignment Gap */}
          {isMenuOpen && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-44 h-24 pointer-events-auto z-50">
              {/* Option 1: Messenger / Chat Speech Bubble (Left) */}
              <button
                type="button"
                onClick={handleActionMessage}
                aria-label="বার্তা ও চ্যাট"
                title="বার্তা ও চ্যাট"
                className="absolute left-0 bottom-2 w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 ring-4 ring-white dark:ring-brand-charcoal-dark hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-in zoom-in-75 fade-in slide-in-from-bottom-5 duration-200"
              >
                <MessageCircleMore className="w-6 h-6 stroke-[2.2]" />
              </button>

              {/* Option 2: Create Post / Book with Pen (Center / Top) */}
              <button
                type="button"
                onClick={handleActionPost}
                aria-label="নতুন পোস্ট করুন"
                title="নতুন পোস্ট করুন"
                className="absolute left-1/2 -translate-x-1/2 bottom-10 w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/45 ring-4 ring-white dark:ring-brand-charcoal-dark hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-in zoom-in-75 fade-in slide-in-from-bottom-7 duration-250"
              >
                <PenSquare className="w-6 h-6 stroke-[2.2]" />
              </button>

              {/* Option 3: Community Persona / Members (Right) */}
              <button
                type="button"
                onClick={handleActionComingSoon}
                aria-label="কমিউনিটি ও সদস্য"
                title="কমিউনিটি ও সদস্য"
                className="absolute right-0 bottom-2 w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-violet-700 text-white flex items-center justify-center shadow-xl shadow-purple-500/40 ring-4 ring-white dark:ring-brand-charcoal-dark hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer animate-in zoom-in-75 fade-in slide-in-from-bottom-5 duration-200"
              >
                <Users className="w-6 h-6 stroke-[2.2]" />
              </button>
            </div>
          )}

          {/* Navigation Bar Shell */}
          <div className="relative bg-white/95 dark:bg-brand-charcoal-dark/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl px-4 py-2 flex items-center justify-between transition-colors">
            {/* Home */}
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
                className={`w-12 h-12 rounded-full bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-emerald/40 ring-4 ring-white dark:ring-brand-charcoal-dark active:scale-90 transition-all duration-300 cursor-pointer ${
                  isMenuOpen
                    ? 'rotate-45 from-rose-500 to-rose-600 shadow-rose-500/40 ring-rose-100 dark:ring-rose-950/30'
                    : ''
                }`}
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Notifications */}
            <Link
              href="/notifications"
              onClick={() => setIsMenuOpen(false)}
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
              onClick={() => setIsMenuOpen(false)}
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
