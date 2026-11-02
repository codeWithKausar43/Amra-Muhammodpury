'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { forgetPassword } from '@/lib/auth/auth-client';
import { forgotPasswordSchema, ForgotPasswordValues } from '../schemas/auth.schema';
import { FloatingInput } from './FloatingInput';

export function ForgotPasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);

    try {
      const response = await forgetPassword({
        email: values.email.trim().toLowerCase(),
        redirectTo: window.location.origin + '/reset-password',
      });

      if (response?.error) {
        setServerError(response.error.message || 'অনুরোধ সম্পন্ন করা যায়নি।');
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'সার্ভারে সংযোগ করা সম্ভব হয়নি। আবার চেষ্টা করুন।';
      setServerError(message);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            নির্দেশনা পাঠানো হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            যদি এই ইমেইল ঠিকানাটি নিবন্ধিত থাকে, তবে পাসওয়ার্ড পরিবর্তন করার লিংক আপনার ইনবক্সে চলে
            গেছে।
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>লগইন পেজে ফিরে যান</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {serverError && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email input with Floating Label */}
      <FloatingInput
        id="forgot-email"
        type="email"
        autoComplete="email"
        label="আপনার ইমেইল ঠিকানা"
        icon={Mail}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register('email')}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all duration-200 bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>পাঠানো হচ্ছে...</span>
          </>
        ) : (
          <span>রিসেট লিংক পাঠান</span>
        )}
      </button>

      {/* Back to Login Link */}
      <div className="text-center pt-2 text-xs sm:text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-emerald dark:text-brand-mint hover:underline transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>লগইন পেজে ফিরে যান</span>
        </Link>
      </div>
    </form>
  );
}
