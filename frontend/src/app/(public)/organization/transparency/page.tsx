'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MemberFinancialTransparency } from '@/features/organization/components/MemberFinancialTransparency';

export default function TransparencyPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/organization/member"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-emerald transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>মেম্বার ড্যাশবোর্ডে ফিরে যান</span>
        </Link>
      </div>

      <MemberFinancialTransparency />
    </div>
  );
}

