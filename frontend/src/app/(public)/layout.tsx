'use client';

import * as React from 'react';
import { Navbar, BottomNav } from '@/features/feed/components';
import { FeedModalProvider } from '@/features/feed/context/FeedModalContext';
import { AdminNavProvider } from '@/features/organization/context/AdminNavContext';
import { CentralPopupManager } from '@/features/organization/components/CentralPopupManager';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeedModalProvider>
      <AdminNavProvider>
        <div className="flex min-h-screen flex-col bg-slate-50/70 dark:bg-brand-charcoal text-slate-900 dark:text-slate-100 transition-colors">
          <Navbar />
          <main className="flex-1 pb-20 md:pb-10">{children}</main>
          <BottomNav />
          <CentralPopupManager />
        </div>
      </AdminNavProvider>
    </FeedModalProvider>
  );
}
