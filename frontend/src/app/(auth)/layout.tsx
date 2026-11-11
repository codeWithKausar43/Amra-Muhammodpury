'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/auth-client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  React.useEffect(() => {
    // If user is already logged in, send them to dashboard
    if (!isPending && session) {
      router.replace('/dashboard');
    }
  }, [session, isPending, router]);

  // While checking session, show nothing (prevents flash of auth page)
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-brand-charcoal-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-emerald border-t-transparent" />
      </div>
    );
  }

  // If already authenticated, show loading while redirecting to dashboard
  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-brand-charcoal-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-emerald border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center p-3 sm:p-6 overflow-x-hidden transition-colors duration-300">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-brand-emerald/15 dark:bg-brand-emerald/20 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-brand-gold/10 dark:bg-brand-emerald/10 blur-[120px]" />
      </div>

      {/* Main container */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
        {children}
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 mt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} মোহাম্মদপুর কমিউনিটি। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}
