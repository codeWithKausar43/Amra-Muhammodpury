'use client';

import * as React from 'react';
import Image from 'next/image';
import { Users, X, Loader2, Shield, UserMinus, UserPlus, Search } from 'lucide-react';
import { ConversationItem } from '../types/messenger.types';
import { messengerService } from '../services/messenger.service';
import { useUserSearch } from '../hooks/useMessenger';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationItem;
  currentUserId?: string;
  onRefresh: () => void;
}

export function GroupMembersModal({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onRefresh,
}: GroupMembersModalProps) {
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading } = useUserSearch(debouncedQuery);

  if (!isOpen) return null;

  const members = conversation.members || [];
  const currentMember = members.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === 'ADMIN' || conversation.creatorId === currentUserId;

  const handleRemove = async (targetUserId: string) => {
    if (!confirm('আপনি কি এই সদস্যকে গ্রুপ থেকে অপসারণ করতে চান?')) return;
    setLoadingAction(`remove-${targetUserId}`);
    try {
      await messengerService.removeGroupMember(conversation.id, targetUserId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'অপসারণ করা সম্ভব হয়নি');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAdd = async (userId: string) => {
    setLoadingAction(`add-${userId}`);
    try {
      await messengerService.addGroupMembers(conversation.id, [userId]);
      onRefresh();
      setShowAddMember(false);
      setSearchQuery('');
    } catch (err: any) {
      alert(err.message || 'সদস্য যোগ করতে ব্যর্থ হয়েছে');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {conversation.title || 'গ্রুপের সদস্যবৃন্দ'}
              </h3>
              <p className="text-[11px] text-slate-400">{members.length} জন সক্রিয় সদস্য</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Member Toggle for Admin */}
        {isAdmin && (
          <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              নতুন সদস্য যোগ করবেন?
            </span>
            <button
              type="button"
              onClick={() => setShowAddMember(!showAddMember)}
              className="px-2.5 py-1 rounded-xl bg-brand-emerald text-white text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-800 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddMember ? 'বন্ধ করুন' : 'সদস্য যোগ'}</span>
            </button>
          </div>
        )}

        {/* Add Member Search Panel */}
        {showAddMember && (
          <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-emerald-50/50 dark:bg-brand-emerald/5 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নতুন সদস্যের নাম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none"
              />
            </div>

            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-emerald mx-auto" />
                </div>
              ) : (
                searchResults
                  .filter((u) => !members.some((m) => m.userId === u.id))
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-2 flex items-center justify-between gap-2 hover:bg-white/80 dark:hover:bg-white/5 rounded-xl"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {user.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(user.id)}
                        disabled={loadingAction === `add-${user.id}`}
                        className="px-2 py-1 rounded-lg bg-brand-emerald text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {loadingAction === `add-${user.id}` ? 'যোগ হচ্ছে...' : 'যুক্ত করুন'}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
          {members.map((member) => {
            const isCreator = conversation.creatorId === member.userId;
            const isSelf = member.userId === currentUserId;
            return (
              <div
                key={member.id}
                className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-brand-emerald/10 shrink-0">
                    {member.user?.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-xs">
                        {member.user?.name?.charAt(0) || 'ম'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {member.user?.name} {isSelf && '(আপনি)'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isCreator ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                          <Shield className="w-2.5 h-2.5" />
                          <span>গ্রুপ প্রতিষ্ঠাতা</span>
                        </span>
                      ) : member.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                          <Shield className="w-2.5 h-2.5" />
                          <span>অ্যাডমিন</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">সদস্য</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Member Button for Admin (cannot remove creator or self) */}
                {isAdmin && !isCreator && !isSelf && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.userId)}
                    disabled={loadingAction === `remove-${member.userId}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                    title="অপসারণ করুন"
                  >
                    {loadingAction === `remove-${member.userId}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
