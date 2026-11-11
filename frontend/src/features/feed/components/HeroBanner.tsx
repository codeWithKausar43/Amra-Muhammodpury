'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal-dark text-white p-5 sm:p-7 shadow-glow mb-5">
      {/* Background soft glow patterns */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-brand-gold/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-[11px] font-bold border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span>মোহাম্মদপুরের নাগরিকদের জন্য তৈরি প্রথম সোশ্যাল হাব</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-lg border border-white/25 bg-emerald-950/40 p-0.5 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="মোহাম্মদপুর কমিউনিটি লোগো"
              width={56}
              height={56}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            মোহাম্মদপুর কমিউনিটি — সম্প্রীতি, উন্নয়ন ও ঐক্যের বন্ধন
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
          আপনার এলাকার খবর জানুন, নাগরিক উন্নয়ন ও নিরাপত্তায় মতামত দিন এবং কমিউনিটি হিসাবরক্ষণে
          স্বচ্ছতা নিশ্চিত করুন।
        </p>

        <div className="flex items-center gap-2.5 pt-2 flex-wrap">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-brand-emerald font-bold text-xs sm:text-sm hover:bg-emerald-50 active:scale-95 transition-all shadow-md"
          >
            <span>লগইন করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/25 active:scale-95 transition-all"
          >
            <span>নতুন সদস্য নিবন্ধন</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
