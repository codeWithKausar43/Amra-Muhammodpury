'use client';

import * as React from 'react';
import {
  X,
  Heart,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  User,
  Hash,
  ArrowRight,
} from 'lucide-react';
import type { Campaign } from '../types';
import { usePublicPaymentMethodsQuery, useCampaignMutations } from '../hooks/useCampaignQueries';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

interface DonationModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000];

export const DonationModal: React.FC<DonationModalProps> = ({ campaign, isOpen, onClose }) => {
  const { data: paymentMethods = [] } = usePublicPaymentMethodsQuery();
  const { submitDonation } = useCampaignMutations();

  const [step, setStep] = React.useState<'FORM' | 'SUCCESS'>('FORM');
  const [selectedAmount, setSelectedAmount] = React.useState<number>(500);
  const [customAmount, setCustomAmount] = React.useState<string>('500');
  const [selectedMethod, setSelectedMethod] = React.useState<string>('BKASH');
  const [donorName, setDonorName] = React.useState('');
  const [donorPhone, setDonorPhone] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [trxId, setTrxId] = React.useState('');
  const [senderNumber, setSenderNumber] = React.useState('');
  const [donorNotes, setDonorNotes] = React.useState('');
  const [receiptUrl, setReceiptUrl] = React.useState('');
  const [copiedAccount, setCopiedAccount] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('FORM');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMethodConfig =
    paymentMethods.find((p) => p.method === selectedMethod) ||
    paymentMethods[0] || {
      method: 'BKASH',
      title: 'বিকাশ (মার্চেন্ট)',
      accountNumber: '01711000001',
      accountType: 'মার্চেন্ট পেমেন্ট',
      instructions: 'বিকাশ অ্যাপের Payment অপশন ব্যবহার করে অর্থ প্রদান করুন।',
    };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleAmountSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount(String(val));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setSelectedAmount(Number(val) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = Number(customAmount);
    if (!amount || amount < 10) {
      setErrorMessage('অনুগ্রহ করে সর্বনিম্ন ১০ টাকা বা তার বেশি অনুদানের পরিমাণ নির্ধারণ করুন।');
      return;
    }
    if (!donorName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম প্রদান করুন।');
      return;
    }
    if (!donorPhone.trim() || donorPhone.trim().length < 10) {
      setErrorMessage('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    try {
      const res = await submitDonation.mutateAsync({
        campaignId: campaign.id,
        data: {
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || undefined,
          amount,
          paymentMethod: selectedMethod,
          trxId: trxId.trim() || undefined,
          senderNumber: senderNumber.trim() || undefined,
          receiptUrl: receiptUrl.trim() || undefined,
          donorNotes: donorNotes.trim() || undefined,
        },
      });

      setSuccessData(res);
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err?.message || 'অনুদান জমা দিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-emerald-50/50 dark:bg-brand-emerald/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center shrink-0 shadow-xs">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {step === 'SUCCESS' ? 'অনুদান সফলভাবে গৃহীত' : 'ক্যাম্পেইনে অনুদান প্রদান'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                {campaign.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800 dark:text-slate-200">
          {step === 'SUCCESS' ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-75">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ধন্যবাদ, {successData?.donorName || donorName}!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  আপনার ৳ {toBengaliNumber(customAmount)} অনুদান তথ্যটি সফলভাবে জমা হয়েছে। অ্যাডমিন লেনদেন যাচাইয়ের পর এটি চূড়ান্তভাবে যুক্ত হবে।
                </p>
              </div>

              {/* Receipt Voucher Card */}
              <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-2xl p-4 text-left space-y-2.5 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">রশিদ নম্বর:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
                    <span>{successData?.receiptNumber || 'AMP-DON-REC'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(successData?.receiptNumber || '')}
                      className="p-1 text-slate-400 hover:text-brand-emerald"
                      title="কপি করুন"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">ক্যাম্পেইন:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                    {campaign.title}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">অনুদানের পরিমাণ:</span>
                  <span className="font-bold text-brand-emerald dark:text-brand-mint text-sm">
                    ৳ {toBengaliNumber(customAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">পদ্ধতি:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedMethod}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">বর্তমান স্ট্যাটাস:</span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    যাচাই অপেক্ষমাণ
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                >
                  সম্পন্ন করুন
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Donation Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  অনুদানের পরিমাণ নির্বাচন করুন (টাকা) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountSelect(amt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedAmount === amt
                          ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-emerald/40'
                      }`}
                    >
                      ৳{toBengaliNumber(amt)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="অথবা আপনার পছন্দমতো পরিমাণ লিখুন"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    required
                  />
                </div>
              </div>

              {/* 2. Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  পেমেন্ট মাধ্যম বেছে নিন <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'BKASH', label: 'বিকাশ', icon: '📱' },
                    { id: 'NAGAD', label: 'নগদ', icon: '📲' },
                    { id: 'ROCKET', label: 'রকেট', icon: '🚀' },
                    { id: 'BANK', label: 'ব্যাংক', icon: '🏦' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        selectedMethod === m.id
                          ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald dark:text-brand-mint ring-1 ring-brand-emerald'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm">{m.icon}</div>
                      <div className="mt-0.5 text-[11px] truncate">{m.label}</div>
                    </button>
                  ))}
                </div>

                {/* Method Instructions Box */}
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {currentMethodConfig.title}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded">
                      {currentMethodConfig.accountType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <span className="font-mono font-bold text-brand-emerald dark:text-brand-mint text-sm tracking-wide">
                      {currentMethodConfig.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(currentMethodConfig.accountNumber)}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-brand-mint hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                  {currentMethodConfig.instructions && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      💡 {currentMethodConfig.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Donor Info (Mandatory Login-Free) */}
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      আপনার নাম <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="আপনার পূর্ণ নাম"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="০১XXXXXXXXX"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ইমেইল ঠিকানা (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="ইমেইলে রশিদ পেতে"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      পেমেন্ট প্রুফ / স্ক্রিনশট লিংক (ঐচ্ছিক)
                    </label>
                    <input
                      type="url"
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      placeholder="রশিদের ইমেজ লিংক"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                </div>

                {/* TrxID & Sender Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ট্রানজেকশন আইডি (TrxID)
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="পেমেন্টের TrxID"
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      প্রেরক নম্বর / অ্যাকাউন্ট
                    </label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মন্তব্য বা প্রার্থনা (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    value={donorNotes}
                    onChange={(e) => setDonorNotes(e.target.value)}
                    placeholder="ক্যাম্পেইন বা আপনার অনুভূতি সম্পর্কে কিছু লিখুন..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitDonation.isPending}
                  className="w-full py-3 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitDonation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>অনুদানের তথ্য পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>৳ {toBengaliNumber(customAmount)} দান নিশ্চিত করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  🔒 আপনার তথ্য সম্পূর্ণ সুরক্ষিত। কোনো অ্যাকাউন্ট বা রেজিস্ট্রেশনের প্রয়োজন নেই।
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
