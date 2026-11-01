'use client';

import * as React from 'react';
import Link from 'next/link';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center text-center space-y-3 pt-1">
      {/* Brand Logo & Name (Centered & Clean) */}
      <Link href="/" className="flex items-center gap-2.5 mb-1 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-brand-emerald to-emerald-800 flex items-center justify-center text-white font-bold text-base shadow-glow">
          <span>ম</span>
        </div>
        <span className="text-base sm:text-lg font-bold tracking-tight text-brand-emerald dark:text-brand-mint">
          আমরা মুহাম্মদপুরী
        </span>
      </Link>

      {/* Headings */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

