'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/auth-client';
import { Loader2 } from 'lucide-react';

export default function MyProfileRedirectPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  React.useEffect(() => {
    if (!isPending) {
      if (session?.user?.id) {
        router.replace(`/profile/${session.user.id}`);
      } else {
        router.replace('/login');
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="py-24 flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
      <p className="text-xs text-slate-400">প্রোফাইলে নিয়ে যাওয়া হচ্ছে...</p>
    </div>
  );
}

