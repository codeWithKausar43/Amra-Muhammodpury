'use client';

import * as React from 'react';
import Image from 'next/image';
import { Search, X, Loader2, MessageSquare, UserCheck, Shield } from 'lucide-react';
import { useUserSearch } from '../hooks/useMessenger';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => Promise<void>;
}

export function NewChatModal({ isOpen, onClose, onSelectUser }: NewChatModalProps) {
  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [isStarting, setIsStarting] = React.useState<string | null>(null);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: users = [], isLoading } = useUserSearch(debouncedQuery);

  if (!isOpen) return null;

  const handleStart = async (userId: string) => {
    setIsStarting(userId);
    try {
      await onSelectUser(userId);
      onClose();
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      alert(err.message || 'চ্যাট শুরু করতে সমস্যা হয়েছে');
    } finally {
      setIsStarting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন চ্যাট শুরু করুন</h3>
              <p className="text-[11px] text-slate-400">মোহাম্মদপুরী কমিউনিটির যেকোনো সদস্যকে খুঁজুন</p>
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

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="নাম বা মোবাইল নম্বর লিখে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5 no-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-brand-emerald" />
              <span className="text-xs text-slate-400">খোঁজা হচ্ছে...</span>
            </div>
          ) : debouncedQuery.length < 1 ? (
            <div className="py-12 text-center text-xs text-slate-400 p-4">
              <p>যেকোনো সদস্যের নাম লিখে খুঁজুন।</p>
              <p className="mt-1 text-[11px] text-slate-500">
                বন্ধু ছাড়া সাধারণ সদস্যদের ক্ষেত্রে প্রথম বার্তাটি রিকোয়েস্ট হিসেবে যাবে।
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো সদস্য খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            users.map((user) => {
              const starting = isStarting === user.id;
              return (
                <div
                  key={user.id}
                  className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-brand-emerald/10 ring-2 ring-brand-emerald/20 shrink-0">
                      {user.image ? (
                        <Image src={user.image} alt={user.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.isFriend && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>বন্ধু</span>
                          </span>
                        )}
                        {user.role === 'ADMIN' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                            <Shield className="w-2.5 h-2.5" />
                            <span>অ্যাডমিন</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.phone ? user.phone.slice(0, 7) + '****' : 'মুহাম্মদপুরী সদস্য'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStart(user.id)}
                    disabled={Boolean(isStarting)}
                    className="px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    {starting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    <span>বার্তা</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
