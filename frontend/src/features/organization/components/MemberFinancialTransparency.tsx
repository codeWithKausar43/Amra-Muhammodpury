'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Lock,
  CreditCard,
  ArrowUp,
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Heart,
  Sprout,
  Search,
  Image as ImageIcon,
  X,
  Layers,
  Receipt,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useOrgTransparencyQuery } from '../hooks/useOrganizationQueries';

const BENGALI_MONTHS = [
  { value: 'ALL', label: 'সকল মাস' },
  { value: '1', label: 'জানুয়ারি' },
  { value: '2', label: 'ফেব্রুয়ারি' },
  { value: '3', label: 'মার্চ' },
  { value: '4', label: 'এপ্রিল' },
  { value: '5', label: 'মে' },
  { value: '6', label: 'জুন' },
  { value: '7', label: 'জুলাই' },
  { value: '8', label: 'আগস্ট' },
  { value: '9', label: 'সেপ্টেম্বর' },
  { value: '10', label: 'অক্টোবর' },
  { value: '11', label: 'নভেম্বর' },
  { value: '12', label: 'ডিসেম্বর' },
];

function toBengaliNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '০';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function formatBengaliDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function getBengaliChildInitial(name?: string | null): string {
  if (!name) return 'বৃ';
  const clean = name.replace(/^শিশু\s+/i, '').trim();
  if (!clean) return 'বৃ';

  // If English letters, handle common sound transliterations
  if (/^[a-zA-Z]/.test(clean)) {
    const lower = clean.toLowerCase();
    if (lower.startsWith('ka')) return 'কা';
    if (lower.startsWith('ar') || lower.startsWith('aa')) return 'আ';
    if (lower.startsWith('ra')) return 'রা';
    if (lower.startsWith('sa')) return 'সা';
    if (lower.startsWith('ma')) return 'মা';
    if (lower.startsWith('na')) return 'না';
    return clean.slice(0, 2).toUpperCase();
  }

  // If Bengali, check for vowel sign (কার) on 2nd char
  const first = clean[0] || 'বৃ';
  const second = clean[1] || '';
  if (/[\u09BE-\u09CD]/.test(second)) {
    return first + second;
  }
  return first;
}

function TreePlantationCard({
  tp,
  onClick,
}: {
  tp: any;
  onClick: () => void;
}) {
  const initial = getBengaliChildInitial(tp.childName || tp.title);
  return (
    <div
      onClick={onClick}
      className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0E1A16] border border-slate-200/80 dark:border-white/10 hover:border-brand-emerald/50 dark:hover:border-brand-emerald/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar with initial */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#D6F7E5] dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {initial}
        </div>

        {/* Name & Subtitle */}
        <div className="min-w-0">
          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-emerald transition-colors">
            {tp.childName ? `শিশু ${tp.childName}` : tp.title}
          </div>
          <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            রোপণ: {tp.treesPlanted || '২টি চারা'} • {tp.plantationLocation || tp.birthPlace || 'মোহাম্মদপুর'}
          </p>
        </div>
      </div>

      {/* Price badge */}
      <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#E8F8F0] dark:bg-emerald-950/40 text-brand-emerald dark:text-emerald-300 font-bold font-mono text-xs sm:text-sm whitespace-nowrap shrink-0">
        ৳ {toBengaliNumber(tp.spent || tp.budget)}
      </div>
    </div>
  );
}

export function MemberFinancialTransparency() {
  const { data, isLoading, error, refetch } = useOrgTransparencyQuery();

  const [activeSection, setActiveSection] = React.useState<
    'OVERVIEW' | 'INCOME' | 'EXPENSE' | 'HUMANITARIAN' | 'TREE' | 'CAMPAIGN'
  >('OVERVIEW');

  // Search & Filters
  const [incomeSearch, setIncomeSearch] = React.useState('');
  const [incomeSourceFilter, setIncomeSourceFilter] = React.useState<string>('ALL');
  const [expenseSearch, setExpenseSearch] = React.useState('');
  const [expenseFundFilter, setExpenseFundFilter] = React.useState<string>('ALL');
  const [expenseYearFilter, setExpenseYearFilter] = React.useState<string>('ALL');
  const [expenseMonthFilter, setExpenseMonthFilter] = React.useState<string>('ALL');

  // Modal preview states
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [selectedTreePlantation, setSelectedTreePlantation] = React.useState<any | null>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<any | null>(null);
  const [treeSearch, setTreeSearch] = React.useState('');

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-emerald mx-auto" />
        <p className="text-sm text-slate-500 font-medium">
          সংগঠনের আর্থিক তথ্য ও খতিয়ান লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          আর্থিক হিসাব লোড করতে সমস্যা হয়েছে
        </h3>
        <p className="text-xs text-slate-500">
          {(error as any)?.message || 'অনুগ্রহ করে পুনরায় চেষ্টা করুন'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  const {
    summary,
    humanitarianActivities = [],
    treePlantations = [],
    campaigns = [],
    recentIncomes = [],
    recentExpenses = [],
  } = data;

  // Filtered incomes
  const filteredIncomes = recentIncomes.filter((inc) => {
    const matchesSource =
      incomeSourceFilter === 'ALL' || inc.source === incomeSourceFilter;
    const query = incomeSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      inc.title.toLowerCase().includes(query) ||
      (inc.receiptNumber && inc.receiptNumber.toLowerCase().includes(query)) ||
      inc.sourceLabel.toLowerCase().includes(query);
    return matchesSource && matchesSearch;
  });

  // Available expense years for filtering
  const availableExpenseYears = Array.from(
    new Set([
      String(new Date().getFullYear()),
      ...recentExpenses.flatMap((e) => {
        if (!e.date) return [];
        const d = new Date(e.date);
        return isNaN(d.getFullYear()) ? [] : [String(d.getFullYear())];
      }),
    ])
  ).sort((a, b) => Number(b) - Number(a));

  // Filtered expenses
  const filteredExpenses = recentExpenses.filter((exp) => {
    const matchesFund =
      expenseFundFilter === 'ALL' ||
      (expenseFundFilter === 'CAMPAIGN' && exp.type === 'CAMPAIGN_EXPENSE') ||
      (expenseFundFilter === 'ORGANIZATION' && exp.type !== 'CAMPAIGN_EXPENSE');

    const expDate = exp.date ? new Date(exp.date) : null;
    const matchesYear =
      expenseYearFilter === 'ALL' ||
      (expDate !== null && !isNaN(expDate.getFullYear()) && String(expDate.getFullYear()) === expenseYearFilter);

    const matchesMonth =
      expenseMonthFilter === 'ALL' ||
      (expDate !== null && !isNaN(expDate.getMonth()) && String(expDate.getMonth() + 1) === expenseMonthFilter);

    const query = expenseSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      exp.title.toLowerCase().includes(query) ||
      exp.category.toLowerCase().includes(query) ||
      exp.fundName.toLowerCase().includes(query) ||
      (exp.items && exp.items.some((it) => it.itemName.toLowerCase().includes(query)));

    return matchesFund && matchesYear && matchesMonth && matchesSearch;
  });

  // Filtered tree plantations
  const filteredTreePlantations = treePlantations.filter((tp: any) => {
    const q = treeSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      tp.childName?.toLowerCase().includes(q) ||
      tp.fatherName?.toLowerCase().includes(q) ||
      tp.birthPlace?.toLowerCase().includes(q) ||
      tp.plantationLocation?.toLowerCase().includes(q) ||
      tp.treesPlanted?.toLowerCase().includes(q) ||
      tp.title?.toLowerCase().includes(q) ||
      tp.description?.toLowerCase().includes(q) ||
      (tp.items && tp.items.some((it: any) => it.itemName?.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. Top-Level Summary Cards (Real DB Aggregations)
         ========================================================================= */}
      <div className="space-y-3 sm:space-y-4">
        {/* Top Featured Card: বর্তমানে অবশিষ্ট নিট স্থিতি */}
        <div className="w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#047857] via-[#065f46] to-[#044e39] dark:from-[#064e3b] dark:to-[#022c22] text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-100/90">
              <Lock className="w-3.5 h-3.5" />
              <span>বর্তমানে অবশিষ্ট নিট স্থিতি</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              ৳ {toBengaliNumber(summary.netBalance)}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-100/90 font-normal pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block shrink-0"></span>
              <span>সংগঠনের বিভিন্ন তহবিলে নিরাপদ ও সংরক্ষিত</span>
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
        </div>

        {/* 2-Column Row: সর্বমোট অর্জিত আয় & সর্বমোট অনুমোদিত ব্যয় (Single row on all screens) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* Card 1: সর্বমোট অর্জিত আয় */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-emerald-500/20 shadow-soft">
            <div className="flex items-center justify-between pb-1 gap-1">
              <span className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-bold leading-tight">
                সর্বমোট অর্জিত আয়
              </span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-brand-emerald dark:text-brand-mint tracking-tight pt-1 truncate whitespace-nowrap">
              ৳ {toBengaliNumber(summary.totalIncome)}
            </div>
          </div>

          {/* Card 2: সর্বমোট অনুমোদিত ব্যয় */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-emerald-500/20 shadow-soft">
            <div className="flex items-center justify-between pb-1 gap-1">
              <span className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-bold leading-tight">
                সর্বমোট অনুমোদিত ব্যয়
              </span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight pt-1 truncate whitespace-nowrap">
              ৳ {toBengaliNumber(summary.totalExpense)}
            </div>
          </div>
        </div>

        {/* 3 Mini Highlight Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/5 text-center shadow-soft">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {toBengaliNumber(summary.humanitarianCount)} টি
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              মানবিক সহায়তা
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/5 text-center shadow-soft">
            <div className="text-base sm:text-xl font-black text-brand-emerald dark:text-emerald-400">
              {toBengaliNumber(summary.treePlantationCount)} টি
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              নবজাতক বৃক্ষরোপণ
            </span>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/5 text-center shadow-soft">
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {toBengaliNumber(summary.completedCampaignsCount)} টি
            </div>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              সম্পন্ন ক্যাম্পেইন
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Sub-Navigation Tabs
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80 dark:border-white/10 text-xs font-bold">
        {[
          { key: 'OVERVIEW', label: 'সারসংক্ষেপ ও সারমর্ম', icon: Layers },
          { key: 'INCOME', label: `আয়ের বিবরণী (${toBengaliNumber(recentIncomes.length)})`, icon: ArrowUpRight },
          { key: 'EXPENSE', label: `ব্যয় ও ব্রেকডাউন (${toBengaliNumber(recentExpenses.length)})`, icon: ArrowDownRight },
          { key: 'HUMANITARIAN', label: `মানবিক কার্যক্রম (${toBengaliNumber(humanitarianActivities.length)})`, icon: Heart },
          { key: 'TREE', label: `বৃক্ষরোপণ উদ্যোগ (${toBengaliNumber(treePlantations.length)})`, icon: Sprout },
          { key: 'CAMPAIGN', label: `ক্যাম্পেইন খতিয়ান (${toBengaliNumber(campaigns.length)})`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key as any)}
              className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-emerald text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 1: OVERVIEW (Combined Highlights & Recent Real Transactions)
         ========================================================================= */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6">

          {/* Featured Humanitarian & Tree Plantation Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Humanitarian Preview */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    সর্বশেষ মানবিক সহায়তা
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('HUMANITARIAN')}
                  className="text-xs text-brand-emerald font-bold hover:underline"
                >
                  বিস্তারিত →
                </button>
              </div>

              {humanitarianActivities.length > 0 ? (
                <div className="space-y-2">
                  {humanitarianActivities.slice(0, 2).map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {act.title}
                        </div>
                        <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400 shrink-0">
                          - ৳ {toBengaliNumber(act.spent || act.budget)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {act.description}
                      </p>
                      {act.items && act.items.length > 0 && (
                        <div className="text-[10px] text-brand-emerald font-semibold pt-0.5">
                          ✓ {toBengaliNumber(act.items.length)} টি আইটেম বিস্তারিত হিসাব অন্তর্ভুক্ত
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">কোনো মানবিক সহায়তা রেকর্ড নেই</p>
              )}
            </div>

            {/* Tree Plantation Preview (Clean standalone layout, no duplicate outer card) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    নবজাতকের স্মরণে বৃক্ষরোপণ
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('TREE')}
                  className="text-xs text-brand-emerald font-bold hover:underline cursor-pointer"
                >
                  বিস্তারিত →
                </button>
              </div>

              {treePlantations.length > 0 ? (
                <div className="space-y-2.5">
                  {treePlantations.slice(0, 3).map((tp) => (
                    <TreePlantationCard
                      key={tp.id}
                      tp={tp}
                      onClick={() => setSelectedTreePlantation(tp)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">কোনো বৃক্ষরোপণ রেকর্ড নেই</p>
              )}
            </div>
          </div>
        </div>
      )}



      {/* =========================================================================
          SECTION 3: INCOME DETAILS (Verified Incomes Only)
         ========================================================================= */}
      {activeSection === 'INCOME' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'সকল আয়' },
                { id: 'MEMBERSHIP_CONTRIBUTION', label: 'মাসিক চাঁদা' },
                { id: 'CAMPAIGN_DONATION', label: 'ক্যাম্পেইন অনুদান' },
                { id: 'GENERAL_FUND_INCOME', label: 'সাধারণ দান / অন্যান্য' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setIncomeSourceFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    incomeSourceFilter === filter.id
                      ? 'bg-brand-emerald text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={incomeSearch}
                onChange={(e) => setIncomeSearch(e.target.value)}
                placeholder="রসিদ, দাতা বা বিবরণ খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
              />
            </div>
          </div>

          {/* Incomes Table with Horizontal Scroll & Zebra Striping */}
          <div className="overflow-x-auto border-t border-b border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="border-b-2 border-slate-300 dark:border-white/15 bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">তারিখ</th>
                  <th className="py-3 px-3.5">আয়ের উৎস ও খাত</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">রসিদ / ট্রানজেকশন</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">মাধ্যম</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                {filteredIncomes.map((inc, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr
                      key={inc.id}
                      className={`transition-colors ${
                        isEven
                          ? 'bg-white dark:bg-[#071317]'
                          : 'bg-slate-100/90 dark:bg-white/[0.04]'
                      } hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30`}
                    >
                      <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatBengaliDate(inc.date)}
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {inc.title}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-brand-mint">
                          {inc.sourceLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-500">
                        {inc.receiptNumber || '—'}
                      </td>
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          {inc.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-black font-mono text-brand-emerald text-sm whitespace-nowrap">
                        + ৳ {toBengaliNumber(inc.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredIncomes.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো আয়ের রেকর্ড পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 4: EXPENSES & ITEM-WISE BREAKDOWN (Horizontal Scrolling Ledger)
         ========================================================================= */}
      {activeSection === 'EXPENSE' && (
        <div className="space-y-4">
          {/* Header Explanation */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>আইটেমওয়ারি খরচের পূর্ণাঙ্গ বিবরণী</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              প্রতিটি ব্যয়ের অধীনে কোন কোন জিনিস কী মূল্যে কেনা হয়েছে, তা সরাসরি নিচে দেওয়া হয়েছে। কোনো খরচের পাশে “আইটেম তালিকা” বাটনে চাপলে পণ্যের বিবরণ দেখতে পারবেন।
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setExpenseFundFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  expenseFundFilter === 'ALL'
                    ? 'bg-brand-emerald text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                সকল ব্যয়
              </button>
              <button
                type="button"
                onClick={() => setExpenseFundFilter('CAMPAIGN')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  expenseFundFilter === 'CAMPAIGN'
                    ? 'bg-brand-emerald text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ক্যাম্পেইন ব্যয়
              </button>
              <button
                type="button"
                onClick={() => setExpenseFundFilter('ORGANIZATION')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  expenseFundFilter === 'ORGANIZATION'
                    ? 'bg-brand-emerald text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                সাধারণ ও মানবিক কার্যক্রম
              </button>
            </div>

            {/* Search + Year & Month Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative flex-1 sm:w-56 min-w-[160px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="খরচের বিবরণ বা আইটেম খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>

              {/* Year Select */}
              <div className="relative shrink-0">
                <select
                  value={expenseYearFilter}
                  onChange={(e) => setExpenseYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071317] text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer"
                  title="বছর নির্বাচন করুন"
                >
                  <option value="ALL">সকল বছর</option>
                  {availableExpenseYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {toBengaliNumber(yr)} সাল
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Select */}
              <div className="relative shrink-0">
                <select
                  value={expenseMonthFilter}
                  onChange={(e) => setExpenseMonthFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071317] text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer"
                  title="মাস নির্বাচন করুন"
                >
                  {BENGALI_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Table with Horizontal Scroll & Alternating Zebra Striping */}
          <div className="overflow-x-auto border-t border-b border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="border-b-2 border-slate-300 dark:border-white/15 bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">তারিখ</th>
                  <th className="py-3 px-3.5">ব্যয়ের বিবরণ ও খাত</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">তহবিল ও ক্যাটাগরি</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">আইটেম ও ভাউচার</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                {filteredExpenses.map((exp, index) => {
                  const hasItems = exp.items && exp.items.length > 0;
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExpense(exp)}
                      className={`transition-colors cursor-pointer group ${
                        isEven
                          ? 'bg-white dark:bg-[#071317]'
                          : 'bg-slate-100/90 dark:bg-white/[0.04]'
                      } hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30`}
                      title="ব্যয়ের পূর্ণাঙ্গ বিবরণ দেখতে ক্লিক করুন"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] align-top">
                        {formatBengaliDate(exp.date)}
                      </td>

                      {/* Expense Title, Description & Tags */}
                      <td className="py-3.5 px-3.5 min-w-[260px] align-top">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-brand-emerald transition-colors">
                          {exp.title}
                        </div>
                        {exp.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {exp.description}
                          </p>
                        )}
                        {exp.campaignTitle && exp.campaignTitle !== exp.title && (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald">
                              ক্যাম্পেইন: {exp.campaignTitle}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Fund & Category */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap align-top">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                          {exp.fundName}
                        </span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {exp.category}
                        </div>
                      </td>

                      {/* Items Breakdown & Voucher Buttons */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasItems ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald dark:text-brand-mint group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-500/30 transition-colors"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>{toBengaliNumber(exp.items.length)} টি আইটেম</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-brand-emerald text-[11px] font-medium transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>বিবরণ</span>
                            </span>
                          )}

                          {exp.receiptUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(exp.receiptUrl);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-brand-emerald text-[11px] font-medium cursor-pointer transition-colors"
                              title="রশিদ বা ভাউচার প্রমাণ সরাসরি বড় করে দেখুন"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>ভাউচার</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap font-mono font-black text-rose-600 dark:text-rose-400 text-sm align-top">
                        - ৳ {toBengaliNumber(exp.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 5: HUMANITARIAN ACTIVITIES DETAILS
         ========================================================================= */}
      {activeSection === 'HUMANITARIAN' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/30 text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>মানবকল্যাণ ও দরিদ্র সহায়তা স্বচ্ছতা</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
              সুবিধাবঞ্চিত মানুষের মর্যাদা রক্ষা করে সহায়তা প্রদানের বিস্তারিত তালিকা এখানে সংরক্ষিত। গ্রহীতার সম্মতি অনুযায়ী গোপনীয়তা বজায় রাখা হয়েছে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {humanitarianActivities.map((act) => (
              <div
                key={act.id}
                className="rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 p-5 shadow-soft space-y-3.5"
              >
                {/* Images */}
                {act.images && act.images.length > 0 && act.images[0] && (
                  <div className="h-44 rounded-2xl overflow-hidden relative bg-slate-100">
                    <Image
                      src={act.images[0]}
                      alt={act.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10.5px] font-bold">
                      {act.assistanceType || 'মানবিক সহায়তা'}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {act.title}
                    </h4>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      ৳ {toBengaliNumber(act.spent || act.budget)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                {/* Beneficiary Info */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">সহায়তাপ্রাপ্ত ব্যক্তি/পরিবার:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {act.beneficiaryDisplayName || 'অসহায় পরিবার'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">সহায়তার তারিখ:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatBengaliDate(act.startDate || act.endDate)}
                    </span>
                  </div>
                </div>

                {/* Items Purchased Breakdown */}
                {act.items && act.items.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      ক্রয়কৃত সামগ্রী ও খরচের হিসাব:
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-xl border border-slate-100 dark:border-white/5 p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                      {act.items.map((it) => (
                        <div key={it.id} className="py-1.5 flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {it.itemName}
                          </span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            ৳ {toBengaliNumber(it.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {humanitarianActivities.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো মানবিক সহায়তা কার্যক্রম রেকর্ড নেই
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 6: TREE PLANTATION FOR NEWBORNS (Special Initiative)
         ========================================================================= */}
      {activeSection === 'TREE' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 shadow-soft">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  নবজাতকের স্মরণে বৃক্ষরোপণ খতিয়ান
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                মোহাম্মদপুরের প্রতিটি নবজাতকের আগমনকে স্মরণীয় করে রাখতে ২টি করে গাছ রোপণ কার্যক্রম
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('OVERVIEW')}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <span>← সারসংক্ষেপে ফিরে যান</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder="শিশু বা পিতার নাম, এলাকা অথবা গাছের নাম দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand-emerald transition-colors"
            />
            {treeSearch && (
              <button
                type="button"
                onClick={() => setTreeSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              মোট <strong className="text-brand-emerald">{toBengaliNumber(filteredTreePlantations.length)}</strong> টি উদ্যোগ তালিকাভুক্ত
            </span>
            {treeSearch && (
              <button
                type="button"
                onClick={() => setTreeSearch('')}
                className="text-[11px] text-brand-emerald hover:underline cursor-pointer font-bold"
              >
                সার্চ মুছুন
              </button>
            )}
          </div>

          {/* Tree Plantation Cards (Using same design) */}
          {filteredTreePlantations.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTreePlantations.map((tp: any) => (
                <TreePlantationCard
                  key={tp.id}
                  tp={tp}
                  onClick={() => setSelectedTreePlantation(tp)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 space-y-2">
              <Sprout className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p>কোনো বৃক্ষরোপণ রেকর্ড খুঁজে পাওয়া যায়নি</p>
              {treeSearch && (
                <button
                  type="button"
                  onClick={() => setTreeSearch('')}
                  className="text-xs text-brand-emerald font-bold hover:underline"
                >
                  সবগুলো দেখতে সার্চ ফিল্টার মুছুন
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 7: CAMPAIGNS TRANSPARENCY
         ========================================================================= */}
      {activeSection === 'CAMPAIGN' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-emerald" />
              <span>ক্যাম্পেইনভিত্তিক পৃথক আর্থিক খতিয়ান</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
              ক্যাম্পেইনে উত্তোলিত সকল অনুদান শুধুমাত্র ঐ ক্যাম্পেইনের উদ্দেশ্যের জন্যই ব্যয় করা হয়। এখানে প্রতিটি ক্যাম্পেইনের সংগৃহীত অর্থ, মোট ব্যয় এবং উদ্বৃত্ত তহবিলের লাইভ হিসাব প্রদর্শিত।
            </p>
          </div>

          <div className="space-y-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 p-5 shadow-soft space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">
                      {camp.title}
                    </h4>
                    <span className="text-xs text-slate-400">
                      মেয়াদ: {formatBengaliDate(camp.startDate)} হতে {formatBengaliDate(camp.endDate)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                      camp.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-brand-mint'
                    }`}
                  >
                    {camp.status === 'COMPLETED' ? 'সম্পন্ন ক্যাম্পেইন' : 'চলমান কর্মসূচি'}
                  </span>
                </div>

                {/* Campaign Financial 3-Pillars: Collected, Spent, Remaining */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                      মোট সংগৃহীত অনুদান
                    </span>
                    <span className="text-xl font-black text-brand-emerald dark:text-brand-mint">
                      ৳ {toBengaliNumber(camp.collectedAmount)}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5">
                      লক্ষ্য: {camp.goalAmount ? `৳ ${toBengaliNumber(camp.goalAmount)}` : 'উন্মুক্ত'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-500/20">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                      মোট ব্যয়
                    </span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                      ৳ {toBengaliNumber(camp.totalExpenses)}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5">
                      {toBengaliNumber(camp.expenses?.length || 0)} টি খতিয়ান ভাউচার
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">
                      অবশিষ্ট তহবিল স্থিতি
                    </span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      ৳ {toBengaliNumber(camp.remainingBalance)}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5">
                      ক্যাম্পেইন সমাপনী ব্যালেন্স
                    </span>
                  </div>
                </div>

                {/* Expenses List under Campaign */}
                {camp.expenses && camp.expenses.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      ক্যাম্পেইন খরচের তালিকা ও ভাউচার:
                    </span>
                    <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                      {camp.expenses.map((exp) => (
                        <div key={exp.id} className="p-3 bg-slate-50/40 dark:bg-white/[0.01] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {exp.purpose}
                            </span>
                            <span className="text-[10.5px] text-slate-400">
                              তারিখ: {formatBengaliDate(exp.expenseDate)} • অনুমোদনকারী: {exp.performedBy}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                              - ৳ {toBengaliNumber(exp.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {campaigns.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              কোনো ক্যাম্পেইন রেকর্ড নেই
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          Tree Plantation Details Popup Modal
         ========================================================================= */}
      {selectedTreePlantation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden min-w-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                    নবজাতকের বৃক্ষরোপণ বিবরণ
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    সামাজিক উদ্যোগের বিস্তারিত তথ্য ও ব্যয়ের হিসাব
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTreePlantation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo with click-to-preview */}
            {selectedTreePlantation.images && selectedTreePlantation.images.length > 0 && selectedTreePlantation.images[0] && (
              <div
                className="relative h-44 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 group cursor-pointer"
                onClick={() => setPreviewImage(selectedTreePlantation.images[0])}
              >
                <Image
                  src={selectedTreePlantation.images[0]}
                  alt={selectedTreePlantation.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10.5px] font-medium flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>ছবি বড় করে দেখুন</span>
                </div>
              </div>
            )}

            {/* Child & Amount Top Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#D6F7E5] dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base flex items-center justify-center shrink-0">
                  {getBengaliChildInitial(selectedTreePlantation.childName || selectedTreePlantation.title)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {selectedTreePlantation.childName ? `শিশু ${selectedTreePlantation.childName}` : selectedTreePlantation.title}
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 truncate">
                    {selectedTreePlantation.title}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">মোট ব্যয়</span>
                <span className="font-mono font-black text-brand-emerald text-sm sm:text-base">
                  ৳ {toBengaliNumber(selectedTreePlantation.spent || selectedTreePlantation.budget)}
                </span>
              </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">শিশুর নাম:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTreePlantation.childName || '—'}
                </span>
              </div>
              {selectedTreePlantation.fatherName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">পিতার নাম:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTreePlantation.fatherName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">জন্মস্থান / এলাকা:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTreePlantation.birthPlace || 'মোহাম্মদপুর'}
                </span>
              </div>
              {selectedTreePlantation.plantationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">রোপণের তারিখ:</span>
                  <span className="font-bold text-brand-emerald">
                    {formatBengaliDate(selectedTreePlantation.plantationDate)}
                  </span>
                </div>
              )}
              {selectedTreePlantation.plantationLocation && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">রোপণের স্থান:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTreePlantation.plantationLocation}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">রোপণকৃত গাছ:</span>
                <span className="font-bold text-brand-emerald">
                  {selectedTreePlantation.treesPlanted || '২টি চারা'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5">
                <span className="text-slate-400">স্ট্যাটাস:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10.5px]">
                  রোপণ সম্পন্ন
                </span>
              </div>
            </div>

            {/* Tree items breakdown if present */}
            {selectedTreePlantation.items && selectedTreePlantation.items.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  গাছের তালিকা ও চারা ক্রয়ের খরচ:
                </span>
                <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                  {selectedTreePlantation.items.map((it: any) => (
                    <div key={it.id || it.itemName} className="py-1.5 flex items-center justify-between text-xs px-1">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {it.itemName}
                      </span>
                      <span className="font-mono font-bold text-brand-emerald">
                        ৳ {toBengaliNumber(it.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes / Description */}
            {selectedTreePlantation.description && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="text-[10px] text-slate-400 mb-0.5 font-bold uppercase">বিবরণ / মন্তব্য:</p>
                {selectedTreePlantation.description}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTreePlantation(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Expense Details & Items Breakdown Modal
         ========================================================================= */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    ব্যয়ের পূর্ণাঙ্গ বিবরণ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    তারিখ: {formatBengaliDate(selectedExpense.date)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Expense Info */}
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedExpense.title}
                  </h4>
                  {selectedExpense.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {selectedExpense.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">মোট ব্যয়</span>
                  <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                    - ৳ {toBengaliNumber(selectedExpense.amount)}
                  </span>
                </div>
              </div>

              {/* Badges / Meta */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                  {selectedExpense.fundName}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 font-bold text-brand-emerald text-[11px]">
                  {selectedExpense.category}
                </span>
                {selectedExpense.campaignTitle && selectedExpense.campaignTitle !== selectedExpense.title && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 font-bold text-brand-emerald text-[11px]">
                    ক্যাম্পেইন: {selectedExpense.campaignTitle}
                  </span>
                )}
                {selectedExpense.projectTitle && selectedExpense.projectTitle !== selectedExpense.title && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    প্রকল্প: {selectedExpense.projectTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Items Breakdown Table */}
            {selectedExpense.items && selectedExpense.items.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>আইটেমওয়ারি ব্রেকডাউন ({toBengaliNumber(selectedExpense.items.length)} টি আইটেম):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    মোট: ৳ {toBengaliNumber(selectedExpense.items.reduce((s: number, i: any) => s + (i.amount || 0), 0))}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
                  <table className="w-full text-xs min-w-[360px]">
                    <thead className="bg-slate-100/80 dark:bg-white/[0.05] border-b border-slate-200/80 dark:border-white/10 text-slate-500 font-bold text-[10.5px]">
                      <tr>
                        <th className="py-2.5 px-3 text-left">আইটেমের বিবরণ</th>
                        <th className="py-2.5 px-3 text-left">ক্যাটাগরি</th>
                        <th className="py-2.5 px-3 text-right">মূল্য (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-800 dark:text-slate-200">
                      {selectedExpense.items.map((it: any, idx: number) => (
                        <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {it.itemName}
                            </div>
                            {it.description && (
                              <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                {it.description}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                            {it.category || 'সাধারণ'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            ৳ {toBengaliNumber(it.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-500">
                এই ব্যয়ের অধীনে আলাদা কোনো পণ্যের তালিকা যুক্ত করা নেই।
              </div>
            )}

            {/* Voucher Image / Receipt */}
            {selectedExpense.receiptUrl && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  রশিদ বা ভাউচার প্রমাণ:
                </span>
                <div
                  onClick={() => setPreviewImage(selectedExpense.receiptUrl)}
                  className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 cursor-pointer border border-slate-200/80 dark:border-white/10 hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={selectedExpense.receiptUrl}
                    alt="ভাউচার প্রমাণ"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Image Preview Modal
         ========================================================================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden p-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/90"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-black/40">
              <Image
                src={previewImage}
                alt="রশিদ বা ভাউচার প্রমাণ"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
