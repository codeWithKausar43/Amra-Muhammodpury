'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, AlertCircle, CreditCard, Clock, ChevronRight } from 'lucide-react';

function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num ?? 0).replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

interface DueBreakdownItem {
  year: number;
  month: number;
  monthName: string;
  amount: number;
  status: 'DUE' | 'PENDING';
}

interface MemberDueReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  totalDueAmount: number;
  pendingDueCount: number;
  dueBreakdown: DueBreakdownItem[];
  pendingReviewCount?: number;
}

export const MemberDueReminderPopup: React.FC<MemberDueReminderPopupProps> = ({
  isOpen,
  onClose,
  memberName,
  totalDueAmount,
  pendingDueCount,
  dueBreakdown,
  pendingReviewCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="due-reminder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-300 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Close button top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Alert Strip */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent border-b border-slate-200/70 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-500/20">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-1">
                <span>মাসিক চাঁদা তাগিদ</span>
              </div>
              <h3
                id="due-reminder-title"
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate"
              >
                প্রিয় {memberName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                আপনার সংগঠনের নির্ধারিত মাসিক চাঁদা বকেয়া রয়েছে।
              </p>
            </div>
          </div>

          {/* Quick Summary Box */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                মোট বকেয়া চাঁদা
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                ৳ {toBengaliDigits(totalDueAmount)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                বকেয়া কিস্তির সংখ্যা
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {toBengaliDigits(pendingDueCount)} টি মাস
              </span>
            </div>
          </div>
        </div>

        {/* Content Body: Month-wise Breakdown */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                বকেয়া মাসের বিবরণ
              </span>
              <span className="text-[11px] text-slate-400">
                ধারাবাহিক পরিশোধযোগ্য
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-white/5">
              {dueBreakdown.slice(0, 8).map((item) => (
                <div
                  key={`${item.year}-${item.month}`}
                  className="pt-1.5 first:pt-0 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.monthName} {toBengaliDigits(item.year)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ৳ {toBengaliDigits(item.amount)}
                    </span>
                    {item.status === 'PENDING' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        যাচাইাধীন
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        বকেয়া
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pendingReviewCount > 0 && (
              <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  আপনার {toBengaliDigits(pendingReviewCount)} টি কিস্তির পেমেন্ট পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs text-center transition-colors cursor-pointer"
            >
              পরে দিব
            </button>

            <Link
              href="/organization/member"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs text-center transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>বকেয়া পরিশোধ করুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

