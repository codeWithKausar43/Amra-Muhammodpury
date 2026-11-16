'use client';

import * as React from 'react';
import Image from 'next/image';
import { Users, X, Loader2, Check, Search } from 'lucide-react';
import { useUserSearch } from '../hooks/useMessenger';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: { title: string; memberIds: string[] }) => Promise<void>;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
}: CreateGroupModalProps) {
  const [title, setTitle] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading } = useUserSearch(debouncedSearch);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateGroup({
        title: title.trim(),
        memberIds: selectedUserIds,
      });
      setTitle('');
      setSelectedUserIds([]);
      onClose();
    } catch (err: any) {
      alert(err.message || 'গ্রুপ তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন গ্রুপ চ্যাট তৈরি</h3>
              <p className="text-[11px] text-slate-400">সদস্যদের সাথে দলবদ্ধ কথোপকথন শুরু করুন</p>
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

        {/* Group Details Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/10 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                গ্রুপের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: তাজমহল রোড উন্নয়ন ফোরাম"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                required
              />
            </div>

            {/* Member Search input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                সদস্য যোগ করুন ({selectedUserIds.length} জন নির্বাচিত)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সদস্যের নাম দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Members Checklist */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-brand-emerald" />
              </div>
            ) : debouncedSearch.length < 1 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                গ্রুপে যুক্ত করতে সদস্যদের নাম লিখে খুঁজুন।
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                কোনো সদস্য পাওয়া যায়নি।
              </div>
            ) : (
              searchResults.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-emerald/10 shrink-0">
                        {user.image ? (
                          <Image src={user.image} alt={user.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-xs">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-brand-emerald border-brand-emerald text-white'
                          : 'border-slate-300 dark:border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submit Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              <span>গ্রুপ তৈরি করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
