'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  X,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Loader2,
  Crown,
  Ban,
  Trash2,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { useAdminUsersQuery, useOrgMutations, useOrgMembershipStatusQuery } from '../hooks/useOrganizationQueries';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/feedback/Toast';
import type { AdminUserItem, AdminUsersQueryParams } from '../types';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function formatBengaliDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const months = [
      'জানু',
      'ফেব্রু',
      'মার্চ',
      'এপ্রিল',
      'মে',
      'জুন',
      'জুলাই',
      'আগস্ট',
      'সেপ্টে',
      'অক্টো',
      'নভে',
      'ডিসে',
    ];
    const day = toBengaliNumber(d.getDate());
    const month = months[d.getMonth()];
    const year = toBengaliNumber(d.getFullYear());
    return `${day} ${month}, ${year}`;
  } catch {
    return '—';
  }
}

// Google SVG Icon for consistent branding
function GoogleBrandIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function RegisteredUsersManagement() {
  const { data: session } = useSession();
  const { data: membershipData } = useOrgMembershipStatusQuery();
  const membership = membershipData?.membership;
  const isSystemAdmin =
    (session?.user as any)?.role === 'SUPER_ADMIN' ||
    session?.user?.email === 'itskausarprodhan@gmail.com' ||
    session?.user?.email === 'itskausarprod@gmail.com';
  const isPresident =
    (session?.user as any)?.role === 'ADMIN' ||
    membership?.orgRole === 'PRESIDENT' ||
    Boolean(membership?.designation?.title && /সভাপতি/i.test(membership.designation.title));
  const canPerformActions = isSystemAdmin || isPresident;
  const mutations = useOrgMutations();

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<'ALL' | 'GENERAL_USER' | 'MEMBER'>('ALL');
  const [selectedProvider, setSelectedProvider] = React.useState<'ALL' | 'google' | 'credential'>('ALL');
  const [selectedRole, setSelectedRole] = React.useState<'ALL' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'>('ALL');
  const [page, setPage] = React.useState(1);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Professional Dialog State (Eliminates browser alert/confirm/prompt popups)
  const [activeDialog, setActiveDialog] = React.useState<{
    type: 'SUSPEND' | 'DELETE';
    user: AdminUserItem;
  } | null>(null);
  const [suspendReason, setSuspendReason] = React.useState('প্রশাসনিক সিদ্ধান্তের প্রেক্ষিতে সাময়িকভাবে স্থগিত');
  const [isDialogSubmitting, setIsDialogSubmitting] = React.useState(false);

  const handleConfirmAction = async () => {
    if (!activeDialog) return;
    const { type, user } = activeDialog;
    setIsDialogSubmitting(true);
    setActionLoadingId(user.id);

    try {
      if (type === 'SUSPEND') {
        const willSuspend = !user.isSuspended;
        await mutations.suspendUser.mutateAsync({
          userId: user.id,
          isSuspended: willSuspend,
          reason: willSuspend ? suspendReason.trim() || undefined : undefined,
        });
        toast.success(
          willSuspend ? 'অ্যাকাউন্ট সফলভাবে স্থগিত করা হয়েছে।' : 'স্থগিতাদেশ প্রত্যাহার করা হয়েছে।'
        );
      } else if (type === 'DELETE') {
        await mutations.deleteUser.mutateAsync(user.id);
        toast.success(`${user.name}-এর অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।`);
      }
      setActiveDialog(null);
    } catch (err: any) {
      toast.error(err.message || 'অপারেশন সম্পন্ন করা সম্ভব হয়নি');
    } finally {
      setIsDialogSubmitting(false);
      setActionLoadingId(null);
    }
  };

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams: AdminUsersQueryParams = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: selectedType,
      provider: selectedProvider,
      role: selectedRole,
      page,
      limit: 15,
    }),
    [debouncedSearch, selectedType, selectedProvider, selectedRole, page]
  );

  const { data, isLoading, isError } = useAdminUsersQuery(queryParams);

  const users: AdminUserItem[] = data?.users || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. Metrics KPI Row (Distinct General Users vs Members)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Users */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
            <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">মোট ব্যবহারকারী</span>
          </div>
          <div className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {toBengaliNumber(summary?.totalUsers ?? users.length)} জন
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ওয়েবসাইটে নিবন্ধিত</div>
        </div>

        {/* General Users (Sadaron User) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">সাধারণ ব্যবহারকারী</span>
          </div>
          <div className="text-base sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {toBengaliNumber(summary?.generalUsers ?? 0)} জন
          </div>
          <div className="text-[10px] text-indigo-500/80 mt-0.5">সদস্যপদ বহির্ভূত ইউজার</div>
        </div>

        {/* Organization Members */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">মেম্বার</span>
          </div>
          <div className="text-base sm:text-2xl font-bold text-brand-emerald dark:text-emerald-400 mt-1">
            {toBengaliNumber(summary?.members ?? 0)} জন
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">অফিসিয়াল সদস্য ব্যাজযুক্ত</div>
        </div>

        {/* Google OAuth Logins */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
            <GoogleBrandIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">গুগল সাইন-ইন</span>
          </div>
          <div className="text-base sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {toBengaliNumber(summary?.googleUsers ?? 0)} জন
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">গুগল অ্যাকাউন্ট দিয়ে লগইন</div>
        </div>
      </div>

      {/* =========================================================================
          2. Search & Filter Toolbar
         ========================================================================= */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-brand-emerald transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Type Filter (General User vs Member) */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setPage(1);
              }}
              aria-label="ব্যবহারকারীর শ্রেণি ফিল্টার"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সকল শ্রেণি (সাধারণ ও মেম্বার)
              </option>
              <option value="GENERAL_USER" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সাধারণ ব্যবহারকারী
              </option>
              <option value="MEMBER" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                মেম্বার
              </option>
            </select>
          </div>

          {/* Login Provider Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value as any);
                setPage(1);
              }}
              aria-label="লগইন মাধ্যম ফিল্টার"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সকল মাধ্যম
              </option>
              <option value="google" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                গুগল
              </option>
              <option value="credential" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                ইমেইল
              </option>
            </select>
          </div>

          {/* System Role Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as any);
                setPage(1);
              }}
              aria-label="ইউজার রোল ফিল্টার"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer transition-colors"
            >
              <option value="ALL" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সকল রোল
              </option>
              <option value="USER" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সাধারণ ইউজার
              </option>
              <option value="ADMIN" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                প্রশাসক (ADMIN)
              </option>
              <option value="SUPER_ADMIN" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                সিস্টেম অ্যাডমিন (SUPER_ADMIN)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. Registered Users Directory (Flat, Clean, Strict CSS Grid Alignment)
         ========================================================================= */}
      <div className="space-y-3 pt-1">
        {/* Header bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ব্যবহারকারী তালিকা
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
              {toBengaliNumber(pagination?.total ?? users.length)} জন
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            সাধারণ ইউজার ও সদস্য সম্পূর্ণ আলাদাভাবে চিহ্নিত
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-brand-emerald" />
            <p className="text-xs">ব্যবহারকারী তথ্য লোড হচ্ছে...</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-red-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
            <p className="text-xs font-bold">ব্যবহারকারী তালিকা লোড করা সম্ভব হয়নি</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
            {(debouncedSearch || selectedType !== 'ALL' || selectedProvider !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedType('ALL');
                  setSelectedProvider('ALL');
                }}
                className="text-xs text-brand-emerald font-bold hover:underline cursor-pointer"
              >
                সকল ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unified Horizontal Scrolling Table View (Responsive across all screen sizes) */}
            <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
              <div className="min-w-[660px]">
                {/* Table Header */}
                <div
                  className={`grid ${canPerformActions
                      ? 'grid-cols-[minmax(180px,1.2fr)_minmax(210px,1.4fr)_minmax(95px,0.7fr)_minmax(75px,0.5fr)_minmax(85px,0.5fr)_minmax(80px,0.5fr)]'
                      : 'grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.5fr)_minmax(100px,0.8fr)_minmax(85px,0.6fr)_minmax(95px,0.6fr)]'
                    } items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/5`}
                >
                  <div>ব্যবহারকারী</div>
                  <div>যোগাযোগ</div>
                  <div>শ্রেণি</div>
                  <div>মাধ্যম</div>
                  <div className={canPerformActions ? '' : 'text-right'}>তারিখ</div>
                  {canPerformActions && <div className="text-right">অ্যাকশন</div>}
                </div>

                {/* Compact Rows (একটার নিচে একটা কম জায়গায় স্লিম লেআউট) */}
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.map((user) => {
                    const isMember = user.isMember;
                    const isTargetSuperAdmin =
                      user.role === 'SUPER_ADMIN' || user.email === 'itskausarprodhan@gmail.com';
                    const isTargetPresident =
                      user.membership?.orgRole === 'PRESIDENT' ||
                      (user.membership?.designation && /সভাপতি/i.test(user.membership.designation));
                    const isSelf =
                      session?.user?.id === user.id || session?.user?.email === user.email;

                    return (
                      <div
                        key={user.id}
                        className={`grid ${canPerformActions
                            ? 'grid-cols-[minmax(180px,1.2fr)_minmax(210px,1.4fr)_minmax(95px,0.7fr)_minmax(75px,0.5fr)_minmax(85px,0.5fr)_minmax(80px,0.5fr)]'
                            : 'grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.5fr)_minmax(100px,0.8fr)_minmax(85px,0.6fr)_minmax(95px,0.6fr)]'
                          } items-center gap-2.5 px-3 py-2 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors ${user.isSuspended ? 'opacity-60 bg-rose-50/30 dark:bg-rose-950/10' : ''
                          }`}
                      >
                        {/* 1. User Profile & Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 shrink-0">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                {user.name?.slice(0, 1) || 'ব'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {user.name}
                              </span>
                              {isMember && <VerifiedBadge size="xs" />}
                              {isTargetSuperAdmin ? (
                                <span className="px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20 shrink-0">
                                  সিস্টেম এডমিন
                                </span>
                              ) : isPresident ? (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 shrink-0 inline-flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  সভাপতি
                                </span>
                              ) : user.role === 'ADMIN' ? (
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20 shrink-0">
                                  এডমিন
                                </span>
                              ) : null}
                              {user.isSuspended && (
                                <span className="px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20 shrink-0 inline-flex items-center gap-0.5">
                                  <Ban className="w-2.5 h-2.5" />
                                  স্থগিত
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              আইডি: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {/* 2. Contact details (Full Email & Phone) */}
                        <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px] select-all break-all">{user.email}</span>
                            {user.emailVerified && (
                              <span title="ইমেইল ভেরিফাইড" className="inline-flex shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px]">
                              {user.phone || 'ফোন নম্বর নেই'}
                            </span>
                          </div>
                        </div>

                        {/* 3. User Classification: General User vs Member */}
                        <div className="min-w-0 flex items-center">
                          {isMember ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold shrink-0">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>মেম্বার</span>
                            </span>
                          ) : user.applicationStatus === 'PENDING' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold shrink-0">
                              আবেদন অপেক্ষমাণ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-medium shrink-0">
                              সাধারণ ব্যবহারকারী
                            </span>
                          )}
                        </div>

                        {/* 4. Login Method / Provider */}
                        <div className="min-w-0 flex items-center">
                          {user.isGoogle ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-semibold">
                              <GoogleBrandIcon className="w-3 h-3 shrink-0" />
                              <span>গুগল</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                              <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>ইমেইল</span>
                            </span>
                          )}
                        </div>

                        {/* 5. Registration Date */}
                        <div className={`min-w-0 ${canPerformActions ? '' : 'text-right'}`}>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatBengaliDate(user.createdAt)}
                          </span>
                        </div>

                        {/* 6. Officer Actions: Suspend (President & System Admin) | Delete (System Admin ONLY) */}
                        {canPerformActions && (
                          <div className="flex items-center justify-end gap-1">
                            {isTargetSuperAdmin || isSelf || (isPresident && !isSystemAdmin && isTargetPresident) ? (
                              <span className="text-[10px] text-slate-400 italic">সুরক্ষিত</span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === user.id}
                                  onClick={() => {
                                    setSuspendReason('প্রশাসনিক সিদ্ধান্তের প্রেক্ষিতে সাময়িকভাবে স্থগিত');
                                    setActiveDialog({ type: 'SUSPEND', user });
                                  }}
                                  title={user.isSuspended ? 'স্থগিতাদেশ প্রত্যাহার করুন' : 'অ্যাকাউন্ট স্থগিত করুন'}
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${user.isSuspended
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                    }`}
                                >
                                  {actionLoadingId === user.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                {isSystemAdmin && (
                                  <button
                                    type="button"
                                    disabled={actionLoadingId === user.id}
                                    onClick={() => setActiveDialog({ type: 'DELETE', user })}
                                    title="অ্যাকাউন্ট মুছে ফেলুন"
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    {actionLoadingId === user.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs px-1">
            <span className="text-slate-500 dark:text-slate-400">
              পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
              >
                পূর্ববর্তী
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Professional Confirmation Modal (No native browser alerts/confirm) */}
      {activeDialog && (
        <ConfirmDialog
          isOpen={Boolean(activeDialog)}
          onClose={() => !isDialogSubmitting && setActiveDialog(null)}
          onConfirm={handleConfirmAction}
          isLoading={isDialogSubmitting}
          title={
            activeDialog.type === 'DELETE'
              ? 'অ্যাকাউন্ট মুছে ফেলা'
              : activeDialog.user.isSuspended
                ? 'স্থগিতাদেশ প্রত্যাহার'
                : 'অ্যাকাউন্ট স্থগিতকরণ'
          }
          variant={activeDialog.type === 'DELETE' ? 'danger' : 'warning'}
          confirmText={
            activeDialog.type === 'DELETE'
              ? 'স্থায়ীভাবে মুছুন'
              : activeDialog.user.isSuspended
                ? 'সক্রিয় করুন'
                : 'স্থগিত করুন'
          }
          description={
            activeDialog.type === 'DELETE' ? (
              <div className="space-y-1.5">
                <p>
                  আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 dark:text-white">{activeDialog.user.name}</strong>-এর অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে চান?
                </p>
                <p className="text-xs text-rose-500 font-semibold">
                  ⚠️ সতর্কতা: এটি ডাটাবেজ থেকে ব্যবহারকারীর সমস্ত রেকর্ড স্থায়ীভাবে মুছে ফেলবে এবং এটি আর ফিরিয়ে আনা সম্ভব নয়!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p>
                  আপনি কি নিশ্চিতভাবে <strong className="text-slate-900 dark:text-white">{activeDialog.user.name}</strong>-এর অ্যাকাউন্ট{' '}
                  {activeDialog.user.isSuspended ? 'পুনরায় সক্রিয়' : 'সাময়িকভাবে স্থগিত (Suspend)'} করতে চান?
                </p>
                {!activeDialog.user.isSuspended && (
                  <p className="text-xs text-amber-500">
                    স্থগিত থাকাকালীন ব্যবহারকারী প্ল্যাটফর্মে প্রবেশ করতে বা কোনো পোস্ট করতে পারবেন না।
                  </p>
                )}
              </div>
            )
          }
          inputPrompt={
            activeDialog.type === 'SUSPEND' && !activeDialog.user.isSuspended
              ? {
                label: 'স্থগিতের কারণ (ঐচ্ছিক):',
                placeholder: 'প্রশাসনিক সিদ্ধান্তের প্রেক্ষিতে সাময়িকভাবে স্থগিত',
                value: suspendReason,
                onChange: setSuspendReason,
              }
              : undefined
          }
        />
      )}
    </div>
  );
}
