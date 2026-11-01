'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/auth/auth-client';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = React.useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('যাচাইকরণ টোকেন পাওয়া যায়নি।');
      return;
    }

    let isMounted = true;

    async function performVerification() {
      try {
        const response = await verifyEmail({
          query: { token: token as string },
        });

        if (!isMounted) return;

        if (response?.error) {
          setStatus('error');
          setErrorMessage(response.error.message || 'ইমেইল যাচাইকরণ ব্যর্থ হয়েছে।');
          return;
        }

        setStatus('success');
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus('error');
        const message = err instanceof Error ? err.message : 'সার্ভারে সংযোগ করা সম্ভব হয়নি।';
        setErrorMessage(message);
      }
    }

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="text-center py-8 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-emerald mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            ইমেইল যাচাই করা হচ্ছে...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ইমেইল সফলভাবে যাচাই হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            আপনার অ্যাকাউন্ট এখন সম্পূর্ণ সক্রিয়। আপনি এখনই আপনার অ্যাকাউন্টে লগইন করতে পারেন।
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md cursor-pointer"
          >
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-6 space-y-4 animate-fadeIn">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-md">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">যাচাইকরণ ব্যর্থ হয়েছে</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          {errorMessage || 'লিংকটির মেয়াদ শেষ হয়ে গেছে বা টোকেনটি সঠিক নয়।'}
        </p>
      </div>
      <div className="pt-2 space-y-2">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লগইন পেজে ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}
