import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'অ্যাকাউন্ট তৈরি করুন',
  description: 'আমরা মুহাম্মদপুরী প্ল্যাটফর্মে নতুন অ্যাকাউন্ট খুলুন',
};

export default function RegisterPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="নতুন অ্যাকাউন্ট তৈরি করুন"
        subtitle="মুহাম্মদপুরী কমিউনিটির একজন গর্বিত সদস্য হিসেবে যুক্ত হোন।"
      />
      <RegisterForm />
    </AuthCard>
  );
}
