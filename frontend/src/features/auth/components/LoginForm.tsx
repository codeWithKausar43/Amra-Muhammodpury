'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '@/lib/auth/auth-client';
import { loginFormSchema, LoginFormValues } from '../schemas/auth.schema';
import { FloatingInput } from './FloatingInput';
import { PasswordInput } from './PasswordInput';
import { GoogleLoginButton } from './GoogleLoginButton';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(true);

  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'account_not_linked') {
        setServerError(
          'এই ইমেইল দিয়ে ইতোমধ্যে পাসওয়ার্ডভিত্তিক অ্যাকাউন্ট খোলা হয়েছে। লিংক করতে প্রথমে পাসওয়ার্ড দিয়ে লগইন করুন।'
        );
      } else if (error === 'access_denied') {
        setServerError('Google সাইন-ইন বাতিল করা হয়েছে।');
      } else if (error === 'oauth_provider_not_found') {
        setServerError('Google লগইন সাময়িকভাবে অনুপলব্ধ।');
      } else {
        setServerError(`লগইন সম্পন্ন করা যায়নি (${error})। অনুগ্রহ করে আবার চেষ্টা করুন।`);
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const callbackParam = searchParams.get('callbackUrl') || '/dashboard';
      const response = await signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe,
        callbackURL: callbackParam,
      });

      if (response?.error) {
        if (
          response.error.message?.includes('Invalid') ||
          response.error.message?.includes('password')
        ) {
          setServerError('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় যাচাই করুন।');
        } else if (response.error.message?.includes('verify')) {
          setServerError('অনুগ্রহ করে প্রথমে আপনার ইমেইল যাচাই করুন।');
        } else {
          setServerError(response.error.message || 'লগইন ব্যর্থ হয়েছে।');
        }
        return;
      }

      // Successful login
      router.push(callbackParam);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'সার্ভারে সংযোগ করা যায়নি। আবার চেষ্টা করুন।';
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      {serverError && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email Field with Floating Label */}
      <FloatingInput
        id="email"
        type="email"
        autoComplete="email"
        label="ইমেইল ঠিকানা"
        icon={Mail}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register('email')}
      />

      {/* Password Field with Floating Label */}
      <PasswordInput
        label="পাসওয়ার্ড"
        id="password"
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />

      {/* Remember Me & Forgot Password Row */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded-md border-slate-300 dark:border-white/20 text-brand-emerald focus:ring-brand-emerald/20 cursor-pointer"
          />
          <span>মনে রাখুন</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-brand-emerald dark:text-brand-mint font-medium hover:underline transition-all"
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </Link>
      </div>

      {/* Primary Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all duration-200 bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>লগইন হচ্ছে...</span>
          </>
        ) : (
          <span>লগইন করুন</span>
        )}
      </button>

      {/* Social Google Login Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-brand-charcoal px-3 text-slate-400 font-medium">
            অথবা
          </span>
        </div>
      </div>

      {/* Google OAuth Login */}
      <GoogleLoginButton />

      {/* Link to Registration */}
      <div className="text-center pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        কোনো অ্যাকাউন্ট নেই?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-emerald dark:text-brand-mint hover:underline transition-all"
        >
          নতুন অ্যাকাউন্ট তৈরি করুন
        </Link>
      </div>
    </form>
  );
}
