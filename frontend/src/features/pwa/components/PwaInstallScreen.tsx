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
  Sparkles,
  ShieldCheck,
  Laptop,
} from 'lucide-react';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';
import { openInExternalChrome } from '@/lib/pwa/pwa-utils';

interface PwaInstallScreenProps {
  targetPath?: string;
}

export default function PwaInstallScreen({ targetPath = '/' }: PwaInstallScreenProps) {
  const {
    isInstalled,
    canPrompt,
    isPrompting,
    platformInfo,
    promptInstall,
    openInstalledApp,
  } = usePwaInstall();

  const [hasPromptFailed, setHasPromptFailed] = React.useState<boolean>(false);
  const [isOpeningApp, setIsOpeningApp] = React.useState<boolean>(false);

  const handleInstallClick = async () => {
    setHasPromptFailed(false);
    const result = await promptInstall();

    if (result === 'accepted') {
      // Prompt accepted by user - automatically attempt launch on Android after brief delay
      if (platformInfo.isAndroid) {
        setTimeout(() => {
          openInstalledApp(targetPath);
        }, 800);
      }
      return;
    }

    if (result === 'unavailable' || result === 'dismissed') {
      setHasPromptFailed(true);
    }
  };

  const handleOpenApp = () => {
    setIsOpeningApp(true);
    const launched = openInstalledApp(targetPath);
    setTimeout(() => {
      setIsOpeningApp(false);
    }, 1500);
    return launched;
  };

  const handleOpenChrome = () => {
    openInExternalChrome(targetPath);
  };

  const hasSpecificDestination = Boolean(
    targetPath && targetPath !== '/' && !targetPath.startsWith('/?source=pwa')
  );

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center p-3.5 sm:p-6 bg-slate-950 text-white selection:bg-brand-emerald selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Background ambient lighting effects (matches Amra Mohammodpury design tokens) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[75vw] h-[75vw] max-w-[540px] max-h-[540px] rounded-full bg-brand-emerald/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[75vw] h-[75vw] max-w-[540px] max-h-[540px] rounded-full bg-emerald-600/15 blur-[130px]" />
      </div>

      {/* Main Installation Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-4 sm:py-6">
        <div className="rounded-3xl p-5 sm:p-8 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
          
          {/* Logo with glowing emerald aura */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-emerald to-emerald-400 opacity-30 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-brand-charcoal p-2 border-2 border-brand-emerald/40 shadow-xl flex items-center justify-center">
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

          {/* Title & Organization Identity */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/15 border border-brand-emerald/30 text-brand-mint text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-brand-gold" />
              <span>অফিসিয়াল অ্যাপ ইনস্টল করুন</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              আমরা মোহাম্মদপুরী
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              মোহাম্মদপুরবাসীর ঐক্য, নাগরিক উন্নয়ন ও সামাজিক সংহতির ডিজিটাল প্ল্যাটফর্ম।
            </p>
          </div>

          {/* Deep link destination indicator badge */}
          {hasSpecificDestination && (
            <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span className="truncate">ইনস্টলের পর কাঙ্ক্ষিত লিংকে সরাসরি প্রবেশ করানো হবে</span>
            </div>
          )}

          {/* =========================================================================
              SECTION 1: In-App Browser Warning (Messenger, Facebook, WhatsApp, Instagram)
             ========================================================================= */}
          {platformInfo.isInAppBrowser && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left text-xs text-amber-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                <span>বাহ্যিক ব্রাউজারে খুলুন</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                আপনি মেসেঞ্জার, ফেসবুক বা হোয়াটসঅ্যাপের অভ্যন্তরীণ ব্রাউজারে আছেন। সঠিক ইনস্টলেশনের জন্য অনুগ্রহ করে সরাসরি মূল ব্রাউজারে খুলুন:
              </p>
              {platformInfo.isAndroid ? (
                <button
                  type="button"
                  onClick={handleOpenChrome}
                  className="w-full mt-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Chrome-এ খুলুন</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-black/30 border border-amber-500/20 text-[11px] space-y-1">
                  <p>
                    ১. স্ক্রিনের উপরের বা নিচের <strong>থ্রি-ডট (•••)</strong> বা শেয়ার আইকনে চাপুন।
                  </p>
                  <p>
                    ২. <strong>&quot;Open in Safari&quot;</strong> বা <strong>&quot;ব্রাউজারে খুলুন&quot;</strong> সিলেক্ট করুন।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 2: App Already Installed on Device State
             ========================================================================= */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 font-bold text-sm text-brand-mint">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>অ্যাপটি আপনার ডিভাইসে ইনস্টল রয়েছে!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                সম্পূর্ণ অভিজ্ঞতার জন্য আপনার হোম স্ক্রিন থেকে <strong>&quot;আমরা মোহাম্মদপুরী&quot;</strong> অ্যাপটি খুলুন অথবা নিচের বাটনে চাপুন:
              </p>
              <button
                type="button"
                onClick={handleOpenApp}
                disabled={isOpeningApp}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
              >
                {isOpeningApp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অ্যাপ খোলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>অ্যাপটি ওপেন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* =========================================================================
              SECTION 3: iOS Safari Installation Instructions (No native prompt API)
             ========================================================================= */}
          {platformInfo.isIos && !isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-mint">
                <Smartphone className="w-4 h-4 text-brand-emerald" />
                <span>আইফোন / আইপ্যাডে ইনস্টল করার নিয়ম:</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-200 font-medium pl-0.5">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ১
                  </span>
                  <span>
                    সাফারি ব্রাউজারের নিচে থাকা{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      <Share2 className="w-3 h-3 inline text-brand-mint" /> শেয়ার (Share)
                    </span>{' '}
                    বাটনে চাপুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ২
                  </span>
                  <span>
                    তালিকা থেকে স্ক্রোল করে{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      <PlusSquare className="w-3 h-3 inline text-brand-mint" /> Add to Home Screen
                    </span>{' '}
                    সিলেক্ট করুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ৩
                  </span>
                  <span>
                    উপরের ডানপাশে{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      <Check className="w-3 h-3 inline text-brand-mint" /> Add
                    </span>{' '}
                    ট্যাপ করলেই ইনস্টল সম্পন্ন হবে।
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-[11px] text-brand-mint/90 pt-1 border-t border-white/5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-brand-gold mt-0.5" />
                  <span>
                    ইনস্টল শেষে আপনার হোম স্ক্রিন থেকে <strong>&quot;আমরা মোহাম্মদপুরী&quot;</strong> অ্যাপ আইকনে ট্যাপ করে প্রবেশ করুন।
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: Android & Chromium Installation Action
             ========================================================================= */}
          {!platformInfo.isIos && !isInstalled && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-emerald via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm sm:text-base shadow-glow hover:shadow-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-80"
              >
                {isPrompting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ইনস্টলেশন উইন্ডো খোলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>অ্যাপটি ইনস্টল করুন</span>
                  </>
                )}
              </button>

              {/* Helpful fallback instructions if prompt is unavailable or was dismissed */}
              {(hasPromptFailed || !canPrompt) && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-brand-mint flex items-center gap-1.5">
                    {platformInfo.isDesktop ? (
                      <Laptop className="w-4 h-4" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    <span>সহজে ইনস্টল করার উপায়:</span>
                  </div>
                  {platformInfo.isDesktop ? (
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা <strong>ইনস্টল আইকনে</strong> (কম্পিউটার/ডাউনলোড চিহ্ন) ক্লিক করুন অথবা মেনু (⋮) থেকে <strong>&quot;Install আমরা মোহাম্মদপুরী&quot;</strong> নির্বাচন করুন।
                    </p>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      আপনার ব্রাউজারের উপরের ডানপাশে থাকা ৩টি ডট (⋮) মেনুতে চাপুন এবং <strong>&quot;Install app&quot;</strong> বা <strong>&quot;Add to Home screen&quot;</strong> সিলেক্ট করুন।
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Privacy & Security Footnote */}
          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
            <span>কোনো প্লে-স্টোর ছাড়াই সরাসরি ও নিরাপদে ডিভাইসে সংযুক্ত হবে</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md text-center py-2 text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} আমরা মোহাম্মদপুরী। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}
