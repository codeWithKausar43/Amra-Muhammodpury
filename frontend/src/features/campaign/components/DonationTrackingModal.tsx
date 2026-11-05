'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useTrackDonationQuery } from '../hooks/useCampaignQueries';
import { downloadCampaignDonationReceipt } from '../utils/receiptGenerator';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

interface DonationTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReceiptNumber?: string;
}

export const DonationTrackingModal: React.FC<DonationTrackingModalProps> = ({
  isOpen,
  onClose,
  initialReceiptNumber = '',
}) => {
  const [searchInput, setSearchInput] = React.useState(initialReceiptNumber);
  const [activeReceipt, setActiveReceipt] = React.useState(initialReceiptNumber);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSearchInput(initialReceiptNumber);
      setActiveReceipt(initialReceiptNumber);
      setCopied(false);
    }
  }, [isOpen, initialReceiptNumber]);

  const { data: tracking, isLoading, isError, error } = useTrackDonationQuery(
    activeReceipt,
    Boolean(activeReceipt && activeReceipt.trim().length >= 5)
  );

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveReceipt(searchInput.trim().toUpperCase());
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!tracking) return;
    downloadCampaignDonationReceipt({
      receiptNumber: tracking.receiptNumber,
      donorName: tracking.donorName,
      senderNumber: tracking.senderNumber || undefined,
      campaignTitle: tracking.campaign.title,
      amount: tracking.amount,
      paymentMethod: tracking.paymentMethod,
      status: tracking.status,
      date: tracking.submittedAt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-sky-50/50 dark:bg-sky-950/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                অনুদানের অবস্থা ও অগ্রগতি ট্র্যাকিং
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                রশিদ নম্বর দিয়ে আপনার অনুদানের লাইভ স্ট্যাটাস পর্যবেক্ষণ করুন
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

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="রশিদ নম্বর লিখুন (যেমন: AMP-DON-202611-1234)"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>খুঁজুন</span>}
            </button>
          </form>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-600" />
              <p className="text-xs">অনুদানের তথ্য লোড হচ্ছে...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">কোনো রেকর্ড পাওয়া যায়নি</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {(error as any)?.message || 'অনুগ্রহ করে সঠিক রসিদ নম্বর নিশ্চিত করে পুনরায় খুঁজুন।'}
                </p>
              </div>
            </div>
          ) : tracking ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Status Header Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  tracking.status === 'VERIFIED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : tracking.status === 'PENDING'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {tracking.status === 'VERIFIED' && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {tracking.status === 'PENDING' && (
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  )}
                  {tracking.status === 'REJECTED' && (
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {tracking.status === 'VERIFIED'
                        ? 'অনুমোদিত ও যাচাইকৃত'
                        : tracking.status === 'PENDING'
                          ? 'যাচাই অপেক্ষমাণ'
                          : 'অনুমোদন সম্ভব হয়নি'}
                    </span>
                    <span className="text-[11px] opacity-75">
                      {new Date(tracking.submittedAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {tracking.status === 'VERIFIED'
                      ? 'আপনার অনুদানটি যাচাই করে সফলভাবে ক্যাম্পেইন তহবিলে যুক্ত করা হয়েছে। আন্তরিক ধন্যবাদ!'
                      : tracking.status === 'PENDING'
                        ? 'আপনার অনুদানের তথ্যটি জমা হয়েছে। দায়িত্বপ্রাপ্ত অ্যাডমিন পেমেন্ট যাচাইয়ের পর এটি অনুমোদিত হবে।'
                        : tracking.rejectionReason
                          ? `বাতিলের কারণ: ${tracking.rejectionReason}`
                          : 'প্রদত্ত তথ্য অনুযায়ী পেমেন্ট রেকর্ড মেলানো যায়নি।'}
                  </p>
                </div>
              </div>

              {/* Donation Details Card */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-white/10">
                  <span className="text-slate-500 dark:text-slate-400">রশিদ নম্বর:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
                    <span>{tracking.receiptNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(tracking.receiptNumber)}
                      className="p-1 text-slate-400 hover:text-sky-600"
                      title="কপি করুন"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">দাতার নাম:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{tracking.donorName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">অনুদানের পরিমাণ:</span>
                  <span className="font-black text-brand-emerald dark:text-brand-mint text-sm">
                    ৳ {toBengaliNumber(tracking.amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">পদ্ধতি:</span>
                  <span className="font-medium">{tracking.paymentMethod}</span>
                </div>

                {tracking.senderNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">প্রেরক নম্বর:</span>
                    <span className="font-mono">{tracking.senderNumber}</span>
                  </div>
                )}
              </div>

              {/* Campaign Live Progress Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand-emerald dark:text-brand-mint font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>ক্যাম্পেইন রিয়েল-টাইম অগ্রগতি</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {toBengaliNumber(tracking.campaign.progressPercent)}% সম্পন্ন
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {tracking.campaign.title}
                </h4>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-emerald to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, tracking.campaign.progressPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>
                      সংগৃহীত: <strong className="text-brand-emerald">৳ {toBengaliNumber(tracking.campaign.collectedAmount)}</strong>
                    </span>
                    <span>
                      লক্ষ্য: <strong>৳ {toBengaliNumber(tracking.campaign.goalAmount)}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    href={`/campaigns/${tracking.campaign.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-emerald hover:underline"
                  >
                    <span>সম্পূর্ণ ক্যাম্পেইন বিস্তারিত ও অনুদান বিবরণী দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Download Receipt Button */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>অফিসিয়াল রশিদ ডাউনলোড করুন</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p>আপনার অনুদান রশিদের নম্বরটি ওপরের বক্সে লিখে খুঁজুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
