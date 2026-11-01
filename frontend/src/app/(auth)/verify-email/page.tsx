import type { Metadata } from 'next';
import * as React from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { VerifyEmailView } from '@/features/auth/components/VerifyEmailView';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ইমেইল যাচাইকরণ',
  description: 'আপনার ইমেইল অ্যাকাউন্ট নিশ্চিত করুন',
};

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="ইমেইল যাচাইকরণ"
        subtitle="আপনার পরিচয় ও অ্যাকাউন্টের সুরক্ষা নিশ্চিত করতে যাচাই করুন।"
      />
      <React.Suspense
        fallback={
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          </div>
        }
      >
        <VerifyEmailView />
      </React.Suspense>
    </AuthCard>
  );
}

