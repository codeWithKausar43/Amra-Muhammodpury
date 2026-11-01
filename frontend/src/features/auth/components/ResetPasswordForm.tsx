'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/lib/auth/auth-client';
import { resetPasswordSchema, ResetPasswordValues } from '../schemas/auth.schema';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const watchedPassword = watch('password');

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setServerError('রিসেট টোকেন পাওয়া যায়নি অথবা লিংকটির মেয়াদ উত্তীর্ণ হয়েছে।');
      return;
    }

    setServerError(null);

    try {
      const response = await resetPassword({
        newPassword: values.password,
        token,
      });

      if (response?.error) {
        setServerError(response.error.message || 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি।');
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'সার্ভারে সংযোগ করা সম্ভব হয়নি।';
      setServerError(message);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-6 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            অবৈধ বা মেয়াদোত্তীর্ণ লিংক
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            পাসওয়ার্ড পরিবর্তনের লিংকটির মেয়াদ শেষ হয়ে গেছে বা টোকেনটি সঠিক নয়। অনুগ্রহ করে নতুন করে
            আবেদন করুন।
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md"
          >
            নতুন লিংক অনুরোধ করুন
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-6 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করা হয়েছে। এখন আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md cursor-pointer"
          >
            লগইন পেজে যান
          </button>
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

      {/* New Password */}
      <div className="space-y-1">
        <PasswordInput
          label="নতুন পাসওয়ার্ড"
          id="new-password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordStrength password={watchedPassword} />
      </div>

      {/* Confirm Password */}
      <PasswordInput
        label="পাসওয়ার্ড নিশ্চিত করুন"
        id="confirm-new-password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
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
            <span>পরিবর্তন করা হচ্ছে...</span>
          </>
        ) : (
          <span>পাসওয়ার্ড পরিবর্তন করুন</span>
        )}
      </button>

      {/* Back to Login */}
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
