'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth/auth-client';
import {
  ShieldCheck,
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
  HeartHandshake,
  Sprout,
  Receipt,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
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
    SUPER_ADMIN: 'সিস্টেম অ্যাডমিন',
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
    // 0. Super Admin / Platform Owner has highest precedence
    const systemRole = (session?.user as any)?.role;
    const userEmail = session?.user?.email;
    if (systemRole === 'SUPER_ADMIN' || userEmail === 'itskausarprodhan@gmail.com') {
      return 'সিস্টেম অ্যাডমিন';
    }

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

  // Unified Expense & Transparency Activity Modal State
  const [trxModalOpen, setTrxModalOpen] = React.useState(false);
  const [entryCategory, setEntryCategory] = React.useState<
    'HUMANITARIAN' | 'TREE_PLANTATION' | 'GENERAL_EXPENSE' | 'INCOME'
  >('HUMANITARIAN');
  const [trxAmount, setTrxAmount] = React.useState<number | string>('');
  const [trxTitle, setTrxTitle] = React.useState('');
  const [trxDesc, setTrxDesc] = React.useState('');
  const [beneficiaryName, setBeneficiaryName] = React.useState('');
  const [assistanceType, setAssistanceType] = React.useState('খাদ্যসামগ্রী বিতরণ');
  const [childName, setChildName] = React.useState('');
  const [fatherName, setFatherName] = React.useState('');
  const [birthPlace, setBirthPlace] = React.useState('মোহাম্মদপুর');
  const [treesPlanted, setTreesPlanted] = React.useState('নিম ও আমলকি (২টি গাছ)');
  const [plantationDate, setPlantationDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmittingTrx, setIsSubmittingTrx] = React.useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = React.useState('');
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Breakdown Items State
  const [expenseItems, setExpenseItems] = React.useState<
    Array<{ itemName: string; amount: number; category?: string; description?: string }>
  >([]);
  const [draftItemName, setDraftItemName] = React.useState('');
  const [draftItemAmount, setDraftItemAmount] = React.useState('');

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন।');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারবে।');
      return;
    }

    setIsUploadingImage(true);
    try {
      const sigRes = await apiClient<ApiResponse<{
        timestamp: number;
        folder: string;
        signature: string;
        apiKey: string;
        cloudName: string;
        resourceType: string;
      }>>('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({
          folder: 'organization',
          resourceType: 'image',
          isRegistration: false,
        }),
      });

      const signData = sigRes.data;
      if (!signData) {
        throw new Error('আপলোড অনুমোদন পাওয়া যায়নি');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType || 'image'}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const asset = await uploadRes.json();
      if (!uploadRes.ok || !asset.secure_url) {
        throw new Error(asset.error?.message || 'ছবি আপলোড সম্পন্ন হয়নি');
      }

      try {
        await apiClient('/uploads/confirm', {
          method: 'POST',
          body: JSON.stringify({
            publicId: asset.public_id,
            secureUrl: asset.secure_url,
            resourceType: 'image',
            format: asset.format || 'jpg',
            bytes: asset.bytes || file.size,
            width: asset.width,
            height: asset.height,
          }),
        });
      } catch {
        // Non-blocking
      }

      setReceiptImageUrl(asset.secure_url);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert(err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে। আপনি সরাসরি ছবির ওয়েব লিংকও দিতে পারেন।');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddExpenseItem = () => {
    if (!draftItemName.trim() || !draftItemAmount || Number(draftItemAmount) <= 0) {
      alert(
        entryCategory === 'TREE_PLANTATION'
          ? 'গাছের নাম ও সঠিক টাকার পরিমাণ দিন।'
          : 'আইটেমের নাম ও সঠিক টাকার পরিমাণ দিন।'
      );
      return;
    }
    const amt = Number(draftItemAmount);
    const updated = [
      ...expenseItems,
      {
        itemName: draftItemName.trim(),
        amount: amt,
      },
    ];
    setExpenseItems(updated);
    const newTotal = updated.reduce((s, it) => s + it.amount, 0);
    setTrxAmount(newTotal);
    setDraftItemName('');
    setDraftItemAmount('');
  };

  const handleRemoveExpenseItem = (index: number) => {
    const updated = expenseItems.filter((_, i) => i !== index);
    setExpenseItems(updated);
    const newTotal = updated.reduce((s, it) => s + it.amount, 0);
    setTrxAmount(newTotal > 0 ? newTotal : '');
  };

  // Financial figures (Synchronized with single source of truth)
  const totalBalance =
    stats?.financialSummary?.netBalance ??
    stats?.funds?.totalBalance ??
    funds.reduce((acc, f) => acc + (f.balance ?? f.currentBalance ?? 0), 0);
  const totalIncome =
    stats?.financialSummary?.totalIncome ??
    stats?.financialSummary?.totalContributions ??
    0;
  const totalExpense = stats?.financialSummary?.totalExpense ?? 0;

  const handleCreateTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedItemsTotal = expenseItems.reduce((s, it) => s + it.amount, 0);
    const finalAmount = expenseItems.length > 0 ? calculatedItemsTotal : (Number(trxAmount) || 0);
    if (finalAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।');
      return;
    }

    const defaultFund = funds.find((f) => f.code === 'GENERAL') || funds[0];
    const defaultFundId = defaultFund?.id;

    setIsSubmittingTrx(true);
    try {
      if (entryCategory === 'HUMANITARIAN') {
        const title = trxTitle.trim() || 'অসহায় পরিবারের জন্য মানবিক সহায়তা';
        await mutations.createProject.mutateAsync({
          title,
          description: trxDesc.trim() || 'মুহাম্মদপুরের অসহায় ও সুবিধাবঞ্চিত পরিবারের জন্য মানবিক সহায়তা কার্যক্রম।',
          category: 'HUMANITARIAN',
          assistanceType: assistanceType.trim() || 'খাদ্য ও নিত্যপণ্য সহায়তা',
          beneficiaryName: beneficiaryName.trim() || 'অসহায় পরিবার',
          consentGiven: true,
          budget: finalAmount,
          spent: finalAmount,
          status: 'COMPLETED',
          isPublic: true,
          images: receiptImageUrl ? [receiptImageUrl] : undefined,
          fundId: defaultFundId,
          items: expenseItems.length > 0 ? expenseItems : undefined,
        });
      } else if (entryCategory === 'TREE_PLANTATION') {
        const cName = childName.trim() || 'নবজাতক শিশু';
        const title = `${cName}-এর জন্ম উপলক্ষ্যে বৃক্ষরোপণ`;
        const computedTrees = expenseItems.length > 0 
          ? expenseItems.map(i => i.itemName).join(', ') 
          : (treesPlanted.trim() || 'নিম ও আমলকি (২টি গাছ)');
        await mutations.createProject.mutateAsync({
          title,
          description: trxDesc.trim() || 'কোনো শিশুর জন্ম হলে তার জন্য দুটি গাছ রোপণ উদ্যোগ।',
          category: 'TREE_PLANTATION',
          childName: cName,
          fatherName: fatherName.trim() || undefined,
          birthPlace: birthPlace.trim() || 'মোহাম্মদপুর',
          treesPlanted: computedTrees,
          plantationLocation: birthPlace.trim() || 'মোহাম্মদপুর',
          plantationDate: plantationDate ? new Date(plantationDate).toISOString() : undefined,
          budget: finalAmount,
          spent: finalAmount,
          status: 'COMPLETED',
          isPublic: true,
          images: receiptImageUrl ? [receiptImageUrl] : undefined,
          fundId: defaultFundId,
          items: expenseItems.length > 0 ? expenseItems : undefined,
        });
      } else if (entryCategory === 'GENERAL_EXPENSE') {
        const title = trxTitle.trim() || 'সাধারণ সাংগঠনিক ব্যয়';
        if (defaultFundId) {
          await mutations.recordTransaction.mutateAsync({
            fundId: defaultFundId,
            type: 'EXPENSE',
            amount: finalAmount,
            title,
            description: trxDesc.trim() || undefined,
            receiptUrl: receiptImageUrl || undefined,
            items: expenseItems.length > 0 ? expenseItems : undefined,
          });
        }
      } else if (entryCategory === 'INCOME') {
        const title = trxTitle.trim() || 'সাধারণ অনুদান / জমা';
        if (defaultFundId) {
          await mutations.recordTransaction.mutateAsync({
            fundId: defaultFundId,
            type: 'INCOME',
            amount: finalAmount,
            title,
            description: trxDesc.trim() || undefined,
            receiptUrl: receiptImageUrl || undefined,
          });
        }
      }

      setTrxModalOpen(false);
      setTrxAmount('');
      setTrxTitle('');
      setTrxDesc('');
      setBeneficiaryName('');
      setChildName('');
      setFatherName('');
      setPlantationDate(new Date().toISOString().split('T')[0]);
      setReceiptImageUrl('');
      setIsUploadingImage(false);
      setExpenseItems([]);
      setDraftItemName('');
      setDraftItemAmount('');
      alert('সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      alert(err.message || 'সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSubmittingTrx(false);
    }
  };

  const adminModules = [
    {
      href: '/organization/admin/users',
      title: 'ওয়েবসাইট ব্যবহারকারী',
      description: 'গুগল ও ইমেইল দিয়ে লগইন করা সাধারণ ব্যবহারকারী ডিরেক্টরি',
      icon: UserCheck,
      badge: `${toBengaliNumber((stats as any)?.userCounts?.total || 0)} জন ইউজার`,
      badgeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    },
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

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl">
            {/* Personalized Welcome Heading with Position & Name */}
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
            </h1>
          </div>

          {/* Action Buttons - Perfectly Aligned Side-by-Side in 1 Row */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEntryCategory('HUMANITARIAN');
                setTrxModalOpen(true);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white text-brand-emerald font-bold text-xs shadow-lg hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-brand-emerald stroke-[2.5] shrink-0" />
              <span>নতুন খরচ ও কার্যক্রম এন্ট্রি</span>
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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* Card 2: মোট জমা */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121F1B] p-3.5 sm:p-5 border border-slate-200/80 dark:border-brand-emerald/30 shadow-soft space-y-1.5 sm:space-y-2 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold truncate">মোট জমা</span>
            </div>
            <div className="text-base sm:text-2xl md:text-3xl font-black text-brand-emerald dark:text-brand-mint tracking-tight whitespace-nowrap">
              ৳ {toBengaliNumber(totalIncome)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-brand-emerald dark:text-emerald-400 font-medium flex items-center gap-1 truncate">
              <span>▲ ৳১৫,০০০ গত সপ্তাহ</span>
            </p>
          </div>

          {/* Card 3: মোট খরচ */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1619] p-3.5 sm:p-5 border border-slate-200/80 dark:border-rose-500/30 shadow-soft space-y-1.5 sm:space-y-2 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold truncate">মোট খরচ</span>
            </div>
            <div className="text-base sm:text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-300 tracking-tight whitespace-nowrap">
              ৳ {toBengaliNumber(totalExpense)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 truncate">
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
          4. Easy Organization Expense & Activity Modal
         ========================================================================= */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-3.5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden min-w-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                    নতুন খরচ ও কার্যক্রম লিপিবদ্ধ
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    মানবিক সহায়তা, বৃক্ষরোপণ বা সাধারণ ব্যয়ের হিসাব সহজেই যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrxModalOpen(false);
                  setReceiptImageUrl('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrx} className="space-y-3.5 sm:space-y-4 text-xs min-w-0">
              {/* Category / Type Selector (Super easy, no jargon, no fund codes) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  কার্যক্রমের ধরন বেছে নিন *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryCategory('HUMANITARIAN')}
                    className={`p-2 sm:p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center min-w-0 ${
                      entryCategory === 'HUMANITARIAN'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/50 dark:border-rose-600 dark:text-rose-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-[10.5px] sm:text-[11px] leading-tight truncate w-full">মানবিক সহায়তা</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('TREE_PLANTATION')}
                    className={`p-2 sm:p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center min-w-0 ${
                      entryCategory === 'TREE_PLANTATION'
                        ? 'bg-emerald-50 border-emerald-400 text-brand-emerald dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sprout className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[10.5px] sm:text-[11px] leading-tight truncate w-full">বৃক্ষরোপণ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('GENERAL_EXPENSE')}
                    className={`p-2 sm:p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center min-w-0 ${
                      entryCategory === 'GENERAL_EXPENSE'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950/50 dark:border-amber-600 dark:text-amber-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[10.5px] sm:text-[11px] leading-tight truncate w-full">সাধারণ ব্যয়</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('INCOME')}
                    className={`p-2 sm:p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center min-w-0 ${
                      entryCategory === 'INCOME'
                        ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/50 dark:border-sky-600 dark:text-sky-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-[10.5px] sm:text-[11px] leading-tight truncate w-full">জমা / অনুদান</span>
                  </button>
                </div>
              </div>

              {/* 1. Field Set: HUMANITARIAN */}
              {entryCategory === 'HUMANITARIAN' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      কার্যক্রমের নাম / শিরোনাম *
                    </label>
                    <input
                      type="text"
                      value={trxTitle}
                      onChange={(e) => setTrxTitle(e.target.value)}
                      placeholder="যেমন: অসহায় পরিবারের জন্য খাদ্য সহায়তা বা চিকিৎসা অনুদান"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        সাহায্যপ্রাপ্ত ব্যক্তি / পরিবার (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        placeholder="যেমন: রহিমা বেগম ও পরিবার"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        সহায়তার ধরন
                      </label>
                      <select
                        value={assistanceType}
                        onChange={(e) => setAssistanceType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      >
                        <option value="খাদ্যসামগ্রী বিতরণ">খাদ্যসামগ্রী বিতরণ</option>
                        <option value="চিকিৎসা সহায়তা">চিকিৎসা সহায়তা</option>
                        <option value="জরুরি ত্রাণ ও আশ্রয়">জরুরি ত্রাণ ও আশ্রয়</option>
                        <option value="শিক্ষা উপকরণ সহায়তা">শিক্ষা উপকরণ সহায়তা</option>
                        <option value="নগদ আর্থিক অনুদান">নগদ আর্থিক অনুদান</option>
                        <option value="অন্যান্য সহায়তা">অন্যান্য সহায়তা</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Field Set: TREE PLANTATION */}
              {entryCategory === 'TREE_PLANTATION' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        নবজাতক শিশুর নাম *
                      </label>
                      <input
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="যেমন: আয়ান আহমেদ"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        পিতার নাম *
                      </label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="যেমন: কামাল হোসেন"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        জন্মস্থান / এলাকা
                      </label>
                      <input
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="যেমন: মোহাম্মদপুর"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        গাছ রোপণের তারিখ *
                      </label>
                      <input
                        type="date"
                        value={plantationDate}
                        onChange={(e) => setPlantationDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      রোপণকৃত ২টি গাছ
                    </label>
                    <input
                      type="text"
                      value={treesPlanted}
                      onChange={(e) => setTreesPlanted(e.target.value)}
                      placeholder="যেমন: নিম ও আমলকি (২টি গাছ)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 3. Field Set: GENERAL_EXPENSE */}
              {entryCategory === 'GENERAL_EXPENSE' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      খরচের বিবরণ / খাত *
                    </label>
                    <input
                      type="text"
                      value={trxTitle}
                      onChange={(e) => setTrxTitle(e.target.value)}
                      placeholder="যেমন: অফিস স্টেশনারি ও ব্যানার প্রিন্ট"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 4. Field Set: INCOME */}
              {entryCategory === 'INCOME' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      জমার খাত / শিরোনাম *
                    </label>
                    <input
                      type="text"
                      value={trxTitle}
                      onChange={(e) => setTrxTitle(e.target.value)}
                      placeholder="যেমন: সদস্য অনুদান জমা বা সাধারণ দান"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Optional Itemized Breakdown (For Humanitarian, Tree Plantation, or General Expense) */}
              {entryCategory !== 'INCOME' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {entryCategory === 'TREE_PLANTATION' ? (
                          <>
                            <Sprout className="w-3.5 h-3.5 text-brand-emerald" />
                            <span>গাছের তালিকা ও চারা ক্রয়ের খরচ (ঐচ্ছিক)</span>
                          </>
                        ) : entryCategory === 'HUMANITARIAN' ? (
                          <>
                            <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                            <span>সহায়তা সামগ্রীর তালিকা ও খরচ (ঐচ্ছিক)</span>
                          </>
                        ) : (
                          <>
                            <Receipt className="w-3.5 h-3.5 text-brand-emerald" />
                            <span>খরচের বিস্তারিত জিনিসপত্র (ঐচ্ছিক তালিকা)</span>
                          </>
                        )}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {entryCategory === 'TREE_PLANTATION'
                          ? 'প্রতিটি গাছের নাম ও চারা কেনার দাম আলাদা করে যোগ করতে পারেন'
                          : entryCategory === 'HUMANITARIAN'
                          ? 'চাল, ডাল, তেল বা ওষুধের মতো আলাদা আলাদা জিনিসের দাম সহজে যোগ করতে পারেন'
                          : 'স্টেশনারি, ব্যানার বা আনুষঙ্গিক খরচের দাম সহজে যোগ করতে পারেন'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={draftItemName}
                      onChange={(e) => setDraftItemName(e.target.value)}
                      placeholder={
                        entryCategory === 'TREE_PLANTATION'
                          ? 'গাছের নাম (যেমন: নিম বা আম চারা)'
                          : entryCategory === 'HUMANITARIAN'
                          ? 'আইটেম (যেমন: চাল, ডাল)'
                          : 'আইটেম / খরচের খাত'
                      }
                      className="flex-1 min-w-0 w-full px-3 py-2 sm:py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        value={draftItemAmount}
                        onChange={(e) => setDraftItemAmount(e.target.value)}
                        placeholder={entryCategory === 'TREE_PLANTATION' ? 'টাকা (যেমন: ৫০০)' : 'টাকা (যেমন: ২০০০)'}
                        className="flex-1 sm:w-28 min-w-0 px-3 py-2 sm:py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 outline-none text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddExpenseItem}
                        className="px-4 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 dark:bg-white/15 text-white font-bold text-xs hover:bg-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        + যোগ
                      </button>
                    </div>
                  </div>

                  {expenseItems.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-white/10">
                      <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-28 overflow-y-auto pr-1">
                        {expenseItems.map((item, idx) => (
                          <div key={idx} className="py-1.5 sm:py-1 flex items-center justify-between text-xs gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate min-w-0">
                              {item.itemName}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                ৳ {toBengaliNumber(item.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExpenseItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোট টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={expenseItems.length > 0 ? expenseItems.reduce((s, it) => s + it.amount, 0) : trxAmount}
                  onChange={(e) => {
                    if (expenseItems.length === 0) {
                      setTrxAmount(e.target.value);
                    }
                  }}
                  readOnly={expenseItems.length > 0}
                  placeholder="যেমন: ৫০০০"
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-mono text-xs font-bold transition-colors ${
                    expenseItems.length > 0
                      ? 'bg-slate-200/70 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-100 cursor-not-allowed select-none'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                  }`}
                  required
                />
                {expenseItems.length > 0 ? (
                  <p className="text-[10.5px] text-brand-emerald dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <span>✓</span>
                    <span>উপরের খরচের তালিকা থেকে স্বয়ংক্রিয়ভাবে মোট হিসাব নির্ধারিত হয়েছে (এডিট লক করা)</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    যদি উপরের তালিকা যোগ না করেন, তবে এখানে সরাসরি মোট পরিমাণ লিখুন
                  </p>
                )}
              </div>

              {/* Image / Voucher / Activity Photo Upload Field */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {entryCategory === 'TREE_PLANTATION'
                    ? 'গাছ রোপণের ছবি বা রসিদ (ঐচ্ছিক)'
                    : entryCategory === 'HUMANITARIAN'
                    ? 'সহায়তা কার্যক্রম বা রসিদের ছবি (ঐচ্ছিক)'
                    : 'ভাউচার / রসিদের ছবি (ঐচ্ছিক)'}
                </label>

                {receiptImageUrl ? (
                  <div className="relative rounded-2xl border border-emerald-200 dark:border-emerald-800/60 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0 border border-slate-300 dark:border-white/10">
                        <img
                          src={receiptImageUrl}
                          alt="Uploaded voucher/photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          ছবি যুক্ত করা হয়েছে
                        </p>
                        <a
                          href={receiptImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brand-emerald hover:underline truncate inline-flex items-center gap-1 font-medium"
                        >
                          ছবি দেখুন
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImageUrl('')}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="ছবি মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors text-xs font-semibold">
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-brand-emerald" />
                          <span>ছবি আপলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-brand-emerald" />
                          <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  অতিরিক্ত মন্তব্য বা ভাউচার রসিদ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={trxDesc}
                  onChange={(e) => setTrxDesc(e.target.value)}
                  placeholder="রসিদ নম্বর, ভাউচার বা সংশ্লিষ্ট বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none resize-none text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setTrxModalOpen(false);
                    setReceiptImageUrl('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrx}
                  className="px-5 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-colors"
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
