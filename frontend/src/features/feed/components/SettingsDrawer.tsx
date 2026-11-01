'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { useTheme } from 'next-themes';
import {
  X,
  Settings,
  Bell,
  Lock,
  Moon,
  Sun,
  Home,
  Compass,
  Calculator,
  Users,
  Bookmark,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key when drawer is open
  React.useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isDark = mounted && theme === 'dark';

  const handleSignOut = async () => {
    onClose();
    await signOut();
    window.location.reload();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible delay-300'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel (Smooth Slide-In From Right) */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[380px] max-w-full bg-white dark:bg-brand-charcoal-dark h-full shadow-2xl flex flex-col z-10 border-l border-slate-200/80 dark:border-white/10 transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-emerald to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ম
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                মেনু ও সেটিংস
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                আমরা মুহাম্মদপুরী
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body (Clean, Non-Boxy Design) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">
          {/* User Account / Sign In Section (Clean Minimalist) */}
          {session?.user ? (
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 min-w-0 group"
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/30 group-hover:ring-brand-emerald shrink-0 transition-all">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                      {session.user.name?.charAt(0) || 'ম'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">প্রোফাইল দেখুন ও ম্যানেজ করুন</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pb-4 border-b border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-brand-emerald dark:text-brand-mint font-bold text-sm">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>মুহাম্মদপুরী একাউন্টে স্বাগতম</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                আপনার এলাকার খবর জানতে, আলোচনায় যুক্ত হতে এবং পোস্ট প্রকাশ করতে একাউন্টে প্রবেশ করুন।
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন করুন</span>
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>নতুন নিবন্ধন</span>
                </Link>
              </div>
            </div>
          )}

          {/* Section 1: মূল ফিচার ও নেভিগেশন (Clean Minimal List) */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              মূল ফিচার ও নেভিগেশন
            </h3>
            <div className="space-y-0.5">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">হোম টাইমলাইন</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/explore"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">এক্সপ্লোর ও ট্রেন্ডস</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">নাগরিক হিসাবরক্ষণ (স্বচ্ছতা)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('এলাকা ভিত্তিক ফোরাম শীঘ্রই উন্মুক্ত করা হবে!');
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">এলাকা ভিত্তিক ফোরাম</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('সংরক্ষিত পোস্ট শীঘ্রই যুক্ত হবে!');
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">সংরক্ষিত পোস্ট (Saved)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Section 2: সেটিংস ও প্রেফারেন্স (Clean Minimal List) */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-white/10">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              সেটিংস ও প্রেফারেন্স
            </h3>
            <div className="space-y-0.5">
              {/* Theme Switcher Row */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block leading-tight">
                      থিম পরিবর্তন
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isDark ? 'ডার্ক মোড সক্রিয়' : 'লাইট মোড সক্রিয়'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand-emerald">
                  {isDark ? 'লাইট করুন' : 'ডার্ক করুন'}
                </span>
              </button>

              {/* Account Settings */}
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">অ্যাকাউন্ট সেটিংস</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Notification Preferences */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('বিজ্ঞপ্তি সেটিংস শীঘ্রই আসছে!');
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">বিজ্ঞপ্তি প্রেফারেন্স</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Privacy and Security */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('গোপনীয়তা ও নিরাপত্তা সেটিংস উন্মুক্ত করা হচ্ছে');
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">গোপনীয়তা ও নিরাপত্তা</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>আমরা মুহাম্মদপুরী • v১.০</span>
          <span>© ২০২৬</span>
        </div>
      </div>
    </div>
  );
}
