'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from '@/lib/auth/auth-client';
import {
  Home,
  Compass,
  Bookmark,
  Users,
  Calculator,
  MapPin,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Landmark,
} from 'lucide-react';

interface LeftSidebarProps {
  activeBlock?: string | null;
  onSelectBlock?: (block: string | null) => void;
}

const BLOCKS = [
  'তাজমহল রোড',
  'সলিমুল্লাহ রোড',
  'বাবর রোড',
  'হুমায়ুন রোড',
  'নুরজাহান রোড',
  'জাপান গার্ডেন সিটি',
  'কাটাসুর',
  'বসিলা',
];

export function LeftSidebar({ activeBlock, onSelectBlock }: LeftSidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-5 sticky top-20 h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar scrollbar-none pb-8">
      {/* User Mini Card */}
      {session?.user ? (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0 ring-2 ring-brand-emerald/30">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-emerald font-bold">
                  {session.user.name?.charAt(0) || 'ম'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-brand-emerald/10 via-brand-mint/20 to-transparent dark:from-brand-emerald/20 dark:to-transparent rounded-2xl p-4 border border-brand-emerald/20 text-left space-y-2.5">
          <div className="flex items-center gap-2 text-brand-emerald font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>মোহাম্মদপুরী পরিবারে যুক্ত হোন</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            এলাকার উন্নয়ন, নিরাপত্তা ও সামাজিক উদ্যোগে আপনার কণ্ঠ তুলে ধরুন।
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-emerald text-white hover:bg-emerald-800 transition-colors"
            >
              লগইন
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              নিবন্ধন
            </Link>
          </div>
        </div>
      )}

      {/* Main Navigation Menu */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-2 border border-slate-200/80 dark:border-white/10 shadow-soft">
        <ul className="space-y-0.5 text-xs sm:text-sm font-medium">
          <li>
            <Link
              href="/"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-brand-emerald dark:text-brand-mint bg-brand-emerald/10 dark:bg-brand-emerald/20 font-bold"
            >
              <Home className="w-4 h-4 text-brand-emerald" />
              <span>হোম টাইমলাইন</span>
            </Link>
          </li>
          <li>
            <Link
              href="/explore"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>এক্সপ্লোর ও ট্রেন্ডস</span>
            </Link>
          </li>
          <li>
            <Link
              href="/friends"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>বন্ধু ও পরিচিত মহল</span>
            </Link>
          </li>
          <li>
            <Link
              href="/messages"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>ইনবক্স ও বার্তা</span>
            </Link>
          </li>
          <li>
            <Link
              href="/saved"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-slate-500" />
              <span>সংরক্ষিত পোস্ট</span>
            </Link>
          </li>
          <li>
            <Link
              href="/groups"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>এলাকা ভিত্তিক ফোরাম</span>
            </Link>
          </li>
          <li>
            <Link
              href="/organization"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <Landmark className="w-4 h-4 text-brand-emerald" />
              <span className="font-semibold text-brand-emerald dark:text-brand-mint">আমাদের সংগঠন</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Calculator className="w-4 h-4 text-slate-500" />
              <span>নাগরিক হিসাবরক্ষণ</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Block Selector Shortcuts */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-emerald" />
            মোহাম্মদপুরের ব্লকসমূহ
          </span>
          {activeBlock && (
            <button
              type="button"
              onClick={() => onSelectBlock?.(null)}
              className="text-[11px] text-brand-emerald font-semibold hover:underline"
            >
              সকল
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BLOCKS.map((block) => {
            const isSelected = activeBlock === block;
            return (
              <button
                key={block}
                type="button"
                onClick={() => onSelectBlock?.(isSelected ? null : block)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                  isSelected
                    ? 'bg-brand-emerald text-white font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {block}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
