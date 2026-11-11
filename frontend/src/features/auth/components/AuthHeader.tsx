'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader(_props: AuthHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center text-center pt-2 pb-1 mb-2">
      {/* Brand Logo & Title (Clean, Clickable Link to Home) */}
      <Link
        href="/"
        className="flex flex-col items-center gap-2.5 hover:opacity-90 transition-opacity group"
        title="হোমে ফিরে যান"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform border border-emerald-500/20 bg-emerald-50/50 dark:bg-white/5 p-0.5">
          <Image
            src="/logos/logo.png"
            alt="মোহাম্মদপুর কমিউনিটি লোগো"
            width={64}
            height={64}
            className="w-full h-full object-contain rounded-xl"
            priority
          />
        </div>
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-emerald dark:text-brand-mint">
          মোহাম্মদপুর কমিউনিটি
        </span>
      </Link>
    </div>
  );
}

