'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passedCount = [hasLength, hasLower, hasUpper, hasNumber].filter(Boolean).length;

  const strengthLabels = ['দুর্বল', 'চলনসই', 'ভালো', 'শক্তিশালী'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-brand-emerald'];

  const currentLabel = passedCount === 0 ? '' : strengthLabels[passedCount - 1];
  const currentColor = passedCount === 0 ? 'bg-slate-200' : strengthColors[passedCount - 1];

  return (
    <div className="space-y-2 pt-1 text-xs">
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
        <span>পাসওয়ার্ডের শক্তি:</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{currentLabel}</span>
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

      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          {hasLength ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          )}
          <span>কমপক্ষে ৮ অক্ষর</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasUpper ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          )}
          <span>বড় হাতের অক্ষর (A-Z)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasLower ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          )}
          <span>ছোট হাতের অক্ষর (a-z)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasNumber ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          )}
          <span>সংখ্যা (০-৯)</span>
        </div>
      </div>
    </div>
  );
}
