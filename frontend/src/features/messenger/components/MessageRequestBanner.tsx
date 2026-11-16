'use client';

import * as React from 'react';
import { ShieldAlert, Check, X, Ban, Loader2 } from 'lucide-react';

interface MessageRequestBannerProps {
  isMyRequest: boolean;
  senderName?: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onBlock: () => Promise<void>;
}

export function MessageRequestBanner({
  isMyRequest,
  senderName = 'ব্যবহারকারী',
  onAccept,
  onDecline,
  onBlock,
}: MessageRequestBannerProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleAction = async (action: 'accept' | 'decline' | 'block') => {
    setLoading(action);
    try {
      if (action === 'accept') await onAccept();
      if (action === 'decline') await onDecline();
      if (action === 'block') await onBlock();
    } finally {
      setLoading(null);
    }
  };

  if (isMyRequest) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/40 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="flex-1">
          আপনার বার্তাটি রিকোয়েস্ট হিসেবে পাঠানো হয়েছে। অপর প্রান্ত থেকে রিকোয়েস্ট গ্রহণ করা হলে আপনি আরও বার্তা পাঠাতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-slate-50 dark:bg-white/5 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">
            {senderName} আপনাকে একটি বার্তা পাঠিয়েছেন
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            আপনি গ্রহণ না করা পর্যন্ত তিনি আর কোনো বার্তা পাঠাতে পারবেন না।
          </p>
        </div>
      </div>

      {/* Action buttons: Accept, Decline, Block */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={() => handleAction('block')}
          disabled={Boolean(loading)}
          className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          {loading === 'block' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
          <span>ব্লক</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction('decline')}
          disabled={Boolean(loading)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          {loading === 'decline' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          <span>বাতিল</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction('accept')}
          disabled={Boolean(loading)}
          className="px-3.5 py-1.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
        >
          {loading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          <span>গ্রহণ করুন</span>
        </button>
      </div>
    </div>
  );
}
