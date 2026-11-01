'use client';

import * as React from 'react';
import { Megaphone, X } from 'lucide-react';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between gap-2 shadow-xs transition-all animate-fadeIn">
      <div className="flex items-center gap-2 overflow-hidden text-xs sm:text-sm">
        <Megaphone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="truncate font-medium">
          <strong className="font-bold text-amber-800 dark:text-amber-300">নাগরিক বার্তা:</strong> বাবর রোডে সুয়ারেজ লাইন রক্ষণাবেক্ষণ কাজের জন্য বিকল্প রুট ব্যবহার করুন।
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
        aria-label="বন্ধ করুন"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
