'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth/auth-client';
import {
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Plus,
  FileText,
  Vote,
  Award,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import {
  useOrgAdminStatsQuery,
  useOrgApplicationsQuery,
  useOrgFundsQuery,
  useOrgCommitteesQuery,
  useOrgElectionsQuery,
  useOrgNoticesQuery,
  useOrgMembershipStatusQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { FinancialAnalyticsChart } from '@/features/organization/components/FinancialAnalyticsChart';
import { useAdminNav } from '@/features/organization/context/AdminNavContext';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export default function OrganizationAdminPage() {
  const { setBadgeCounts } = useAdminNav();
  const { data: session } = useSession();
  const userName = session?.user?.name;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'শুভ সকাল';
    if (hour >= 12 && hour < 17) return 'শুভ দুপুর';
    if (hour >= 17 && hour < 20) return 'শুভ সন্ধ্যা';
    return 'স্বাগতম';
  };

  // Queries
  const { data: stats } = useOrgAdminStatsQuery();
  const { data: applications = [] } = useOrgApplicationsQuery('PENDING');
  const { data: funds = [] } = useOrgFundsQuery();
  const { data: committees = [] } = useOrgCommitteesQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const { data: notices = [] } = useOrgNoticesQuery();
  const { data: membershipStatus } = useOrgMembershipStatusQuery();
  const mutations = useOrgMutations();

  // Role translation mapping
  const ORG_ROLE_MAP: Record<string, string> = {
    PRESIDENT: 'সভাপতি',
    VICE_PRESIDENT: 'সহ-সভাপতি',
    GENERAL_SECRETARY: 'সাধারণ সম্পাদক',
    TREASURER: 'কোষাধ্যক্ষ',
    MODERATOR: 'মডারেটর',
    MEMBER: 'সদস্য',
    EXECUTIVE_MEMBER: 'কার্যনির্বাহী সদস্য',
    ADVISOR: 'উপদেষ্টা',
    ADMIN: 'প্রধান প্রশাসক',
  };

  // Determine user's official position in the organization
  const userPosition = React.useMemo(() => {
    // 1. Check committee designation
    if (session?.user && committees.length > 0) {
      const uId = session.user.id;
      const uEmail = session.user.email;
      for (const com of committees) {
        const member = com.members?.find(
          (m: any) =>
            (uId && (m.userId === uId || m.user?.id === uId)) ||
            (uEmail && m.user?.email === uEmail)
        );
        if (member) {
          const desigTitle =
            member.customTitle ||
            (member.designation as any)?.name ||
            member.designation?.title;
          if (desigTitle) return desigTitle;
        }
      }
    }

    // 2. Check membership designation or orgRole
    const membership = membershipStatus?.membership;
    const desig = membership?.designation;
    if (desig?.title || (desig as any)?.name) {
      return desig?.title || (desig as any)?.name;
    }
    if ((membershipStatus as any)?.committeeMember?.designation?.name) {
      return (membershipStatus as any).committeeMember.designation.name;
    }
    if ((membershipStatus as any)?.committeeMember?.customTitle) {
      return (membershipStatus as any).committeeMember.customTitle;
    }
    if (membership?.orgRole && ORG_ROLE_MAP[membership.orgRole]) {
      return ORG_ROLE_MAP[membership.orgRole];
    }

    // 3. Check system user role
    const systemRole = (session?.user as any)?.role;
    if (systemRole === 'ADMIN') {
      return 'প্রধান প্রশাসক';
    }

    return null;
  }, [committees, membershipStatus, session?.user]);

  React.useEffect(() => {
    setBadgeCounts({
      fundsCount: funds.length,
      noticesCount: notices.length,
    });
  }, [funds.length, notices.length, setBadgeCounts]);

  // Transaction Modal State (for quick ledger entry from hero button)
  const [trxModalOpen, setTrxModalOpen] = React.useState(false);
  const [trxFundId, setTrxFundId] = React.useState('');
  const [trxType, setTrxType] = React.useState<'INCOME' | 'EXPENSE' | 'CONTRIBUTION'>('INCOME');
  const [trxAmount, setTrxAmount] = React.useState<number>(0);
  const [trxTitle, setTrxTitle] = React.useState('');
  const [trxDesc, setTrxDesc] = React.useState('');
  const [isSubmittingTrx, setIsSubmittingTrx] = React.useState(false);

  React.useEffect(() => {
    if (funds.length > 0 && !trxFundId) {
      const firstFund = funds[0];
      if (firstFund) setTrxFundId(firstFund.id);
    }
  }, [funds, trxFundId]);

  // Financial figures
  const totalBalance =
    stats?.funds?.totalBalance ??
    funds.reduce((acc, f) => acc + (f.balance ?? f.currentBalance ?? 0), 0);
  const totalIncome =
    stats?.financialSummary?.totalIncome ||
    stats?.financialSummary?.totalContributions ||
    0;
  const totalExpense = stats?.financialSummary?.totalExpense || 0;

  const handleCreateTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxFundId || trxAmount <= 0 || !trxTitle.trim()) {
      alert('তহবিল, পরিমাণ এবং বিবরণ সঠিকভাবে পূরণ করুন।');
      return;
    }
    setIsSubmittingTrx(true);
    try {
      await mutations.recordTransaction.mutateAsync({
        fundId: trxFundId,
        type: trxType,
        amount: Number(trxAmount),
        title: trxTitle.trim(),
        description: trxDesc.trim() || undefined,
      });
      setTrxModalOpen(false);
      setTrxAmount(0);
      setTrxTitle('');
      setTrxDesc('');
    } catch (err: any) {
      alert(err.message || 'লেনদেন সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSubmittingTrx(false);
    }
  };

  const adminModules = [
    {
      href: '/organization/admin/members',
      title: 'সদস্য ব্যবস্থাপনা',
      description: 'সদস্য তালিকা, তথ্য যাচাই ও পদবি নির্ধারণ',
      icon: Users,
      badge: `${toBengaliNumber(stats?.memberCounts?.active || stats?.memberCounts?.total || 0)} জন সদস্য`,
      badgeColor: 'bg-emerald-50 text-brand-emerald dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      href: '/organization/admin/applications',
      title: 'সদস্য আবেদন',
      description: 'নতুন আবেদন পর্যালোচনা, অনুমোদন বা বাতিল',
      icon: FileText,
      badge: applications.length > 0 ? `${toBengaliNumber(applications.length)} টি অপেক্ষমাণ` : 'কোনো আবেদন নেই',
      badgeColor: applications.length > 0
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
        : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
    },
    {
      href: '/organization/admin/contributions',
      title: 'চাঁদা ট্র্যাকিং ও তাগিদ',
      description: 'মাসিক চাঁদা আদায় ট্র্যাকিং ও বকেয়া তাগিদ',
      icon: CreditCard,
      badge: 'মাসিক কিস্তি',
      badgeColor: 'bg-emerald-50 text-brand-emerald dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      href: '/organization/admin/funds',
      title: 'তহবিল ও বাজেট',
      description: 'কল্যাণ তহবিল ব্যালেন্স, বাজেট ও হিসেব',
      icon: Wallet,
      badge: `${toBengaliNumber(funds.length)} টি সক্রিয় তহবিল`,
      badgeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      href: '/organization/admin/transactions',
      title: 'লেনদেন ও চাঁদা',
      description: 'আয়-ব্যয় খতিয়ান, ভাউচার ও রসিদ তালিকা',
      icon: TrendingUp,
      badge: `${toBengaliNumber((stats?.recentTransactions?.length || 0) + (stats?.recentPayments?.length || 0))} টি রেকর্ড`,
      badgeColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300',
    },
    {
      href: '/organization/admin/committees',
      title: 'কমিটি ও পদবি',
      description: 'কার্যনির্বাহী পরিষদ ও প্রাতিষ্ঠানিক পদমর্যাদা',
      icon: Award,
      badge: `${toBengaliNumber(committees.length)} টি পরিষদ`,
      badgeColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    {
      href: '/organization/admin/notices',
      title: 'বিজ্ঞপ্তি ব্যবস্থাপনা',
      description: 'জরুরি নোটিশ প্রকাশ, সম্পাদন ও সার্কুলার',
      icon: FileText,
      badge: `${toBengaliNumber(notices.length)} টি বিজ্ঞপ্তি`,
      badgeColor: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300',
    },
    {
      href: '/organization/admin/elections',
      title: 'ডিজিটাল নির্বাচন',
      description: 'গোপন ব্যালট ভোটিং, তফশিল ও ফলাফল',
      icon: Vote,
      badge: `${toBengaliNumber(elections.length)} টি নির্বাচন`,
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* =========================================================================
          1. Hero Header Banner (Consistent Muhammodpury Signature Branding)
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-5 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Pill with Time Greeting and Security Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-100 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
              <span>{getGreeting()}</span>
              <span className="opacity-40">•</span>
              <span>কেন্দ্রীয় প্রশাসনিক পরিষদ ও হিসাব খাতা</span>
            </div>

            {/* Personalized Welcome Heading with Position & Name (No Avatar Image) */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
                <span>স্বাগতম, </span>
                {userPosition ? (
                  <>
                    <span className="text-brand-gold font-bold">{userPosition} </span>
                    <span>{userName || 'সম্মানিত অ্যাডমিন'}!</span>
                  </>
                ) : (
                  <span>{userName || 'সম্মানিত অ্যাডমিন'}!</span>
                )}
                <span className="ml-2 select-none">👋</span>
              </h1>

              {/* Official Position & Organization Subtitle */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {userPosition && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-100 shadow-xs backdrop-blur-xs">
                    <Award className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                    <span>পদবি: {userPosition}</span>
                  </span>
                )}
                <span className="text-xs sm:text-sm text-emerald-100/80 font-medium">
                  আমরা মোহাম্মদপুরী • কেন্দ্রীয় প্রশাসনিক ড্যাশবোর্ড
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              আমরা মোহাম্মদপুরী প্রশাসনিক প্যানেলে আপনাকে স্বাগতম। প্রাতিষ্ঠানিক সদস্যপদ পর্যালোচনা ও অনুমোদন, ৪টি কল্যাণ তহবিলের লাইভ নিরীক্ষণ ও আয়-ব্যয় লেনদেন পরিচালনা করুন।
            </p>
          </div>

          {/* Action Buttons - Perfectly Aligned Side-by-Side in 1 Row */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setTrxType('INCOME');
                setTrxModalOpen(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white text-brand-emerald font-bold text-xs shadow-lg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-brand-emerald stroke-[2.5] shrink-0" />
              <span>লেনদেন লিপিবদ্ধ</span>
            </button>

            <Link
              href="/organization"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors whitespace-nowrap"
            >
              <span>সংগঠন হোম</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white/90 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Executive Financial Overview (Hero Net Balance + 2 Sub-Cards)
         ========================================================================= */}
      <div className="space-y-3 sm:space-y-4">
        {/* Card 4: লাইভ আর্থিক অ্যানালিটিক্স ও ট্রেন্ড */}
        <FinancialAnalyticsChart
          trends={stats?.financialTrends}
          funds={stats?.funds?.fundList}
        />

        {/* Card 1: বর্তমান মোট ক্যাশ (Net Balance) */}
        <div className="relative rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#0E1714] dark:via-[#14231E] dark:to-[#172722] p-5 sm:p-6 border border-slate-200/80 dark:border-brand-emerald/35 shadow-soft dark:shadow-glass space-y-4 overflow-hidden text-slate-900 dark:text-white transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              বর্তমান মোট ক্যাশ (Net Balance)
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint text-[11px] font-bold border border-emerald-200/80 dark:border-brand-emerald/40">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald dark:text-brand-mint" />
              <span>সেফ ফান্ড</span>
            </div>
          </div>

          <div className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl text-brand-emerald dark:text-brand-mint font-bold">৳</span>
            <span>{toBengaliNumber(totalBalance)}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-brand-emerald dark:text-brand-mint font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-brand-emerald dark:text-brand-mint" />
              <span>আয় +১২.৫% বৃদ্ধি</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              সর্বশেষ আপডেট: আজ ৩:৩০ PM
            </span>
          </div>
        </div>

        {/* Sub-Stat Cards (মোট জমা ও মোট খরচ - 2 Column Grid) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 2: মোট জমা */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121F1B] p-4 sm:p-5 border border-slate-200/80 dark:border-brand-emerald/30 shadow-soft space-y-2 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold">মোট জমা</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-brand-emerald dark:text-brand-mint tracking-tight">
              ৳ {toBengaliNumber(totalIncome)}
            </div>
            <p className="text-[11px] text-brand-emerald dark:text-emerald-400 font-medium flex items-center gap-1">
              <span>▲ ৳১৫,০০০ গত সপ্তাহ</span>
            </p>
          </div>

          {/* Card 3: মোট খরচ */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1619] p-4 sm:p-5 border border-slate-200/80 dark:border-rose-500/30 shadow-soft space-y-2 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold">মোট খরচ</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-300 tracking-tight">
              ৳ {toBengaliNumber(totalExpense)}
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <span>▼ -৫% বাজেট এর মধ্যে</span>
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. Quick Navigation Hub: Administrative Control Modules
         ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              প্রশাসনিক নিয়ন্ত্রণ মডিউলসমূহ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              যেকোনো মডিউলে গিয়ে বিস্তারিত তথ্য ও কার্যক্রম পরিচালনা করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group p-4 sm:p-5 rounded-3xl bg-white dark:bg-brand-charcoal-dark/70 border border-slate-200/80 dark:border-white/10 hover:border-brand-emerald/50 dark:hover:border-brand-emerald/50 shadow-soft hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${module.badgeColor}`}>
                    {module.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors flex items-center justify-between">
                    <span>{module.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-emerald group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. Quick Transaction Modal
         ========================================================================= */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  নতুন আয় / ব্যয় লিপিবদ্ধ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTrxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  লেনদেনের ধরন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrxType('INCOME')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      trxType === 'INCOME'
                        ? 'bg-brand-emerald text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>জমা / অনুদান</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxType('EXPENSE')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      trxType === 'EXPENSE'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>ব্যয় / খরচ</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  তহবিল নির্বাচন *
                </label>
                <select
                  value={trxFundId}
                  onChange={(e) => setTrxFundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                >
                  <option value="" disabled>
                    তহবিল বেছে নিন
                  </option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={trxAmount || ''}
                  onChange={(e) => setTrxAmount(Number(e.target.value))}
                  placeholder="যেমন: ৫০০০"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  লেনদেনের বিবরণ / খাত *
                </label>
                <input
                  type="text"
                  value={trxTitle}
                  onChange={(e) => setTrxTitle(e.target.value)}
                  placeholder="যেমন: সদস্য অনুদান জমা অথবা চিকিৎসা সহায়তা"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অতিরিক্ত মন্তব্য (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  placeholder="রসিদ নম্বর, ভাউচার বা সংশ্লিষ্ট বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTrxModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrx}
                  className="px-5 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow-xs hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingTrx && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
