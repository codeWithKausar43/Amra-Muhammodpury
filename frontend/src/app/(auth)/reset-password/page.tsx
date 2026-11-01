import type { Metadata } from 'next';
import * as React from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'পাসওয়ার্ড রিসেট',
  description: 'আপনার নতুন পাসওয়ার্ড নির্ধারণ করুন',
};

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="নতুন পাসওয়ার্ড তৈরি করুন"
        subtitle="আপনার অ্যাকাউন্টের সুরক্ষার জন্য একটি শক্তিশালী পাসওয়ার্ড দিন।"
      />
      <React.Suspense
        fallback={
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          </div>
        }
      >
        <ResetPasswordForm />
      </React.Suspense>
    </AuthCard>
  );
}

