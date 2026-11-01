'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth/auth-client';
import {
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  Home,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-emerald" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          আপনার অ্যাকাউন্ট লোড হচ্ছে...
        </p>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-emerald to-emerald-800 flex items-center justify-center text-white font-bold text-lg shadow-glow">
            <span>ম</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
              সদস্য ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">আমরা মুহাম্মদপুরী</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-brand-emerald rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="হোমে ফিরুন"
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark space-y-6">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-brand-emerald/10 ring-4 ring-brand-emerald/20 shadow-md shrink-0">
            {user?.image ? (
              <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-2xl">
                {user?.name?.charAt(0) || 'ম'}
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'মুহাম্মদপুরী নাগরিক'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint">
                <CheckCircle2 className="w-3 h-3" />
                সক্রিয় সদস্য
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              আমরা মুহাম্মদপুরী প্ল্যাটফর্মে আপনাকে স্বাগতম
            </p>
          </div>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Email */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Mail className="w-3.5 h-3.5" />
              <span>ইমেইল ঠিকানা</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user?.email || '—'}
            </p>
          </div>

          {/* Phone */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Phone className="w-3.5 h-3.5" />
              <span>মোবাইল নম্বর</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {(user as { phone?: string })?.phone || '০১৭XXXXXXXX'}
            </p>
          </div>

          {/* Role */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>অ্যাকাউন্ট রোল</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {(user as { role?: string })?.role === 'ADMIN' ? 'অ্যাডমিন' : 'কমিউনিটি সদস্য'}
            </p>
          </div>

          {/* Session Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span>নিরাপত্তা সেশন</span>
            </div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-brand-mint">
              সুরক্ষিত (Better Auth)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl sm:rounded-2xl text-center text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md hover:shadow-glow cursor-pointer"
          >
            হোম টাইমলাইনে প্রবেশ করুন
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-xl sm:rounded-2xl text-sm font-medium transition-all border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-60 cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>লগআউট</span>
          </button>
        </div>
      </div>
    </div>
  );
}
