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
  X,
  Phone,
  Mail,
  Calendar,
  Pencil,
  BarChart3,
  Clock,
  Upload,
} from 'lucide-react';
import {
  useOrgAdminStatsQuery,
  useOrgApplicationsQuery,
  useOrgFundsQuery,
  useOrgCommitteesQuery,
  useOrgDesignationsQuery,
  useOrgElectionsQuery,
  useOrgNoticesQuery,
  useOrgVotingConfigQuery,
  useOrgVotingPollMonitoringQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import type { OrgApplication, OrgNotice, Election } from '@/features/organization/types';
import { CandidateAvatar, cleanImageUrl, fileToDataUrl } from '@/features/organization/components/CandidateAvatar';
import { FinancialAnalyticsChart } from '@/features/organization/components/FinancialAnalyticsChart';

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
  const [editingNotice, setEditingNotice] = React.useState<OrgNotice | null>(null);
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeContent, setNoticeContent] = React.useState('');
  const [noticePriority, setNoticePriority] = React.useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL');
  const [noticeIsPublic, setNoticeIsPublic] = React.useState(true);
  const [isSubmittingNotice, setIsSubmittingNotice] = React.useState(false);

  // Global Voting Config Query
  const { data: votingConfig } = useOrgVotingConfigQuery();
  const isVotingEnabled = votingConfig?.isVotingEnabled ?? true;

  // Modals for Voting
  const [monitoringElectionId, setMonitoringElectionId] = React.useState<string | null>(null);
  const [scheduleModalElection, setScheduleModalElection] = React.useState<Election | null>(null);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = React.useState(false);

  // New Voting Poll Form State
  const [pollTitle, setPollTitle] = React.useState('');
  const [pollPosition, setPollPosition] = React.useState('সভাপতি');
  const [pollDesc, setPollDesc] = React.useState('');
  const [pollStartDate, setPollStartDate] = React.useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [pollEndDate, setPollEndDate] = React.useState(() => {
    const end = new Date(Date.now() + 86400000 * 2);
    return new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [pollCandidates, setPollCandidates] = React.useState<
    Array<{ name: string; image: string; bio: string }>
  >([
    { name: '', image: '', bio: '' },
    { name: '', image: '', bio: '' },
  ]);
  const [uploadingCandidateIdx, setUploadingCandidateIdx] = React.useState<number | null>(null);
  const [isSubmittingPoll, setIsSubmittingPoll] = React.useState(false);

  // Set default fund
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

  const handleOpenCreateNotice = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePriority('NORMAL');
    setNoticeIsPublic(true);
    setNoticeModalOpen(true);
  };

  const handleOpenEditNotice = (n: OrgNotice) => {
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticePriority(n.priority);
    setNoticeIsPublic(n.isPublic);
    setNoticeModalOpen(true);
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('শিরোনাম ও বিবরণ আবশ্যক।');
      return;
    }
    setIsSubmittingNotice(true);
    try {
      if (editingNotice) {
        await mutations.updateNotice.mutateAsync({
          noticeId: editingNotice.id,
          data: {
            title: noticeTitle.trim(),
            content: noticeContent.trim(),
            priority: noticePriority,
            isPublic: noticeIsPublic,
          },
        });
      } else {
        await mutations.createNotice.mutateAsync({
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          priority: noticePriority,
          isPinned: false,
          isPublic: noticeIsPublic,
        });
      }
      setNoticeModalOpen(false);
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err: any) {
      alert(err.message || 'বিজ্ঞপ্তি সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const handleToggleVotingConfig = async () => {
    const nextState = !isVotingEnabled;
    try {
      await mutations.updateVotingConfig.mutateAsync({ isVotingEnabled: nextState });
    } catch (err: any) {
      alert(err.message || 'ভোট সিস্টেম কনফিগারেশন আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleUploadCandidateImage = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট হতে পারবে।');
      return;
    }

    setUploadingCandidateIdx(index);

    // 1. Instant local preview via optimized data URL so image is NEVER lost
    try {
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl) {
        setPollCandidates((prev) => {
          const next = [...prev];
          const current = next[index] ?? { name: '', image: '', bio: '' };
          next[index] = { name: current.name, image: dataUrl, bio: current.bio };
          return next;
        });
      }
    } catch {
      // Continue to cloud upload
    }

    // 2. Upload to Cloudinary (using 'profiles' folder which is standard and supported)
    try {
      const sigRes = await apiClient<
        ApiResponse<{
          apiKey: string;
          timestamp: number;
          signature: string;
          folder: string;
          cloudName: string;
          resourceType: string;
        }>
      >('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({
          folder: 'profiles',
          resourceType: 'image',
          isRegistration: false,
        }),
      });
      const signData = sigRes.data;
      if (signData) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', signData.timestamp.toString());
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType}/upload`,
          { method: 'POST', body: formData }
        );
        const asset = await res.json();
        if (res.ok && asset.secure_url) {
          // Confirm asset with backend
          try {
            await apiClient('/uploads/confirm', {
              method: 'POST',
              body: JSON.stringify({
                publicId: asset.public_id,
                secureUrl: asset.secure_url,
                resourceType: 'image',
                format: asset.format || 'jpg',
                bytes: asset.bytes || file.size || 100,
                width: asset.width || 800,
                height: asset.height || 600,
              }),
            });
          } catch {
            // Confirmation non-blocking
          }

          setPollCandidates((prev) => {
            const next = [...prev];
            const current = next[index] ?? { name: '', image: '', bio: '' };
            next[index] = { name: current.name, image: asset.secure_url, bio: current.bio };
            return next;
          });
        }
      }
    } catch (err: any) {
      console.warn('Cloud upload warning (using local optimized asset):', err);
    } finally {
      setUploadingCandidateIdx(null);
    }
  };

  const handleCreateVotingPoll = async (isDraft: boolean) => {
    if (!isVotingEnabled) {
      alert('ভোটিং সিস্টেম বর্তমানে স্থগিত রয়েছে। নতুন নির্বাচন তৈরি করতে প্রথমে উপরে ভোটিং সিস্টেম সক্রিয় করুন।');
      return;
    }
    if (!pollTitle.trim()) {
      alert('ভোটের শিরোনাম আবশ্যক।');
      return;
    }
    if (!pollPosition.trim()) {
      alert('পদের নাম আবশ্যক।');
      return;
    }
    const validCandidates = pollCandidates.filter((c) => c.name.trim().length > 0);
    if (validCandidates.length < 2) {
      alert('কমপক্ষে ২ জন প্রার্থীর নাম আবশ্যক।');
      return;
    }
    if (!pollStartDate || !pollEndDate) {
      alert('ভোটের শুরু ও সমাপ্তির সময় নির্ধারণ করুন।');
      return;
    }
    if (new Date(pollEndDate) <= new Date(pollStartDate)) {
      alert('সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।');
      return;
    }

    setIsSubmittingPoll(true);
    try {
      await mutations.createVotingPoll.mutateAsync({
        title: pollTitle.trim(),
        positionName: pollPosition.trim(),
        description: pollDesc.trim() || undefined,
        candidates: validCandidates.map((c) => {
          const img = cleanImageUrl(c.image) || c.image.trim() || undefined;
          return {
            name: c.name.trim(),
            photo: img,
            image: img,
            bio: c.bio.trim() || undefined,
          };
        }),
        votingStartDate: new Date(pollStartDate).toISOString(),
        votingEndDate: new Date(pollEndDate).toISOString(),
        isDraft,
      });

      setElectionModalOpen(false);
      setPollTitle('');
      setPollPosition('সভাপতি');
      setPollDesc('');
      setPollCandidates([
        { name: '', image: '', bio: '' },
        { name: '', image: '', bio: '' },
      ]);
    } catch (err: any) {
      alert(err.message || 'ভোট তৈরি করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleSaveSchedule = async (data: {
    votingStartDate: string;
    votingEndDate: string;
    reason?: string;
  }) => {
    if (!scheduleModalElection) return;
    setIsUpdatingSchedule(true);
    try {
      await mutations.updateVotingSchedule.mutateAsync({
        electionId: scheduleModalElection.id,
        data,
      });
      setScheduleModalElection(null);
    } catch (err: any) {
      alert(err.message || 'সময়সূচি হালনাগাদ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsUpdatingSchedule(false);
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

  const handleDeleteNotice = async (noticeId: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${title}" বিজ্ঞপ্তিটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await mutations.deleteNotice.mutateAsync({ noticeId });
    } catch (err: any) {
      alert(err.message || 'বিজ্ঞপ্তি মুছতে ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* =========================================================================
          1. Hero Header Banner (Consistent Muhammodpury Signature Branding)
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-5 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
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

          {/* Action Buttons - Perfectly Aligned Side-by-Side in 1 Row */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
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
          2. Executive Financial Overview (Target Design: Hero Net Balance + 2 Sub-Cards)
         ========================================================================= */}
      <div className="space-y-3 sm:space-y-4">
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

        {/* Card 4: লাইভ আর্থিক অ্যানালিটিক্স ও ট্রেন্ড */}
        <FinancialAnalyticsChart
          trends={stats?.financialTrends}
          funds={stats?.funds?.fundList}
        />
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
          4. Tab 1: Member Applications Review (সদস্যপদ আবেদন - Seamless Clean Open Layout)
         ========================================================================= */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          {/* Header & Filter Toolbar (Open flat layout, zero boxiness) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  সদস্যপদ আবেদন পর্যালোচনা
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-brand-emerald dark:text-brand-mint bg-brand-emerald/10">
                  {toBengaliNumber(filteredApplications.length)} টি আবেদন
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                আবেদনকারীর তথ্য যাচাই করে সদস্যপদ অনুমোদন বা বাতিল করুন
              </p>
            </div>

            {/* Status Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="নাম, ফোন বা পেশা খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald w-44 sm:w-56 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAppFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'PENDING'
                      ? 'bg-brand-emerald text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  অপেক্ষমাণ {pendingAppsCount > 0 && `(${toBengaliNumber(pendingAppsCount)})`}
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('APPROVED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'APPROVED'
                      ? 'bg-brand-emerald text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  অনুমোদিত
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('REJECTED')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'REJECTED'
                      ? 'bg-brand-emerald text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  বাতিলকৃত
                </button>
                <button
                  type="button"
                  onClick={() => setAppFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    appFilter === 'ALL'
                      ? 'bg-brand-emerald text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            <>
              {/* Seamless Clean Table (No outer box, pure icons without background boxes) */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">আবেদনকারী</th>
                      <th className="py-2.5 px-3 min-w-[170px] whitespace-nowrap">যোগাযোগ তথ্য</th>
                      <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">অঙ্গীকার ও তারিখ</th>
                      <th className="py-2.5 px-3 text-center min-w-[100px] whitespace-nowrap">স্ট্যাটাস</th>
                      <th className="py-2.5 px-3 text-right min-w-[90px] whitespace-nowrap">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* 1. Applicant (Proper single-line alignment) */}
                        <td className="py-3.5 px-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative ring-1 ring-brand-emerald/20">
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
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap group-hover:text-brand-emerald transition-colors">
                                {app.fullName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {app.profession || 'পেশা উল্লেখ নেই'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact */}
                        <td className="py-3.5 px-3 space-y-1 min-w-[170px]">
                          <a
                            href={`tel:${app.phone}`}
                            className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-emerald transition-colors whitespace-nowrap"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{app.phone}</span>
                          </a>
                          <div
                            className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap truncate max-w-[170px]"
                            title={app.user?.email || 'N/A'}
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{app.user?.email || 'N/A'}</span>
                          </div>
                        </td>

                        {/* 3. Monthly Contribution & Submission Date (Merged Column) */}
                        <td className="py-3.5 px-3 min-w-[130px] whitespace-nowrap space-y-1">
                          <div className="font-bold font-mono text-brand-emerald dark:text-brand-mint text-xs">
                            ৳ {toBengaliNumber(app.monthlyContribution)}
                            <span className="text-[10px] font-normal text-slate-400 ml-0.5">/মাস</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {new Date(app.submittedAt || app.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="py-3.5 px-3 text-center min-w-[100px] whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              app.status === 'PENDING'
                                ? 'text-amber-600 dark:text-amber-400'
                                : app.status === 'APPROVED'
                                ? 'text-emerald-600 dark:text-brand-mint'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                app.status === 'PENDING'
                                  ? 'bg-amber-500 animate-pulse'
                                  : app.status === 'APPROVED'
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {app.status === 'PENDING'
                              ? 'অপেক্ষমাণ'
                              : app.status === 'APPROVED'
                              ? 'অনুমোদিত'
                              : 'বাতিলকৃত'}
                          </span>
                        </td>

                        {/* 6. Actions (PURE ICONS ONLY - NO background box!) */}
                        <td className="py-3.5 px-3 text-right min-w-[90px] whitespace-nowrap">
                          {app.status === 'PENDING' ? (
                            <div className="inline-flex items-center gap-3 justify-end">
                              {/* Quick Approve: Pure checkmark icon without background box */}
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(app.id)}
                                disabled={mutations.reviewApplication.isPending}
                                className="text-emerald-500 hover:text-emerald-400 hover:scale-125 active:scale-75 transition-transform cursor-pointer disabled:opacity-40 p-1"
                                title="সদস্যপদ অনুমোদন করুন"
                                aria-label="অনুমোদন করুন"
                              >
                                <Check className="w-5 h-5 stroke-[2.5]" />
                              </button>

                              {/* Reject: Pure cross icon without background box */}
                              <button
                                type="button"
                                onClick={() => setReviewModalApp(app)}
                                className="text-rose-500 hover:text-rose-400 hover:scale-125 active:scale-75 transition-transform cursor-pointer p-1"
                                title="আবেদন বাতিল করুন"
                                aria-label="বাতিল করুন"
                              >
                                <X className="w-5 h-5 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : app.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>অনুমোদিত</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-semibold">
                                <XCircle className="w-4 h-4" />
                                <span>বাতিল</span>
                              </span>
                              {app.rejectionReason && (
                                <p
                                  className="text-[10px] text-slate-400 max-w-[140px] truncate ml-auto"
                                  title={app.rejectionReason}
                                >
                                  {app.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          5. Tab 2: Multi-Fund Ledger Management (তহবিল ও বাজেট - Seamless Open Table)
         ========================================================================= */}
      {activeTab === 'FUNDS' && (
        <div className="space-y-4">
          {/* Header (Clean, Minimal & Direct) */}
          <div className="flex items-center justify-between gap-3 pb-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              কল্যাণ তহবিল ({toBengaliNumber(funds.length)}টি)
            </h2>

            <button
              type="button"
              onClick={() => {
                setTrxType('INCOME');
                setTrxModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow-xs hover:bg-brand-emerald-hover cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>লেনদেন যুক্ত করুন</span>
            </button>
          </div>

          {/* Seamless Open Treasury Ledger (No nested box cards, smooth horizontal scrolling) */}
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[240px] whitespace-nowrap">তহবিল বিবরণ ও কোড</th>
                  <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">মোট লেনদেন</th>
                  <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">বর্তমান ব্যালেন্স</th>
                  <th className="py-2.5 px-3 text-right min-w-[60px] whitespace-nowrap">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {funds.map((fund) => {
                  const bal = fund.balance ?? fund.currentBalance ?? 0;
                  return (
                    <tr
                      key={fund.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* 1. Fund Details */}
                      <td className="py-2.5 sm:py-3 px-3 min-w-[240px]">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors">
                                {fund.name}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded">
                                {fund.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {fund.description || 'সংগঠনের নির্ধারিত সামাজিক ও নাগরিক কল্যাণ তহবিল।'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Total Transactions */}
                      <td className="py-2.5 sm:py-3 px-3 min-w-[110px] whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                          {toBengaliNumber(fund._count?.transactions || 0)} টি লেনদেন
                        </span>
                      </td>

                      {/* 3. Current Balance (Compact small text for better UX) */}
                      <td className="py-2.5 sm:py-3 px-3 min-w-[120px] whitespace-nowrap">
                        <div className="flex items-baseline gap-1 font-mono">
                          <span className="text-[11px] font-bold text-brand-emerald">৳</span>
                          <span className="text-xs sm:text-sm font-bold text-brand-emerald dark:text-brand-mint">
                            {toBengaliNumber(bal)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Action (Pure Standalone Icon Only - No text, no background box) */}
                      <td className="py-2.5 sm:py-3 px-3 text-right min-w-[60px] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setTrxFundId(fund.id);
                            setTrxType('INCOME');
                            setTrxModalOpen(true);
                          }}
                          className="text-brand-emerald hover:text-brand-emerald-hover hover:scale-125 active:scale-75 transition-transform p-1 cursor-pointer inline-flex items-center justify-end"
                          title="এই তহবিলে লেনদেন এন্ট্রি দিন"
                          aria-label="লেনদেন এন্ট্রি দিন"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. Tab 3: Transactions & Member Payments Ledger (লেনদেন লেজার - Seamless Open Table)
         ========================================================================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  লেনদেন ও চাঁদা আদায় লেজার
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-brand-emerald dark:text-brand-mint bg-brand-emerald/10">
                  {toBengaliNumber((stats?.recentTransactions?.length || 0) + (stats?.recentPayments?.length || 0))} টি রেকর্ড
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                সকল তহবিলের জমা-খরচ এবং সদস্যদের মাসিক অনুদানের হিসাব খাতা
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTrxView('FUNDS')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  trxView === 'FUNDS'
                    ? 'bg-brand-emerald text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                তহবিল লেনদেন ({stats?.recentTransactions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setTrxView('PAYMENTS')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  trxView === 'PAYMENTS'
                    ? 'bg-brand-emerald text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                সদস্য চাঁদা ({stats?.recentPayments?.length || 0})
              </button>
            </div>
          </div>

          {/* Subview 1: Fund Transactions (Responsive Full-Width Feed, No Scrolling Required) */}
          {trxView === 'FUNDS' && (
            <div className="w-full">
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {stats.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 px-1 sm:px-2 flex items-start justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className="shrink-0 mt-0.5"
                          title={tx.type === 'EXPENSE' ? 'ব্যয় / খরচ' : 'জমা / অনুদান'}
                        >
                          {tx.type === 'EXPENSE' ? (
                            <ArrowDownRight className="w-4 h-4 text-rose-500 stroke-[2.5]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug group-hover:text-brand-emerald transition-colors break-words">
                            {tx.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{tx.fund?.name || 'তহবিল'}</span>
                            <span className="opacity-40">•</span>
                            <span>
                              {new Date(tx.createdAt).toLocaleDateString('bn-BD', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono font-bold text-xs sm:text-sm ${
                            tx.type === 'EXPENSE'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-brand-mint'
                          }`}
                        >
                          {tx.type === 'EXPENSE' ? '- ' : '+ '}৳ {toBengaliNumber(Math.abs(tx.amount))}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'EXPENSE'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-brand-mint'
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

          {/* Subview 2: Member Payments (Date Under Name, No Huge Gap, No Scrolling) */}
          {trxView === 'PAYMENTS' && (
            <div className="w-full">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {stats.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 px-1 sm:px-2 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors group"
                    >
                      {/* Left: Avatar + Member Name + Period/Date directly underneath */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative ring-1 ring-brand-emerald/20">
                          {p.user?.image ? (
                            <Image
                              src={p.user.image}
                              alt={p.user.name || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            p.user?.name?.charAt(0) || 'স'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-emerald transition-colors">
                            {p.user?.name || 'সদস্য'}
                          </h4>
                          {/* Date / Period directly under the name */}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            মাসিক কিস্তি • {toBengaliNumber(p.periodMonth)}/{toBengaliNumber(p.periodYear)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Paid Amount + Status Badge */}
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-xs sm:text-sm text-brand-emerald dark:text-brand-mint">
                          + ৳ {toBengaliNumber(p.amount)}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
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
          7. Tab 4: Committees & Designations (কমিটি ও পদবি - Flat Open Layout)
         ========================================================================= */}
      {activeTab === 'COMMITTEES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                সাংগঠনিক কাঠামো ও কার্যনির্বাহী পরিষদ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                সংগঠনের আনুষ্ঠানিক পদবি, দায়িত্ব ও কার্যনির্বাহী কমিটির তালিকা
              </p>
            </div>
          </div>

          {/* Designations Grid (Clean Flat Badges) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              নির্ধারিত প্রাতিষ্ঠানিক পদবিসমূহ ({toBengaliNumber(designations.length)})
            </h3>
            <div className="flex flex-wrap gap-2">
              {designations.map((d) => (
                <div
                  key={d.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{d.title}</span>
                  <span className="text-[10px] font-bold text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded">
                    লেভেল {toBengaliNumber(d.level)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{d.code}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Committees list (Open Flat Cards) */}
          <div className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              বর্তমান সক্রিয় কমিটিসমূহ ({toBengaliNumber(committees.length)})
            </h3>
            {committees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {committees.map((c) => (
                  <div
                    key={c.id}
                    className="border-l-2 border-l-brand-emerald pl-4 py-2 space-y-1 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors rounded-r-xl"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c.description || 'সংগঠনের নির্ধারিত কার্যনির্বাহী কমিটি।'}
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1">
                      কার্যকাল শুরু: {c.startDate ? new Date(c.startDate).toLocaleDateString('bn-BD') : 'চলমান'}
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
          8. Tab 5: Notices Management (বিজ্ঞপ্তি ব্যবস্থাপনা - Clean Seamless Table)
         ========================================================================= */}
      {activeTab === 'NOTICES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  প্রাতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তি
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-brand-emerald dark:text-brand-mint bg-brand-emerald/10 shrink-0">
                  {toBengaliNumber(notices.length)} টি
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateNotice}
              className="inline-flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow-xs hover:bg-brand-emerald-hover cursor-pointer transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
              <span>নতুন বিজ্ঞপ্তি</span>
            </button>
          </div>

          {notices.length > 0 ? (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 min-w-[240px] whitespace-nowrap">শিরোনাম ও বিবরণ</th>
                    <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">ধরন ও প্রাপক</th>
                    <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">তারিখ</th>
                    <th className="py-2.5 px-3 text-right min-w-[90px] whitespace-nowrap">কার্যক্রম</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {notices.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* 1. Title & Content Preview */}
                      <td className="py-3 px-3 min-w-[240px] max-w-[380px]">
                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors line-clamp-1">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.content}
                        </div>
                      </td>

                      {/* 2. Priority & Audience */}
                      <td className="py-3 px-3 min-w-[130px] whitespace-nowrap space-y-1">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              n.priority === 'URGENT'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-brand-emerald/15 text-brand-emerald'
                            }`}
                          >
                            {n.priority === 'URGENT' ? 'জরুরি নোটিশ' : 'সাধারণ বিজ্ঞপ্তি'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {n.isPublic ? '🌐 সর্বজনীন' : '🔒 সদস্যদের জন্য'}
                        </div>
                      </td>

                      {/* 3. Published Date */}
                      <td className="py-3 px-3 min-w-[110px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {new Date(n.publishedAt).toLocaleDateString('bn-BD', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 4. Actions: Update & Delete */}
                      <td className="py-3 px-3 text-right min-w-[90px] whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditNotice(n)}
                            className="text-slate-400 hover:text-brand-emerald hover:scale-110 active:scale-90 transition-transform p-1.5 cursor-pointer"
                            title="বিজ্ঞপ্তি সম্পাদন করুন"
                            aria-label="সম্পাদন করুন"
                          >
                            <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotice(n.id, n.title)}
                            className="text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-90 transition-transform p-1.5 cursor-pointer"
                            title="বিজ্ঞপ্তি মুছুন"
                            aria-label="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          9. Tab 6: Elections Management (ডিজিটাল নির্বাচন পরিচালনা - Seamless Layout)
         ========================================================================= */}
      {activeTab === 'ELECTIONS' && (
        <div className="space-y-5">
          {/* Top Bar with Header and Create Election Button */}
          <div className="flex items-start sm:items-center justify-between gap-3 pb-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  নির্বাচন পরিচালনা
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-amber-500 bg-amber-500/10 shrink-0">
                  {toBengaliNumber(elections.length)} টি নির্বাচন
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                তফশিল ঘোষণা, স্বয়ংক্রিয় শিডিউলিং, লাইভ ব্যালট মনিটরিং এবং ফলাফল চূড়ান্তকরণ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isVotingEnabled) {
                  alert('ভোটিং সিস্টেম বর্তমানে স্থগিত রয়েছে। নতুন নির্বাচন তৈরি করতে প্রথমে ভোটিং সিস্টেম সক্রিয় করুন।');
                  return;
                }
                setElectionModalOpen(true);
              }}
              disabled={!isVotingEnabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 whitespace-nowrap self-start sm:self-center ${
                isVotingEnabled
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer active:scale-95'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50 shadow-none'
              }`}
              title={
                isVotingEnabled
                  ? 'নতুন নির্বাচন ও ভোট তৈরি করুন'
                  : 'ভোটিং সিস্টেম স্থগিত রয়েছে। নতুন নির্বাচন তৈরি করতে প্রথমে ভোটিং সক্রিয় করুন।'
              }
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>নির্বাচন</span>
            </button>
          </div>

          {/* Section 3: Global Voting ON/OFF Switch & Overview KPIs */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 space-y-4">
            <div className="pb-3 border-b border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  গ্লোবাল ভোটিং সিস্টেম কন্ট্রোল
                </h3>
                {/* Interactive Toggle Switch Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVotingEnabled}
                  onClick={handleToggleVotingConfig}
                  disabled={mutations.updateVotingConfig.isPending}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border select-none active:scale-95 shrink-0 ${
                    isVotingEnabled
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
                  title={
                    isVotingEnabled
                      ? 'ভোটগ্রহণ স্থগিত করতে ক্লিক করুন'
                      : 'ভোটগ্রহণ চালু করতে ক্লিক করুন'
                  }
                >
                  <span
                    className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      isVotingEnabled ? 'bg-emerald-500' : 'bg-rose-400 dark:bg-rose-500'
                    }`}
                  >
                    <span
                      className={`bg-white w-3 h-3 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                        isVotingEnabled ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span className="whitespace-nowrap">{isVotingEnabled ? 'সক্রিয়' : 'স্থগিত'}</span>
                  {mutations.updateVotingConfig.isPending && (
                    <Loader2 className="w-3 h-3 animate-spin text-current" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                সুইচ বন্ধ রাখলে সাধারণ সদস্যরা ভোটকেন্দ্রে ঢুকতে পারবেন না। কোনো ঐতিহাসিক ভোট বা ফলাফল ডিলিট হবে না।
              </p>
            </div>

            {/* 5 KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">মোট পোল</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {toBengaliNumber(elections.length)} টি
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-amber-500 block font-bold uppercase">আসন্ন নির্বাচন</span>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                  {toBengaliNumber(elections.filter((e) => e.status === 'UPCOMING').length)} টি
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-emerald-500 block font-bold uppercase">লাইভ চলমান</span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {toBengaliNumber(elections.filter((e) => e.status === 'VOTING_ACTIVE').length)} টি
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-blue-500 block font-bold uppercase">সমাপ্ত নির্বাচন</span>
                <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                  {toBengaliNumber(
                    elections.filter(
                      (e) =>
                        e.status === 'COMPLETED' ||
                        e.status === 'FINALIZED' ||
                        e.status === 'VOTING_CLOSED'
                    ).length
                  )} টি
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-purple-500 block font-bold uppercase">মোট সংগৃহীত ভোট</span>
                <span className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                  {toBengaliNumber(
                    elections.reduce((sum, e) => sum + (e.votesCastCount || 0), 0)
                  )} টি
                </span>
              </div>
            </div>
          </div>

          {/* Elections List */}
          {elections.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {elections.map((elec) => {
                const isUpcoming = elec.status === 'UPCOMING';
                const isLive = elec.status === 'VOTING_ACTIVE';
                const isCompleted =
                  elec.status === 'COMPLETED' ||
                  elec.status === 'FINALIZED' ||
                  elec.status === 'VOTING_CLOSED';

                return (
                  <div
                    key={elec.id}
                    className="py-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] px-2 sm:px-3 rounded-2xl transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Status Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isLive
                                ? 'bg-amber-500 text-slate-950 animate-pulse'
                                : isUpcoming
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : elec.status === 'FINALIZED'
                                ? 'bg-brand-emerald/15 text-brand-emerald'
                                : isCompleted
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isLive
                              ? '● লাইভ ভোটগ্রহণ চলছে'
                              : isUpcoming
                              ? 'আসন্ন নির্বাচন'
                              : elec.status === 'FINALIZED'
                              ? 'ফলাফল চূড়ান্ত'
                              : isCompleted
                              ? 'ভোটগ্রহণ সমাপ্ত'
                              : 'খসড়া তফশিল'}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            পদ: {elec.positions?.[0]?.designation?.title || 'সাধারণ পদ'}
                          </span>

                          {elec.votesCastCount !== undefined && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              • সংগৃহীত ভোট: {toBengaliNumber(elec.votesCastCount)}
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {elec.title}
                        </h3>
                        {elec.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {elec.description}
                          </p>
                        )}

                        {/* Schedule times */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              শুরু:{' '}
                              {new Date(elec.votingStartDate).toLocaleString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <span>—</span>
                          <div className="flex items-center gap-1">
                            <span>
                              সমাপ্ত:{' '}
                              {new Date(elec.votingEndDate).toLocaleString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Candidates mini list */}
                        {elec.positions?.[0]?.nominations && elec.positions[0].nominations.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">প্রার্থী:</span>
                            {elec.positions[0].nominations.map((cand) => (
                              <div
                                key={cand.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-[11px]"
                              >
                                <CandidateAvatar
                                  src={cand.candidatePhoto}
                                  name={cand.candidateName}
                                  className="w-4 h-4 rounded-full"
                                  textClassName="text-[8px] font-bold text-amber-600"
                                />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {cand.candidateName}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Election Controls (Actions: Monitor, Schedule, Status, Delete) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 shrink-0">
                        {/* Live Monitoring Button */}
                        <button
                          type="button"
                          onClick={() => setMonitoringElectionId(elec.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          title="লাইভ ফলাফল ও ভোটার উপস্থিতি পর্যবেক্ষণ"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                          <span>মনিটরিং</span>
                        </button>

                        {/* Schedule update button */}
                        <button
                          type="button"
                          onClick={() => setScheduleModalElection(elec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          title="ভোটের সময়সূচি পরিবর্তন"
                        >
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>সময় পরিবর্তন</span>
                        </button>

                        {/* Manual status triggers */}
                        {!isLive && !isCompleted && elec.status !== 'FINALIZED' && (
                          <button
                            type="button"
                            onClick={() => handleStartVoting(elec.id, elec.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>ভোট শুরু</span>
                          </button>
                        )}

                        {isLive && (
                          <button
                            type="button"
                            onClick={() => handleCloseVoting(elec.id, elec.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>ভোট সমাপ্ত</span>
                          </button>
                        )}

                        {elec.status === 'VOTING_CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleFinalizeElection(elec.id, elec.title)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-hover text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ফলাফল চূড়ান্ত</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteElection(elec.id, elec.title)}
                          className="text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-90 transition-transform p-1.5 cursor-pointer"
                          title="নির্বাচন মুছুন"
                          aria-label="মুছুন"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                <Vote className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                কোনো সক্রিয় নির্বাচন নেই
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                কার্যনির্বাহী পরিষদের গণতান্ত্রিক নির্বাচন সম্পন্ন করতে উপরের &ldquo;+ নির্বাচন&rdquo; বোতামে ক্লিক করুন।
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

              {/* Fund Selector (Short, clean text with separate balance info to prevent layout breakage) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <label htmlFor="trx-fund-select">উদ্দিষ্ট তহবিল</label>
                  {(() => {
                    const selected = funds.find((f) => f.id === trxFundId) || funds[0];
                    if (!selected) return null;
                    const bal = selected.balance ?? selected.currentBalance ?? 0;
                    return (
                      <span className="text-[11px] font-semibold text-brand-emerald dark:text-brand-mint font-mono">
                        ব্যালেন্স: ৳{toBengaliNumber(bal)}
                      </span>
                    );
                  })()}
                </div>
                <select
                  id="trx-fund-select"
                  value={trxFundId}
                  onChange={(e) => setTrxFundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald cursor-pointer"
                  required
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id} className="text-slate-900 dark:text-white dark:bg-slate-900 py-1">
                      {f.name}
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
          MODAL 3: নতুন নোটিশ প্রকাশ ও সম্পাদনা (Notice Modal)
         ========================================================================= */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-emerald" />
                <span>{editingNotice ? 'বিজ্ঞপ্তি সম্পাদনা' : 'নতুন প্রাতিষ্ঠানিক বিজ্ঞপ্তি'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setNoticeModalOpen(false);
                  setEditingNotice(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNotice} className="space-y-4">
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
                  onClick={() => {
                    setNoticeModalOpen(false);
                    setEditingNotice(null);
                  }}
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
                  <span>{editingNotice ? 'হালনাগাদ করুন' : 'বিজ্ঞপ্তি প্রকাশ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: নতুন নির্বাচন ও ভোট তৈরি (Create Voting Poll Modal)
         ========================================================================= */}
      {electionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-white/10 my-auto overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Vote className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    নতুন ডিজিটাল নির্বাচন ও ভোট তৈরি
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    পদ, প্রার্থী ও সময়সূচি নির্ধারণ করে খসড়া বা প্রকাশ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setElectionModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left flex-1">
              {/* 1. Basic Poll Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    নির্বাচনের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: সভাপতি নির্বাচন ২০২৬"
                    value={pollTitle}
                    onChange={(e) => setPollTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    নির্বাচনী পদের নাম *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: সভাপতি / সাধারণ সম্পাদক"
                    value={pollPosition}
                    onChange={(e) => setPollPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    সংক্ষিপ্ত বিবরণ বা নিয়মাবলী (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ভোটের উদ্দেশ্য বা সাধারণ নির্দেশিকা..."
                    value={pollDesc}
                    onChange={(e) => setPollDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* 2. Automatic Schedule (Start & End Time) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>স্বয়ংক্রিয় সময়সূচি (Asia/Dhaka)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      ভোট শুরুর তারিখ ও সময় *
                    </label>
                    <input
                      type="datetime-local"
                      value={pollStartDate}
                      onChange={(e) => setPollStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      ভোট সমাপ্তির তারিখ ও সময় *
                    </label>
                    <input
                      type="datetime-local"
                      value={pollEndDate}
                      onChange={(e) => setPollEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  শুরুর সময়ে স্বয়ংক্রিয়ভাবে লাইভ হবে এবং সমাপ্তির সময়ে স্বয়ংক্রিয়ভাবে ব্যালট বন্ধ হয়ে ফলাফল নির্ধারিত হবে।
                </p>
              </div>

              {/* 3. Candidates Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    প্রার্থী তালিকা ({toBengaliNumber(pollCandidates.length)} জন) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPollCandidates((prev) => [...prev, { name: '', image: '', bio: '' }])
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ প্রার্থী যোগ করুন</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {pollCandidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          প্রার্থী #{toBengaliNumber(idx + 1)}
                        </span>
                        {pollCandidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPollCandidates((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                            title="প্রার্থী অপসারণ করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="প্রার্থীর পূর্ণ নাম *"
                            value={cand.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPollCandidates((prev) => {
                                const next = [...prev];
                                const current = next[idx] ?? { name: '', image: '', bio: '' };
                                next[idx] = { name: val, image: current.image, bio: current.bio };
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                            required
                          />
                        </div>

                        {/* Image Upload or URL */}
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`cand-file-${idx}`}
                            className="cursor-pointer shrink-0"
                            title="ডিভাইস থেকে ছবি আপলোড করতে ক্লিক করুন"
                          >
                            <CandidateAvatar
                              src={cand.image}
                              name={cand.name || 'প্রার্থী'}
                              className="w-8 h-8 rounded-lg ring-1 ring-slate-200 dark:ring-white/10 hover:opacity-80 transition-opacity"
                              textClassName="text-xs font-bold text-slate-500"
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="ছবির লিংক (URL) অথবা ফাইল দিন"
                              value={cand.image}
                              onChange={(e) => {
                                const rawVal = e.target.value;
                                const val = cleanImageUrl(rawVal) || rawVal;
                                setPollCandidates((prev) => {
                                  const next = [...prev];
                                  const current = next[idx] ?? { name: '', image: '', bio: '' };
                                  next[idx] = { name: current.name, image: val, bio: current.bio };
                                  return next;
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-slate-900 dark:text-white text-[11px] border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                            />
                          </div>
                          <label
                            htmlFor={`cand-file-${idx}`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors select-none active:scale-95"
                            title="ডিভাইস থেকে ছবি আপলোড করুন"
                          >
                            {uploadingCandidateIdx === idx ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">ছবি আপলোড</span>
                          </label>
                          <input
                            id={`cand-file-${idx}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCandidateIdx !== null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadCandidateImage(file, idx);
                              e.target.value = '';
                            }}
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <input
                            type="text"
                            placeholder="প্রার্থীর বিবরণ বা প্রতিশ্রুতি (যেমন: মোহাম্মদপুর উন্নয়ন কর্মী)"
                            value={cand.bio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPollCandidates((prev) => {
                                const next = [...prev];
                                const current = next[idx] ?? { name: '', image: '', bio: '' };
                                next[idx] = { name: current.name, image: current.image, bio: val };
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions: Draft vs Publish */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setElectionModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                বাতিল
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingPoll}
                  onClick={() => handleCreateVotingPoll(true)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  খসড়া সংরক্ষণ (Draft)
                </button>

                <button
                  type="button"
                  disabled={isSubmittingPoll}
                  onClick={() => handleCreateVotingPoll(false)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingPoll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>নির্বাচন প্রকাশ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: লাইভ মনিটরিং (Monitoring Modal)
         ========================================================================= */}
      {monitoringElectionId && (
        <ElectionMonitoringModal
          electionId={monitoringElectionId}
          onClose={() => setMonitoringElectionId(null)}
        />
      )}

      {/* =========================================================================
          MODAL 6: সময় পরিবর্তন (Schedule Modal)
         ========================================================================= */}
      {scheduleModalElection && (
        <ElectionScheduleModal
          election={scheduleModalElection}
          onClose={() => setScheduleModalElection(null)}
          onSave={handleSaveSchedule}
          isSaving={isUpdatingSchedule}
        />
      )}
    </div>
  );
}

{/* =========================================================================
    Helper Sub-component: Election Monitoring Modal
   ========================================================================= */}
function ElectionMonitoringModal({
  electionId,
  onClose,
}: {
  electionId: string;
  onClose: () => void;
}) {
  const { data: monitoring, isLoading } = useOrgVotingPollMonitoringQuery(
    electionId,
    Boolean(electionId)
  );

  const monitoringAny = (monitoring || {}) as any;
  const candidates: any[] = Array.isArray(monitoringAny.candidates)
    ? monitoringAny.candidates
    : Array.isArray(monitoringAny.candidateResults)
    ? monitoringAny.candidateResults
    : [];
  const voters: any[] = Array.isArray(monitoringAny.voters)
    ? monitoringAny.voters
    : Array.isArray(monitoringAny.votedMembers)
    ? monitoringAny.votedMembers
    : [];
  const totalVotersCount = monitoringAny.totalVotersCount ?? monitoringAny.stats?.totalEligibleVoters ?? 0;
  const votesCastCount = monitoringAny.votesCastCount ?? monitoringAny.stats?.totalVotesSubmitted ?? 0;
  const turnoutPercentage = monitoringAny.turnoutPercentage ?? monitoringAny.stats?.participationPercentage ?? 0;
  const notVotedCount = monitoringAny.notVotedCount ?? monitoringAny.stats?.remainingVoters ?? 0;
  const modalTitle = monitoringAny.title || monitoringAny.election?.title || 'নির্বাচন মনিটরিং';
  const positionTitle = monitoringAny.positionName || monitoringAny.election?.positions?.[0]?.designation?.name || 'পদ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                লাইভ নির্বাচনী ফলাফল ও ভোটার উপস্থিতি
              </h3>
              <p className="text-[11px] text-slate-400">
                {modalTitle} ({positionTitle})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading || !monitoring ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs">ডাটা লোড হচ্ছে...</span>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">মোট যোগ্য ভোটার</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {toBengaliNumber(totalVotersCount)} জন
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold uppercase">ভোট কাস্ট হয়েছে</span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {toBengaliNumber(votesCastCount)} টি
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold uppercase">ভোটার টার্নআউট</span>
                  <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                    {toBengaliNumber(turnoutPercentage)}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">বাকি ভোটার</span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {toBengaliNumber(notVotedCount)} জন
                  </span>
                </div>
              </div>

              {/* Candidate Votes Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    প্রার্থীভিত্তিক প্রাপ্ত ভোট ও পরিসংখ্যান
                  </h4>
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>রিয়েল-টাইম সিঙ্ক</span>
                  </span>
                </div>
                <div className="space-y-2.5">
                  {candidates.map((cand: any) => (
                    <div
                      key={cand.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CandidateAvatar
                            src={cand.candidatePhoto}
                            name={cand.candidateName}
                            className="w-9 h-9 rounded-xl"
                            textClassName="text-xs font-bold text-amber-600"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {cand.candidateName}
                            </h5>
                            <span className="text-[11px] text-slate-400">
                              {toBengaliNumber(cand.voteCount ?? cand.votesCount ?? 0)} ভোট
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                            {toBengaliNumber(cand.votePercentage ?? 0)}%
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${cand.votePercentage ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voter Participation List (Secret Ballot Preserved) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    অংশগ্রহণকারী ভোটার তালিকা ({toBengaliNumber(voters.length)} জন)
                  </h4>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
                    গোপন ব্যালট সুরক্ষিত
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  সংবিধান অনুযায়ী কোন সদস্য কোন প্রার্থীকে ভোট দিয়েছেন তা ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত ও গোপন। এখানে কেবল ভোটাধিকার প্রয়োগের উপস্থিতি প্রদর্শিত হচ্ছে।
                </p>

                {voters.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200/60 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
                    {voters.map((v: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{v.name}</span>
                            {v.memberNumber && (
                              <span className="text-[10px] text-slate-400">আইডি: {v.memberNumber}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(v.votedAt || v.participatedAt || Date.now()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    এখনও কোনো ভোট জমা পড়েনি
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

{/* =========================================================================
    Helper Sub-component: Election Schedule Modal
   ========================================================================= */}
function ElectionScheduleModal({
  election,
  onClose,
  onSave,
  isSaving,
}: {
  election: Election;
  onClose: () => void;
  onSave: (data: { votingStartDate: string; votingEndDate: string; reason?: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [startDate, setStartDate] = React.useState(() => {
    try {
      const d = new Date(election.votingStartDate);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  });
  const [endDate, setEndDate] = React.useState(() => {
    try {
      const d = new Date(election.votingEndDate);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  });
  const [reason, setReason] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('শুরু ও সমাপ্তির সময় নির্ধারণ করুন');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      alert('সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে');
      return;
    }
    onSave({
      votingStartDate: new Date(startDate).toISOString(),
      votingEndDate: new Date(endDate).toISOString(),
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>ভোটের সময়সূচি পরিবর্তন</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ভোট শুরুর তারিখ ও সময়
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ভোট সমাপ্তির তারিখ ও সময়
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              পরিবর্তনের কারণ (ঐচ্ছিক অডিট রেকর্ড)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: ভোটারদের অংশগ্রহণের সুবিধার্থে সময় বৃদ্ধি"
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
            সময়সূচি হালনাগাদ করলে বিদ্যমান প্রদত্ত কোনো ভোট মুছে যাবে না এবং সাধারণ সদস্যদের কাউন্টডাউন টাইমার স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>সময়সূচি হালনাগাদ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
