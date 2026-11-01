'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ShieldAlert,
  Flame,
  Droplet,
  Zap,
  HeartHandshake,
} from 'lucide-react';

const EMERGENCY_CONTACTS = [
  {
    name: 'ডিপিডিসি বিদ্যুৎ অভিযোগ',
    number: '১৬১১০',
    icon: Zap,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    name: 'ঢাকা ওয়াসা (পানি ও পয়ঃনিষ্কাশন)',
    number: '১৬১৬২',
    icon: Droplet,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    name: 'মুহাম্মদপুর থানা পুলিশ',
    number: '০১৩২০-০৪০৮৮৪',
    icon: ShieldAlert,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    name: 'ফায়ার সার্ভিস মুহাম্মদপুর',
    number: '০২-৯১১৯৯৯৯',
    icon: Flame,
    color: 'text-red-500 bg-red-50 dark:bg-red-950/40',
  },
];

export function RightSidebar() {
  return (
    <aside className="hidden xl:block w-72 shrink-0 space-y-5 sticky top-20 h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar pb-8">
      {/* Emergency Helpline Widget */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <PhoneCall className="w-4 h-4 text-brand-emerald" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            জরুরী হেল্পলাইন ও সেবা
          </h3>
        </div>

        <div className="space-y-2.5">
          {EMERGENCY_CONTACTS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={`tel:${item.number.replace(/[^0-9]/g, '')}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-white/5 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-emerald transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.number}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-brand-emerald font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  কল
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Community Cleanliness & Pride Pledge */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-brand-mint/15 to-transparent dark:from-emerald-950/30 rounded-2xl p-4 border border-emerald-500/20 text-left space-y-2">
        <div className="flex items-center gap-2 text-brand-emerald dark:text-brand-mint font-bold text-xs">
          <HeartHandshake className="w-4 h-4" />
          <span>নাগরিক অঙ্গীকার</span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          নির্দিষ্ট স্থানে ময়লা ফেলুন, ড্রেন বন্ধ করবেন না এবং গাছপালার যত্ন নিন। আসুন আমাদের মুহাম্মদপুরকে
          সুন্দর ও পরিচ্ছন্ন রাখি।
        </p>
      </div>

      {/* Footer Info */}
      <div className="px-2 text-[11px] text-slate-400 dark:text-slate-500 space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/about" className="hover:underline">আমাদের সম্পর্কে</Link>
          <Link href="/guidelines" className="hover:underline">কমিউনিটি নীতিমালা</Link>
          <Link href="/privacy" className="hover:underline">গোপনীয়তা</Link>
          <Link href="/terms" className="hover:underline">শর্তাবলী</Link>
        </div>
        <p>© ২০২৬ আমরা মুহাম্মদপুরী। সর্বস্বত্ব সংরক্ষিত।</p>
      </div>
    </aside>
  );
}
