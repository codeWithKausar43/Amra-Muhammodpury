'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '@/lib/auth/auth-client';
import { loginFormSchema, LoginFormValues } from '../schemas/auth.schema';
import { PasswordInput } from './PasswordInput';
import { GoogleLoginButton } from './GoogleLoginButton';

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(true);

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
      const response = await signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe,
        callbackURL: '/dashboard',
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
      router.push('/dashboard');
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

      {/* Email Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          ইমেইল ঠিকানা
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="example@domain.com"
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm transition-all outline-none bg-white/80 dark:bg-brand-charcoal-dark/70 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-emerald dark:focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <PasswordInput
        label="পাসওয়ার্ড"
        id="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
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
            <span>লগইন করা হচ্ছে...</span>
          </>
        ) : (
          <span>লগইন করুন</span>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-white/10 w-full" />
        <span className="bg-transparent px-3 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
          অথবা
        </span>
        <div className="border-t border-slate-200 dark:border-white/10 w-full" />
      </div>

      {/* Google Login */}
      <GoogleLoginButton />

      {/* Register Link */}
      <div className="text-center pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        নতুন সদস্য?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-emerald dark:text-brand-mint hover:underline transition-all"
        >
          অ্যাকাউন্ট তৈরি করুন
        </Link>
      </div>
    </form>
  );
}
