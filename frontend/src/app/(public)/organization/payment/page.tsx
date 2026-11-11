'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import {
  useOrgMembershipStatusQuery,
  useOrgPaymentConfigsQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';

type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH';

const PAYMENT_INFO: Record<PaymentMethod, { title: string; number: string; type: string; instructions: string }> = {
  BKASH: {
    title: 'bKash (বিকাশ)',
    number: '০১৭৫০০০০০০০',
    type: 'মার্চেন্ট / সেন্ড মানি',
    instructions: 'বিকাশ অ্যাপ থেকে "Send Money" অথবা "Payment" করুন। রেফারেন্স হিসেবে আপনার মোবাইল নম্বর লিখুন।',
  },
  NAGAD: {
    title: 'Nagad (নগদ)',
    number: '০১৮৫০০০০০০০',
    type: 'মার্চেন্ট একাউন্ট',
    instructions: 'নগদ অ্যাপে গিয়ে উল্লেখিত নম্বরে সেন্ড মানি করুন।',
  },
  ROCKET: {
    title: 'Rocket (রকেট)',
    number: '০১835234869-9',
    type: 'ব্যক্তিগত একাউন্ট',
    instructions: 'রকেট অ্যাকাউন্টে উল্লেখিত নম্বরে পে করুন।',
  },
  BANK: {
    title: 'ব্যাংক ট্রান্সফার',
    number: '১২৩.১০১.৪৫৬৭৮ (Meghna ব্যাংক)',
    type: 'কর্পোরেট একাউন্ট',
    instructions: 'অ্যাকাউন্টের নাম: "মোহাম্মদপুর কমিউনিটি নাগরিক উন্নয়ন সংস্থা"। জমার স্লিপ সংরক্ষণ করুন।',
  },
  CASH: {
    title: 'সরাসরি নগদ (ক্যাশ)',
    number: 'সংগঠনের কার্যালয়, তাজমহল রোড',
    type: 'কোষাধ্যক্ষ দপ্তর',
    instructions: 'দাপ্তরিক সময়ে কোষাধ্যক্ষের নিকট সরাসরি নগদ চাঁদা জমা দিয়ে রসিদ গ্রহণ করুন।',
  },
};

export default function OrganizationPaymentPage() {
  const { data: membershipData } = useOrgMembershipStatusQuery();
  const { data: dbPaymentConfigs } = useOrgPaymentConfigsQuery();
  const mutations = useOrgMutations();

  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>('BKASH');
  const [senderNumber, setSenderNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Dynamic payment config lookup merging DB records with fallback defaults
  const activeConfigs = React.useMemo(() => {
    const map: Record<string, { title: string; number: string; type: string; instructions: string }> = { ...PAYMENT_INFO };
    if (dbPaymentConfigs && dbPaymentConfigs.length > 0) {
      dbPaymentConfigs.forEach((cfg) => {
        if (cfg.isActive) {
          map[cfg.method] = {
            title: cfg.title,
            number: cfg.accountNumber,
            type: cfg.accountType,
            instructions: cfg.instructions || '',
          };
        } else {
          delete map[cfg.method];
        }
      });
    }
    return map;
  }, [dbPaymentConfigs]);

  const availableMethods = React.useMemo(() => {
    return Object.keys(activeConfigs) as PaymentMethod[];
  }, [activeConfigs]);

  // Ensure current selection is valid
  React.useEffect(() => {
    if (availableMethods.length > 0 && !activeConfigs[selectedMethod] && availableMethods[0]) {
      setSelectedMethod(availableMethods[0]);
    }
  }, [availableMethods, activeConfigs, selectedMethod]);

  const agreementAmount =
    membershipData?.currentAgreement?.agreedAmount ||
    membershipData?.latestApplication?.monthlyContribution ||
    100;

  const currentMethodInfo = activeConfigs[selectedMethod] || PAYMENT_INFO[selectedMethod] || {
    title: selectedMethod,
    number: '',
    type: 'অ্যাকাউন্ট',
    instructions: '',
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedMethod !== 'CASH' && !senderNumber.trim()) {
      setErrorMsg('অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন তা উল্লেখ করুন');
      return;
    }

    try {
      await mutations.submitInitialPayment.mutateAsync({
        paymentMethod: selectedMethod,
        senderNumber: senderNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            অভিনন্দন! আপনার সদস্যপদ সক্রিয় হয়েছে
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            আপনার প্রারম্ভিক কিস্তি (৳{agreementAmount}) সফলভাবে যাচাই হয়েছে। আপনি এখন মোহাম্মদপুর কমিউনিটি সংগঠনের একজন পূর্ণাঙ্গ সক্রিয় সদস্য।
          </p>
        </div>
        <div className="pt-3">
          <Link
            href="/organization/member"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-emerald text-white text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-md"
          >
            <span>সদস্য ড্যাশবোর্ডে প্রবেশ করুন</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/organization"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-emerald transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>সংগঠন ড্যাশবোর্ডে ফিরুন</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-brand-emerald/10 via-brand-gold/10 to-transparent rounded-2xl p-5 sm:p-6 border border-brand-emerald/20 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-brand-emerald/30 bg-white dark:bg-white/5 p-0.5 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="মোহাম্মদপুর কমিউনিটি লোগো"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-brand-emerald font-bold text-xs">
              <CreditCard className="w-4 h-4 text-brand-emerald" />
              <span>নিরাপদ চাঁদা ও অনুদান পরিশোধ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              প্রারম্ভিক কিস্তি পরিশোধ
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          আপনার অনুমোদিত মাসিক অনুদান: <strong>৳{agreementAmount}</strong>। নিচের যে কোনো মাধ্যমে পরিশোধ করে প্রেরক নম্বর প্রদান করুন।
        </p>
      </div>

      {/* Payment Method Selector */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block text-left">
          পেমেন্ট মাধ্যম নির্বাচন করুন:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${selectedMethod === method
                  ? 'border-brand-emerald bg-brand-emerald/10 text-brand-emerald dark:text-brand-mint ring-1 ring-brand-emerald'
                  : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              {activeConfigs[method]?.title || method}
            </button>
          ))}
        </div>

        {/* Selected method details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {currentMethodInfo.type}:
            </span>
            <button
              type="button"
              onClick={() => handleCopyNumber(currentMethodInfo.number)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-emerald hover:underline cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'কপি হয়েছে!' : 'নম্বর কপি করুন'}</span>
            </button>
          </div>
          <p className="text-sm font-black text-brand-emerald select-all tracking-wider">
            {currentMethodInfo.number}
          </p>
          {currentMethodInfo.instructions && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentMethodInfo.instructions}
            </p>
          )}
        </div>
      </div>

      {/* Verification Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          পেমেন্টের তথ্য প্রদান করুন
        </h3>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            প্রেরক মোবাইল নম্বর (যে নম্বর থেকে টাকা পাঠিয়েছেন) {selectedMethod !== 'CASH' && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="tel"
            required={selectedMethod !== 'CASH'}
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="যেমন: ০১৭xxxxxxxx"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            মন্তব্য বা অতিরিক্ত তথ্য (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="প্রারম্ভিক কিস্তি / সদস্যপদ ফি"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald outline-none transition-all"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={mutations.submitInitialPayment.isPending}
            className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {mutations.submitInitialPayment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>যাচাই করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span>পেমেন্ট নিশ্চিত ও সদস্যপদ সক্রিয় করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
