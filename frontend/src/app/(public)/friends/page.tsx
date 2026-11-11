'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  useFriendsQuery,
  useFriendRequestsQuery,
  useFriendSuggestionsQuery,
  useSocialMutations,
} from '@/features/social/hooks/useSocialQueries';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/feedback/Toast';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'REQUESTS' | 'SUGGESTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [removeFriendTarget, setRemoveFriendTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  // TanStack Cached Queries (Instant Render if Prefetched)
  const { data: friends = [], isLoading: isFriendsLoading } = useFriendsQuery();
  const { data: requests = { incoming: [], sent: [] }, isLoading: isRequestsLoading } = useFriendRequestsQuery();
  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useFriendSuggestionsQuery();
  const mutations = useSocialMutations();

  const loading =
    (isFriendsLoading || isRequestsLoading || isSuggestionsLoading) &&
    friends.length === 0 &&
    requests.incoming.length === 0 &&
    suggestions.length === 0;

  const handleAccept = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await mutations.acceptFriendRequest.mutateAsync(requestId);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await mutations.rejectFriendRequest.mutateAsync(requestId);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await mutations.cancelFriendRequest.mutateAsync(requestId);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoadingId(userId);
    try {
      await mutations.sendFriendRequest.mutateAsync(userId);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmRemoveFriend = async () => {
    if (!removeFriendTarget) return;
    setIsRemoving(true);
    setActionLoadingId(removeFriendTarget.id);
    try {
      await mutations.removeFriend.mutateAsync(removeFriendTarget.id);
      toast.success(`${removeFriendTarget.name}-কে বন্ধুর তালিকা থেকে সরানো হয়েছে`);
      setRemoveFriendTarget(null);
    } catch {
      toast.error('বন্ধু সরাতে ব্যর্থ হয়েছে');
    } finally {
      setIsRemoving(false);
      setActionLoadingId(null);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-emerald" />
            <span>বন্ধু ও পরিচিত মহল</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            মোহাম্মদপুরের প্রতিবেশী ও বন্ধুদের সাথে কানেক্ট থাকুন
          </p>
        </div>

        {/* Tab Controls */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            সকল বন্ধু ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>রিকোয়েস্ট</span>
            {requests.incoming.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {requests.incoming.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUGGESTIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'SUGGESTIONS'
                ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>সাজেস্টেড মানুষ</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">তথ্য লোড হচ্ছে...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ALL FRIENDS */}
          {activeTab === 'ALL' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="বন্ধুর নাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald text-slate-900 dark:text-white"
                />
              </div>

              {filteredFriends.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    কোনো বন্ধু পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    সাজেস্টেড মানুষ ট্যাব থেকে নতুন বন্ধুদের যুক্ত করুন এবং কমিউনিটির সাথে কানেক্টেড থাকুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('SUGGESTIONS')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold cursor-pointer shadow-sm hover:bg-emerald-800"
                  >
                    <span>নতুন বন্ধু খুঁজুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="glass-panel p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-soft transition-all hover:border-brand-emerald/40"
                    >
                      <Link
                        href={`/profile/${friend.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1 group"
                      >
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                          {friend.image ? (
                            <Image
                              src={friend.image}
                              alt={friend.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                              {friend.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                            {friend.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {friend.bio || 'মোহাম্মদপুরী সদস্য'}
                          </p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setRemoveFriendTarget({ id: friend.id, name: friend.name })}
                        disabled={actionLoadingId === friend.id}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="বন্ধু তালিকা থেকে সরান"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS (INCOMING & SENT) */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-emerald" />
                  <span>আগত ফ্রেন্ড রিকোয়েস্ট ({requests.incoming.length})</span>
                </h3>

                {requests.incoming.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    কোনো নতুন আগত রিকোয়েস্ট নেই।
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requests.incoming.map((req) => (
                      <div
                        key={req.id}
                        className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-soft space-y-3"
                      >
                        <Link href={`/profile/${req.sender.id}`} className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                            {req.sender.image ? (
                              <Image
                                src={req.sender.image}
                                alt={req.sender.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald">
                                {req.sender.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {req.sender.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {req.sender.bio || 'মোহাম্মদপুরী নাগরিক'}
                            </p>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="flex-1 py-2 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>গ্রহণ করুন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>পাঠানো রিকোয়েস্ট ({requests.sent.length})</span>
                </h3>

                {requests.sent.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    কোনো অপেক্ষমাণ পাঠানো রিকোয়েস্ট নেই।
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requests.sent.map((req) => (
                      <div
                        key={req.id}
                        className="glass-panel p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-soft"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0">
                            {req.receiver.image ? (
                              <Image
                                src={req.receiver.image}
                                alt={req.receiver.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-600">
                                {req.receiver.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {req.receiver.name}
                            </p>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400">
                              অপেক্ষমাণ...
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCancel(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        >
                          বাতিল করুন
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FRIEND SUGGESTIONS */}
          {activeTab === 'SUGGESTIONS' && (
            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    আপাতত কোনো নতুন পরামর্শ নেই
                  </p>
                  <p className="text-xs text-slate-400">
                    মোহাম্মদপুরের অন্যান্য বাসিন্দারা যুক্ত হলে স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {suggestions.map((cand) => (
                    <div
                      key={cand.id}
                      className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft flex flex-col items-center text-center space-y-3 transition-all hover:shadow-glow"
                    >
                      <Link href={`/profile/${cand.id}`} className="group">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/30 group-hover:ring-brand-emerald transition-all mx-auto">
                          {cand.image ? (
                            <Image
                              src={cand.image}
                              alt={cand.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-xl">
                              {cand.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 group-hover:text-brand-emerald transition-colors truncate max-w-[180px]">
                          {cand.name}
                        </h4>
                      </Link>

                      <div className="text-[11px] text-slate-400">
                        {cand.mutualFriendsCount && cand.mutualFriendsCount > 0 ? (
                          <span className="text-brand-emerald dark:text-brand-mint font-medium">
                            {cand.mutualFriendsCount} জন পারস্পরিক বন্ধু
                          </span>
                        ) : (
                          <span>মোহাম্মদপুরী সদস্য</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendRequest(cand.id)}
                        disabled={actionLoadingId === cand.id}
                        className="w-full py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>ফ্রেন্ড রিকোয়েস্ট পাঠান</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Professional Remove Friend Modal */}
      {removeFriendTarget && (
        <ConfirmDialog
          isOpen={Boolean(removeFriendTarget)}
          onClose={() => !isRemoving && setRemoveFriendTarget(null)}
          onConfirm={handleConfirmRemoveFriend}
          isLoading={isRemoving}
          title="বন্ধু তালিকা থেকে অপসারণ"
          variant="danger"
          confirmText="তালিকা থেকে সরান"
          description={
            <p>
              আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 dark:text-white">{removeFriendTarget.name}</strong>-কে আপনার বন্ধুর তালিকা থেকে সরাতে চান?
            </p>
          }
        />
      )}
    </div>
  );
}
