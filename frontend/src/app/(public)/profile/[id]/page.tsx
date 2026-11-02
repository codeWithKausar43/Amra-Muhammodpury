'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useSession } from '@/lib/auth/auth-client';
import {
  MessageSquare,
  UserPlus,
  UserCheck,
  Edit3,
  Loader2,
  CheckCircle2,
  FileText,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useUserProfileQuery,
  useSocialMutations,
  socialQueryKeys,
} from '@/features/social/hooks/useSocialQueries';
import {
  socialService,
} from '@/features/social/services/social.service';
import { PostCard } from '@/features/feed/components/PostCard';

export default function UserProfilePage() {
  const params = useParams();
  const rawId = params?.id;
  const userId = (Array.isArray(rawId) ? rawId[0] : (rawId as string)) || '';
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const mutations = useSocialMutations();

  const { data: profileData, isLoading } = useUserProfileQuery(userId);

  const { data: friendshipStatus = { status: 'NONE' } } = useQuery({
    queryKey: socialQueryKeys.friends.status(userId),
    queryFn: () => socialService.getFriendshipStatus(userId),
    enabled: Boolean(session?.user && session.user.id !== userId),
    staleTime: 60 * 1000,
  });

  const [actionLoading, setActionLoading] = React.useState(false);

  // Edit Profile Modal states
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editCover, setEditCover] = React.useState('');
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    if (profileData?.user) {
      setEditName(profileData.user.name);
      setEditBio(profileData.user.bio || '');
      setEditCover(profileData.user.coverImage || '');
    }
  }, [profileData]);

  const handleSendFriendRequest = async () => {
    setActionLoading(true);
    try {
      await mutations.sendFriendRequest.mutateAsync(userId);
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.status(userId) });
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipStatus.requestId) return;
    setActionLoading(true);
    try {
      await mutations.acceptFriendRequest.mutateAsync(friendshipStatus.requestId);
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.status(userId) });
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.profile.detail(userId) });
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendshipStatus.requestId) return;
    setActionLoading(true);
    try {
      await mutations.cancelFriendRequest.mutateAsync(friendshipStatus.requestId);
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.friends.status(userId) });
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await socialService.updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        coverImage: editCover.trim() || undefined,
      });
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: socialQueryKeys.profile.detail(userId) });
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p className="text-xs text-slate-400">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">প্রোফাইল পাওয়া যায়নি</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>টাইমলাইনে ফিরে যান</span>
        </Link>
      </div>
    );
  }

  const { user, posts, isSelf } = profileData;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Profile Header Banner Card */}
      <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-soft">
        {/* Cover Photo */}
        <div className="relative h-40 sm:h-56 bg-gradient-to-r from-emerald-700 via-brand-emerald to-teal-800">
          {user.coverImage && (
            <Image src={user.coverImage} alt={user.name} fill className="object-cover" />
          )}
        </div>

        {/* Profile Info Area */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Name */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 text-center sm:text-left">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white dark:bg-brand-charcoal-dark ring-4 ring-white dark:ring-brand-charcoal-dark shadow-md shrink-0">
                {user.image ? (
                  <Image src={user.image} alt={user.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-3xl">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint">
                    <CheckCircle2 className="w-3 h-3" />
                    সক্রিয় সদস্য
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.bio || 'মুহাম্মদপুরী কমিউনিটির একজন সদস্য।'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2 pt-2 sm:pt-0">
              {isSelf ? (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>প্রোফাইল এডিট করুন</span>
                </button>
              ) : (
                <>
                  {friendshipStatus.status === 'FRIENDS' ? (
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald text-xs font-semibold flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      <span>আপনার বন্ধু</span>
                    </span>
                  ) : friendshipStatus.status === 'REQUEST_SENT' ? (
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      রিকোয়েস্ট পাঠানো হয়েছে (বাতিল করুন)
                    </button>
                  ) : friendshipStatus.status === 'REQUEST_RECEIVED' ? (
                    <button
                      type="button"
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>রিকোয়েস্ট গ্রহণ করুন</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>ফ্রেন্ড রিকোয়েস্ট পাঠান</span>
                    </button>
                  )}

                  <Link
                    href={`/messages`}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    title="বার্তা পাঠান"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-white/5 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">
                {user.friendsCount}
              </span>
              <span className="text-[11px] text-slate-400">বন্ধু</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">
                {user.postsCount}
              </span>
              <span className="text-[11px] text-slate-400">পোস্ট</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">
                {user.groupsCount}
              </span>
              <span className="text-[11px] text-slate-400">গ্রুপ</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts Timeline */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-emerald" />
          <span>টাইমলাইন পোস্টসমূহ ({posts.length})</span>
        </h3>

        {posts.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              কোনো পোস্ট পাওয়া যায়নি
            </p>
            <p className="text-xs text-slate-400">
              এই সদস্য এখনো কোনো পাবলিক পোস্ট প্রকাশ করেননি।
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                প্রোফাইল সম্পাদনা করুন
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">নাম</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  নিজের সম্পর্কে কিছু লিখুন (Bio)
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="আপনার পেশা, আগ্রহ বা মুহাম্মদপুরের এলাকা..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  কভার ছবির লিঙ্ক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
