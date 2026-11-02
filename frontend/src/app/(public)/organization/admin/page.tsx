'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Settings,
  Users,
  CreditCard,
  Vote,
  TrendingUp,
  Plus,
} from 'lucide-react';
import {
  useOrgAdminStatsQuery,
  useOrgApplicationsQuery,
  useOrgFundsQuery,
  useOrgCommitteesQuery,
  useOrgDesignationsQuery,
  useOrgElectionsQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';

type AdminTab = 'APPLICATIONS' | 'FUNDS' | 'COMMITTEES' | 'NOTICES' | 'ELECTIONS';

export default function OrganizationAdminPage() {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('APPLICATIONS');
  const [appFilter, setAppFilter] = React.useState<'PENDING' | 'APPROVED' | 'REJECTED' | undefined>('PENDING');

  // Queries
  const { data: stats } = useOrgAdminStatsQuery();
  const { data: applications = [] } = useOrgApplicationsQuery(appFilter);
  const { data: funds = [] } = useOrgFundsQuery();
  const { data: committees = [] } = useOrgCommitteesQuery();
  const { data: designations = [] } = useOrgDesignationsQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const mutations = useOrgMutations();

  // Modals
  const [reviewModalApp, setReviewModalApp] = React.useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [trxModalOpen, setTrxModalOpen] = React.useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = React.useState(false);
  const [electionModalOpen, setElectionModalOpen] = React.useState(false);

  // New Transaction Form State
  const [trxFundId, setTrxFundId] = React.useState('');
  const [trxType, setTrxType] = React.useState<'INCOME' | 'EXPENSE' | 'TRANSFER' | 'CONTRIBUTION'>('INCOME');
  const [trxAmount, setTrxAmount] = React.useState<number>(0);
  const [trxTitle, setTrxTitle] = React.useState('');

  // New Notice Form State
  const [noticeTitle, setNoticeTitle] = React.useState('');
  const [noticeContent, setNoticeContent] = React.useState('');
  const [noticePriority, setNoticePriority] = React.useState<'URGENT' | 'NORMAL' | 'LOW'>('NORMAL');
  const [noticeIsPublic, setNoticeIsPublic] = React.useState(true);

  // New Election Form State
  const [elecTitle, setElecTitle] = React.useState('');
  const [elecDesc, setElecDesc] = React.useState('');
  const [selectedDesignationId, setSelectedDesignationId] = React.useState('');

  // Set default fund
  React.useEffect(() => {
    if (funds.length > 0 && !trxFundId) {
      const firstFund = funds[0];
      if (firstFund) {
        setTrxFundId(firstFund.id);
      }
    }
  }, [funds, trxFundId]);

  // Set default designation
  React.useEffect(() => {
    if (designations.length > 0 && !selectedDesignationId) {
      const firstDesig = designations[0];
      if (firstDesig) {
        setSelectedDesignationId(firstDesig.id);
      }
    }
  }, [designations, selectedDesignationId]);

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
      alert(err.message || 'পর্যালোচনা ব্যর্থ হয়েছে');
    }
  };

  const handleCreateTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxFundId || trxAmount <= 0 || !trxTitle.trim()) return;
    try {
      await mutations.recordTransaction.mutateAsync({
        fundId: trxFundId,
        type: trxType,
        amount: Number(trxAmount),
        title: trxTitle.trim(),
      });
      setTrxModalOpen(false);
      setTrxAmount(0);
      setTrxTitle('');
    } catch (err: any) {
      alert(err.message || 'লেনদেন সংরক্ষণ ব্যর্থ');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
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
      alert(err.message || 'বিজ্ঞপ্তি প্রকাশ ব্যর্থ');
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elecTitle.trim() || !selectedDesignationId) return;
    try {
      await mutations.createElection.mutateAsync({
        title: elecTitle.trim(),
        description: elecDesc.trim() || undefined,
        nominationStartDate: new Date(Date.now()).toISOString(),
        nominationEndDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        votingStartDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        votingEndDate: new Date(Date.now() + 86400000 * 6).toISOString(),
        positions: [{ designationId: selectedDesignationId, maxWinners: 1 }],
      });
      setElectionModalOpen(false);
      setElecTitle('');
      setElecDesc('');
    } catch (err: any) {
      alert(err.message || 'নির্বাচনী তফশিল ঘোষণা ব্যর্থ');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-emerald" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              কার্যনির্বাহী ও প্রশাসনিক প্যানেল
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            আমরা মোহাম্মদপুরী • প্রাতিষ্ঠানিক সদস্যপদ, আর্থিক লেজার ও নির্বাচন নিয়ন্ত্রণ
          </p>
        </div>

        <Link
          href="/organization"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors self-start sm:self-auto"
        >
          সংগঠন হোমে ফিরুন
        </Link>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">সক্রিয় সদস্য</span>
            <Users className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats?.memberCounts?.active ?? 0} জন
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {stats?.memberCounts?.pendingApplications ?? 0} টি আবেদন মুলতুবি
          </span>
        </div>

        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">মোট কোষাগার তহবিল</span>
            <CreditCard className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-emerald">
            ৳{stats?.funds?.totalBalance ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">৪টি সক্রিয় তহবিলে</span>
        </div>

        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">মোট সংগৃহীত চাঁদা</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ৳{stats?.financialSummary?.totalContributions ?? 0}
          </div>
          <span className="text-[10px] text-blue-500 font-semibold">মাসিক অনুদান লেজার</span>
        </div>

        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">সক্রিয় নির্বাচন</span>
            <Vote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats?.elections?.activeElections ?? 0} টি
          </div>
          <span className="text-[10px] text-amber-500 font-semibold">ডিজিটাল ব্যালট প্রস্তুত</span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto no-scrollbar scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          আবেদন পর্যালোচনা ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('FUNDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeTab === 'FUNDS'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          তহবিল ও লেনদেন লেজার
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('COMMITTEES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeTab === 'COMMITTEES'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          কার্যনির্বাহী কমিটি ও পদবি
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('NOTICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeTab === 'NOTICES'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          বিজ্ঞপ্তি ও নোটিশ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ELECTIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            activeTab === 'ELECTIONS'
              ? 'bg-white dark:bg-brand-charcoal-dark text-brand-emerald shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ডিজিটাল নির্বাচন পরিচালনা
        </button>
      </div>

      {/* Tab 1: Applications */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ফিল্টার:</span>
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAppFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    appFilter === st
                      ? 'bg-brand-emerald text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st === 'PENDING' ? 'মুলতুবি' : st === 'APPROVED' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {applications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">কোনো আবেদন পাওয়া যায়নি</p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{app.fullName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      মোবাইল: {app.phone} • পেশা: {app.profession} • জমা: {new Date(app.createdAt).toLocaleDateString('bn-BD')}
                    </p>
                    <p className="text-xs font-extrabold text-brand-emerald">
                      অঙ্গীকৃত মাসিক অনুদান: ৳{app.monthlyContribution} / মাস
                    </p>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setReviewModalApp(app)}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                      >
                        পর্যালোচনা ও সিদ্ধান্ত
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Funds & Multi-Fund Ledger */}
      {activeTab === 'FUNDS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">সংগঠনের তহবিল ব্যালেন্স</h3>
              <p className="text-xs text-slate-500">প্রতিটি তহবিলের আলাদা জমা-খরচ হিসাব</p>
            </div>
            <button
              type="button"
              onClick={() => setTrxModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন লেনদেন এন্ট্রি</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {funds.map((f) => (
              <div key={f.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{f.code}</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.name}</h4>
                <div className="text-lg font-black text-brand-emerald mt-1">৳{f.currentBalance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Committees */}
      {activeTab === 'COMMITTEES' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-white/5">
            কার্যনির্বাহী কমিটি সদস্য তালিকা
          </h3>
          <div className="space-y-3">
            {committees.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-brand-emerald">{c.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{c.status}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {c.members.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg bg-white dark:bg-brand-charcoal border border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.user.name}</span>
                      <span className="text-brand-emerald font-semibold">{m.designation.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Notices */}
      {activeTab === 'NOTICES' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">বিজ্ঞপ্তি ও নোটিশ প্রকাশ</h3>
            <button
              type="button"
              onClick={() => setNoticeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন নোটিশ জারি করুন</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            জরুরি, সাধারণ ও পাবলিক বিজ্ঞপ্তি জারি করুন। প্রকাশিত বিজ্ঞপ্তি সকল সদস্যের ড্যাশবোর্ডে প্রদর্শিত হবে।
          </p>
        </div>
      )}

      {/* Tab 5: Elections */}
      {activeTab === 'ELECTIONS' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ডিজিটাল নির্বাচন পরিচালনা</h3>
              <p className="text-xs text-slate-500">তফশিল ঘোষণা, প্রার্থী পর্যালোচনা ও ব্যালট চূড়ান্তকরণ</p>
            </div>
            <button
              type="button"
              onClick={() => setElectionModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-gold text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow hover:brightness-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন নির্বাচনী তফশিল ঘোষণা</span>
            </button>
          </div>

          <div className="space-y-3">
            {elections.map((elec) => (
              <div key={elec.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{elec.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {elec.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    ভোটগ্রহণ: {new Date(elec.votingStartDate).toLocaleDateString('bn-BD')} হতে {new Date(elec.votingEndDate).toLocaleDateString('bn-BD')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/organization/elections`}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-semibold hover:bg-emerald-800"
                  >
                    বুথ দেখুন
                  </Link>
                  {elec.status === 'VOTING_CLOSED' || elec.status === 'RESULTS_REVIEW' ? (
                    <button
                      type="button"
                      onClick={() => mutations.finalizeElection.mutate({ electionId: elec.id })}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-gold text-slate-900 text-xs font-bold hover:brightness-105 cursor-pointer"
                    >
                      ফলাফল চূড়ান্ত ও পদবি বরাদ্দ
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              আবেদন পর্যালোচনা: {reviewModalApp.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              মোবাইল: {reviewModalApp.phone} • পেশা: {reviewModalApp.profession} • মাসিক অঙ্গীকার: ৳{reviewModalApp.monthlyContribution}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                প্রত্যাখ্যানের কারণ (যদি প্রযোজ্য হয়):
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="প্রত্যাখ্যানের কারণ লিখুন"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleReviewAction('APPROVED')}
                disabled={mutations.reviewApplication.isPending}
                className="flex-1 py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                অনুমোদন করুন (কিস্তি বকেয়া)
              </button>
              <button
                type="button"
                onClick={() => handleReviewAction('REJECTED')}
                disabled={mutations.reviewApplication.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                প্রত্যাখ্যান করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন লেনদেন রেকর্ড</h3>
              <button onClick={() => setTrxModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">তহবিল</label>
                <select
                  value={trxFundId}
                  onChange={(e) => setTrxFundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} (ব্যালেন্স: ৳{f.currentBalance})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold block mb-1">ধরণ</label>
                  <select
                    value={trxType}
                    onChange={(e) => setTrxType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                  >
                    <option value="INCOME">আয় (Income)</option>
                    <option value="EXPENSE">ব্যয় (Expense)</option>
                    <option value="TRANSFER">স্থানান্তর (Transfer)</option>
                    <option value="CONTRIBUTION">অনুদান (Contribution)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">পরিমাণ (টাকা)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={trxAmount || ''}
                    onChange={(e) => setTrxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">বিবরণ / শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={trxTitle}
                  onChange={(e) => setTrxTitle(e.target.value)}
                  placeholder="যেমন: সড়ক বাতি সংস্কার ব্যয়"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={mutations.recordTransaction.isPending}
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                লেজারে যুক্ত করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">নতুন বিজ্ঞপ্তি জারি</h3>
              <button onClick={() => setNoticeModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="বিজ্ঞপ্তির বিষয়বস্তু"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">বিবরণ</label>
                <textarea
                  required
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="বিজ্ঞপ্তির পূর্ণ বিবরণ লিখুন"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <select
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                >
                  <option value="NORMAL">সাধারণ</option>
                  <option value="URGENT">জরুরি</option>
                  <option value="LOW">তথ্যমূলক</option>
                </select>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeIsPublic}
                    onChange={(e) => setNoticeIsPublic(e.target.checked)}
                  />
                  <span>উন্মুক্ত পাবলিক নোটিশ</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={mutations.createNotice.isPending}
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                বিজ্ঞপ্তি জারি করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Election Modal */}
      {electionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">নির্বাচনী তফশিল ঘোষণা</h3>
              <button onClick={() => setElectionModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">নির্বাচনের শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={elecTitle}
                  onChange={(e) => setElecTitle(e.target.value)}
                  placeholder="যেমন: কার্যনির্বাহী পরিষদ নির্বাচন ২০২৬"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">নির্বাচনের পদবি</label>
                <select
                  value={selectedDesignationId}
                  onChange={(e) => setSelectedDesignationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                >
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>{d.title} ({d.code})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={mutations.createElection.isPending}
                className="w-full py-2.5 rounded-xl bg-brand-gold text-slate-950 text-xs font-bold hover:brightness-105 transition-colors cursor-pointer"
              >
                তফশিল ঘোষণা ও ব্যালট চালু
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
