'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Lock,
  Globe,
  Loader2,
  ArrowLeft,
  Send,
  UserCheck,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { socialService, GroupData } from '@/features/social/services/social.service';
import { Post } from '@/features/feed/types';
import { PostCard } from '@/features/feed/components/PostCard';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [group, setGroup] = React.useState<GroupData | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [actionLoading, setActionLoading] = React.useState(false);

  // Group post composer state
  const [postContent, setPostContent] = React.useState('');
  const [posting, setPosting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [gData, pData] = await Promise.all([
        socialService.getGroup(groupId),
        socialService.getGroupPosts(groupId),
      ]);
      setGroup(gData);
      setPosts(pData);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await socialService.joinGroup(groupId);
      await loadData();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('আপনি কি এই গ্রুপটি ত্যাগ করতে চান?')) return;
    setActionLoading(true);
    try {
      await socialService.leaveGroup(groupId);
      await loadData();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      await socialService.createGroupPost(groupId, { content: postContent.trim() });
      setPostContent('');
      await loadData();
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p className="text-xs text-slate-400">গ্রুপের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">গ্রুপ পাওয়া যায়নি</h2>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>গ্রুপ তালিকায় ফিরুন</span>
        </Link>
      </div>
    );
  }

  const isMember = Boolean(group.membershipRole);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Back button */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-emerald transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>সব গ্রুপ দেখুন</span>
      </Link>

      {/* Group Hero Banner Card */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-soft">
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-brand-emerald via-emerald-800 to-teal-900">
          {group.coverImage && (
            <Image src={group.coverImage} alt={group.name} fill className="object-cover" />
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
            <div className="flex items-end gap-3.5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-white dark:bg-brand-charcoal-dark ring-4 ring-white dark:ring-brand-charcoal-dark shadow-md shrink-0">
                {group.image ? (
                  <Image src={group.image} alt={group.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-2xl">
                    {group.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {group.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    {group.privacy === 'PUBLIC' ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-brand-emerald" />
                        <span>পাবলিক গ্রুপ</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>প্রাইভেট গ্রুপ</span>
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>{group._count.members} জন সদস্য</span>
                </div>
              </div>
            </div>

            {/* Membership Button */}
            <div className="pt-2 sm:pt-0">
              {isMember ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald text-xs font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {group.membershipRole === 'OWNER'
                        ? 'মালিক'
                        : group.membershipRole === 'ADMIN'
                          ? 'অ্যাডমিন'
                          : 'সদস্য'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                  >
                    ত্যাগ করুন
                  </button>
                </div>
              ) : group.pendingRequest ? (
                <span className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  যোগদানের আবেদন অপেক্ষমাণ...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  <span>গ্রুপে যুক্ত হোন</span>
                </button>
              )}
            </div>
          </div>

          {/* Group description */}
          {group.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Feed + Group Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Posts & Composer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Post composer in group */}
          {isMember && (
            <div className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft">
              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  rows={2}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`"${group.name}" গ্রুপে পোস্ট করুন...`}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-brand-emerald resize-none"
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={posting || !postContent.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {posting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>প্রকাশ করুন</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Group Posts Feed */}
          {posts.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                এই গ্রুপে এখনো কোনো পোস্ট প্রকাশ করা হয়নি
              </p>
              {isMember && (
                <p className="text-xs text-slate-400">প্রথম পোস্টটি আপনিই প্রকাশ করুন!</p>
              )}
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>

        {/* Right Column: Group Details / Rules */}
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">গ্রুপ পরিচিতি</h3>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <p>
                <strong>প্রতিষ্ঠাতা:</strong> {group.creator.name}
              </p>
              {group.rules && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-200 mb-1">
                    আচরণবিধি ও নিয়মাবলী:
                  </strong>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 leading-relaxed">
                    {group.rules}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
