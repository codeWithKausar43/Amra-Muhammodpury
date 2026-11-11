'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ArrowRight, Quote, Handshake, Sprout, ShieldCheck, Heart } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
    >
      {/* Main Modal Card with Deep Emerald Luxury Gradient - Consistent in Light & Dark Mode */}
      <div className="relative w-full max-w-[390px] sm:max-w-md rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-emerald-500/30 bg-gradient-to-b from-[#06422e] via-[#043324] to-[#022319] p-5 sm:p-6 text-white text-center my-auto animate-in zoom-in-95 duration-200">
        
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Circular Illuminated Logo Seal */}
        <div className="relative mx-auto mb-3 mt-1 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-2 bg-gradient-to-b from-emerald-300/40 via-emerald-500/20 to-transparent border border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden shadow-inner">
            <Image
              src="/logos/logo.png"
              alt="মোহাম্মদপুর কমিউনিটি লোগো"
              width={120}
              height={120}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2
          id="membership-invitation-title"
          className="text-2xl sm:text-[26px] font-black text-white tracking-tight flex items-center justify-center gap-2"
        >
          <span>মোহাম্মদপুর কমিউনিটি</span>
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-red-500 shrink-0 inline-block animate-pulse" />
        </h2>
        <p className="text-xs sm:text-[13px] text-emerald-100/90 font-medium mt-1">
          আপনিও হোন আমাদের পরিবারের একজন!
        </p>

        {/* Glass Quote Card */}
        <div className="relative bg-white/[0.07] border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center mt-4 backdrop-blur-md shadow-xs">
          <div className="absolute top-2 left-2 text-emerald-400/40">
            <Quote className="w-3.5 h-3.5 rotate-180" />
          </div>
          <p className="text-xs sm:text-[13px] text-emerald-50/95 leading-relaxed font-normal italic px-2">
            “একটু ভালোবাসা, একটু সহযোগিতা—হয়তো বদলে দিতে পারে কারও জীবনের গল্প। আসুন, মানুষের পাশে দাঁড়ায়, একসাথে সুন্দর মোহাম্মদপুরী গড়ি”
          </p>
        </div>

        {/* 3 Feature Highlights in a Row with Lucide Icons */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-4">
          <div className="rounded-2xl p-2.5 sm:p-3 bg-white/[0.07] border border-white/10 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs">
            <Handshake className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-[11px] font-bold text-white/95">পারস্পরিক ঐক্য</span>
          </div>

          <div className="rounded-2xl p-2.5 sm:p-3 bg-white/[0.07] border border-white/10 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs">
            <Sprout className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="text-[11px] font-bold text-white/95">সমাজকল্যাণ</span>
          </div>

          <div className="rounded-2xl p-2.5 sm:p-3 bg-white/[0.07] border border-white/10 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0" />
            <span className="text-[11px] font-bold text-white/95">স্বচ্ছ তহবিল</span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <Link
          href="/organization/apply"
          onClick={onClose}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base text-center transition-all shadow-[0_8px_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          <span>সদস্য হতে আবেদন করুন</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>

        {/* Secondary Link */}
        <Link
          href="/organization"
          onClick={onClose}
          className="text-xs sm:text-sm font-semibold text-emerald-200/90 hover:text-white transition-colors cursor-pointer block text-center mt-3"
        >
          আমাদের সম্পর্কে জানুন
        </Link>

      </div>
    </div>
  );
};
