import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'লগইন',
  description: 'আপনার কমিউনিটির সঙ্গে যুক্ত থাকতে লগইন করুন',
};

export default function LoginPage() {
  return (
    <AuthCard>
      <AuthHeader title="আবার ফিরে আসুন" subtitle="আপনার কমিউনিটির সঙ্গে যুক্ত থাকতে লগইন করুন।" />
      <LoginForm />
    </AuthCard>
  );
}
