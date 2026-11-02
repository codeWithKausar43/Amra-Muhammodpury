'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from '@/lib/auth/auth-client';
import {
  Users2,
  Plus,
  Lock,
  Globe,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGroupsQuery,
  useSocialMutations,
  socialQueryKeys,
} from '@/features/social/hooks/useSocialQueries';
import { socialService } from '@/features/social/services/social.service';

export default function GroupsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data: groupsData, isLoading } = useGroupsQuery();
  const mutations = useSocialMutations();

  const [activeTab, setActiveTab] = React.useState<'JOINED' | 'DISCOVER'>('JOINED');
  const joinedGroups = groupsData?.joined ?? [];
  const discoverGroups = groupsData?.discover ?? [];
  const isInitialLoading = isLoading && !groupsData;

  // Modal for creating group
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [groupName, setGroupName] = React.useState('');
  const [groupDesc, setGroupDesc] = React.useState('');
  const [groupPrivacy, setGroupPrivacy] = React.useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [groupRules, setGroupRules] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupName.trim().length < 3) {
      setCreateError('গ্রুপের নাম কমপক্ষে ৩ অক্ষরের হতে হবে');
      return;
    }
    setCreating(true);
    setCreateError(null);

    try {
      await socialService.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        privacy: groupPrivacy,
        rules: groupRules.trim() || undefined,
      });

      setCreateModalOpen(false);
      setGroupName('');
      setGroupDesc('');
      setGroupRules('');
      await queryClient.invalidateQueries({ queryKey: socialQueryKeys.groups.all });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'গ্রুপ তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    setActionLoadingId(groupId);
    try {
      await mutations.joinGroup.mutateAsync(groupId);
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-brand-emerald" />
            <span>কমিউনিটি ও গ্রুপসমূহ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            মোহাম্মদপুরের বিভিন্ন মহল্লা ও সাধারণ স্বার্থভিত্তিক কমিউনিটি
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session?.user && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন গ্রুপ তৈরি করুন</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('JOINED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'JOINED'
                  ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              আপনার গ্রুপ ({joinedGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DISCOVER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'DISCOVER'
                  ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              নতুন গ্রুপ খুঁজুন ({discoverGroups.length})
            </button>
          </div>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">গ্রুপ লোড হচ্ছে...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: JOINED GROUPS */}
          {activeTab === 'JOINED' && (
            <div className="space-y-4">
              {joinedGroups.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mx-auto">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    আপনি এখনো কোনো গ্রুপে যুক্ত হননি
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    আপনার পছন্দের বা আপনার এলাকার গ্রুপে যুক্ত হয়ে নাগরিক আলোচনায় অংশ নিন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DISCOVER')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold shadow-sm hover:bg-emerald-800 cursor-pointer"
                  >
                    <span>গ্রুপ এক্সপ্লোর করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {joinedGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft hover:shadow-glow transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                            {group.image ? (
                              <Image
                                src={group.image}
                                alt={group.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald">
                                {group.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                              group.privacy === 'PUBLIC'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald dark:text-brand-mint'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {group.privacy === 'PUBLIC' ? (
                              <>
                                <Globe className="w-3 h-3" />
                                <span>পাবলিক</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>প্রাইভেট</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors line-clamp-1">
                            {group.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {group.description || 'মোহাম্মদপুরী কমিউনিটি গ্রুপ।'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <span>{group._count.members} জন সদস্য</span>
                        <span className="font-semibold text-brand-emerald group-hover:translate-x-0.5 transition-transform">
                          প্রবেশ করুন &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCOVER GROUPS */}
          {activeTab === 'DISCOVER' && (
            <div className="space-y-4">
              {discoverGroups.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    আপাতত সব উপলব্ধ গ্রুপেই আপনি যুক্ত আছেন!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {discoverGroups.map((group) => (
                    <div
                      key={group.id}
                      className="glass-panel p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-soft flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-brand-emerald/10 shrink-0">
                            {group.image ? (
                              <Image
                                src={group.image}
                                alt={group.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald">
                                {group.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald dark:text-brand-mint flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>পাবলিক</span>
                          </span>
                        </div>

                        <div>
                          <Link href={`/groups/${group.id}`}>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-emerald transition-colors line-clamp-1">
                              {group.name}
                            </h4>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {group.description || 'মোহাম্মদপুরী কমিউনিটি গ্রুপ।'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <span className="text-xs text-slate-400 block">
                          {group._count.members} জন সদস্য
                        </span>
                        <button
                          type="button"
                          onClick={() => handleJoin(group.id)}
                          disabled={actionLoadingId === group.id}
                          className="w-full py-2 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>গ্রুপে যুক্ত হোন</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  নতুন গ্রুপ তৈরি করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">
                {createError}
              </p>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  গ্রুপের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তাজমহল রোড ব্যবসায়ী ও বাসিন্দা পরিষদ"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  গ্রুপের বিবরণ
                </label>
                <textarea
                  rows={2}
                  placeholder="গ্রুপের মূল উদ্দেশ্য ও কার্যক্রম লিখুন..."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  গোপনীয়তা ধরণ
                </label>
                <select
                  value={groupPrivacy}
                  onChange={(e) => setGroupPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald cursor-pointer"
                >
                  <option value="PUBLIC">পাবলিক (যে কেউ যুক্ত হতে পারবে ও পোস্ট দেখতে পাবে)</option>
                  <option value="PRIVATE">প্রাইভেট (অ্যাডমিনের অনুমোদন লাগবে)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  গ্রুপের নিয়মাবলী (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="গ্রুপের সাধারণ আচরণবিধি লিখুন..."
                  value={groupRules}
                  onChange={(e) => setGroupRules(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>গ্রুপ তৈরি করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
