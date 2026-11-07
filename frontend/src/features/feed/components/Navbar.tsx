'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminNav } from '@/features/organization/context/AdminNavContext';
import { AdminDrawer } from '@/features/organization/components/AdminDrawer';
import { Search, Bell, X, Menu, MessageSquare, Heart, UserPlus, CreditCard } from 'lucide-react';
import { notificationAudio } from '@/lib/audio/notificationSound';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SettingsDrawer } from './SettingsDrawer';
import { useFeedModal } from '../context/FeedModalContext';
import {
  useNotificationsQuery,
  useSocialMutations,
} from '@/features/social/hooks/useSocialQueries';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminDashboard = pathname === '/organization/admin' || pathname?.startsWith('/organization/admin');
  const {
    isAdminDrawerOpen,
    setIsAdminDrawerOpen,
    badgeCounts,
  } = useAdminNav();
  const { searchQuery, setSearchQuery } = useFeedModal();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const { data: notifData } = useNotificationsQuery();
  const mutations = useSocialMutations();
  const notificationsList = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  // Play sweet chime sound when new unread notification arrives
  const prevUnreadRef = React.useRef(unreadCount);
  React.useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      notificationAudio.play(1.0);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const notificationRef = React.useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
    setSearchOpen(false);
  };

  const markAllRead = () => {
    mutations.markAllNotificationsRead.mutate();
  };

  const getNotifMeta = (type: string) => {
    switch (type) {
      case 'POST_LIKE':
        return { Icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' };
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return { Icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPT':
        return { Icon: UserPlus, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
      case 'CONTRIBUTION_REMINDER':
        return { Icon: CreditCard, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
      default:
        return { Icon: Bell, color: 'text-brand-emerald bg-emerald-50 dark:bg-emerald-950/40' };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-brand-charcoal-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none min-w-0 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logos/logo.png"
                alt="আমরা মোহাম্মদপুরী লোগো"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-brand-emerald dark:text-brand-mint leading-tight truncate max-w-[125px] min-[360px]:max-w-[165px] sm:max-w-none">
                আমরা মোহাম্মদপুরী
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Community Timeline
              </span>
            </div>
          </Link>

          {/* Center Search Bar (Desktop & Tablet) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="মোহাম্মদপুরের পোস্ট, সড়ক বা বিষয় খুঁজুন..."
                className="w-full pl-10 pr-9 py-2 rounded-full text-xs sm:text-sm bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Public Campaigns Link */}
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-brand-emerald/15 text-brand-emerald dark:text-brand-mint hover:bg-emerald-100 dark:hover:bg-brand-emerald/25 transition-colors border border-emerald-200/60 dark:border-brand-emerald/30 shadow-2xs"
              title="জনকল্যাণমূলক ক্যাম্পেইন ও অনুদান"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span className="hidden min-[420px]:inline">ক্যাম্পেইন</span>
            </Link>

            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Popover Trigger */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="নোটিফিকেশন"
                title="বিজ্ঞপ্তি"
              >
                <Bell className="w-4 h-4" />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-brand-charcoal animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="sm:hidden fixed inset-0 bg-black/25 z-40 backdrop-blur-xs"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="fixed top-14 left-3 right-3 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:w-88 sm:mt-2 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        বিজ্ঞপ্তি ও নোটিফিকেশন
                      </h3>
                      {hasUnread && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-[11px] font-semibold text-brand-emerald hover:underline cursor-pointer"
                        >
                          পড়া হয়েছে
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          কোনো নতুন নোটিফিকেশন নেই
                        </div>
                      ) : (
                        notificationsList.slice(0, 6).map((n) => {
                          const { Icon, color } = getNotifMeta(n.type);
                          return (
                            <Link
                              key={n.id}
                              href={n.type === 'CONTRIBUTION_REMINDER' ? '/organization/member' : '/notifications'}
                              onClick={() => setNotificationsOpen(false)}
                              className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${
                                !n.isRead ? 'bg-emerald-50/40 dark:bg-brand-emerald/5' : ''
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString('bn-BD', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-emerald shrink-0 mt-1.5" />
                              )}
                            </Link>
                          );
                        })
                      )}
                    </div>

                    {/* Panel footer */}
                    <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-brand-emerald dark:text-brand-mint hover:underline inline-block py-1"
                      >
                        সকল নোটিফিকেশন দেখুন →
                      </Link>
                    </div>

                  </div>
                </>
              )}
            </div>

            {/* Theme switcher (Hidden on narrow screens < 420px to prevent crowding; fully accessible via Drawer) */}
            <div className="hidden min-[420px]:inline-flex">
              <ThemeToggle />
            </div>

            {/* Hamburger Menu: Shows dedicated Admin Drawer on /organization/admin, else regular Settings Hamburger */}
            {isAdminDashboard ? (
              <button
                type="button"
                onClick={() => setIsAdminDrawerOpen(true)}
                aria-label="অ্যাডমিন কন্ট্রোল মেনু"
                title="অ্যাডমিন মেনু ও অপশন (ড্রয়ার)"
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-brand-emerald text-white hover:bg-emerald-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20 active:scale-95"
              >
                <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span className="text-xs font-bold hidden sm:inline">অ্যাডমিন মেনু</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="মেনু ও সেটিংস"
                title="মেনু ও সেটিংস"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer ring-1 ring-slate-200 dark:ring-white/10"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search input expander */}
        {searchOpen && (
          <div className="md:hidden px-3 py-2 border-t border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-brand-charcoal">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setSearchOpen(false);
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="মোহাম্মদপুরের পোস্ট বা বিষয় খুঁজুন..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 text-slate-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Slide-over Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Slide-over Admin Drawer (Dedicated for /organization/admin) */}
      {isAdminDashboard && (
        <AdminDrawer
          isOpen={isAdminDrawerOpen}
          onClose={() => setIsAdminDrawerOpen(false)}
                    fundsCount={badgeCounts.fundsCount}
          noticesCount={badgeCounts.noticesCount}
          onOpenGeneralSettings={() => {
            setIsAdminDrawerOpen(false);
            setSettingsOpen(true);
          }}
        />
      )}
    </>
  );
}
