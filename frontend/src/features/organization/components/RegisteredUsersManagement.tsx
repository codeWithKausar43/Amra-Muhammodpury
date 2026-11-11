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
} from 'lucide-react';
import { useAdminUsersQuery } from '../hooks/useOrganizationQueries';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
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
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<'ALL' | 'GENERAL_USER' | 'MEMBER'>('ALL');
  const [selectedProvider, setSelectedProvider] = React.useState<'ALL' | 'google' | 'credential'>('ALL');
  const [selectedRole, setSelectedRole] = React.useState<'ALL' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'>('ALL');
  const [page, setPage] = React.useState(1);

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
                সুপার এডমিন (SUPER_ADMIN)
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
            {/* Desktop Table View (hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
              <div className="min-w-[640px]">
                {/* Desktop Table Header */}
                <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.5fr)_minmax(100px,0.8fr)_minmax(85px,0.6fr)_minmax(95px,0.6fr)] items-center gap-3 px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                  <div>ব্যবহারকারী</div>
                  <div>যোগাযোগ</div>
                  <div>শ্রেণি</div>
                  <div>মাধ্যম</div>
                  <div className="text-right">তারিখ</div>
                </div>

                {/* Desktop Rows */}
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {users.map((user) => {
                    const isMember = user.isMember;

                    return (
                      <div
                        key={user.id}
                        className="grid grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.5fr)_minmax(100px,0.8fr)_minmax(85px,0.6fr)_minmax(95px,0.6fr)] items-center gap-3 px-3 py-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                      >
                        {/* 1. User Profile & Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 shrink-0">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                fill
                                sizes="36px"
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
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {user.name}
                              </span>
                              {isMember && <VerifiedBadge size="xs" />}
                              {user.role === 'SUPER_ADMIN' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20 shrink-0">
                                  সুপার এডমিন
                                </span>
                              )}
                              {user.role === 'ADMIN' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20 shrink-0">
                                  এডমিন
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              আইডি: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {/* 2. Contact details (Full Email & Phone) */}
                        <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300 space-y-1">
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>মেম্বার</span>
                            </span>
                          ) : user.applicationStatus === 'PENDING' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold shrink-0">
                              আবেদন অপেক্ষমাণ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium shrink-0">
                              সাধারণ ব্যবহারকারী
                            </span>
                          )}
                        </div>

                        {/* 4. Login Method / Provider */}
                        <div className="min-w-0 flex items-center">
                          {user.isGoogle ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[11px] font-semibold">
                              <GoogleBrandIcon className="w-3 h-3 shrink-0" />
                              <span>গুগল</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                              <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>ইমেইল</span>
                            </span>
                          )}
                        </div>

                        {/* 5. Registration Date (Clean single line, no repeated 'ইউজার') */}
                        <div className="min-w-0 text-right">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatBengaliDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile Responsive Cards (visible only on mobile sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {users.map((user) => {
                const isMember = user.isMember;

                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2 shadow-2xs"
                  >
                    {/* Top Row: User Identity (Avatar + Name + Badges) & Status Badge on Right */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10 shrink-0">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                              {user.name?.slice(0, 1) || 'ব'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {user.name}
                            </span>
                            {isMember && <VerifiedBadge size="xs" />}
                            {user.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20 shrink-0">
                                এডমিন
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isMember ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                    </div>

                    {/* Middle Row: Full-width Email Address - NEVER truncated */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono break-all py-1 px-2.5 rounded-lg bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="select-all flex-1 text-[11px]">{user.email}</span>
                      {user.emailVerified && (
                        <span title="ইমেইল ভেরিফাইড" className="inline-flex shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Phone, Provider & Date */}
                    <div className="flex items-center justify-between pt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 min-w-0">
                        {user.isGoogle ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-semibold">
                            <GoogleBrandIcon className="w-3 h-3 shrink-0" />
                            <span>গুগল</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                            <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>ইমেইল</span>
                          </span>
                        )}
                        {user.phone ? (
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {user.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">ফোন নম্বর নেই</span>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        {formatBengaliDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
