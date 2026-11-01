'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-sm rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 text-center space-y-4">
        {/* Close Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-brand-emerald/10 text-brand-emerald dark:text-brand-mint mx-auto flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            মুহাম্মদপুরী পরিবারে যুক্ত হোন
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            লাইক দিতে, মন্তব্য করতে বা আপনার এলাকার পোস্ট প্রকাশ করতে অনুগ্রহ করে একাউন্টে প্রবেশ করুন।
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-glow transition-all"
          >
            <span>লগইন করুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all"
          >
            <UserPlus className="w-4 h-4 text-brand-emerald" />
            <span>নতুন সদস্য নিবন্ধন</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium pt-1"
        >
          পরে করব
        </button>
      </div>
    </div>
  );
}
