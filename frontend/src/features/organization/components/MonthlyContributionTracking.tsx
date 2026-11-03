'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  CreditCard,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  BellRing,
  AlertTriangle,
} from 'lucide-react';
import {
  useContributionTrackingQuery,
  useOrgMutations,
} from '../hooks/useOrganizationQueries';
import type { ContributionTrackingCategoryItem } from '../types';

function toBengaliNumber(num: number | string | undefined | null): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

const MONTH_NAMES = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function MonthlyContributionTracking() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = React.useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState<number>(currentDate.getMonth() + 1);
  const [activeCategory, setActiveCategory] = React.useState<'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE'>('UNPAID');

  // Single reminder state
  const [reminderTarget, setReminderTarget] = React.useState<ContributionTrackingCategoryItem | null>(null);
  const [reminderNote, setReminderNote] = React.useState('');

  // Bulk reminder modal state
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [bulkFilter, setBulkFilter] = React.useState<'ALL_UNPAID' | 'ONLY_OVERDUE'>('ALL_UNPAID');
  const [bulkResult, setBulkResult] = React.useState<{
    targetedMembersCount: number;
    remindersSent: number;
    skippedCooldownCount: number;
  } | null>(null);

  const { data, isLoading } = useContributionTrackingQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const mutations = useOrgMutations();

  const counts = data?.counts || { paid: 0, unpaid: 0, pending: 0, overdue: 0 };
  const paidList = data?.paid || [];
  const unpaidList = data?.unpaid || [];
  const pendingList = data?.pending || [];
  const overdueList = data?.overdue || [];

  const handleSendSingleReminder = async () => {
    if (!reminderTarget) return;
    try {
      await mutations.sendManualReminder.mutateAsync({
        memberId: reminderTarget.memberId,
        userId: reminderTarget.userId,
        year: selectedYear,
        periodYear: selectedYear,
        month: selectedMonth,
        periodMonth: selectedMonth,
        customNote: reminderNote || undefined,
      });
      alert(`${reminderTarget.name}-কে সফলভাবে তাগিদ পাঠানো হয়েছে।`);
      setReminderTarget(null);
      setReminderNote('');
    } catch (err: any) {
      alert(err.message || 'তাগিদ পাঠানো ব্যর্থ হয়েছে।');
    }
  };

  const handleSendBulkReminders = async () => {
    try {
      const res = await mutations.sendBulkReminders.mutateAsync({
        year: selectedYear,
        periodYear: selectedYear,
        month: selectedMonth,
        periodMonth: selectedMonth,
        filter: bulkFilter,
      });
      setBulkResult(res);
    } catch (err: any) {
      alert(err.message || 'একসাথে তাগিদ পাঠানো ব্যর্থ হয়েছে।');
    }
  };

  const handleReviewPayment = async (paymentId: string, action: 'VERIFY' | 'REJECT') => {
    try {
      await mutations.reviewPayment.mutateAsync({
        id: paymentId,
        status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
      });
    } catch (err: any) {
      alert(err.message || 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Month/Year Selector */}
      <div className="p-4 rounded-3xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-emerald" />
              <span>মাসিক চাঁদা আদায় ও ট্র্যাকিং ড্যাশবোর্ড</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মাসভিত্তিক সদস্য চাঁদা নিরীক্ষণ, বকেয়া পর্যবেক্ষণ এবং স্বয়ংক্রিয়/ম্যানুয়াল তাগিদ প্রেরণ
            </p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald cursor-pointer"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {toBengaliNumber(y)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Category Pill Counters & Bulk Action */}
        <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveCategory('PAID')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeCategory === 'PAID'
                ? 'bg-emerald-50 dark:bg-brand-emerald/20 border-brand-emerald shadow-xs'
                : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                পরিশোধিত
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {toBengaliNumber(counts.paid)} <span className="text-xs font-normal text-slate-500">জন</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('UNPAID')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeCategory === 'UNPAID'
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 shadow-xs'
                : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                বকেয়া
              </span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {toBengaliNumber(counts.unpaid)} <span className="text-xs font-normal text-slate-500">জন</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('PENDING')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeCategory === 'PENDING'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 shadow-xs'
                : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                যাচাই অপেক্ষমাণ
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {toBengaliNumber(counts.pending)} <span className="text-xs font-normal text-slate-500">জন</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('OVERDUE')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeCategory === 'OVERDUE'
                ? 'bg-red-100/70 dark:bg-red-950/40 border-red-400 shadow-xs'
                : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-700 dark:text-red-400">
                মেয়াদোত্তীর্ণ
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {toBengaliNumber(counts.overdue)} <span className="text-xs font-normal text-slate-500">জন</span>
            </div>
          </button>
        </div>

        {/* Bulk Reminder Trigger Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {MONTH_NAMES[selectedMonth - 1]} {toBengaliNumber(selectedYear)}-এ মোট সক্রিয় সদস্য: <strong>{toBengaliNumber(data?.period.totalActiveMembers)}</strong> জন
          </div>

          <button
            type="button"
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResult(null);
            }}
            disabled={counts.unpaid === 0 && counts.overdue === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>একসাথে সকল বকেয়াদের তাগিদ পাঠান</span>
          </button>
        </div>
      </div>

      {/* 2. Selected Category List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
            <p className="text-xs text-slate-400">ট্র্যাকিং ডাটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* CATEGORY A: PAID MEMBERS */}
            {activeCategory === 'PAID' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  পরিশোধিত সদস্য তালিকা ({toBengaliNumber(paidList.length)} জন)
                </div>
                {paidList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    এই মাসের চাঁদা এখনো কোনো সদস্য পরিশোধ করেননি।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {paidList.map((item) => (
                      <div
                        key={item.memberId}
                        className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden shrink-0">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.memberNumber && <span>#{item.memberNumber}</span>}
                              {item.phone && <span>• {item.phone}</span>}
                              {item.designation && <span>• {item.designation}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            + ৳ {toBengaliNumber(item.paidAmount || item.agreedAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('bn-BD') : 'অনুমোদিত'}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            যাচাইকৃত
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY B: UNPAID MEMBERS */}
            {activeCategory === 'UNPAID' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  বকেয়া সদস্য তালিকা ({toBengaliNumber(unpaidList.length)} জন)
                </div>
                {unpaidList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    অভিনন্দন! এই মাসের সকল সদস্য চাঁদা পরিশোধ করেছেন।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {unpaidList.map((item) => (
                      <div
                        key={item.memberId}
                        className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden shrink-0">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                              {item.memberNumber && <span>#{item.memberNumber}</span>}
                              {item.phone && (
                                <a href={`tel:${item.phone}`} className="hover:underline">
                                  {item.phone}
                                </a>
                              )}
                              {item.lastReminderSentAt && (
                                <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                                  শেষ তাগিদ: {new Date(item.lastReminderSentAt).toLocaleDateString('bn-BD')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                              ৳ {toBengaliNumber(item.agreedAmount)}
                            </div>
                            <span className="text-[10px] text-slate-400">নির্ধারিত</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setReminderTarget(item)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>তাগিদ পাঠান</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY C: PENDING VERIFICATION */}
            {activeCategory === 'PENDING' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  যাচাই অপেক্ষমাণ পেমেন্ট তালিকা ({toBengaliNumber(pendingList.length)} টি)
                </div>
                {pendingList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    কোনো পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ নেই।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {pendingList.map((item) => (
                      <div
                        key={item.memberId}
                        className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 relative overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 space-x-2">
                              <span>মাধ্যম: {item.paymentMethod || 'মোবাইল ব্যাংকিং'}</span>
                              <span>• Trx: <strong className="font-mono text-slate-700 dark:text-slate-200">{item.trxId || 'N/A'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200/60 dark:border-amber-800/30">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              ৳ {toBengaliNumber(item.paidAmount || item.agreedAmount)}
                            </div>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              যাচাই প্রয়োজন
                            </span>
                          </div>

                          {item.paymentId && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleReviewPayment(item.paymentId!, 'VERIFY')}
                                disabled={mutations.reviewPayment.isPending}
                                className="px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>অনুমোদন</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewPayment(item.paymentId!, 'REJECT')}
                                disabled={mutations.reviewPayment.isPending}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>বাতিল</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY D: OVERDUE MEMBERS */}
            {activeCategory === 'OVERDUE' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-red-700 dark:text-red-400 px-1">
                  মেয়াদোত্তীর্ণ বকেয়া সদস্য তালিকা ({toBengaliNumber(overdueList.length)} জন)
                </div>
                {overdueList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    কোনো সদস্যের চাঁদা মেয়াদোত্তীর্ণ নেই।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {overdueList.map((item) => (
                      <div
                        key={item.memberId}
                        className="p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden shrink-0">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                              {toBengaliNumber(item.dueMonth)}/{toBengaliNumber(item.dueYear)} কিস্তি • বকেয়া সময়সীমা অতিক্রান্ত
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-red-700 dark:text-red-400">
                              ৳ {toBengaliNumber(item.agreedAmount)}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                              জরুরি তাগিদ
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setReminderTarget(item)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>তাগিদ দিন</span>
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
      </div>

      {/* 3. Single Reminder Confirmation Modal */}
      {reminderTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                <span>চাঁদা পরিশোধের তাগিদ নোটিফিকেশন</span>
              </h3>
              <button
                type="button"
                onClick={() => setReminderTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div>প্রাপক: <strong>{reminderTarget.name}</strong> ({reminderTarget.phone || 'N/A'})</div>
              <div>বকেয়া মাস: <strong>{MONTH_NAMES[selectedMonth - 1]} {toBengaliNumber(selectedYear)}</strong></div>
              <div>নির্ধারিত চাঁদা: <strong>৳ {toBengaliNumber(reminderTarget.agreedAmount)}</strong></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                বিশেষ বার্তা (ঐচ্ছিক)
              </label>
              <textarea
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="যেমন: অনুগ্রহ করে আগামী ৩ দিনের মধ্যে চাঁদা পরিশোধ করুন..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * একই সদস্যকে বারবার তাগিদ এড়াতে ১ ঘণ্টার কুলডাউন সক্রিয় থাকবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setReminderTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSendSingleReminder}
                disabled={mutations.sendManualReminder.isPending}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {mutations.sendManualReminder.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>তাগিদ পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bulk Reminder Confirmation Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-500" />
                <span>বাল্ক তাগিদ নিশ্চিতকরণ</span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bulkResult ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-brand-emerald/20 border border-emerald-200 dark:border-brand-emerald/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
                  <div className="font-bold text-sm">তাগিদ প্রেরণ সম্পন্ন হয়েছে!</div>
                  <div>মোট বকেয়া সদস্য: <strong>{toBengaliNumber(bulkResult.targetedMembersCount)} জন</strong></div>
                  <div>সফলভাবে পাঠানো হয়েছে: <strong>{toBengaliNumber(bulkResult.remindersSent)} জনকে</strong></div>
                  {bulkResult.skippedCooldownCount > 0 && (
                    <div className="text-amber-700 dark:text-amber-400">
                      কুলডাউনের কারণে বাদ পড়েছে (সম্প্রতি পাঠানো হয়েছিল): <strong>{toBengaliNumber(bulkResult.skippedCooldownCount)} জন</strong>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold"
                >
                  ঠিক আছে
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  আপনি <strong>{MONTH_NAMES[selectedMonth - 1]} {toBengaliNumber(selectedYear)}</strong> মাসের সকল বকেয়া সদস্যদের ইন-অ্যাপ নোটিফিকেশন মাধ্যমে তাগিদ পাঠাতে যাচ্ছেন।
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    কাদের তাগিদ পাঠানো হবে?
                  </label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                      <input
                        type="radio"
                        checked={bulkFilter === 'ALL_UNPAID'}
                        onChange={() => setBulkFilter('ALL_UNPAID')}
                        className="text-brand-emerald"
                      />
                      <span>সব বকেয়া সদস্য ({toBengaliNumber(counts.unpaid)} জন)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                      <input
                        type="radio"
                        checked={bulkFilter === 'ONLY_OVERDUE'}
                        onChange={() => setBulkFilter('ONLY_OVERDUE')}
                        className="text-brand-emerald"
                      />
                      <span>শুধুমাত্র যাদের মেয়াদ উত্তীর্ণ হয়েছে ({toBengaliNumber(counts.overdue)} জন)</span>
                    </label>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300">
                  * যেসকল সদস্যকে গত ১ ঘণ্টার মধ্যে তাগিদ পাঠানো হয়েছে তাদের ক্ষেত্রে স্প্যামিং রোধে পুনরায় পাঠানো হবে না।
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleSendBulkReminders}
                    disabled={mutations.sendBulkReminders.isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {mutations.sendBulkReminders.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>নিশ্চিত করুন ও পাঠান</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
