'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function AuthCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full max-w-[440px] mx-auto p-5 sm:p-8 rounded-3xl sm:rounded-3xl',
        'glass-panel shadow-glass dark:shadow-glass-dark transition-all duration-300',
        'border border-slate-200/80 dark:border-white/10',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
