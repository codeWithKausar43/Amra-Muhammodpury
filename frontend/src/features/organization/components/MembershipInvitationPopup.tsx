'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Users, HeartHandshake, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface MembershipInvitationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MembershipInvitationPopup: React.FC<MembershipInvitationPopupProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-invitation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-300 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Close button top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-sm"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Visual Banner */}
        <div className="relative pt-7 pb-6 px-5 sm:px-6 bg-gradient-to-br from-brand-emerald/90 via-emerald-800 to-emerald-950 text-white text-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Org Logo / Icon Badge */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/30 bg-emerald-950/40 p-0.5">
            <Image
              src="/logos/logo.png"
              alt="আমরা মোহাম্মদপুরী লোগো"
              width={80}
              height={80}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md mb-2 text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>সংগঠনের সদস্যপদ আহ্বান</span>
          </div>

          <h2
            id="membership-invitation-title"
            className="text-lg sm:text-xl font-black text-white tracking-tight"
          >
            আমরা মুহাম্মদপুরী
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xs mx-auto leading-relaxed">
            মুহাম্মদপুরবাসীর ঐক্য, সামাজিক উন্নয়ন ও মানবিক সহায়তায় আমাদের সাথে যুক্ত হোন।
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Feature Highlights */}
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 text-brand-emerald dark:text-brand-mint flex items-center justify-center shrink-0 mt-0.5">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  সামাজিক উন্নয়ন ও মানবিক সহায়তা
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  জরুরি ত্রাণ, চিকিৎসা ও শিক্ষা সহায়তায় মুহাম্মদপুরবাসীর পাশে দাঁড়ান।
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  সম্মিলিত ঐক্য ও নেটওয়ার্কিং
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  এলাকার সচেতন নাগরিক ও পেশাজীবীদের সাথে সুদৃঢ় ভ্রাতৃত্ব গড়ে তুলুন।
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  স্বচ্ছ তহবিল ও ভোটাধিকার
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  ডিজিটাল নির্বাচন, স্বচ্ছ আর্থিক হিসাব ও নিয়মিত সাধারণ সভায় মতামত দিন।
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              href="/organization"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>আমাদের সম্পর্কে</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/organization/apply"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs text-center transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>সদস্য হতে আবেদন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

