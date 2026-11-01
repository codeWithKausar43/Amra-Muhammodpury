import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'পাসওয়ার্ড ভুলে গেছেন?',
  description: 'পাসওয়ার্ড পরিবর্তন করার জন্য লিংক পান',
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="পাসওয়ার্ড ভুলে গেছেন?"
        subtitle="আপনার অ্যাকাউন্টের ইমেইল ঠিকানা দিন। আমরা পাসওয়ার্ড রিসেট করার নির্দেশনা পাঠাব।"
      />
      <ForgotPasswordForm />
    </AuthCard>
  );
}
