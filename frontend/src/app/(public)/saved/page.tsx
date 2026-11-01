'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bookmark, Loader2, ArrowRight } from 'lucide-react';
import { useSavedPostsQuery } from '@/features/social/hooks/useSocialQueries';
import { PostCard } from '@/features/feed/components/PostCard';

export default function SavedPostsPage() {
  const { data: savedItems = [], isLoading } = useSavedPostsQuery();
  const isInitialLoading = isLoading && savedItems.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      <div className="pb-2 border-b border-slate-200/60 dark:border-white/10">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-brand-emerald" />
          <span>সংরক্ষিত পোস্টসমূহ</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          আপনার পরবর্তীতে পড়ার জন্য সংরক্ষণ করে রাখা পোস্টসমূহ
        </p>
      </div>

      {isInitialLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">সংরক্ষিত পোস্ট লোড হচ্ছে...</p>
        </div>
      ) : savedItems.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            কোনো পোস্ট সংরক্ষিত নেই
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            টাইমলাইনে যেকোনো পোস্টের ডান পাশের অপশন থেকে &quot;সংরক্ষণ করুন&quot; ক্লিক করে এখানে জমা রাখতে পারেন।
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold shadow-sm hover:bg-emerald-800"
          >
            <span>টাইমলাইনে ফিরে যান</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedItems.map((item) => (
            <PostCard key={item.post.id} post={item.post} />
          ))}
        </div>
      )}
    </div>
  );
}
