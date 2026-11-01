'use client';

import * as React from 'react';
import Link from 'next/link';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader(_props: AuthHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center text-center pt-2 pb-1 mb-2">
      {/* Brand Title (Clean, Clickable Link to Home) */}
      <Link
        href="/"
        className="inline-block hover:opacity-85 transition-opacity"
        title="হোমে ফিরে যান"
      >
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-emerald dark:text-brand-mint">
          আমরা মোহাম্মদপুরী
        </span>
      </Link>
    </div>
  );
}

