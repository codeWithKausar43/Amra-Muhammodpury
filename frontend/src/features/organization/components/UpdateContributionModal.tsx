'use client';

import * as React from 'react';
import {
  X,
  Coins,
  ArrowRight,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/components/feedback/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useOrgMutations } from '../hooks/useOrganizationQueries';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function getNextMonthNameBengali(): string {
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
}

interface UpdateContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  nextEffectiveAmount?: number | null;
  nextEffectiveDate?: string | null;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [100, 200, 300, 500, 1000, 2000];

export function UpdateContributionModal({
  isOpen,
  onClose,
  currentAmount,
  nextEffectiveAmount,
  nextEffectiveDate,
  onSuccess,
}: UpdateContributionModalProps) {
  const mutations = useOrgMutations();
  const [newAmount, setNewAmount] = React.useState<number | string>(currentAmount || 100);
  const [reason, setReason] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync initial amount when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setNewAmount(nextEffectiveAmount || currentAmount || 100);
      setReason('');
      setShowConfirm(false);
    }
  }, [isOpen, currentAmount, nextEffectiveAmount]);

  if (!isOpen) return null;

  const parsedNewAmount = Number(newAmount);
  const nextMonthText = nextEffectiveDate
    ? new Date(nextEffectiveDate).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })
    : getNextMonthNameBengali();
  const isSameAsCurrent = Math.round(parsedNewAmount) === Math.round(currentAmount);
  const isInvalid = !parsedNewAmount || parsedNewAmount < 50 || isSameAsCurrent;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedNewAmount < 50) {
      toast.warning('মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে।');
      return;
    }
    if (isSameAsCurrent) {
      toast.warning('নতুন অনুদানের পরিমাণ বর্তমান পরিমাণের চেয়ে ভিন্ন হতে হবে।');
      return;
    }
    setShowConfirm(true);
  };

  const handleExecuteUpdate = async () => {
    setIsSubmitting(true);
    try {
      await mutations.updateMonthlyContribution.mutateAsync({
        newAmount: parsedNewAmount,
        reason: reason.trim() || undefined,
      });
      toast.success(
        `মাসিক অনুদান ৳${toBengaliNumber(parsedNewAmount)} সফলভাবে নির্ধারিত হয়েছে। এটি ${nextMonthText} থেকে কার্যকর হবে।`
      );
      setShowConfirm(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'অনুদান আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-white dark:bg-[#0E1A16] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-brand-emerald dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  মাসিক অনুদান পরিবর্তন
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  সংগঠনে আপনার মাসিক অঙ্গীকার আপডেট করুন
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleOpenConfirm} className="p-5 space-y-4 overflow-y-auto">
            {/* Current vs Next Banner */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  বর্তমান অনুদান
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  ৳{toBengaliNumber(currentAmount)}
                  <span className="text-xs font-normal text-slate-400"> /মাস</span>
                </span>
              </div>
              <div className="border-l border-slate-200/60 dark:border-white/5 pl-3">
                <span className="text-[10px] uppercase font-semibold text-brand-emerald dark:text-emerald-400 block">
                  কার্যকর হওয়ার সময়
                </span>
                <span className="text-xs sm:text-sm font-bold text-brand-emerald dark:text-emerald-300 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{nextMonthText}</span>
                </span>
              </div>
            </div>

            {nextEffectiveAmount && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-semibold">ইতোমধ্যে নির্ধারিত:</span> {nextMonthText} থেকে আপনার
                  চাঁদা <strong>৳{toBengaliNumber(nextEffectiveAmount)}</strong> নির্ধারিত রয়েছে। আপনি চাইলে পুনরায় এটি পরিবর্তন করতে পারেন।
                </div>
              </div>
            )}

            {/* New Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                নতুন মাসিক অনুদানের পরিমাণ (টাকায়) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  min={50}
                  step={10}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="যেমন: ২০০"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 transition-all"
                  required
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 mr-1">দ্রুত নির্বাচন:</span>
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = Number(newAmount) === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-emerald text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      ৳{toBengaliNumber(amt)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                পরিবর্তনের কারণ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="যেমন: অনুদান বৃদ্ধির আগ্রহ / ব্যক্তিগত সামর্থ্য"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 transition-all"
              />
            </div>

            {/* Rules & Transparency Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/15 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-brand-emerald dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>গুরুত্বপূর্ণ আর্থিক নীতিমালা</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                <li>নতুন পরিমাণ আগামী <strong>{nextMonthText}</strong> থেকে বকেয়া ও নিয়মিত হিসাবে প্রযোজ্য হবে।</li>
                <li>ইতোমধ্যে পরিশোধিত বা অনুমোদিত পূর্ববর্তী কোনো মাসের রসিদ পরিবর্তিত হবে না।</li>
                <li>অডিট ও স্বচ্ছতার স্বার্থে আপনার সকল অঙ্গীকারের ইতিহাস ডাটাবেজে স্থায়ীভাবে সংরক্ষিত থাকে।</li>
              </ul>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isInvalid || isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>আপডেট নিশ্চিত করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Professional Confirmation Modal (No native alert/confirm popups) */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => !isSubmitting && setShowConfirm(false)}
        onConfirm={handleExecuteUpdate}
        isLoading={isSubmitting}
        title="মাসিক অনুদান পরিবর্তন নিশ্চিতকরণ"
        variant="primary"
        confirmText="হ্যাঁ, পরিবর্তন নিশ্চিত করুন"
        cancelText="ফিরে যান"
        description={
          <div className="space-y-2 text-xs">
            <p>
              আপনি কি নিশ্চিতভাবে আপনার মাসিক অনুদানের পরিমাণ{' '}
              <strong className="text-slate-900 dark:text-white">৳{toBengaliNumber(currentAmount)}</strong> থেকে{' '}
              <strong className="text-brand-emerald dark:text-emerald-400 font-bold">
                ৳{toBengaliNumber(parsedNewAmount)}
              </strong>{' '}
              টাকায় পরিবর্তন করতে চান?
            </p>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1 font-semibold text-brand-emerald dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>কার্যকর তারিখ: ১লা {nextMonthText}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                চলতি মাস পর্যন্ত আপনার পূর্ববর্তী হার কার্যকর থাকবে এবং আগামী মাস থেকে নতুন হার প্রযোজ্য হবে।
              </p>
            </div>
          </div>
        }
      />
    </>
  );
}
