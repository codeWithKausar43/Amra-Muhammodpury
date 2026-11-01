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
  PhoneCall,
  ShieldCheck,
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

const EMERGENCY_SERVICES = [
  { name: 'ডিপিডিসি বিদ্যুৎ হেল্পলাইন', number: '১৬১১০' },
  { name: 'ঢাকা ওয়াসা (পানি ও পয়ঃনিষ্কাশন)', number: '১৬১৬২' },
  { name: 'মুহাম্মদপুর থানা পুলিশ', number: '০১৩২০-০৪০৮৮৪' },
  { name: 'ফায়ার সার্ভিস মুহাম্মদপুর', number: '০২-৯১১৯৯৯৯' },
];

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const isDark = mounted && theme === 'dark';

  const handleSignOut = async () => {
    onClose();
    await signOut();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full sm:w-[400px] max-w-full bg-white dark:bg-brand-charcoal-dark h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-white/10 overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-emerald text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ম
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                মেনু ও সেটিংস
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                আমরা মুহাম্মদপুরী হাব
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* User Account or Login / Register Card */}
          {session?.user ? (
            <div className="bg-gradient-to-br from-brand-mint/30 via-emerald-50/30 to-white dark:from-emerald-950/30 dark:via-brand-charcoal dark:to-brand-charcoal-dark border border-brand-emerald/20 rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-emerald/20 ring-2 ring-brand-emerald/40 shrink-0">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-base">
                      {session.user.name?.charAt(0) || 'ম'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-white/5 flex items-center gap-2">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex-1 text-center py-2 px-3 rounded-xl bg-brand-emerald text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
                >
                  প্রোফাইল ও ড্যাশবোর্ড
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>প্রস্থান</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-brand-emerald/10 via-brand-mint/20 to-transparent dark:from-emerald-950/40 rounded-2xl p-4 border border-brand-emerald/20 text-left space-y-2.5 shadow-soft">
              <div className="flex items-center gap-2 text-brand-emerald dark:text-brand-mint font-bold text-sm">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>মুহাম্মদপুরী একাউন্টে যুক্ত হোন</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                আপনার এলাকার খবর জানতে, লাইক ও মন্তব্য করতে অথবা নতুন পোস্ট প্রকাশ করতে প্রবেশ করুন।
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-all shadow-glow"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন করুন</span>
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>নতুন নিবন্ধন</span>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Shortcuts & Navigation Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
              মূল ফিচার ও নেভিগেশন
            </h3>
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-1.5 space-y-0.5">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    হোম টাইমলাইন
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/explore"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    এক্সপ্লোর ও ট্রেন্ডস
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    নাগরিক হিসাবরক্ষণ (স্বচ্ছতা)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('এলাকা ভিত্তিক ফোরাম শীঘ্রই চালু হবে!');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    এলাকা ভিত্তিক ফোরাম
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('সংরক্ষিত পোস্ট শীঘ্রই যুক্ত হবে!');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    সংরক্ষিত পোস্ট (Saved)
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Settings & Preferences Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
              সেটিংস ও প্রেফারেন্স
            </h3>
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-1.5 space-y-0.5">
              {/* Theme Toggle in Menu */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      থিম পরিবর্তন
                    </span>
                    <span className="text-[10px] text-slate-500">
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
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    অ্যাকাউন্ট সেটিংস
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Notification Preferences */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  alert('নোটিফিকেশন সেটিংস শীঘ্রই আসছে!');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    বিজ্ঞপ্তি প্রেফারেন্স
                  </span>
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
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    গোপনীয়তা ও নিরাপত্তা
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Emergency Helplines Section */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
              জরুরী সেবা ও হেল্পলাইন
            </h3>
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-1.5 space-y-1">
              {EMERGENCY_SERVICES.map((s) => (
                <a
                  key={s.name}
                  href={`tel:${s.number.replace(/[^0-9]/g, '')}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PhoneCall className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {s.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-emerald">
                    {s.number}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Community Guidelines and Info */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-brand-emerald dark:text-brand-mint font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>কমিউনিটি অঙ্গীকার</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              আমরা মুহাম্মদপুরী প্ল্যাটফর্মে কোনো প্রকার গুজব, বিভ্রান্তি বা হিংসাত্মক বক্তব্য দেওয়া নিষিদ্ধ।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-slate-400">
          <span>আমরা মুহাম্মদপুরী • v১.০</span>
          <span>© ২০২৬ সর্বস্বত্ব সংরক্ষিত</span>
        </div>
      </div>
    </div>
  );
}
