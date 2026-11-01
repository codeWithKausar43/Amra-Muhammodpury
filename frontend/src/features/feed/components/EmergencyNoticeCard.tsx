'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, Wrench, PhoneCall, Check } from 'lucide-react';

interface EmergencyNoticeCardProps {
  onAcknowledge?: () => void;
}

export function EmergencyNoticeCard({ onAcknowledge }: EmergencyNoticeCardProps) {
  const [acknowledged, setAcknowledged] = React.useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(!acknowledged);
    onAcknowledge?.();
  };

  return (
    <article className="w-full bg-emerald-50/60 dark:bg-brand-emerald/10 border border-emerald-200/80 dark:border-brand-emerald/30 rounded-2xl p-4 sm:p-5 shadow-soft transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                মুহাম্মদপুর সেন্ট্রাল হেল্পডেস্ক
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span>৪ ঘণ্টা আগে</span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">বাবর রোড</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">✨ পরিষেবা বিজ্ঞপ্তি</span>
            </p>
          </div>
        </div>

        <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/40 animate-pulse">
          জরুরী
        </span>
      </div>

      {/* Notice Content Box */}
      <div className="bg-white/80 dark:bg-brand-charcoal-dark/70 rounded-xl p-3.5 sm:p-4 border border-emerald-100 dark:border-white/5 mb-3.5 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
          <Wrench className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            জরুরী রক্ষণাবেক্ষণ বিজ্ঞপ্তি:
          </p>
          <p>
            আগামী শনিবার বাবর রোড ও হুমায়ুন রোডে নিয়মিত ডিপিডিসি বিদ্যুৎ সাব-স্টেশন সংস্কার কাজ চলবে
            সকাল ৮:০০টা থেকে দুপুর ১২:০০টা পর্যন্ত। বিকল্প বিদ্যুৎ ব্যাকআপ প্রস্তুত রাখার অনুরোধ করা হচ্ছে।
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-emerald-100/80 dark:border-brand-emerald/20 flex-wrap">
        <a
          href="tel:16110"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-brand-mint transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5 text-brand-emerald" />
          <span>হেল্পলাইন: ১৬১১০ (ডিপিডিসি)</span>
        </a>

        <button
          type="button"
          onClick={handleAcknowledge}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 ${
            acknowledged
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              : 'bg-brand-emerald text-white hover:bg-emerald-800 shadow-glow'
          }`}
        >
          {acknowledged ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>অবহিত হলাম</span>
            </>
          ) : (
            <span>অবহিত হলাম</span>
          )}
        </button>
      </div>
    </article>
  );
}

