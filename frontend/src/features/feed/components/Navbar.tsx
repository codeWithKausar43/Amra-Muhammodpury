'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Bell, X, Menu, MessageSquare, Heart, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SettingsDrawer } from './SettingsDrawer';
import { useFeedModal } from '../context/FeedModalContext';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'n-1',
    icon: MessageSquare,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
    title: 'ইঞ্জি. সামিউল ইসলাম আপনার পোস্টে মন্তব্য করেছেন।',
    time: '১০ মিনিট আগে',
    unread: true,
  },
  {
    id: 'n-2',
    icon: AlertTriangle,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
    title: 'ডিপিডিসি থেকে বাবর রোডে বিদ্যুৎ সংস্কার বিজ্ঞপ্তি প্রকাশিত হয়েছে।',
    time: '১ ঘণ্টা আগে',
    unread: true,
  },
  {
    id: 'n-3',
    icon: Heart,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
    title: 'সালমান ফারসি আপনার পোস্টে লাইক দিয়েছেন।',
    time: '৩ ঘণ্টা আগে',
    unread: false,
  },
];

export function Navbar({ onSearch }: NavbarProps) {
  const { searchQuery, setSearchQuery } = useFeedModal();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(SAMPLE_NOTIFICATIONS);

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
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const hasUnread = notifications.some((n) => n.unread);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-brand-charcoal-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-brand-emerald to-emerald-800 flex items-center justify-center text-white font-bold text-base shadow-glow">
              <span>ম</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg font-bold tracking-tight text-brand-emerald dark:text-brand-mint leading-tight">
                আমরা মুহাম্মদপুরী
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden xs:inline">
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
                placeholder="মুহাম্মদপুরের পোস্ট, সড়ক বা বিষয় খুঁজুন..."
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications Popover Trigger */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
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
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <div
                          key={n.id}
                          className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${
                            n.unread ? 'bg-emerald-50/40 dark:bg-brand-emerald/5' : ''
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {n.time}
                            </span>
                          </div>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-brand-emerald shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Theme switcher */}
            <ThemeToggle />

            {/* Hamburger Menu & Settings Button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="মেনু ও সেটিংস"
              title="মেনু ও সেটিংস"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-all cursor-pointer ring-1 ring-slate-200 dark:ring-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
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
                placeholder="মুহাম্মদপুরের পোস্ট বা বিষয় খুঁজুন..."
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
    </>
  );
}
