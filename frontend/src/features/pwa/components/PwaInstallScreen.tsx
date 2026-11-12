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
  RotateCcw,
} from 'lucide-react';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';
import { openInExternalChrome } from '@/lib/pwa/pwa-utils';

interface PwaInstallScreenProps {
  targetPath?: string;
  onUnlock?: () => void;
}

export default function PwaInstallScreen({
  targetPath = '/',
  onUnlock,
}: PwaInstallScreenProps) {
  const {
    isInstalled,
    hasStoredRecord,
    clearInstallRecord,
    isPrompting,
    platformInfo,
    promptInstall,
    openInstalledApp,
  } = usePwaInstall();

  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [isOpeningApp, setIsOpeningApp] = React.useState<boolean>(false);
  const [showAndroidGuide, setShowAndroidGuide] = React.useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = React.useState<boolean>(false);

  // Directly generates and downloads the standalone app launcher file ONLY on Desktop PC
  const triggerDesktopDownload = () => {
    // Strictly for Desktop! NEVER download .url on Android/iOS (unsupported file type on mobile)
    // Triple-check: platformInfo state, UA, and touch capabilities
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isActuallyMobile =
      platformInfo.isAndroid ||
      platformInfo.isIos ||
      /Android|iPhone|iPad|iPod/i.test(ua) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 &&
        typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
    if (!platformInfo.isDesktop || isActuallyMobile) return;

    try {
      const appUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://amra-muhammodpury.vercel.app';

      const fileContent = `[InternetShortcut]\r\nURL=${appUrl}/?source=pwa\r\nIconIndex=0\r\nIconFile=${appUrl}/favicon.ico\r\n`;
      const blob = new Blob([fileContent], { type: 'application/octet-stream;charset=utf-8' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'মোহাম্মদপুর কমিউনিটি.url';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (err) {
      console.warn('Download error:', err);
    }
  };

  const handleInstallClick = async () => {
    setIsProcessing(true);
    setShowAndroidGuide(false);
    // Safety: determine mobile status at click time via UA (protects against stale state)
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isMobileAtClickTime =
      platformInfo.isAndroid ||
      platformInfo.isIos ||
      /Android|iPhone|iPad|iPod/i.test(ua);
    try {
      // 1. Try native PWA prompt (Chrome Android & Chromium Desktop)
      const result = await promptInstall();

      if (result === 'accepted') {
        setInstalledSuccess(true);
        try {
          sessionStorage.setItem('amra_pwa_gate_unlocked', 'true');
          localStorage.setItem('amra_pwa_gate_unlocked', 'true');
          window.dispatchEvent(new CustomEvent('pwa-unlock-gate'));
        } catch {
          // ignore
        }
        if (platformInfo.isAndroid || isMobileAtClickTime) {
          setTimeout(() => {
            openInstalledApp(targetPath);
            onUnlock?.();
          }, 1200);
        } else {
          setTimeout(() => {
            onUnlock?.();
          }, 800);
        }
        return;
      }

      if (result === 'dismissed') {
        if (platformInfo.isAndroid || isMobileAtClickTime) {
          setShowAndroidGuide(true);
        }
        return;
      }

      // 2. If native prompt unavailable or not ready:
      if (platformInfo.isAndroid || isMobileAtClickTime) {
        // Mobile Android: Never download .url file! Show clear 1-tap browser install instructions
        setShowAndroidGuide(true);
      } else if (platformInfo.isIos) {
        // iOS instructions are already rendered
      } else {
        // Desktop PC only fallback
        triggerDesktopDownload();
      }
    } catch (err) {
      console.warn('Install error:', err);
      if (platformInfo.isAndroid || isMobileAtClickTime) {
        setShowAndroidGuide(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenApp = () => {
    setIsOpeningApp(true);
    try {
      sessionStorage.setItem('amra_pwa_gate_unlocked', 'true');
      localStorage.setItem('amra_pwa_gate_unlocked', 'true');
      window.dispatchEvent(new CustomEvent('pwa-unlock-gate'));
    } catch {
      // ignore
    }
    onUnlock?.();
    const launched = openInstalledApp(targetPath);
    setTimeout(() => {
      setIsOpeningApp(false);
    }, 1200);
    return launched;
  };

  const handleForceReinstall = () => {
    clearInstallRecord();
    setShowAndroidGuide(false);
    setInstalledSuccess(false);
    handleInstallClick();
  };

  const handleOpenChrome = () => {
    openInExternalChrome(targetPath);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center p-3.5 sm:p-6 bg-slate-950 text-white selection:bg-brand-emerald selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Background ambient lighting effects (matches design tokens) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[75vw] h-[75vw] max-w-[540px] max-h-[540px] rounded-full bg-brand-emerald/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[75vw] h-[75vw] max-w-[540px] max-h-[540px] rounded-full bg-emerald-600/15 blur-[130px]" />
      </div>

      {/* Main Installation Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-4 sm:py-6">
        <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          
          {/* Logo with glowing emerald aura */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-emerald to-emerald-400 opacity-30 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-brand-charcoal p-2 border-2 border-brand-emerald/40 shadow-xl flex items-center justify-center">
              <Image
                src="/logos/app-logo.png"
                alt="মোহাম্মদপুর কমিউনিটি"
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-contain p-2"
                priority
              />
            </div>
          </div>

          {/* Title & Organization Identity */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              মোহাম্মদপুর কমিউনিটি
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              মোহাম্মদপুরবাসীর ঐক্য, নাগরিক উন্নয়ন ও সামাজিক সংহতির ডিজিটাল প্ল্যাটফর্ম।
            </p>
          </div>

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
                আপনি মেসেঞ্জার, ফেসবুক বা হোয়াটসঅ্যাপের অভ্যন্তরীণ ব্রাউজারে আছেন। সঠিক ডাউনলোডের জন্য অনুগ্রহ করে সরাসরি মূল ব্রাউজারে খুলুন:
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
              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full mt-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>অথবা সরাসরি অ্যাপে প্রবেশ করুন</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              SECTION 2: Installation Success State
             ========================================================================= */}
          {installedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 font-bold text-sm text-brand-mint">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>অ্যাপ ইনস্টল সম্পন্ন হয়েছে!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার ডিভাইসের হোম স্ক্রিনে <strong>&quot;মোহাম্মদপুর কমিউনিটি&quot;</strong> অ্যাপটি যুক্ত হয়েছে। সম্পূর্ণ অভিজ্ঞতার জন্য হোম স্ক্রিন থেকে অ্যাপটি খুলুন।
              </p>
              <button
                type="button"
                onClick={handleOpenApp}
                disabled={isOpeningApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
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
              SECTION 3: App Previously Recorded State (With Guaranteed Re-install Option)
             ========================================================================= */}
          {(hasStoredRecord || isInstalled) && !installedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 font-bold text-sm text-brand-mint">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>অ্যাপটি আপনার ডিভাইসে ইনস্টল রয়েছে!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার হোম স্ক্রিন থেকে <strong>&quot;মোহাম্মদপুর কমিউনিটি&quot;</strong> অ্যাপটি খুলুন অথবা নিচের বাটনে চাপুন:
              </p>
              <button
                type="button"
                onClick={handleOpenApp}
                disabled={isOpeningApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
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
              
              {/* Escape hatch for users who never actually got the app installed or whose intent failed */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleForceReinstall}
                  className="w-full text-center text-xs text-emerald-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer py-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>অ্যাপটি ফোনে খুঁজে পাচ্ছেন না? সরাসরি নতুন করে ইনস্টল করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: Primary Install Action (Never downloads invalid files on Mobile)
             ========================================================================= */}
          {!installedSuccess && !hasStoredRecord && !isInstalled && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting || isProcessing}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-brand-emerald via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm sm:text-base shadow-glow hover:shadow-lg transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-80"
              >
                {isPrompting || isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ইনস্টলেশন প্রস্তুত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>অ্যাপটি ইনস্টল করুন</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* =========================================================================
              SECTION 5: Android Installation Helper (One-tap Chrome Install)
             ========================================================================= */}
          {platformInfo.isAndroid && !installedSuccess && (showAndroidGuide || (!hasStoredRecord && !isInstalled)) && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3 mt-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-mint">
                <Smartphone className="w-4 h-4 text-brand-emerald" />
                <span>অ্যান্ড্রয়েডে সহজে ইনস্টল করার নিয়ম:</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-200 font-medium pl-0.5">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ১
                  </span>
                  <span>
                    ব্রাউজারের অ্যাড্রেস বারের ডানে থাকা{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      (+) প্লাস চিহ্ন
                    </span>{' '}
                    অথবা উপরের ডানপাশে ৩টি ডট{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      ⋮ মেনু
                    </span>-তে চাপুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ২
                  </span>
                  <span>
                    মেনু থেকে{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
                      <Download className="w-3 h-3 inline text-brand-mint" /> Install app
                    </span>{' '}
                    বা <strong>&quot;হোম স্ক্রিনে যোগ করুন&quot;</strong> চাপুন।
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-emerald/30 border border-brand-emerald/40 text-brand-mint text-[10px] font-bold shrink-0 mt-0.5">
                    ৩
                  </span>
                  <span>
                    <strong>&quot;Install&quot;</strong> চাপলেই সরাসরি আপনার ফোনে অফিসিয়াল অ্যাপটি ইনস্টল হয়ে যাবে!
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span>সরাসরি অ্যাপে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              SECTION 6: iOS Safari Step Instructions
             ========================================================================= */}
          {platformInfo.isIos && !installedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left space-y-3 mt-2">
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
              </ol>

              <button
                type="button"
                onClick={handleOpenApp}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span>সরাসরি অ্যাপে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md text-center py-2 text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} মোহাম্মদপুর কমিউনিটি। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}
