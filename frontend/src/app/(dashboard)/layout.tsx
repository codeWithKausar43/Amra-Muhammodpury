'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/auth-client';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  React.useEffect(() => {
    // If session check is done and there's no session, redirect to login
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [session, isPending, router]);

  // Show a minimal loading state while the session is being verified
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-brand-charcoal-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-emerald border-t-transparent" />
      </div>
    );
  }

  // Don't render children if not authenticated (redirect is in progress)
  if (!session) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-brand-charcoal-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <main className="flex-1 py-4 sm:py-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
