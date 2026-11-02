'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUp } from '@/lib/auth/auth-client';
import { apiClient } from '@/lib/api/client';
import { registerFormSchema, RegisterFormValues } from '../schemas/auth.schema';
import { FloatingInput } from './FloatingInput';
import { PasswordInput } from './PasswordInput';
import { ProfileImageUploader } from './ProfileImageUploader';

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const [successEmail, setSuccessEmail] = React.useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      profileImage: null,
      tempImageToken: null,
    },
  });

  const handleProfileImageUploaded = (url: string | null, tempToken: string | null) => {
    setValue('profileImage', url);
    setValue('tempImageToken', tempToken);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    try {
      // 1. Verify availability of email and phone with backend first
      await apiClient(
        `/auth/check?email=${encodeURIComponent(values.email.trim().toLowerCase())}&phone=${encodeURIComponent(values.phone.trim())}`,
      );

      // 2. Perform actual account creation through Better Auth
      const signUpEmailWithPhone = signUp.email as (data: {
        name: string;
        email: string;
        password: string;
        image?: string;
        phone: string;
        callbackURL: string;
      }) => Promise<{ error?: { message?: string } }>;

      const response = await signUpEmailWithPhone({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        image: values.profileImage || undefined,
        phone: values.phone.trim(),
        callbackURL: '/dashboard',
      });

      if (response?.error) {
        setServerError(response.error.message || 'নিবন্ধন সম্পন্ন করা সম্ভব হয়নি।');
        return;
      }

      // 3. If there was a temporary profile image, claim it for this user
      if (values.tempImageToken) {
        try {
          await apiClient('/uploads/claim', {
            method: 'POST',
            body: JSON.stringify({ tempToken: values.tempImageToken }),
          });
        } catch {
          // If claim fails, image URL is already set on user in Better Auth, safe to continue
        }
      }

      setSuccessEmail(values.email);
      setRegistrationSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'সার্ভারে সমস্যা দেখা দিয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
      setServerError(message);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="text-center py-6 space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            আমরা আপনার ইমেইল{' '}
            <strong className="text-slate-700 dark:text-slate-200">{successEmail}</strong>-এ একটি
            যাচাইকরণ লিংক পাঠিয়েছি।
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
      {serverError && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Clean Profile Image Uploader */}
      <ProfileImageUploader
        onImageUploaded={handleProfileImageUploaded}
        disabled={isSubmitting}
      />

      {/* Full Name with Floating Label */}
      <FloatingInput
        id="name"
        label="আপনার পূর্ণ নাম"
        icon={User}
        error={errors.name?.message}
        disabled={isSubmitting}
        {...register('name')}
      />

      {/* Email Address with Floating Label */}
      <FloatingInput
        id="reg-email"
        type="email"
        autoComplete="email"
        label="আপনার ইমেইল ঠিকানা"
        icon={Mail}
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register('email')}
      />

      {/* Mobile Number with Clean Floating Label */}
      <FloatingInput
        id="phone"
        type="tel"
        autoComplete="tel"
        label="মোবাইল নম্বর"
        icon={Phone}
        error={errors.phone?.message}
        disabled={isSubmitting}
        {...register('phone')}
      />

      {/* Password with Floating Label */}
      <PasswordInput
        id="reg-password"
        label="পাসওয়ার্ড তৈরি করুন"
        autoComplete="new-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register('password')}
      />

      {/* Confirm Password with Floating Label */}
      <PasswordInput
        id="reg-confirm-password"
        label="পাসওয়ার্ড নিশ্চিত করুন"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        disabled={isSubmitting}
        {...register('confirmPassword')}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 rounded-xl sm:rounded-2xl text-sm font-semibold transition-all duration-200 bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-md hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
          </>
        ) : (
          <span>অ্যাকাউন্ট তৈরি করুন</span>
        )}
      </button>

      {/* Link to Login */}
      <div className="text-center pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        ইতিমধ্যে সদস্য?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-emerald dark:text-brand-mint hover:underline transition-all"
        >
          লগইন করুন
        </Link>
      </div>
    </form>
  );
}
