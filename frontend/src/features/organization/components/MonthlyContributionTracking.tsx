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
  Calendar,
  Settings,
} from 'lucide-react';
import {
  useContributionTrackingQuery,
  useAdminMemberDetailsQuery,
  useOrgAdminPaymentConfigsQuery,
  useOrgMutations,
} from '../hooks/useOrganizationQueries';
import { toast } from '@/components/feedback/Toast';
import type { ContributionTrackingCategoryItem, OrgPaymentConfig } from '../types';

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

function formatBengaliDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const day = toBengaliNumber(d.getDate());
    const month = MONTH_NAMES[d.getMonth()] || `${d.getMonth() + 1} তম মাস`;
    const year = toBengaliNumber(d.getFullYear());
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
}

export function MonthlyContributionTracking() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = React.useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState<number>(currentDate.getMonth() + 1);
  const [activeCategory, setActiveCategory] = React.useState<'PAID' | 'UNPAID' | 'PENDING' | 'OVERDUE'>('UNPAID');

  // Review payment loading state
  const [reviewingPaymentId, setReviewingPaymentId] = React.useState<string | null>(null);

  // Confirm dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    paymentId: string;
  }>({ open: false, paymentId: '' });

  // Single reminder state
  const [reminderTarget, setReminderTarget] = React.useState<ContributionTrackingCategoryItem | null>(null);
  const [reminderNote, setReminderNote] = React.useState('');

  // Overdue member dues breakdown modal state
  const [selectedMemberDues, setSelectedMemberDues] = React.useState<ContributionTrackingCategoryItem | null>(null);

  // Bulk reminder modal state
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [bulkFilter, setBulkFilter] = React.useState<'ALL_UNPAID' | 'ONLY_OVERDUE'>('ALL_UNPAID');
  const [bulkResult, setBulkResult] = React.useState<{
    targetedMembersCount: number;
    remindersSent: number;
    skippedCooldownCount: number;
  } | null>(null);

  // Sub-tab Navigation (Tracking vs Payment Configs)
  const [mainTab, setMainTab] = React.useState<'TRACKING' | 'CONFIGS'>('TRACKING');
  const [editingConfig, setEditingConfig] = React.useState<OrgPaymentConfig | null>(null);

  const { data: adminPaymentConfigs = [], isLoading: isConfigsLoading } = useOrgAdminPaymentConfigsQuery(
    mainTab === 'CONFIGS'
  );

  const { data, isLoading } = useContributionTrackingQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const { data: memberFullDetails } = useAdminMemberDetailsQuery(selectedMemberDues?.memberId || null);

  const mutations = useOrgMutations();

  const counts = data?.counts || { paid: 0, unpaid: 0, pending: 0, overdue: 0 };
  const paidList = data?.paid || [];
  const unpaidList = data?.unpaid || [];
  const pendingList = data?.pending || [];
  const overdueList = data?.overdue || [];

  // Auto-select valid bulk reminder option if one category has 0 members
  React.useEffect(() => {
    if (bulkModalOpen) {
      if (counts.unpaid === 0 && counts.overdue > 0) {
        setBulkFilter('ONLY_OVERDUE');
      } else if (counts.overdue === 0 && counts.unpaid > 0) {
        setBulkFilter('ALL_UNPAID');
      }
    }
  }, [bulkModalOpen, counts.unpaid, counts.overdue]);

  // Calculate active overdue months for the selected member
  const activeOverdueMonths = React.useMemo(() => {
    if (!selectedMemberDues) return [];

    // 1. If backend tracking query already provided overdueMonths, use them
    if (selectedMemberDues.overdueMonths && selectedMemberDues.overdueMonths.length > 0) {
      return selectedMemberDues.overdueMonths;
    }

    // 2. If full member details loaded, calculate comprehensively from verified payments
    const paymentsList = memberFullDetails?.payments || memberFullDetails?.recentPayments;
    if (paymentsList) {
      const now = new Date();
      const currY = now.getFullYear();
      const currM = now.getMonth() + 1;
      const joinedDate = memberFullDetails.membership?.joinedAt
        ? new Date(memberFullDetails.membership.joinedAt)
        : new Date(currY, 0, 1);
      const joinedYear = joinedDate.getFullYear();
      const joinedMonth = joinedDate.getMonth() + 1;

      const paidMap = new Map<string, string>();
      for (const p of (paymentsList as any[])) {
        paidMap.set(`${p.periodYear}-${p.periodMonth}`, p.status);
      }

      const calculated: any[] = [];
      const evalStartYear = Math.max(2026, joinedYear);
      for (let y = evalStartYear; y <= currY; y++) {
        const startM = y === 2026 ? Math.max(11, joinedMonth) : (y === joinedYear ? joinedMonth : 1);
        const endM = y === currY ? currM : 12;
        for (let m = startM; m <= endM; m++) {
          if (y < 2026 || (y === 2026 && m < 11)) continue;
          const key = `${y}-${m}`;
          const pStatus = paidMap.get(key);
          if (pStatus === 'VERIFIED') continue;
          const monthName = MONTH_NAMES[m - 1] || `${m} তম মাস`;
          calculated.push({
            year: y,
            month: m,
            monthName,
            amount: selectedMemberDues.agreedAmount,
            status: pStatus === 'PENDING' ? 'PENDING' : 'OVERDUE',
            formattedPeriod: `${monthName} ${toBengaliNumber(y)}`,
          });
        }
      }
      if (calculated.length > 0) {
        calculated.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
        return calculated;
      }
    }

    // 3. Fallback: at least the selected overdue month
    const fallbackM = selectedMemberDues.dueMonth || selectedMonth;
    const fallbackY = selectedMemberDues.dueYear || selectedYear;
    return [{
      year: fallbackY,
      month: fallbackM,
      monthName: MONTH_NAMES[fallbackM - 1] || `${fallbackM} তম মাস`,
      amount: selectedMemberDues.agreedAmount,
      status: 'OVERDUE' as const,
      formattedPeriod: `${MONTH_NAMES[fallbackM - 1] || fallbackM} ${toBengaliNumber(fallbackY)}`,
    }];
  }, [selectedMemberDues, memberFullDetails, selectedYear, selectedMonth]);

  const totalOverdueSum = React.useMemo(() => {
    return activeOverdueMonths.reduce(
      (sum, item) => sum + (item.amount || selectedMemberDues?.agreedAmount || 0),
      0
    );
  }, [activeOverdueMonths, selectedMemberDues]);

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
      toast.success(`${reminderTarget.name}-কে সফলভাবে তাগিদ পাঠানো হয়েছে।`);
      setReminderTarget(null);
      setReminderNote('');
    } catch (err: any) {
      toast.error(err.message || 'তাগিদ পাঠানো ব্যর্থ হয়েছে।');
    }
  };

  const handleSendBulkReminders = async () => {
    try {
      const targetList = bulkFilter === 'ONLY_OVERDUE' ? overdueList : unpaidList;
      if (targetList.length === 0) {
        toast.warning('নির্বাচিত ক্যাটাগরিতে কোনো বকেয়া সদস্য নেই।');
        return;
      }
      const res = await mutations.sendBulkReminders.mutateAsync({
        year: selectedYear,
        periodYear: selectedYear,
        month: selectedMonth,
        periodMonth: selectedMonth,
        filter: bulkFilter,
        userIds: targetList.map((m) => m.userId),
        memberIds: targetList.map((m) => m.memberId),
      });
      setBulkResult(res);
      toast.success('একসাথে সকল বকেয়ার তাগিদ সফলভাবে পাঠানো হয়েছে।');
    } catch (err: any) {
      toast.error(err.message || 'একসাথে তাগিদ পাঠানো ব্যর্থ হয়েছে।');
    }
  };

  const handleReviewPayment = async (paymentId: string, action: 'VERIFY' | 'REJECT') => {
    if (action === 'REJECT') {
      setConfirmDialog({ open: true, paymentId });
      return;
    }
    await doActualReview(paymentId, 'VERIFY');
  };

  const doActualReview = async (paymentId: string, action: 'VERIFY' | 'REJECT') => {
    setReviewingPaymentId(paymentId);
    try {
      await mutations.reviewPayment.mutateAsync({
        id: paymentId,
        status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
      });
      toast.success(
        action === 'VERIFY'
          ? 'পেমেন্ট সফলভাবে অনুমোদিত এবং সাধারণ তহবিলে জমা হয়েছে।'
          : 'পেমেন্টটি বাতিল করা হয়েছে।'
      );
    } catch (err: any) {
      toast.error(err.message || 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।');
    } finally {
      setReviewingPaymentId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 0. Top Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/60 dark:border-white/10">
        <button
          type="button"
          onClick={() => setMainTab('TRACKING')}
          className={`py-2 px-3 sm:px-4 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs ${
            mainTab === 'TRACKING'
              ? 'bg-brand-emerald text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-semibold'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>চাঁদা ট্র্যাকিং ও নিরীক্ষণ</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('CONFIGS')}
          className={`py-2 px-3 sm:px-4 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer text-xs ${
            mainTab === 'CONFIGS'
              ? 'bg-brand-emerald text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-semibold'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>পেমেন্ট নির্দেশিকা ও অ্যাকাউন্ট নম্বর</span>
        </button>
      </div>

      {mainTab === 'CONFIGS' ? (
        <div className="space-y-4 pt-1">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              মাসিক চাঁদা পরিশোধের অ্যাকাউন্ট নম্বর ও নির্দেশনাবলী
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              সদস্যদের ড্যাশবোর্ড ও প্রারম্ভিক কিস্তি পরিশোধ পেজে প্রদর্শিত পেমেন্ট অ্যাকাউন্ট নম্বর কনফিগার করুন। কোড পরিবর্তন করার কোনো প্রয়োজন নেই।
            </p>
          </div>

          {isConfigsLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminPaymentConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="p-5 rounded-3xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{cfg.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cfg.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                      }`}
                    >
                      {cfg.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl space-y-1">
                    <div className="text-xs text-slate-400 font-medium">{cfg.accountType}</div>
                    <div className="font-mono font-bold text-base text-brand-emerald">{cfg.accountNumber}</div>
                  </div>
                  {cfg.instructions && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {cfg.instructions}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingConfig(cfg)}
                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    নির্দেশিকা সম্পাদনা করুন
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 1. Header & Month/Year Selector */}
          <div className="space-y-3.5 pb-1">
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

        {/* 4 Category Pill Counters (Compact Width, Minimal Scroll on Mobile, Full Grid on Desktop) */}
        <div className="overflow-x-auto pb-1.5 pt-1 -mx-1 px-1 scrollbar-none sm:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
          <div className="flex sm:grid sm:grid-cols-4 gap-1.5 sm:gap-2.5 min-w-max sm:min-w-full">
            <button
              type="button"
              onClick={() => setActiveCategory('PAID')}
              className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-w-[78px] min-[380px]:min-w-[84px] sm:min-w-0 flex-1 shrink-0 ${
                activeCategory === 'PAID'
                  ? 'bg-emerald-50 dark:bg-brand-emerald/20 border-brand-emerald shadow-xs'
                  : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  পরিশোধিত
                </span>
                <CheckCircle2 className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <div className="text-base min-[380px]:text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 flex items-baseline gap-0.5 sm:gap-1">
                {toBengaliNumber(counts.paid)} <span className="text-[10px] sm:text-xs font-normal text-slate-500">জন</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('UNPAID')}
              className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-w-[68px] min-[380px]:min-w-[74px] sm:min-w-0 flex-1 shrink-0 ${
                activeCategory === 'UNPAID'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                  বকেয়া
                </span>
                <AlertCircle className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              </div>
              <div className="text-base min-[380px]:text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 flex items-baseline gap-0.5 sm:gap-1">
                {toBengaliNumber(counts.unpaid)} <span className="text-[10px] sm:text-xs font-normal text-slate-500">জন</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('PENDING')}
              className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-w-[96px] min-[380px]:min-w-[104px] sm:min-w-0 flex-1 shrink-0 ${
                activeCategory === 'PENDING'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  যাচাই অপেক্ষমাণ
                </span>
                <Clock className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              </div>
              <div className="text-base min-[380px]:text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 flex items-baseline gap-0.5 sm:gap-1">
                {toBengaliNumber(counts.pending)} <span className="text-[10px] sm:text-xs font-normal text-slate-500">জন</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('OVERDUE')}
              className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer min-w-[80px] min-[380px]:min-w-[86px] sm:min-w-0 flex-1 shrink-0 ${
                activeCategory === 'OVERDUE'
                  ? 'bg-red-100/70 dark:bg-red-950/40 border-red-400 shadow-xs'
                  : 'bg-slate-50/70 dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] min-[380px]:text-[11px] sm:text-xs font-bold text-red-700 dark:text-red-400 whitespace-nowrap">
                  মেয়াদোত্তীর্ণ
                </span>
                <AlertTriangle className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 text-red-600 dark:text-red-400 shrink-0" />
              </div>
              <div className="text-base min-[380px]:text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 flex items-baseline gap-0.5 sm:gap-1">
                {toBengaliNumber(counts.overdue)} <span className="text-[10px] sm:text-xs font-normal text-slate-500">জন</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bulk Reminder Trigger Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {MONTH_NAMES[selectedMonth - 1]} {toBengaliNumber(selectedYear)}-এ মোট সক্রিয় সদস্য: <strong>{toBengaliNumber(data?.period.totalActiveMembers)}</strong> জন
          </div>

          <button
            type="button"
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResult(null);
              setBulkFilter(counts.unpaid > 0 ? 'ALL_UNPAID' : 'ONLY_OVERDUE');
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
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  <span>পরিশোধিত সদস্য তালিকা ({toBengaliNumber(paidList.length)} জন)</span>
                </div>
                {paidList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    এই মাসের চাঁদা এখনো কোনো সদস্য পরিশোধ করেননি।
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 -mx-1 px-1">
                    <div className="min-w-[480px] divide-y divide-slate-100 dark:divide-white/5">
                      {paidList.map((item) => (
                        <div
                          key={item.memberId}
                          className="py-3 px-2 sm:px-3 grid grid-cols-[minmax(180px,1.4fr)_minmax(150px,1.1fr)_minmax(120px,auto)] items-center gap-4 sm:gap-6 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors group"
                        >
                          {/* Column 1: Avatar + Name + Month Period */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative ring-1 ring-brand-emerald/20">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                item.name?.charAt(0) || 'স'
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                মাসিক কিস্তি • {toBengaliNumber(item.periodMonth || selectedMonth)}/{toBengaliNumber(item.periodYear || selectedYear)}
                              </p>
                            </div>
                          </div>

                          {/* Column 2: Phone + Method Badge & TrxID */}
                          <div className="min-w-0">
                            <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-mono truncate">
                              {item.phone || (item.memberNumber ? `#${item.memberNumber}` : '—')}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              {item.paymentMethod && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                  {item.paymentMethod}
                                </span>
                              )}
                              {item.trxId && (
                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={item.trxId}>
                                  Trx: {item.trxId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Column 3: Amount (+ ৳ পরিমাণ) + Paid Status Badge with Dot */}
                          <div className="flex flex-col items-end text-right justify-center shrink-0">
                            <div className="font-mono font-bold text-xs sm:text-sm text-brand-emerald dark:text-brand-mint">
                              + ৳ {toBengaliNumber(item.paidAmount || item.agreedAmount)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                                পরিশোধিত
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY B: UNPAID MEMBERS */}
            {activeCategory === 'UNPAID' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  <span>বকেয়া সদস্য তালিকা ({toBengaliNumber(unpaidList.length)} জন)</span>
                  <span className="text-[11px] font-normal text-slate-400">তাগিদ পাঠাতে বাটনে চাপুন</span>
                </div>
                {unpaidList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    অভিনন্দন! এই মাসের সকল সদস্য চাঁদা পরিশোধ করেছেন।
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-1 scrollbar-none sm:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 -mx-1 px-1">
                    <div className="min-w-[345px] sm:min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                      {unpaidList.map((item) => (
                        <div
                          key={item.memberId}
                          onClick={() => setSelectedMemberDues(item)}
                          className="py-2.5 sm:py-3 px-1 sm:px-2 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] flex items-center justify-between gap-3 sm:gap-3.5 transition-colors group cursor-pointer"
                        >
                          {/* Column 1: Avatar + Full Name + Phone + Reminder Date (on its own line) */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden border border-slate-200/60 dark:border-white/10 shrink-0">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                  {item.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5 font-medium font-mono">
                                {item.phone || (item.memberNumber ? `#${item.memberNumber}` : 'ফোন নম্বর নেই')}
                              </p>
                              {item.overdueMonthsCount && item.overdueMonthsCount > 1 ? (
                                <p className="text-[10px] text-rose-600 dark:text-rose-400 whitespace-nowrap mt-0.5 font-medium">
                                  মোট {toBengaliNumber(item.overdueMonthsCount)}টি কিস্তি বকেয়া
                                </p>
                              ) : item.lastReminderSentAt ? (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 whitespace-nowrap mt-0.5 font-medium">
                                  তাগিদ: {new Date(item.lastReminderSentAt).toLocaleDateString('bn-BD')}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {/* Column 2 & 3: Amount/Status + Send Reminder Button */}
                          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
                            <div className="shrink-0 text-right min-w-[52px] sm:min-w-[58px]">
                              <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 leading-tight">
                                ৳ {toBengaliNumber(item.agreedAmount)}
                              </div>
                              <div className="mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 whitespace-nowrap">
                                  বকেয়া
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReminderTarget(item);
                              }}
                              className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>তাগিদ পাঠান</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY C: PENDING VERIFICATION */}
            {activeCategory === 'PENDING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 px-1">
                  <span>যাচাই অপেক্ষমাণ পেমেন্ট তালিকা ({toBengaliNumber(pendingList.length)} টি)</span>
                  <span className="text-[11px] font-normal text-slate-400">লেনদেন যাচাই করে অনুমোদন/বাতিল করুন</span>
                </div>
                {pendingList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    কোনো পেমেন্ট যাচাইয়ের জন্য অপেক্ষমাণ নেই।
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 -mx-1 px-1">
                    <div className="min-w-[530px] divide-y divide-slate-200/70 dark:divide-white/10">
                      {pendingList.map((item) => (
                        <div
                          key={item.paymentId || item.memberId}
                          className="grid grid-cols-[minmax(185px,1.6fr)_minmax(130px,1.1fr)_minmax(70px,auto)_minmax(52px,auto)] items-center gap-4 sm:gap-6 py-3 px-1 sm:px-2 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 rounded-xl transition-colors"
                        >
                          {/* Column 1: Avatar + Name (Full, no truncation) + Phone */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden border border-slate-200/60 dark:border-white/10 shrink-0">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                  {item.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5 font-medium font-mono">
                                {item.phone || (item.memberNumber ? `#${item.memberNumber}` : 'ফোন নম্বর নেই')}
                              </p>
                            </div>
                          </div>

                          {/* Column 2: Date + Period Label + Method & Trx */}
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                              {formatBengaliDate(item.paymentDate || item.submittedAt)}
                              {(item as any).monthsCount > 1 && (
                                <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100/80 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                                  {(item as any).monthsCount} মাস
                                </span>
                              )}
                            </div>
                            {(item as any).periodLabel && (
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                                {(item as any).periodLabel}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 whitespace-nowrap font-medium">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">{item.paymentMethod || 'মোবাইল ব্যাংকিং'}</span>
                              {item.trxId && (
                                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold bg-amber-100/70 dark:bg-amber-950/50 px-1 py-0.2 rounded text-[10.5px]">
                                  Trx: {item.trxId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Column 3: Amount & Verification Status */}
                          <div className="text-right shrink-0">
                            <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 leading-tight">
                              ৳ {toBengaliNumber(item.paidAmount ?? item.submittedAmount ?? item.agreedAmount)}
                            </div>
                            <div className="mt-0.5">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 whitespace-nowrap">
                                যাচাই বাকি
                              </span>
                            </div>
                          </div>

                          {/* Column 4: Pure Icon Actions (✓ and ✕, consistent spacing, no box) */}
                          <div className="flex items-center justify-end gap-1.5 shrink-0">
                            {item.paymentId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReviewPayment(item.paymentId!, 'VERIFY')}
                                  disabled={mutations.reviewPayment.isPending}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:scale-125 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                                  title="অনুমোদন করুন"
                                  aria-label="অনুমোদন করুন"
                                >
                                  {reviewingPaymentId === item.paymentId ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewPayment(item.paymentId!, 'REJECT')}
                                  disabled={mutations.reviewPayment.isPending}
                                  className="p-1 text-rose-500 hover:text-rose-600 hover:scale-125 active:scale-95 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                                  title="বাতিল করুন"
                                  aria-label="বাতিল করুন"
                                >
                                  <X className="w-5 h-5 stroke-[3]" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY D: OVERDUE MEMBERS */}
            {activeCategory === 'OVERDUE' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-400 px-1">
                  <span>মেয়াদোত্তীর্ণ বকেয়া সদস্য তালিকা ({toBengaliNumber(overdueList.length)} জন)</span>
                  <span className="text-[11px] font-normal text-slate-400">জরুরি তাগিদ পাঠাতে বাটনে চাপুন</span>
                </div>
                {overdueList.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                    কোনো সদস্যের চাঁদা মেয়াদোত্তীর্ণ নেই।
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-1 scrollbar-none sm:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 -mx-1 px-1">
                    <div className="min-w-[345px] sm:min-w-full divide-y divide-slate-200/70 dark:divide-white/10">
                      {overdueList.map((item) => (
                        <div
                          key={item.memberId}
                          onClick={() => setSelectedMemberDues(item)}
                          className="py-2.5 sm:py-3 px-1 sm:px-2 hover:bg-red-50/50 dark:hover:bg-red-950/20 flex items-center justify-between gap-3 sm:gap-3.5 transition-colors group cursor-pointer"
                        >
                          {/* Column 1: Avatar + Full Name + Due Period */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden border border-slate-200/60 dark:border-white/10 shrink-0">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                  {item.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-0.5 font-medium font-mono">
                                {item.phone || (item.memberNumber ? `#${item.memberNumber}` : 'ফোন নম্বর নেই')}
                              </p>
                              <p className="text-[10px] text-red-600 dark:text-red-400 whitespace-nowrap mt-0.5 font-medium">
                                {item.overdueMonthsCount && item.overdueMonthsCount > 1
                                  ? `মোট ${toBengaliNumber(item.overdueMonthsCount)}টি কিস্তি মেয়াদোত্তীর্ণ`
                                  : `${toBengaliNumber(item.dueMonth)}/${toBengaliNumber(item.dueYear)} কিস্তি মেয়াদোত্তীর্ণ`}
                              </p>
                            </div>
                          </div>

                          {/* Column 2 & 3: Amount/Status + Send Urgent Reminder */}
                          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
                            <div className="shrink-0 text-right min-w-[52px] sm:min-w-[58px]">
                              <div className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 leading-tight">
                                ৳ {toBengaliNumber(item.agreedAmount)}
                              </div>
                              <div className="mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 whitespace-nowrap">
                                  জরুরি বকেয়া
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReminderTarget(item);
                              }}
                              className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>তাগিদ দিন</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

            {/* 2.5 Overdue Months Breakdown Modal (যে যে মাসের মেয়াদ শেষ হয়েছে) */}
      {selectedMemberDues && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    মেয়াদোত্তীর্ণ বকেয়া কিস্তির তালিকা
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    এই সদস্যের যে যে মাসের চাঁদার মেয়াদ শেষ হয়ে গেছে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberDues(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Member Profile Banner */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/10 relative overflow-hidden border border-slate-200/70 dark:border-white/10 shrink-0">
                  {selectedMemberDues.image ? (
                    <Image src={selectedMemberDues.image} alt={selectedMemberDues.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">
                      {selectedMemberDues.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedMemberDues.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedMemberDues.phone || 'ফোন নম্বর নেই'}
                    {selectedMemberDues.memberNumber && ` • #${selectedMemberDues.memberNumber}`}
                  </p>
                  {selectedMemberDues.designation && (
                    <p className="text-[11px] text-brand-emerald dark:text-brand-mint font-medium mt-0.5">
                      {selectedMemberDues.designation}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">মাসিক নির্ধারিত চাঁদা</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ৳ {toBengaliNumber(selectedMemberDues.agreedAmount)}
                </span>
              </div>
            </div>

            {/* Overdue Summary Stats Cards */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/30">
                <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>মোট বকেয়া কিস্তি</span>
                </span>
                <div className="text-lg sm:text-xl font-black text-red-700 dark:text-red-400 mt-1">
                  {toBengaliNumber(activeOverdueMonths.length)} <span className="text-xs font-normal">টি মাস</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/30">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>সর্বমোট বকেয়া পাওনা</span>
                </span>
                <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                  ৳ {toBengaliNumber(totalOverdueSum)}
                </div>
              </div>
            </div>

            {/* Month-by-Month Overdue List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-[140px] max-h-[260px]">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-0.5">
                <span>মেয়াদ শেষ হওয়া মাসসমূহ ({toBengaliNumber(activeOverdueMonths.length)} টি)</span>
                <span className="text-[10px] font-normal text-slate-400">ধারাবাহিক তালিকা</span>
              </div>

              <div className="space-y-1.5">
                {activeOverdueMonths.map((mItem, idx) => (
                  <div
                    key={`${mItem.year}-${mItem.month}-${idx}`}
                    className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3 hover:border-red-300/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-100/70 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{mItem.monthName} {toBengaliNumber(mItem.year)} কিস্তি</span>
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                          {mItem.status === 'PENDING' ? 'যাচাই অপেক্ষমাণ' : 'মেয়াদোত্তীর্ণ বকেয়া'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400">
                        ৳ {toBengaliNumber(mItem.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400">পরিশোধ করা হয়নি</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = selectedMemberDues;
                  setSelectedMemberDues(null);
                  if (target) {
                    setReminderTarget(target);
                    const monthNames = activeOverdueMonths.map(m => `${m.monthName} ${toBengaliNumber(m.year)}`).join(', ');
                    setReminderNote(`${monthNames} সহ মোট ${toBengaliNumber(activeOverdueMonths.length)}টি কিস্তির (৳ ${toBengaliNumber(totalOverdueSum)}) চাঁদা বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।`);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>সকল বকেয়ার তাগিদ পাঠান</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMemberDues(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

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
                rows={6}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald min-h-[160px] resize-y leading-relaxed"
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
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        counts.unpaid === 0
                          ? 'bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 opacity-40 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 cursor-pointer hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bulkReminderFilter"
                        checked={bulkFilter === 'ALL_UNPAID' && counts.unpaid > 0}
                        disabled={counts.unpaid === 0}
                        onChange={() => {
                          if (counts.unpaid > 0) setBulkFilter('ALL_UNPAID');
                        }}
                        className="text-brand-emerald disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={counts.unpaid === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white font-medium'}>
                        সব বকেয়া সদস্য ({toBengaliNumber(counts.unpaid)} জন)
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        counts.overdue === 0
                          ? 'bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 opacity-40 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 cursor-pointer hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="bulkReminderFilter"
                        checked={bulkFilter === 'ONLY_OVERDUE' && counts.overdue > 0}
                        disabled={counts.overdue === 0}
                        onChange={() => {
                          if (counts.overdue > 0) setBulkFilter('ONLY_OVERDUE');
                        }}
                        className="text-brand-emerald disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={counts.overdue === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white font-medium'}>
                        শুধুমাত্র যাদের মেয়াদ উত্তীর্ণ হয়েছে ({toBengaliNumber(counts.overdue)} জন)
                      </span>
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
                    disabled={
                      mutations.sendBulkReminders.isPending ||
                      (bulkFilter === 'ALL_UNPAID' && counts.unpaid === 0) ||
                      (bulkFilter === 'ONLY_OVERDUE' && counts.overdue === 0) ||
                      (counts.unpaid === 0 && counts.overdue === 0)
                    }
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

      {/* Confirm Dialog - Reject Payment */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">পেমেন্ট প্রত্যাখ্যান নিশ্চিত করুন</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  এই পেমেন্ট বাতিল করলে সদস্যের বকেয়া তালিকায় ফেরত যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDialog({ open: false, paymentId: '' })}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDialog.paymentId;
                  setConfirmDialog({ open: false, paymentId: '' });
                  await doActualReview(id, 'REJECT');
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                হ্যাঁ, প্রত্যাখ্যান করুন
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Org Payment Config Edit Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-brand-charcoal p-5 sm:p-6 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingConfig.title} কনফিগারেশন
              </h3>
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অ্যাকাউন্ট নম্বর
                </label>
                <input
                  type="text"
                  value={editingConfig.accountNumber}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, accountNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অ্যাকাউন্ট টাইপ
                </label>
                <input
                  type="text"
                  value={editingConfig.accountType}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, accountType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পেমেন্ট নির্দেশিকা
                </label>
                <textarea
                  rows={3}
                  value={editingConfig.instructions || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, instructions: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isOrgConfigActive"
                  checked={editingConfig.isActive}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald cursor-pointer"
                />
                <label
                  htmlFor="isOrgConfigActive"
                  className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  পেমেন্ট মাধ্যমটি সক্রিয় রাখুন
                </label>
              </div>

              <button
                type="button"
                disabled={mutations.updatePaymentConfig.isPending}
                onClick={async () => {
                  try {
                    await mutations.updatePaymentConfig.mutateAsync({
                      ...editingConfig,
                      qrCodeUrl: editingConfig.qrCodeUrl || null,
                      instructions: editingConfig.instructions || null,
                    });
                    toast.success('পেমেন্ট কনফিগারেশন সফলভাবে হালনাগাদ হয়েছে');
                    setEditingConfig(null);
                  } catch (err: any) {
                    toast.error(err.message || 'কনফিগারেশন হালনাগাদ ব্যর্থ হয়েছে');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {mutations.updatePaymentConfig.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {mutations.updatePaymentConfig.isPending
                    ? 'হালনাগাদ হচ্ছে...'
                    : 'হালনাগাদ নিশ্চিত করুন'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
