'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  FileText,
  Vote,
  Search,
  Trash2,
  Play,
  Square,
  Award,
  Loader2,
  TrendingUp,
  Check,
} from 'lucide-react';
import {
  useOrgAdminStatsQuery,
  useOrgApplicationsQuery,
  useOrgFundsQuery,
  useOrgCommitteesQuery,
  useOrgDesignationsQuery,
  useOrgElectionsQuery,
  useOrgNoticesQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';
import type { OrgApplication } from '@/features/organization/types';

type AdminTab =
  | 'APPLICATIONS'
  | 'FUNDS'
  | 'TRANSACTIONS'
  | 'COMMITTEES'
  | 'NOTICES'
  | 'ELECTIONS';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export default function OrganizationAdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('APPLICATIONS');

  // Application Filters & Search
  const [appFilter, setAppFilter] = React.useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('PENDING');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Transactions Sub-filter
  const [trxView, setTrxView] = React.useState<'FUNDS' | 'PAYMENTS'>('FUNDS');

  // Queries
  const { data: stats } = useOrgAdminStatsQuery();
  const { data: applications = [], isLoading: appsLoading } = useOrgApplicationsQuery(
    appFilter === 'ALL' ? undefined : appFilter,
  );
  const { data: funds = [] } = useOrgFundsQuery();
  const { data: committees = [] } = useOrgCommitteesQuery();
  const { data: designations = [] } = useOrgDesignationsQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const { data: notices = [] } = useOrgNoticesQuery();
  const mutations = useOrgMutations();

  // Modals state
  const [reviewModalApp, setReviewModalApp] = React.useState<OrgApplication | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [trxModalOpen, setTrxModalOpen] = React.useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = React.useState(false);
  const [electionModalOpen, setElectionModalOpen] = React.useState(false);

  // New Transaction Form State
  const [trxFundId, setTrxFundId] = React.useState('');
  const [trxType, setTrxType] = React.useState<'INCOME' | 'EXPENSE' | 'CONTRIBUTION'>('INCOME');
  const [trxAmount, setTrxAmount] = React.useState<number>(0);
  const [trxTitle, setTrxTitle] = React.useState('');
  const [trxDesc, setTrxDesc] = React.useState('');
  const [isSubmittingTrx, setIsSubmittingTrx] = React.useState(false);

  // New Notice Form State
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeContent, setNoticeContent] = React.useState('');
  const [noticePriority, setNoticePriority] = React.useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL');
  const [noticeIsPublic, setNoticeIsPublic] = React.useState(true);
  const [isSubmittingNotice, setIsSubmittingNotice] = React.useState(false);

  // New Election Form State
  const [elecTitle, setElecTitle] = React.useState('');
  const [elecDesc, setElecDesc] = React.useState('');
  const [selectedDesignationId, setSelectedDesignationId] = React.useState('');
  const [elecStartVotingImmediately, setElecStartVotingImmediately] = React.useState(true);
  const [isSubmittingElection, setIsSubmittingElection] = React.useState(false);

  // Set default fund
  React.useEffect(() => {
    if (funds.length > 0 && !trxFundId) {
      const firstFund = funds[0];
      if (firstFund) setTrxFundId(firstFund.id);
    }
  }, [funds, trxFundId]);

  // Set default designation
  React.useEffect(() => {
    if (designations.length > 0 && !selectedDesignationId) {
      const firstDesig = designations[0];
      if (firstDesig) setSelectedDesignationId(firstDesig.id);
    }
  }, [designations, selectedDesignationId]);

  // Financial figures
  const totalBalance =
    stats?.funds?.totalBalance ??
    funds.reduce((acc, f) => acc + (f.balance ?? f.currentBalance ?? 0), 0);
  const totalIncome =
    stats?.financialSummary?.totalIncome ||
    stats?.financialSummary?.totalContributions ||
    0;
  const totalExpense = stats?.financialSummary?.totalExpense || 0;
  const pendingAppsCount = stats?.memberCounts?.pendingApplications ?? 0;
  const activeMembersCount = stats?.memberCounts?.active ?? 0;

  // Filtered applications based on search
  const filteredApplications = React.useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase().trim();
    return applications.filter(
      (app) =>
        app.fullName?.toLowerCase().includes(q) ||
        app.phone?.toLowerCase().includes(q) ||
        app.profession?.toLowerCase().includes(q),
    );
  }, [applications, searchQuery]);

  // Handlers
  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewModalApp) return;
    try {
      await mutations.reviewApplication.mutateAsync({
        id: reviewModalApp.id,
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      });
      setReviewModalApp(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'পর্যালোচনা সম্পন্ন করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleQuickApprove = async (appId: string) => {
    try {
      await mutations.reviewApplication.mutateAsync({
        id: appId,
        status: 'APPROVED',
      });
    } catch (err: any) {
      alert(err.message || 'অনুমোদন ব্যর্থ হয়েছে।');
    }
  };

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

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('শিরোনাম ও বিবরণ আবশ্যক।');
      return;
    }
    setIsSubmittingNotice(true);
    try {
      await mutations.createNotice.mutateAsync({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        priority: noticePriority,
        isPinned: false,
        isPublic: noticeIsPublic,
      });
      setNoticeModalOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err: any) {
      alert(err.message || 'বিজ্ঞপ্তি প্রকাশ করা যায়নি।');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elecTitle.trim() || !selectedDesignationId) {
      alert('নির্বাচনের শিরোনাম ও পদবি নির্বাচন করুন।');
      return;
    }
    setIsSubmittingElection(true);
    try {
      const created = await mutations.createElection.mutateAsync({
        title: elecTitle.trim(),
        description: elecDesc.trim() || undefined,
        nominationStartDate: new Date(Date.now()).toISOString(),
        nominationEndDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        votingStartDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        votingEndDate: new Date(Date.now() + 86400000 * 6).toISOString(),
        positions: [{ designationId: selectedDesignationId, maxWinners: 1 }],
      });
      if (elecStartVotingImmediately && (created as any)?.id) {
        await mutations.updateElectionStatus.mutateAsync({
          electionId: (created as any).id,
          status: 'VOTING_ACTIVE',
        });
      }
      setElectionModalOpen(false);
      setElecTitle('');
      setElecDesc('');
    } catch (err: any) {
      alert(err.message || 'নির্বাচনী তফশিল ঘোষণা ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmittingElection(false);
    }
  };

  const handleStartVoting = async (electionId: string, title: string) => {
    if (!confirm(`"${title}" নির্বাচনের লাইভ ভোটগ্রহণ শুরু করতে চান? এর ফলে সক্রিয় সদস্যরা ভোটকেন্দ্রে ব্যালট দেখতে পাবেন ও ভোট দিতে পারবেন।`)) {
      return;
    }
    try {
      await mutations.updateElectionStatus.mutateAsync({
        electionId,
        status: 'VOTING_ACTIVE',
      });
    } catch (err: any) {
      alert(err.message || 'ভোটগ্রহণ শুরু করা যায়নি');
    }
  };

  const handleCloseVoting = async (electionId: string, title: string) => {
    if (!confirm(`"${title}" নির্বাচনের ভোটগ্রহণ সমাপ্ত করতে চান? এর পর আর কোনো নতুন ভোট গ্রহণ করা হবে না।`)) {
      return;
    }
    try {
      await mutations.updateElectionStatus.mutateAsync({
        electionId,
        status: 'VOTING_CLOSED',
      });
    } catch (err: any) {
      alert(err.message || 'ভোটগ্রহণ সমাপ্ত করা যায়নি');
    }
  };

  const handleFinalizeElection = async (electionId: string, title: string) => {
    if (!confirm(`"${title}" নির্বাচনের ফলাফল চূড়ান্ত করতে চান? এর ফলে বিজয়ী প্রার্থীকে কার্যনির্বাহী পদবি স্বয়ংক্রিয়ভাবে প্রদান করা হবে।`)) {
      return;
    }
    try {
      await mutations.finalizeElection.mutateAsync({ electionId });
    } catch (err: any) {
      alert(err.message || 'ফলাফল চূড়ান্ত করা যায়নি');
    }
  };

  const handleDeleteElection = async (electionId: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" নির্বাচনটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await mutations.deleteElection.mutateAsync({ electionId });
    } catch (err: any) {
      alert(err.message || 'নির্বাচন মুছতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* =========================================================================
          1. Hero Header Banner (Consistent Muhammodpury Signature Branding)
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-100 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>কেন্দ্রীয় প্রশাসনিক পরিষদ ও হিসাব খাতা</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              আমরা মোহাম্মদপুরী
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              প্রাতিষ্ঠানিক সদস্যপদ পর্যালোচনা ও অনুমোদন, ৪টি কল্যাণ তহবিলের লাইভ নিরীক্ষণ, আয়-ব্যয় লেনদেন লেজার ও গণতান্ত্রিক নির্বাচন পরিচালনা।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTrxType('INCOME');
                setTrxModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-brand-emerald font-bold text-xs shadow-lg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-emerald stroke-[2.5]" />
              <span>জমা লিপিবদ্ধ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTrxType('EXPENSE');
                setTrxModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4 text-white stroke-[2.5]" />
              <span>ব্যয় লিপিবদ্ধ</span>
            </button>

            <Link
              href="/organization"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
            >
              <span>সংগঠন হোম</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Admin Identifier Footer Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-100/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>লগইনকৃত অ্যাডমিন:</span>
            <span className="font-bold text-white">
              {session?.user?.name || 'অ্যাডমিন'}
            </span>
            <span className="text-emerald-200/60">({session?.user?.email})</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>স্বচ্ছতা স্ট্যাটাস: <strong className="text-brand-gold">সর্বজনীন লাইভ অডিট</strong></span>
            <span>সর্বশেষ সিঙ্ক: <strong>আজ</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Executive Financial Overview (Target Design: Hero Net Balance + 2 Sub-Cards)
         ========================================================================= */}
      <div className="space-y-3 sm:space-y-4">
        {/* Card 1: বর্তমান মোট ক্যাশ (Net Balance) */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#121c2e] via-[#0d1e33] to-[#0f243b] p-5 sm:p-6 border border-cyan-500/25 shadow-lg space-y-4 overflow-hidden text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-300 font-medium">
              বর্তমান মোট ক্যাশ (Net Balance)
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-300 text-[11px] font-bold border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>সেফ ফান্ড</span>
            </div>
          </div>

          <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl text-cyan-400 font-bold">৳</span>
            <span>{toBengaliNumber(totalBalance)}</span>
          </div>

          <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>আয় +১২.৫% বৃদ্ধি</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              সর্বশেষ আপডেট: আজ ৩:৩০ PM
            </span>
          </div>
        </div>

        {/* Sub-Stat Cards (মোট জমা ও মোট খরচ - 2 Column Grid) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 2: মোট জমা */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#0f1d2c] p-4 sm:p-5 border border-teal-500/25 space-y-2 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-300 font-semibold">মোট জমা</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-teal-300 tracking-tight">
              ৳ {toBengaliNumber(totalIncome)}
            </div>
            <p className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
              <span>▲ ৳১৫,০০০ গত সপ্তাহ</span>
            </p>
          </div>

          {/* Card 3: মোট খরচ */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#1a1424] p-4 sm:p-5 border border-rose-500/25 space-y-2 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-300 font-semibold">মোট খরচ</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-rose-300 tracking-tight">
              ৳ {toBengaliNumber(totalExpense)}
            </div>
            <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
              <span>▼ -৫% বাজেট এর মধ্যে</span>
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. Tab Navigation Controls (Seamless Website Pill Style)
         ========================================================================= */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-soft">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('APPLICATIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'APPLICATIONS'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>সদস্য আবেদন</span>
            <span className="text-[10px] opacity-80">({toBengaliNumber(activeMembersCount)} সক্রিয়)</span>
            {pendingAppsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'APPLICATIONS'
                  ? 'bg-white text-brand-emerald'
                  : 'bg-brand-emerald/15 text-brand-emerald'
              }`}>
                {toBengaliNumber(pendingAppsCount)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FUNDS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'FUNDS'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>তহবিল ও বাজেট</span>
            <span className="text-[10px] opacity-80">({funds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>লেনদেন ও চাঁদা লেজার</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMMITTEES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMMITTEES'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>কমিটি ও পদবি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NOTICES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'NOTICES'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>বিজ্ঞপ্তি ব্যবস্থাপনা</span>
            <span className="text-[10px] opacity-80">({notices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ELECTIONS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ELECTIONS'
                ? 'bg-brand-emerald text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>ডিজিটাল নির্বাচন</span>
            <span className="text-[10px] opacity-80">({elections.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. Tab 1: Member Applications Review (সদস্যপদ আবেদন)
         ========================================================================= */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                সদস্যপদ আবেদন পর্যালোচনা
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                কার্যনির্বাহী কমিটি দ্বারা আবেদনকারীর তথ্য যাচাই করে সদস্যপদ অনুমোদন বা বাতিল করুন
              </p>
            </div>

            {/* Status Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAppFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'PENDING'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  অপেক্ষমাণ
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('APPROVED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'APPROVED'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  অনুমোদিত
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('REJECTED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'REJECTED'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  বাতিলকৃত
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'ALL'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  সবগুলো
                </button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          {appsLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-emerald mx-auto" />
              <p className="text-xs text-slate-500">আবেদন তালিকা লোড হচ্ছে...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                কোনো সদস্য আবেদন পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500">
                {appFilter === 'PENDING'
                  ? 'বর্তমানে কোনো নতুন অপেক্ষমাণ আবেদন নেই।'
                  : 'নির্বাচিত ফিল্টারে কোনো আবেদন রেকর্ড পাওয়া যায়নি।'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-brand-emerald/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                        {app.user?.image ? (
                          <Image
                            src={app.user.image}
                            alt={app.fullName || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          app.fullName?.charAt(0) || 'স'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {app.fullName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {app.profession || 'পেশা উল্লেখ নেই'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        app.status === 'PENDING'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : app.status === 'APPROVED'
                          ? 'bg-brand-emerald/15 text-brand-emerald'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      {app.status === 'PENDING'
                        ? 'অপেক্ষমাণ'
                        : app.status === 'APPROVED'
                        ? 'অনুমোদিত'
                        : 'বাতিলকৃত'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-white/5">
                    <div>
                      <span className="text-[11px] text-slate-400 block">মোবাইল নম্বর</span>
                      <span className="font-semibold">{app.phone}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">মাসিক অনুদান অঙ্গীকার</span>
                      <span className="font-bold text-brand-emerald">
                        ৳ {toBengaliNumber(app.monthlyContribution)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">আবেদনের তারিখ</span>
                      <span>
                        {new Date(app.submittedAt || app.createdAt).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">ইমেইল</span>
                      <span className="truncate block" title={app.user?.email || 'N/A'}>
                        {app.user?.email || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions for PENDING applications */}
                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(app.id)}
                        disabled={mutations.reviewApplication.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>অনুমোদন করুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReviewModalApp(app)}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-all cursor-pointer active:scale-95"
                      >
                        বাতিল
                      </button>
                    </div>
                  )}

                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <p className="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl">
                      বাতিলের কারণ: {app.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. Tab 2: Multi-Fund Ledger Management (তহবিল ও বাজেট)
         ========================================================================= */}
      {activeTab === 'FUNDS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  সংগঠনের ৪টি কল্যাণ তহবিল
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রতিটি তহবিলের নির্ধারিত লক্ষ্য, বর্তমান ব্যালেন্স ও সরাসরি লেনদেন এন্ট্রি
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('INCOME');
                    setTrxModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow hover:bg-brand-emerald-hover cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>লেনদেন যুক্ত করুন</span>
                </button>
              </div>
            </div>

            {/* Funds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map((fund) => {
                const bal = fund.balance ?? fund.currentBalance ?? 0;
                return (
                  <div
                    key={fund.id}
                    className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200/80 dark:border-white/10 space-y-4 hover:border-brand-emerald/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded-md">
                            {fund.code}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                            {fund.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">বর্তমান ব্যালেন্স</span>
                          <span className="text-xl font-extrabold text-brand-emerald">
                            ৳ {toBengaliNumber(bal)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {fund.description || 'সংগঠনের নির্ধারিত সামাজিক ও নাগরিক কল্যাণ তহবিল।'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        মোট রেকর্ডকৃত লেনদেন: {toBengaliNumber(fund._count?.transactions || 0)} টি
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setTrxFundId(fund.id);
                          setTrxType('INCOME');
                          setTrxModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-brand-emerald font-bold text-xs border border-brand-emerald/30 hover:bg-brand-emerald hover:text-white transition-colors cursor-pointer"
                      >
                        + এন্ট্রি দিন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. Tab 3: Transactions & Member Payments Ledger (লেনদেন লেজার)
         ========================================================================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                লেনদেন ও চাঁদা আদায় লেজার
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল তহবিলের জমা-খরচ এবং সদস্যদের মাসিক অনুদানের হিসাব খাতা
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTrxView('FUNDS')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    trxView === 'FUNDS'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  তহবিল লেনদেন ({stats?.recentTransactions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTrxView('PAYMENTS')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    trxView === 'PAYMENTS'
                      ? 'bg-white dark:bg-brand-charcoal text-brand-emerald shadow-xs font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  সদস্য চাঁদা পরিশোধ ({stats?.recentPayments?.length || 0})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setTrxModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow hover:bg-brand-emerald-hover cursor-pointer"
              >
                + নতুন লেনদেন
              </button>
            </div>
          </div>

          {/* Subview 1: Fund Transactions */}
          {trxView === 'FUNDS' && (
            <div className="space-y-3">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {stats.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                            tx.type === 'EXPENSE'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-teal-500/10 text-teal-600'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tx.fund?.name || 'তহবিল'} •{' '}
                            {new Date(tx.createdAt).toLocaleDateString('bn-BD', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs sm:text-sm font-extrabold ${
                            tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-teal-600'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? '- ' : '+ '}৳{' '}
                          {toBengaliNumber(Math.abs(tx.amount))}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.type === 'EXPENSE'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? 'অনুমোদিত ব্যয়' : 'জমা / অনুদান'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    কোনো লেনদেন রেকর্ড পাওয়া যায়নি
                  </h3>
                  <p className="text-xs text-slate-500">
                    উপরের &apos;+ নতুন লেনদেন&apos; বোতাম ব্যবহার করে প্রথম আয় বা ব্যয় লিপিবদ্ধ করুন।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Subview 2: Member Payments */}
          {trxView === 'PAYMENTS' && (
            <div className="space-y-3">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {stats.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0">
                          {p.user?.name?.charAt(0) || 'স'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {p.user?.name || 'সদস্য'}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            মাসিক কিস্তি • মাস: {toBengaliNumber(p.periodMonth)}/{toBengaliNumber(p.periodYear)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-extrabold text-brand-emerald">
                          + ৳ {toBengaliNumber(p.amount)}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald">
                          পরিশোধিত
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    কোনো সদস্য চাঁদা রেকর্ড নেই
                  </h3>
                  <p className="text-xs text-slate-500">
                    সদস্যদের প্রদত্ত মাসিক অনুদান স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          7. Tab 4: Committees & Designations (কমিটি ও পদবি)
         ========================================================================= */}
      {activeTab === 'COMMITTEES' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                সাংগঠনিক কাঠামো ও কার্যনির্বাহী পরিষদ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সংগঠনের আনুষ্ঠানিক পদবি, দায়িত্ব ও কার্যনির্বাহী কমিটির তালিকা
              </p>
            </div>
          </div>

          {/* Designations Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              নির্ধারিত প্রাতিষ্ঠানিক পদবিসমূহ ({designations.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {designations.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1"
                >
                  <span className="text-[10px] font-bold text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded">
                    লেভেল {toBengaliNumber(d.level)}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {d.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">{d.code}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Committees list */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              বর্তমান সক্রিয় কমিটিসমূহ ({committees.length})
            </h3>
            {committees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committees.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c.description || 'সংগঠনের নির্ধারিত কার্যনির্বাহী কমিটি।'}
                    </p>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/50 dark:border-white/5">
                      কার্যকাল শুরু:{' '}
                      {c.startDate ? new Date(c.startDate).toLocaleDateString('bn-BD') : 'চলমান'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">কোনো কমিটি রেকর্ড করা নেই।</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          8. Tab 5: Notices Management (বিজ্ঞপ্তি ব্যবস্থাপনা)
         ========================================================================= */}
      {activeTab === 'NOTICES' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                প্রাতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তি
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                জরুরি নোটিশ প্রকাশ, জনগুরুত্বপূর্ণ বার্তা ও সদস্যদের জন্য নির্দেশনা
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNoticeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow hover:bg-brand-emerald-hover cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন বিজ্ঞপ্তি প্রকাশ</span>
            </button>
          </div>

          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2 hover:border-brand-emerald/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          n.priority === 'URGENT'
                            ? 'bg-rose-500/15 text-rose-600'
                            : 'bg-brand-emerald/15 text-brand-emerald'
                        }`}
                      >
                        {n.priority === 'URGENT' ? 'জরুরি নোটিশ' : 'সাধারণ বিজ্ঞপ্তি'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {n.isPublic ? '🌐 সর্বজনীন' : '🔒 সদস্যদের জন্য সংরক্ষিত'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(n.publishedAt).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                কোনো প্রকাশিত বিজ্ঞপ্তি নেই
              </h3>
              <p className="text-xs text-slate-500">
                নতুন কোনো বার্তা বা নোটিশ প্রকাশ করতে উপরের বোতামটি চাপুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          9. Tab 6: Elections Management (ডিজিটাল নির্বাচন পরিচালনা)
         ========================================================================= */}
      {activeTab === 'ELECTIONS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                গণতান্ত্রিক ডিজিটাল নির্বাচন পরিচালনা
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                তফশিল ঘোষণা, লাইভ ভোটগ্রহণ চালু/বন্ধ এবং ফলাফল চূড়ান্তকরণ
              </p>
            </div>

            <button
              type="button"
              onClick={() => setElectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>নতুন নির্বাচনী তফশিল</span>
            </button>
          </div>

          {elections.length > 0 ? (
            <div className="space-y-4">
              {elections.map((elec) => (
                <div
                  key={elec.id}
                  className="rounded-2xl bg-slate-50 dark:bg-white/5 p-5 border border-slate-200/80 dark:border-white/10 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            elec.status === 'VOTING_ACTIVE'
                              ? 'bg-amber-500 text-slate-950 animate-pulse'
                              : elec.status === 'FINALIZED'
                              ? 'bg-brand-emerald/15 text-brand-emerald'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {elec.status === 'VOTING_ACTIVE'
                            ? '● লাইভ ভোটগ্রহণ চলছে'
                            : elec.status === 'VOTING_CLOSED'
                            ? 'ভোটগ্রহণ সমাপ্ত'
                            : elec.status === 'FINALIZED'
                            ? 'ফলাফল চূড়ান্ত'
                            : elec.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          মোট পদ: {elec.positions?.length || 1} টি
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {elec.title}
                      </h3>
                      {elec.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {elec.description}
                        </p>
                      )}
                    </div>

                    {/* Election Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                      {elec.status !== 'VOTING_ACTIVE' && elec.status !== 'FINALIZED' && (
                        <button
                          type="button"
                          onClick={() => handleStartVoting(elec.id, elec.title)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>ভোটগ্রহণ শুরু</span>
                        </button>
                      )}

                      {elec.status === 'VOTING_ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleCloseVoting(elec.id, elec.title)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>ভোটগ্রহণ সমাপ্ত</span>
                        </button>
                      )}

                      {elec.status === 'VOTING_CLOSED' && (
                        <button
                          type="button"
                          onClick={() => handleFinalizeElection(elec.id, elec.title)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ফলাফল চূড়ান্ত করুন</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteElection(elec.id, elec.title)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="নির্বাচন মুছুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Positions details */}
                  {elec.positions && elec.positions.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap gap-2 text-xs">
                      {elec.positions.map((pos) => (
                        <div
                          key={pos.id}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {pos.designation?.title || 'পদবি'}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            (সর্বোচ্চ বিজয়ী: {toBengaliNumber(pos.maxWinners)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                <Vote className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                কোনো সক্রিয় নির্বাচন নেই
              </h3>
              <p className="text-xs text-slate-500">
                কার্যনির্বাহী পরিষদের গণতান্ত্রিক নির্বাচন সম্পন্ন করতে নতুন তফশিল ঘোষণা করুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: জমা / ব্যয় এন্ট্রি (Transaction Modal)
         ========================================================================= */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {trxType === 'INCOME' ? (
                  <>
                    <Plus className="w-4 h-4 text-brand-emerald stroke-[2.5]" />
                    <span>নতুন জমা ও অনুদান এন্ট্রি</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                    <span>নতুন ব্যয় ও খরচ এন্ট্রি</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setTrxModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTrxType('INCOME')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    trxType === 'INCOME'
                      ? 'bg-brand-emerald text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + জমা / অনুদান
                </button>
                <button
                  type="button"
                  onClick={() => setTrxType('EXPENSE')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    trxType === 'EXPENSE'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  - ব্যয় / খরচ
                </button>
              </div>

              {/* Fund Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  উদ্দিষ্ট তহবিল নির্বাচন করুন
                </label>
                <select
                  value={trxFundId}
                  onChange={(e) => setTrxFundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id} className="text-slate-900 dark:text-white dark:bg-slate-900">
                      {f.name} ({f.code}) — বর্তমান: ৳{toBengaliNumber(f.balance ?? f.currentBalance ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  পরিমাণ (টাকা)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="যেমন: ১০০০"
                    value={trxAmount || ''}
                    onChange={(e) => setTrxAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-bold border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                    required
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  লেনদেনের শিরোনাম / উদ্দেশ্য
                </label>
                <input
                  type="text"
                  placeholder="যেমন: হল বুকিং বিল / ত্রাণ অনুদান"
                  value={trxTitle}
                  onChange={(e) => setTrxTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  অতিরিক্ত বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  placeholder="রশিদ নম্বর বা প্রাসঙ্গিক তথ্য..."
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTrxModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrx}
                  className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingTrx && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: আবেদন বাতিলকরণ ও কারণ (Rejection Modal)
         ========================================================================= */}
      {reviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>সদস্যপদ আবেদন বাতিলকরণ</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিত যে <strong>{reviewModalApp.fullName}</strong> এর আবেদনটি বাতিল করতে চান?
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                বাতিলের কারণ (ঐচ্ছিক)
              </label>
              <textarea
                placeholder="যেমন: ভুল তথ্য প্রদান / এলাকার স্থায়ী বাসিন্দা নন..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('REJECTED')}
                disabled={mutations.reviewApplication.isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: নতুন নোটিশ প্রকাশ (Notice Modal)
         ========================================================================= */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-emerald" />
                <span>নতুন প্রাতিষ্ঠানিক বিজ্ঞপ্তি</span>
              </h3>
              <button
                type="button"
                onClick={() => setNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  বিজ্ঞপ্তির শিরোনাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আগামী শুক্রবার জরুরি সাধারণ সভা"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  বিস্তারিত বিষয়বস্তু
                </label>
                <textarea
                  placeholder="বিজ্ঞপ্তির পূর্ণ বিবরণ লিখুন..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    অগ্রাধিকার স্তর
                  </label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  >
                    <option value="NORMAL" className="dark:bg-slate-900">সাধারণ</option>
                    <option value="URGENT" className="dark:bg-slate-900">জরুরি</option>
                    <option value="LOW" className="dark:bg-slate-900">তথ্যমূলক</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={noticeIsPublic}
                      onChange={(e) => setNoticeIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
                    />
                    <span>জনসাধারণের জন্য দৃশ্যমান</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotice}
                  className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingNotice && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>বিজ্ঞপ্তি প্রকাশ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: নতুন নির্বাচনী তফশিল ঘোষণা (Election Modal)
         ========================================================================= */}
      {electionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Vote className="w-4 h-4 text-amber-500" />
                <span>নতুন নির্বাচনী তফশিল ঘোষণা</span>
              </h3>
              <button
                type="button"
                onClick={() => setElectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  নির্বাচনের শিরোনাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কার্যনির্বাহী পরিষদ নির্বাচন ২০২৬"
                  value={elecTitle}
                  onChange={(e) => setElecTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  নির্বাচনী পদের পদবি
                </label>
                <select
                  value={selectedDesignationId}
                  onChange={(e) => setSelectedDesignationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                >
                  {designations.map((d) => (
                    <option key={d.id} value={d.id} className="dark:bg-slate-900">
                      {d.title} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  সংক্ষিপ্ত বিবরণ / নিয়মাবলী (ঐচ্ছিক)
                </label>
                <textarea
                  placeholder="ভোটগ্রহণের নিয়মাবলী বা প্রাসঙ্গিক তথ্য..."
                  value={elecDesc}
                  onChange={(e) => setElecDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald resize-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={elecStartVotingImmediately}
                  onChange={(e) => setElecStartVotingImmediately(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <span>তফশিল ঘোষণার সাথে সাথে লাইভ ভোটগ্রহণ চালু করুন</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setElectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingElection}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingElection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>তফশিল প্রকাশ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
