'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  if (!password) return null;

  const hasLength = password.length >= 6;
  const hasText = /[a-zA-Z\u0980-\u09FF]/.test(password);
  const hasNumber = /[0-9\u09E6-\u09EF]/.test(password);
  const isComplete = hasLength && hasText && hasNumber;
  const isStrong = isComplete && password.length >= 8;

  let passedCount = 0;
  if (password.length > 0) passedCount = 1;
  if (hasLength) passedCount = 2;
  if (isComplete) passedCount = 3;
  if (isStrong) passedCount = 4;

  const strengthLabels = ['ছোট', 'চলনসই', 'নিরাপদ', 'শক্তিশালী'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-brand-emerald'];

  const currentLabel = passedCount === 0 ? '' : strengthLabels[passedCount - 1];
  const currentColor = passedCount === 0 ? 'bg-slate-200' : strengthColors[passedCount - 1];

  return (
    <div className="space-y-1.5 pt-1 text-xs animate-fadeIn">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
        <span className="text-[11px]">পাসওয়ার্ডের শক্তি:</span>
        <span className={`font-semibold text-[11px] ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
          {currentLabel}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`rounded-full transition-all duration-300 ${
              index < passedCount ? currentColor : 'bg-slate-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          {hasLength ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          )}
          <span className={hasLength ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}>
            কমপক্ষে ৬টি অক্ষর বা ডিজিট
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {hasText && hasNumber ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          )}
          <span className={hasText && hasNumber ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}>
            টেক্সট ও সংখ্যার সমন্বয় (০-৯)
          </span>
        </div>
      </div>
    </div>
  );
}
