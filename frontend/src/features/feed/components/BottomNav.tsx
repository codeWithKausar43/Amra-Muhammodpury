'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, Plus, Bell, User } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { useFeedModal } from '../context/FeedModalContext';
import { useOrgMembershipStatusQuery } from '@/features/organization/hooks/useOrganizationQueries';

interface BottomNavProps {
  onCreatePostClick?: () => void;
}

export function BottomNav({ onCreatePostClick }: BottomNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCreatePost, openAuthModal } = useFeedModal();

  const isHome = pathname === '/' || pathname === '/feed';
  const isOrganization = pathname.startsWith('/organization');
  const isNotifications = pathname === '/notifications';
  const isProfile = pathname.startsWith('/profile') || pathname.startsWith('/dashboard');

  // Query organization membership status (only enabled if user is logged in)
  const { data: membershipData } = useOrgMembershipStatusQuery(Boolean(session?.user));
  const membership = membershipData?.membership;
  const application = membershipData?.latestApplication;
  const isActiveMember = membership?.status === 'ACTIVE';
  const isOfficer =
    Boolean(
      membership &&
        ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR'].includes(
          membership.orgRole,
        ),
    ) || (session?.user as any)?.role === 'ADMIN';

  // Smart Role-based destination:
  // - If not logged in or not joined: take to /organization/apply
  // - If joined as Officer / Admin: take to /organization/admin
  // - If joined as Active Member: take to /organization/member
  // - If approved awaiting payment: take to /organization/payment
  const orgHref = React.useMemo(() => {
    if (!session?.user) {
      return '/organization/apply';
    }
    if (isOfficer) {
      return '/organization/admin';
    }
    if (isActiveMember) {
      return '/organization/member';
    }
    if (application?.status === 'APPROVED' && membership?.status === 'APPROVED_PAYMENT_PENDING') {
      return '/organization/payment';
    }
    // Not a member yet: take to apply page to join
    return '/organization/apply';
  }, [session?.user, isOfficer, isActiveMember, application?.status, membership?.status]);

  const handleCenterPlusClick = () => {
    if (onCreatePostClick) {
      onCreatePostClick();
      return;
    }
    if (!session?.user) {
      openAuthModal();
    } else {
      openCreatePost();
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pt-1 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative bg-white/95 dark:bg-brand-charcoal-dark/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl px-4 py-2 flex items-center justify-between transition-colors">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isHome
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] leading-none">হোম</span>
          </Link>

          {/* Organization (Role-based smart destination) */}
          <Link
            href={orgHref}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isOrganization
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="আমরা মোহাম্মদপুরী সংগঠন"
          >
            <Landmark className="w-5 h-5" />
            <span className="text-[11px] leading-none">সংগঠন</span>
          </Link>

          {/* Elevated Center Floating Action Button (+) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={handleCenterPlusClick}
              aria-label="নতুন পোস্ট তৈরি করুন"
              title="নতুন পোস্ট তৈরি করুন"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-brand-emerald/40 ring-4 ring-white dark:ring-brand-charcoal-dark active:scale-90 transition-transform cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Notifications */}
          <Link
            href="/notifications"
            className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isNotifications
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-brand-charcoal" />
            </div>
            <span className="text-[11px] leading-none">বিজ্ঞপ্তি</span>
          </Link>

          {/* Profile or Login */}
          <Link
            href={session?.user ? `/profile/${session.user.id}` : '/login'}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
              isProfile
                ? 'text-brand-emerald dark:text-brand-mint font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {session?.user ? 'প্রোফাইল' : 'লগইন'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
