'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Download,
  Share2,
  PlusSquare,
  Check,
  Smartphone,
  ExternalLink,
  ArrowRight,
  Loader2,
  Laptop,
} from 'lucide-react';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

export default function PwaInstallScreen() {
  const { isInstalled, platformInfo, isPrompting, promptInstall } =
    usePwaInstall();
  const [showDesktopGuide, setShowDesktopGuide] = React.useState<boolean>(false);

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result === 'accepted') {
      setShowDesktopGuide(false);
    } else if (result === 'dismissed') {
      // User dismissed native prompt
    } else {
      setShowDesktopGuide(true);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center p-4 sm:p-6 bg-slate-50 dark:bg-brand-charcoal-dark text-slate-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Background ambient lighting effects (matches Amra Mohammodpury design tokens) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] max-w-[520px] max-h-[520px] rounded-full bg-brand-emerald/15 dark:bg-brand-emerald/20 blur-[110px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[520px] max-h-[520px] rounded-full bg-brand-gold/10 dark:bg-brand-emerald/15 blur-[120px]" />
      </div>

      {/* Main Installation Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-glass dark:shadow-glass-dark border border-slate-200/90 dark:border-white/10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Logo with emerald glowing ring */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-emerald to-emerald-400 opacity-25 blur-lg animate-pulse" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-brand-charcoal p-2 border-2 border-brand-emerald/30 shadow-md flex items-center justify-center">
              <Image
                src="/logos/app-logo.png"
                alt="আমরা মোহাম্মদপুরী"
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-contain p-2"
                priority
              />
            </div>
          </div>

          {/* Title & Short Bangla Introduction */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              আমরা মোহাম্মদপুরী
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              মোহাম্মদপুরবাসীর ঐক্য, নাগরিক উন্নয়ন ও সামাজিক সহযোগিতার সমন্বিত প্ল্যাটফর্ম।
              অ্যাপের পরিপূর্ণ অভিজ্ঞতা পেতে প্রথমে অ্যাপটি আপনার ডিভাইসে ইনস্টল করে নিন।
            </p>
          </div>

          {/* In-app browser warning banner (Facebook/Messenger) */}
          {platformInfo.isInAppBrowser && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ExternalLink className="w-4 h-4 text-amber-600 shrink-0" />
                <span>বাহ্যিক ব্রাউজারে খুলুন</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                আপনি ফেসবুক বা মেসেঞ্জারের ভেতরের ব্রাউজারে আছেন। অ্যাপটি সফলভাবে ইনস্টল করতে
                উপরের থ্রি-ডট (•••) বাটনে ট্যাপ করে <strong>&quot;Open in Chrome&quot;</strong> বা{' '}
                <strong>&quot;Open in Safari&quot;</strong> সিলেক্ট করুন।
              </p>
            </div>
          )}

          {/* iOS Safari Installation Steps Card */}
          {platformInfo.isIos && !isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-emerald dark:text-brand-mint">
                <Smartphone className="w-4 h-4 text-brand-emerald" />
                <span>আইফোন / আইপ্যাডে ইনস্টল করার নিয়ম:</span>
              </div>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-200 font-medium pl-1">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold shrink-0 mt-0.5">
                    ১
                  </span>
                  <span>
                    সাফারি ব্রাউজারের নিচে থাকা{' '}
                    <span className="inline-flex items-center gap-0.5 font-bold text-brand-emerald bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      <Share2 className="w-3 h-3 inline" /> শেয়ার (Share)
                    </span>{' '}
                    বাটনে চাপুন।
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold shrink-0 mt-0.5">
                    ২
                  </span>
                  <span>
                    তালিকা থেকে{' '}
                    <span className="inline-flex items-center gap-0.5 font-bold text-brand-emerald bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
                    </span>{' '}
                    বাছুন।
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold shrink-0 mt-0.5">
                    ৩
                  </span>
                  <span>
                    উপরের ডানপাশে{' '}
                    <span className="inline-flex items-center gap-0.5 font-bold text-brand-emerald bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                      <Check className="w-3 h-3 inline" /> Add
                    </span>{' '}
                    ট্যাপ করলেই ইনস্টল হয়ে যাবে।
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Android / Desktop Installation Action Button */}
          {!platformInfo.isIos && !isInstalled && (
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-emerald via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm sm:text-base shadow-glow hover:shadow-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                {isPrompting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>প্রসেসিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>অ্যাপটি ইনস্টল করুন</span>
                  </>
                )}
              </button>

              {/* Desktop Installation Guide when browser does not open popup directly */}
              {showDesktopGuide && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-emerald dark:text-brand-mint">
                    <Laptop className="w-4 h-4 text-brand-emerald shrink-0" />
                    <span>কম্পিউটারে ইনস্টল করার নিয়ম:</span>
                  </div>
                  <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-200 font-medium pl-1">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold shrink-0 mt-0.5">
                        ১
                      </span>
                      <span>
                        আপনার ব্রাউজারের ওপরের <strong>অ্যাড্রেস বার (URL Bar)</strong>-এর ডানপাশে থাকা{' '}
                        <span className="inline-flex items-center gap-0.5 font-bold text-brand-emerald bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                          ইনস্টল আইকন (💻 ⬇️ বা ⊕)
                        </span>{' '}
                        এ ক্লিক করুন।
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold shrink-0 mt-0.5">
                        ২
                      </span>
                      <span>
                        অথবা ব্রাউজারের থ্রি-ডট (<strong>⋮</strong>) মেনু থেকে{' '}
                        <strong>&quot;Save and share&quot;</strong> বা <strong>&quot;Apps&quot;</strong> &gt;{' '}
                        <strong>&quot;Install আমরা মোহাম্মদপুরী&quot;</strong> সিলেক্ট করুন।
                      </span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Installation completed confirmation notice */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 font-bold text-sm">
                <Check className="w-5 h-5 text-brand-emerald" />
                <span>অ্যাপ ইনস্টলেশন সফল হয়েছে!</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                আপনার ডিভাইসের হোম স্ক্রিন থেকে <strong>&quot;আমরা মোহাম্মদপুরী&quot;</strong> অ্যাপটি
                খুলুন এবং সম্পূর্ণ ফিচারে প্রবেশ করুন।
              </p>
              <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-brand-emerald dark:text-brand-mint font-bold">
                <span>হোম স্ক্রিন অ্যাপ আইকন দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md text-center py-2 text-[11px] text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} আমরা মোহাম্মদপুরী। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}

