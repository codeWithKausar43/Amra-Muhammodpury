'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Search, Users, FileText, Users2, Loader2 } from 'lucide-react';
import {
  socialService,
  FriendSummary,
  GroupData,
} from '@/features/social/services/social.service';
import { Post } from '@/features/feed/types';
import { PostCard } from '@/features/feed/components/PostCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = React.useState(initialQ);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'PEOPLE' | 'POSTS' | 'GROUPS'>('ALL');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<{
    people: FriendSummary[];
    posts: Post[];
    groups: GroupData[];
  }>({ people: [], posts: [], groups: [] });

  React.useEffect(() => {
    if (!query.trim()) {
      setResults({ people: [], posts: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await socialService.search(query.trim(), activeTab);
        setResults(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const hasAnyResults =
    results.people.length > 0 || results.posts.length > 0 || results.groups.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          autoFocus
          placeholder="মোহাম্মদপুরের মানুষ, পোস্ট বা গ্রুপ খুঁজুন..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-brand-charcoal-dark/80 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-emerald shadow-sm"
        />
      </div>

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          সবগুলো
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PEOPLE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === 'PEOPLE'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>মানুষ ({results.people.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('POSTS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === 'POSTS'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>পোস্ট ({results.posts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('GROUPS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === 'GROUPS'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-3.5 h-3.5" />
          <span>গ্রুপ ({results.groups.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-7 h-7 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">অনুসন্ধান করা হচ্ছে...</p>
        </div>
      ) : !query.trim() ? (
        <div className="py-16 text-center text-xs text-slate-400 space-y-2">
          <Search className="w-10 h-10 mx-auto text-slate-300" />
          <p>সার্চ বারে লিখে যে কাউকে বা যেকোনো পোস্ট সহজে খুঁজে বের করুন।</p>
        </div>
      ) : !hasAnyResults ? (
        <div className="py-16 text-center text-xs text-slate-400 space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            &quot;{query}&quot;-এর জন্য কোনো ফলাফল মেলেনি
          </p>
          <p>বানান ঠিক আছে কিনা যাচাই করুন অথবা অন্য শব্দ দিয়ে সন্ধান করুন।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* People Section */}
          {(activeTab === 'ALL' || activeTab === 'PEOPLE') && results.people.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-emerald" />
                <span>মানুষ ({results.people.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/profile/${person.id}`}
                    className="glass-panel p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center gap-3 shadow-soft hover:border-brand-emerald transition-all group"
                  >
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                      {person.image ? (
                        <Image src={person.image} alt={person.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                          {person.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                        {person.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {person.bio || 'মোহাম্মদপুরী সদস্য'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Groups Section */}
          {(activeTab === 'ALL' || activeTab === 'GROUPS') && results.groups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-brand-emerald" />
                <span>গ্রুপসমূহ ({results.groups.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.groups.map((grp) => (
                  <Link
                    key={grp.id}
                    href={`/groups/${grp.id}`}
                    className="glass-panel p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center gap-3 shadow-soft hover:border-brand-emerald transition-all group"
                  >
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                      {grp.image ? (
                        <Image src={grp.image} alt={grp.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                          {grp.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                        {grp.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {grp._count.members} জন সদস্য
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeTab === 'ALL' || activeTab === 'POSTS') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-emerald" />
                <span>পোস্টসমূহ ({results.posts.length})</span>
              </h3>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
