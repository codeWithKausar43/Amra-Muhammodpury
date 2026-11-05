'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Plus,
  Search,
  Check,
  X,
  Eye,
  Pencil,
  TrendingUp,
  Wallet,
  Loader2,
  Receipt,
  CreditCard,
  Share2,
  Tag,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import {
  useCampaignAdminOverviewQuery,
  useCampaignAdminListQuery,
  useCampaignAdminDonationsQuery,
  useCampaignAdminExpensesQuery,
  useCampaignAdminCategoriesQuery,
  useCampaignAdminPaymentConfigsQuery,
  useCampaignMutations,
} from '../hooks/useCampaignQueries';
import type {
  Campaign,
  CampaignDonation,
  CampaignCategory,
  CampaignPaymentConfig,
} from '../types';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const CampaignAdminManagement: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<
    'OVERVIEW' | 'CAMPAIGNS' | 'DONATIONS' | 'EXPENSES' | 'CATEGORIES' | 'PAYMENT_CONFIGS'
  >('OVERVIEW');

  // Queries
  const { data: overview, isLoading: overviewLoading } = useCampaignAdminOverviewQuery();
  const { data: categories = [] } = useCampaignAdminCategoriesQuery();
  const { data: paymentConfigs = [] } = useCampaignAdminPaymentConfigsQuery();

  // Campaign list filters
  const [campaignSearch, setCampaignSearch] = React.useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = React.useState('ALL');
  const [campaignCategoryFilter, setCampaignCategoryFilter] = React.useState('');
  const [campaignPage, setCampaignPage] = React.useState(1);
  const { data: campaignListData, isLoading: campaignsLoading } = useCampaignAdminListQuery({
    page: campaignPage,
    limit: 15,
    status: campaignStatusFilter === 'ALL' ? undefined : campaignStatusFilter,
    categoryId: campaignCategoryFilter || undefined,
    search: campaignSearch.trim() || undefined,
  });

  // Donations filters
  const [donationSearch, setDonationSearch] = React.useState('');
  const [donationStatusFilter, setDonationStatusFilter] = React.useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [donationCampaignFilter, setDonationCampaignFilter] = React.useState('');
  const [donationMethodFilter, setDonationMethodFilter] = React.useState('');
  const [donationPage, setDonationPage] = React.useState(1);
  const { data: donationListData, isLoading: donationsLoading } = useCampaignAdminDonationsQuery({
    page: donationPage,
    limit: 20,
    status: donationStatusFilter,
    campaignId: donationCampaignFilter || undefined,
    paymentMethod: donationMethodFilter || undefined,
    search: donationSearch.trim() || undefined,
  });

  // Expenses
  const [selectedExpenseCampaign, setSelectedExpenseCampaign] = React.useState('');
  const { data: expenses = [] } = useCampaignAdminExpensesQuery(selectedExpenseCampaign || undefined);

  // Mutations
  const mutations = useCampaignMutations();

  // Modal States
  const [isCampaignModalOpen, setIsCampaignModalOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null);
  const [viewingDonation, setViewingDonation] = React.useState<CampaignDonation | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CampaignCategory | null>(null);
  const [editingConfig, setEditingConfig] = React.useState<CampaignPaymentConfig | null>(null);

  // Form states for Campaign Create/Edit
  const [campTitle, setCampTitle] = React.useState('');
  const [campCategory, setCampCategory] = React.useState('');
  const [campCoverImage, setCampCoverImage] = React.useState('');
  const [campShortDesc, setCampShortDesc] = React.useState('');
  const [campFullDesc, setCampFullDesc] = React.useState('');
  const [campGoal, setCampGoal] = React.useState('');
  const [campStartDate, setCampStartDate] = React.useState('');
  const [campEndDate, setCampEndDate] = React.useState('');
  const [campLocation, setCampLocation] = React.useState('');
  const [campStatus, setCampStatus] = React.useState<string>('DRAFT');
  const [campIsFeatured, setCampIsFeatured] = React.useState(false);
  const [campPriority, setCampPriority] = React.useState('0');

  // Expense Form State
  const [expCampaignId, setExpCampaignId] = React.useState('');
  const [expAmount, setExpAmount] = React.useState('');
  const [expPurpose, setExpPurpose] = React.useState('');
  const [expDescription, setExpDescription] = React.useState('');
  const [expVoucherUrl, setExpVoucherUrl] = React.useState('');
  const [expPerformedBy, setExpPerformedBy] = React.useState('');

  // Category Form State
  const [catName, setCatName] = React.useState('');
  const [catDescription, setCatDescription] = React.useState('');
  const [catIcon, setCatIcon] = React.useState('HeartHandshake');

  // Donation Review Notes
  const [rejectNotes, setRejectNotes] = React.useState('');
  const [rejectingDonationId, setRejectingDonationId] = React.useState<string | null>(null);
  const [approvingDonation, setApprovingDonation] = React.useState<CampaignDonation | null>(null);

  const openCreateCampaignModal = () => {
    setEditingCampaign(null);
    setCampTitle('');
    setCampCategory(categories[0]?.id || '');
    setCampCoverImage('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80');
    setCampShortDesc('');
    setCampFullDesc('');
    setCampGoal('');
    const now = new Date();
    setCampStartDate(now.toISOString().split('T')[0] || '');
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    setCampEndDate(nextMonth.toISOString().split('T')[0] || '');
    setCampLocation('মোহাম্মদপুর, ঢাকা');
    setCampStatus('DRAFT');
    setCampIsFeatured(false);
    setCampPriority('0');
    setIsCampaignModalOpen(true);
  };

  const openEditCampaignModal = (c: Campaign) => {
    setEditingCampaign(c);
    setCampTitle(c.title);
    setCampCategory(c.categoryId || '');
    setCampCoverImage(c.coverImage);
    setCampShortDesc(c.shortDescription);
    setCampFullDesc(c.description || c.shortDescription);
    setCampGoal(c.goalAmount ? String(c.goalAmount) : '');
    setCampStartDate(c.startDate ? c.startDate.split('T')[0] || '' : '');
    setCampEndDate(c.endDate ? c.endDate.split('T')[0] || '' : '');
    setCampLocation(c.location || '');
    setCampStatus(c.status);
    setCampIsFeatured(c.isFeatured);
    setCampPriority(String(c.priority || 0));
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: campTitle,
        categoryId: campCategory || undefined,
        coverImage: campCoverImage,
        shortDescription: campShortDesc,
        description: campFullDesc,
        goalAmount: campGoal ? Number(campGoal) : null,
        startDate: campStartDate,
        endDate: campEndDate,
        location: campLocation || undefined,
        status: campStatus,
        isFeatured: campIsFeatured,
        priority: Number(campPriority) || 0,
      };

      if (editingCampaign) {
        await mutations.updateCampaign.mutateAsync({ id: editingCampaign.id, data: payload });
      } else {
        await mutations.createCampaign.mutateAsync(payload);
      }
      setIsCampaignModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'ক্যাম্পেইন সংরক্ষণে সমস্যা হয়েছে');
    }
  };

  const handleStatusChange = async (campaignId: string, status: string) => {
    try {
      await mutations.updateCampaignStatus.mutateAsync({ id: campaignId, status });
    } catch (err: any) {
      alert(err?.message || 'স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে');
    }
  };

  const handleVerifyDonation = async (id: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    try {
      await mutations.reviewDonation.mutateAsync({ id, status, rejectionReason: reason });
      setViewingDonation(null);
      setRejectingDonationId(null);
      setApprovingDonation(null);
      setRejectNotes('');
    } catch (err: any) {
      alert(err?.message || 'যাচাই সম্পন্ন করতে সমস্যা হয়েছে');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCampaignId) {
      alert('অনুগ্রহ করে ক্যাম্পেইন নির্বাচন করুন');
      return;
    }
    try {
      await mutations.recordExpense.mutateAsync({
        campaignId: expCampaignId,
        amount: Number(expAmount),
        purpose: expPurpose,
        description: expDescription || undefined,
        voucherUrl: expVoucherUrl || undefined,
        performedBy: expPerformedBy || 'অ্যাডমিন',
      });
      setIsExpenseModalOpen(false);
      setExpAmount('');
      setExpPurpose('');
      setExpDescription('');
      setExpVoucherUrl('');
    } catch (err: any) {
      alert(err?.message || 'খরচ অন্তর্ভুক্তিতে সমস্যা হয়েছে');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await mutations.updateCategory.mutateAsync({
          id: editingCategory.id,
          data: { name: catName, description: catDescription, icon: catIcon },
        });
      } else {
        await mutations.createCategory.mutateAsync({
          name: catName,
          description: catDescription,
          icon: catIcon,
        });
      }
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatDescription('');
      setEditingCategory(null);
    } catch (err: any) {
      alert(err?.message || 'ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-white/10 text-xs font-bold scrollbar-thin">
        {[
          { id: 'OVERVIEW', label: 'ওভারভিউ ও অ্যানালিটিক্স', icon: TrendingUp },
          { id: 'CAMPAIGNS', label: 'ক্যাম্পেইন তালিকা', icon: Heart },
          {
            id: 'DONATIONS',
            label: 'অনুদানের তালিকা ও যাচাই',
            icon: Receipt,
            badge: overview?.counts?.pendingDonations,
          },
          { id: 'EXPENSES', label: 'খরচের খতিয়ান', icon: Wallet },
          { id: 'CATEGORIES', label: 'ক্যাটাগরি সমূহ', icon: Tag },
          { id: 'PAYMENT_CONFIGS', label: 'পেমেন্ট নির্দেশিকা', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 sm:px-4 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${isActive
                  ? 'bg-brand-emerald text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${isActive ? 'bg-white text-brand-emerald' : 'bg-amber-500 text-slate-950'
                    }`}
                >
                  {toBengaliNumber(tab.badge!)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'OVERVIEW' && (
        overviewLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">মোট ক্যাম্পেইন</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {toBengaliNumber(overview?.counts?.totalCampaigns || 0)} টি
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  সক্রিয়: {toBengaliNumber(overview?.counts?.activeCampaigns || 0)} টি
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">মোট যাচাইকৃত দান</span>
                <div className="text-xl sm:text-2xl font-black text-brand-emerald dark:text-brand-mint mt-1">
                  ৳ {toBengaliNumber(overview?.financials?.totalVerifiedAmount || 0)}
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                  {toBengaliNumber(overview?.counts?.verifiedDonations || 0)} টি অনুদান
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('DONATIONS');
                  setDonationStatusFilter('PENDING');
                  setDonationPage(1);
                }}
                className="p-4 rounded-2xl bg-white dark:bg-brand-charcoal border-2 border-amber-400/80 dark:border-amber-500/50 hover:border-amber-500 dark:hover:border-amber-400 shadow-xs text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] group relative overflow-hidden"
                title="ক্লিক করে অপেক্ষমাণ অনুদান যাচাই করুন"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold block">যাচাই অপেক্ষমাণ</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    যাচাই করুন →
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  ৳ {toBengaliNumber(overview?.financials?.totalPendingAmount || 0)}
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5 block">
                  {toBengaliNumber(overview?.counts?.pendingDonations || 0)} টি রিভিউ বাকি
                </span>
              </button>

              <div className="p-4 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs">
                <span className="text-[11px] text-slate-500 font-bold block">ক্যাম্পেইন অবশিষ্ট স্থিতি</span>
                <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                  ৳ {toBengaliNumber(overview?.financials?.netCampaignBalance || 0)}
                </div>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                  মোট ব্যয়: ৳ {toBengaliNumber(overview?.financials?.totalExpensesAmount || 0)}
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Donations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Quick Actions Panel */}
              <div className="md:col-span-1 p-5 rounded-3xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  দ্রুত কার্যক্রম
                </h4>
                {Boolean(overview?.counts?.pendingDonations && overview.counts.pendingDonations > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('DONATIONS');
                      setDonationStatusFilter('PENDING');
                      setDonationPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অপেক্ষমাণ অনুদান যাচাই করুন ({toBengaliNumber(overview?.counts?.pendingDonations || 0)} টি)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateCampaignModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ক্যাম্পেইন তৈরি করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-brand-emerald" />
                  <span>ক্যাম্পেইন ব্যয় অন্তর্ভুক্ত করুন</span>
                </button>
                <Link
                  href="/campaigns"
                  target="_blank"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>পাবলিক ক্যাম্পেইন পেজ দেখুন</span>
                </Link>
              </div>

              {/* Recent Donations Activity */}
              <div className="md:col-span-2 p-5 rounded-3xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    সাম্প্রতিক অনুদানসমূহ
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DONATIONS')}
                    className="text-xs text-brand-emerald font-bold hover:underline"
                  >
                    সব দেখুন
                  </button>
                </div>

                {overview?.recentDonations && overview.recentDonations.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {overview.recentDonations.slice(0, 5).map((don) => (
                      <div key={don.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white truncate block">
                            {don.donorName}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {don.campaign?.title} • {don.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <span className="font-bold text-brand-emerald text-sm block">
                              ৳ {toBengaliNumber(don.amount)}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${don.status === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : don.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                            >
                              {don.status === 'VERIFIED'
                                ? 'অনুমোদিত'
                                : don.status === 'PENDING'
                                  ? 'অপেক্ষমাণ'
                                  : 'বাতিল'}
                            </span>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">এখনো কোনো অনুদান জমা পড়েনি</p>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* TAB 2: CAMPAIGN LIST */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          {/* Action and Filter Header */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="ক্যাম্পেইন খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <select
                value={campaignStatusFilter}
                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="ACTIVE">সক্রিয় (Active)</option>
                <option value="DRAFT">খসড়া (Draft)</option>
                <option value="PAUSED">স্থগিত (Paused)</option>
                <option value="COMPLETED">সম্পন্ন (Completed)</option>
                <option value="CANCELLED">বাতিল (Cancelled)</option>
              </select>

              <select
                value={campaignCategoryFilter}
                onChange={(e) => {
                  setCampaignCategoryFilter(e.target.value);
                  setCampaignPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer max-w-[140px] truncate"
              >
                <option value="">সকল ক্যাটাগরি</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={openCreateCampaignModal}
              className="py-2 px-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাম্পেইন</span>
            </button>
          </div>

          {/* Campaigns Table / Cards */}
          {campaignsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
            </div>
          ) : campaignListData?.items && campaignListData.items.length > 0 ? (
            <>
              <div className="bg-white dark:bg-brand-charcoal rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">ক্যাম্পেইন</th>
                        <th className="py-3 px-3">ক্যাটাগরি</th>
                        <th className="py-3 px-3">লক্ষ্য বনাম সংগ্রহ</th>
                        <th className="py-3 px-3">মেয়াদ</th>
                        <th className="py-3 px-3">স্ট্যাটাস</th>
                        <th className="py-3 px-4 text-right">পদক্ষেপ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                      {campaignListData.items.map((camp) => (
                        <tr key={camp.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden relative bg-slate-100 shrink-0 border border-slate-200/60 dark:border-white/10">
                                {camp.coverImage ? (
                                  <Image src={camp.coverImage} alt={camp.title} fill className="object-cover" />
                                ) : (
                                  <Heart className="w-5 h-5 m-auto text-brand-emerald" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {camp.title}
                                </span>
                                <span className="text-[10.5px] text-slate-400 line-clamp-1">
                                  {camp.location || 'মোহাম্মদপুর'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                            {camp.category?.name || camp.categoryName || 'সাধারণ'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-brand-emerald">
                              ৳ {toBengaliNumber(camp.collectedAmount)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              লক্ষ্য: {camp.goalAmount ? `৳ ${toBengaliNumber(camp.goalAmount)}` : 'উন্মুক্ত'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {formatBengaliDate(camp.endDate)}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={camp.status}
                              onChange={(e) => handleStatusChange(camp.id, e.target.value)}
                              className={`py-1 px-2 rounded-lg text-[11px] font-bold border cursor-pointer ${camp.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40'
                                  : camp.status === 'DRAFT'
                                    ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/5 dark:text-slate-300'
                                    : camp.status === 'PAUSED'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              <option value="ACTIVE">সক্রিয় (Active)</option>
                              <option value="DRAFT">খসড়া (Draft)</option>
                              <option value="PAUSED">স্থগিত (Paused)</option>
                              <option value="COMPLETED">সম্পন্ন (Completed)</option>
                              <option value="CANCELLED">বাতিল (Cancelled)</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditCampaignModal(camp)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-emerald hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                title="সম্পাদনা করুন"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/campaigns/${camp.slug || camp.id}`}
                                target="_blank"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-emerald hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                title="পাবলিক পেজ দেখুন"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {Boolean(campaignListData?.totalPages && campaignListData.totalPages > 1) && (
                <div className="flex justify-center items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={campaignPage <= 1}
                    onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                  >
                    পূর্ববর্তী
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    পৃষ্ঠা {toBengaliNumber(campaignPage)} / {toBengaliNumber(campaignListData?.totalPages || 1)}
                  </span>
                  <button
                    type="button"
                    disabled={campaignPage >= (campaignListData?.totalPages || 1)}
                    onClick={() => setCampaignPage((p) => p + 1)}
                    className="px-2.5 py-1 rounded-lg border text-xs font-bold disabled:opacity-40"
                  >
                    পরবর্তী
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-white/5 rounded-3xl border border-slate-200/80">
              কোনো ক্যাম্পেইন পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DONATIONS VERIFICATION */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={donationSearch}
                  onChange={(e) => setDonationSearch(e.target.value)}
                  placeholder="দাতার নাম, ফোন বা TrxID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setDonationStatusFilter(st);
                      setDonationPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${donationStatusFilter === st
                        ? 'bg-white dark:bg-brand-emerald text-brand-emerald dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {st === 'PENDING'
                      ? 'অপেক্ষমাণ'
                      : st === 'VERIFIED'
                        ? 'অনুমোদিত'
                        : st === 'REJECTED'
                          ? 'বাতিল'
                          : 'সকল'}
                  </button>
                ))}
              </div>

              <select
                value={donationMethodFilter}
                onChange={(e) => {
                  setDonationMethodFilter(e.target.value);
                  setDonationPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="">সকল মাধ্যম</option>
                <option value="BKASH">বিকাশ</option>
                <option value="NAGAD">নগদ</option>
                <option value="ROCKET">রকেট</option>
                <option value="BANK">ব্যাংক</option>
              </select>

              <select
                value={donationCampaignFilter}
                onChange={(e) => {
                  setDonationCampaignFilter(e.target.value);
                  setDonationPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer max-w-[150px] truncate"
              >
                <option value="">সকল ক্যাম্পেইন</option>
                {campaignListData?.items?.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Donations Table */}
          {donationsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
            </div>
          ) : donationListData?.items && donationListData.items.length > 0 ? (
            <div className="bg-white dark:bg-brand-charcoal rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">দাতা ও যোগাযোগ</th>
                      <th className="py-3 px-3">ক্যাম্পেইন</th>
                      <th className="py-3 px-3">পরিমাণ</th>
                      <th className="py-3 px-3">মাধ্যম ও TrxID</th>
                      <th className="py-3 px-3">তারিখ</th>
                      <th className="py-3 px-3">স্ট্যাটাস</th>
                      <th className="py-3 px-4 text-right">যাচাই পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                    {donationListData.items.map((don) => (
                      <tr key={don.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {don.donorName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{don.donorPhone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[180px]">
                            {don.campaign?.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {don.receiptNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-brand-emerald text-sm whitespace-nowrap">
                          ৳ {toBengaliNumber(don.amount)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {don.paymentMethod}
                          </div>
                          {don.trxId ? (
                            <div className="text-[10.5px] font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-1 py-0.2 rounded inline-block">
                              Trx: {don.trxId}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">TrxID নেই</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {formatBengaliDate(don.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${don.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : don.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                          >
                            {don.status === 'VERIFIED'
                              ? 'অনুমোদিত'
                              : don.status === 'PENDING'
                                ? 'অপেক্ষমাণ'
                                : 'বাতিল'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setViewingDonation(don)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-emerald hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              title="পূর্ণ বিবরণ দেখুন"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* 1-Click Approve / Reject for PENDING */}
                            {don.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApprovingDonation(don)}
                                  disabled={mutations.reviewDonation.isPending}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                  title="অনুমোদন করুন"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingDonationId(don.id)}
                                  disabled={mutations.reviewDonation.isPending}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="বাতিল করুন"
                                >
                                  <X className="w-4 h-4 stroke-[3]" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-white/5 rounded-3xl border border-slate-200/80">
              কোনো অনুদান রেকর্ড পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPENSES (Dedicated Campaign Financial Ledger) */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                💡 ক্যাম্পেইনের প্রতিটি ব্যয় সাধারণ তহবিল থেকে সম্পূর্ণ আলাদা খতিয়ানে সংরক্ষিত হয়।
              </p>
              <select
                value={selectedExpenseCampaign}
                onChange={(e) => setSelectedExpenseCampaign(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer max-w-[180px] truncate"
              >
                <option value="">সকল ক্যাম্পেইনের ব্যয়</option>
                {campaignListData?.items?.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ব্যয় এন্ট্রি দিন</span>
            </button>
          </div>

          {expenses.length > 0 ? (
            <div className="bg-white dark:bg-brand-charcoal rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">উদ্দেশ্য ও ক্যাম্পেইন</th>
                      <th className="py-3 px-3">পরিমাণ</th>
                      <th className="py-3 px-3">তারিখ</th>
                      <th className="py-3 px-3">অনুমোদনকারী ব্যক্তি</th>
                      <th className="py-3 px-4 text-right">ভাউচার</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{exp.purpose}</div>
                          <div className="text-[11px] text-slate-500">{exp.campaign?.title}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                          - ৳ {toBengaliNumber(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {formatBengaliDate(exp.expenseDate)}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {exp.performedBy}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.voucherUrl ? (
                            <a
                              href={exp.voucherUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-emerald font-bold hover:underline"
                            >
                              রশিদ দেখুন
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">রশিদ নেই</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-white/5 rounded-3xl border border-slate-200/80">
              এখনো কোনো ক্যাম্পেইন ব্যয় অন্তর্ভুক্ত হয়নি
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              প্রয়োজনীয় ক্যাম্পেইন ক্যাটাগরি যোগ ও নিয়ন্ত্রণ করুন।
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setCatName('');
                setCatDescription('');
                setIsCategoryModalOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                    {cat.isArchived && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-600">
                        আর্কাইভ
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{cat.description}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block pt-1">
                    ক্যাম্পেইন সংখ্যা: {toBengaliNumber(cat._count?.campaigns || 0)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCatName(cat.name);
                    setCatDescription(cat.description || '');
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-brand-emerald"
                  title="সম্পাদনা"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENT CONFIGS */}
      {activeTab === 'PAYMENT_CONFIGS' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            অনুদানদাতাদের জন্য প্রদর্শিত পেমেন্ট অ্যাকাউন্ট নম্বর ও নির্দেশনাবলী কনফিগার করুন।
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentConfigs.map((cfg) => (
              <div
                key={cfg.id}
                className="p-5 rounded-3xl bg-white dark:bg-brand-charcoal border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{cfg.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {cfg.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl space-y-1">
                  <div className="text-xs text-slate-400 font-medium">{cfg.accountType}</div>
                  <div className="font-mono font-bold text-base text-brand-emerald">{cfg.accountNumber}</div>
                </div>
                {cfg.instructions && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cfg.instructions}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingConfig(cfg)}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  নির্দেশিকা সম্পাদনা করুন
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Campaign */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {editingCampaign ? 'ক্যাম্পেইন সম্পাদনা' : 'নতুন ক্যাম্পেইন তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ক্যাম্পেইনের শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="যেমন: শীতবস্ত্র বিতরণ ও কম্বল উপহার ২০২৬"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={campCategory}
                    onChange={(e) => setCampCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal font-medium"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    লক্ষ্য পরিমাণ (টাকা)
                  </label>
                  <input
                    type="number"
                    value={campGoal}
                    onChange={(e) => setCampGoal(e.target.value)}
                    placeholder="যেমন: 100000 (ঐচ্ছিক)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কভার ছবির লিংক (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={campCoverImage}
                  onChange={(e) => setCampCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সংক্ষিপ্ত বিবরণ (কার্ড ও পপ-আপের জন্য) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={campShortDesc}
                  onChange={(e) => setCampShortDesc(e.target.value)}
                  placeholder="১-২ বাক্যে ক্যাম্পেইনের মূল আহ্বান লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium resize-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিস্তারিত বিবরণ ও পরিকল্পনা <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={campFullDesc}
                  onChange={(e) => setCampFullDesc(e.target.value)}
                  placeholder="ক্যাম্পেইনের পূর্ণ উদ্দেশ্য, বাজেট ও উদ্যোগের বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর তারিখ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={campStartDate}
                    onChange={(e) => setCampStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সমাপ্তির তারিখ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={campEndDate}
                    onChange={(e) => setCampEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    স্থান
                  </label>
                  <input
                    type="text"
                    value={campLocation}
                    onChange={(e) => setCampLocation(e.target.value)}
                    placeholder="মোহাম্মদপুর"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={campStatus}
                    onChange={(e) => setCampStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal font-medium"
                  >
                    <option value="DRAFT">খসড়া (Draft)</option>
                    <option value="ACTIVE">সক্রিয় (Active)</option>
                    <option value="PAUSED">স্থগিত (Paused)</option>
                    <option value="COMPLETED">সম্পন্ন (Completed)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={campIsFeatured}
                    onChange={(e) => setCampIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-emerald"
                  />
                  <label htmlFor="isFeatured" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    পপ-আপে অগ্রাধিকার
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={mutations.createCampaign.isPending || mutations.updateCampaign.isPending}
                  className="w-full py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {editingCampaign ? 'হালনাগাদ নিশ্চিত করুন' : 'ক্যাম্পেইন প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Full Donation Details */}
      {viewingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                অনুদানের বিস্তারিত তথ্য (গোপনীয়)
              </h3>
              <button
                type="button"
                onClick={() => setViewingDonation(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400">দাতার নাম:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingDonation.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">মোবাইল নম্বর:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{viewingDonation.donorPhone}</span>
              </div>
              {viewingDonation.donorEmail && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ইমেইল:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{viewingDonation.donorEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">পরিমাণ:</span>
                <span className="font-black text-brand-emerald text-sm">৳ {toBengaliNumber(viewingDonation.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">পদ্ধতি:</span>
                <span className="font-medium">{viewingDonation.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TrxID:</span>
                <span className="font-mono font-bold">{viewingDonation.trxId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">রশিদ নম্বর:</span>
                <span className="font-mono">{viewingDonation.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">জমার সময়:</span>
                <span>{new Date(viewingDonation.createdAt).toLocaleString('bn-BD')}</span>
              </div>
              {viewingDonation.donorNotes && (
                <div className="pt-1 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-400 block mb-0.5">দাতার মন্তব্য:</span>
                  <p className="italic text-slate-700 dark:text-slate-300">{viewingDonation.donorNotes}</p>
                </div>
              )}
            </div>

            {viewingDonation.status === 'PENDING' && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingDonation(viewingDonation)}
                  className="py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  অনুমোদন করুন
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingDonationId(viewingDonation.id)}
                  className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
                >
                  বাতিল করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2.5: Approval Confirmation Prompt */}
      {approvingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-brand-charcoal p-5 rounded-3xl shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">অনুদান অনুমোদন নিশ্চিতকরণ</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">এই অনুদানটি যাচাই করে চূড়ান্ত অনুমোদন করুন</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">দাতার নাম:</span>
                <span className="font-bold text-slate-900 dark:text-white">{approvingDonation.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">অনুদানের পরিমাণ:</span>
                <span className="font-black text-brand-emerald text-sm">৳ {toBengaliNumber(approvingDonation.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">পদ্ধতি ও প্রেরক:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {approvingDonation.paymentMethod} {approvingDonation.senderNumber ? `(${approvingDonation.senderNumber})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">রশিদ নম্বর:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{approvingDonation.receiptNumber}</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 leading-relaxed">
              💡 অনুমোদন নিশ্চিত করলে এই অনুদানের অর্থ তাৎক্ষণিকভাবে ক্যাম্পেইনের মূল তহবিলে যোগ হবে এবং জনসাধারণের অগ্রগতিতে প্রতিফলিত হবে।
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setApprovingDonation(null)}
                disabled={mutations.reviewDonation.isPending}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 font-medium cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDonation(approvingDonation.id, 'VERIFIED')}
                disabled={mutations.reviewDonation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {mutations.reviewDonation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>হ্যাঁ, অনুমোদন নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Reason Prompt */}
      {rejectingDonationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-brand-charcoal p-5 rounded-3xl shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">অনুদান বাতিলের কারণ</h4>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="যেমন: ভুল TrxID বা অ্যাকাউন্টে টাকা জমা হয়নি..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingDonationId(null)}
                className="px-3 py-1.5 rounded-xl border text-slate-600"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDonation(rejectingDonationId, 'REJECTED', rejectNotes)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Record Campaign Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-brand-charcoal p-5 rounded-3xl shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">ক্যাম্পেইন ব্যয় এন্ট্রি</h3>
              <button type="button" onClick={() => setIsExpenseModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">ক্যাম্পেইন</label>
                <select
                  value={expCampaignId}
                  onChange={(e) => setExpCampaignId(e.target.value)}
                  className="w-full p-2 rounded-xl border bg-white dark:bg-brand-charcoal"
                  required
                >
                  <option value="">ক্যাম্পেইন নির্বাচন করুন</option>
                  {campaignListData?.items?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">পরিমাণ (টাকা)</label>
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="যেমন: 5000"
                  className="w-full p-2 rounded-xl border bg-white dark:bg-white/5"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">ব্যয়ের উদ্দেশ্য</label>
                <input
                  type="text"
                  value={expPurpose}
                  onChange={(e) => setExpPurpose(e.target.value)}
                  placeholder="যেমন: কম্বল ক্রয় বা ত্রাণ প্যাকেজিং"
                  className="w-full p-2 rounded-xl border bg-white dark:bg-white/5"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">অনুমোদনকারী ব্যক্তি</label>
                <input
                  type="text"
                  value={expPerformedBy}
                  onChange={(e) => setExpPerformedBy(e.target.value)}
                  placeholder="যেমন: কোষাধ্যক্ষ / সদস্য"
                  className="w-full p-2 rounded-xl border bg-white dark:bg-white/5"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white font-bold"
              >
                ব্যয় অন্তর্ভুক্ত করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-brand-charcoal p-5 rounded-3xl shadow-xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">
                {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
              </h3>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">ক্যাটাগরির নাম</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="যেমন: চিকিৎসা সহায়তা"
                  className="w-full p-2 rounded-xl border"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">সংক্ষিপ্ত বিবরণ</label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="বিবরণ..."
                  className="w-full p-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">আইকন</label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full p-2 rounded-xl border bg-white dark:bg-brand-charcoal"
                >
                  <option value="HeartHandshake">HeartHandshake (সহায়তা)</option>
                  <option value="Snowflake">Snowflake (শীতবস্ত্র)</option>
                  <option value="Gift">Gift (ঈদ/উপহার)</option>
                  <option value="Stethoscope">Stethoscope (চিকিৎসা)</option>
                  <option value="GraduationCap">GraduationCap (শিক্ষা)</option>
                  <option value="Utensils">Utensils (খাদ্য)</option>
                  <option value="Building2">Building2 (উন্নয়ন)</option>
                  <option value="Smile">Smile (মানবিক)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white font-bold"
              >
                সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Payment Config Edit */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-brand-charcoal p-5 rounded-3xl shadow-xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm">{editingConfig.title} কনফিগারেশন</h3>
              <button type="button" onClick={() => setEditingConfig(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-bold mb-1">অ্যাকাউন্ট নম্বর</label>
                <input
                  type="text"
                  value={editingConfig.accountNumber}
                  onChange={(e) => setEditingConfig({ ...editingConfig, accountNumber: e.target.value })}
                  className="w-full p-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">অ্যাকাউন্ট টাইপ</label>
                <input
                  type="text"
                  value={editingConfig.accountType}
                  onChange={(e) => setEditingConfig({ ...editingConfig, accountType: e.target.value })}
                  className="w-full p-2 rounded-xl border"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">পেমেন্ট নির্দেশিকা</label>
                <textarea
                  rows={3}
                  value={editingConfig.instructions || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, instructions: e.target.value })}
                  className="w-full p-2 rounded-xl border resize-none"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  await mutations.updatePaymentConfig.mutateAsync(editingConfig);
                  setEditingConfig(null);
                }}
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white font-bold"
              >
                হালনাগাদ নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
