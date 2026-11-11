'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  Vote,
  Search,
  Trash2,
  Award,
  Loader2,
  TrendingUp,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Pencil,
  Clock,
  ChevronLeft,
  CreditCard,
  Play,
  Square,
  BarChart3,
  Heart,
  Receipt,
  HeartHandshake,
  Sprout,
  Upload,
} from 'lucide-react';
import {
  useOrgAdminStatsQuery,
  useOrgApplicationsQuery,
  useOrgFundsQuery,
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
import { notificationAudio } from '@/lib/audio/notificationSound';
import { OrganizationMemberManagement } from '@/features/organization/components/OrganizationMemberManagement';
import { MonthlyContributionTracking } from '@/features/organization/components/MonthlyContributionTracking';
import { CommitteeRoleManagementSection } from '@/features/organization/components/CommitteeRoleManagementSection';
import { CampaignAdminManagement } from '@/features/campaign/components/CampaignAdminManagement';
import { RegisteredUsersManagement } from '@/features/organization/components/RegisteredUsersManagement';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/feedback/Toast';
import { useAdminNav } from '@/features/organization/context/AdminNavContext';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

const MODULE_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  users: {
    title: 'ওয়েবসাইট সাধারণ ব্যবহারকারী ডিরেক্টরি',
    subtitle: 'ওয়েবসাইটে গুগল বা ইমেইল দিয়ে লগইন করা সকল সাধারণ ব্যবহারকারীর তালিকা (সদস্য ও সাধারণ ব্যবহারকারী পৃথক)',
    icon: Users,
  },
  members: {
    title: 'সংগঠন সদস্য ব্যবস্থাপনা ও ডিরেক্টরি',
    subtitle: 'নিবন্ধিত সদস্যদের তথ্য, পদবি নির্ধারণ, মাসিক চাঁদা আদায় স্ট্যাটাস ও সদস্যপদ নিয়ন্ত্রণ',
    icon: Users,
  },
  applications: {
    title: 'সদস্যপদ আবেদন পর্যালোচনা',
    subtitle: 'আবেদনকারীর তথ্য যাচাই করে সদস্যপদ অনুমোদন বা বাতিল করুন',
    icon: FileText,
  },
  contributions: {
    title: 'মাসিক চাঁদা ট্র্যাকিং ও তাগিদ ড্যাশবোর্ড',
    subtitle: 'সদস্যদের নিয়মিত মাসিক চাঁদা আদায় হিসেব ও স্বয়ংক্রিয় তাগিদ বার্তা',
    icon: CreditCard,
  },
  funds: {
    title: 'কল্যাণ তহবিল ও বাজেট ব্যবস্থাপনা',
    subtitle: 'সংগঠনের নির্ধারিত সামাজিক, শিক্ষা, চিকিৎসা ও জরুরি তহবিলের বর্তমান স্থিতি ও খতিয়ান',
    icon: Wallet,
  },
  transactions: {
    title: 'লেনদেন ও চাঁদা আদায় লেজার',
    subtitle: 'সকল তহবিলের জমা-খরচ এবং সদস্যদের মাসিক অনুদানের হিসাব খাতা',
    icon: TrendingUp,
  },
  committees: {
    title: 'সাংগঠনিক কাঠামো ও কার্যনির্বাহী পরিষদ',
    subtitle: 'সংগঠনের আনুষ্ঠানিক পদবি, দায়িত্ব ও কার্যনির্বাহী কমিটির তালিকা',
    icon: Award,
  },
  notices: {
    title: 'প্রাতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তি ব্যবস্থাপনা',
    subtitle: 'সাধারণ সদস্য ও সাধারণ জনগণের জন্য জরুরি নোটিশ, সার্কুলার ও মিটিং আপডেট প্রকাশ',
    icon: FileText,
  },
  elections: {
    title: 'ডিজিটাল নির্বাচন পরিচালনা ও ব্যালট মনিটরিং',
    subtitle: 'তফশিল ঘোষণা, স্বয়ংক্রিয় শিডিউলিং, লাইভ ব্যালট মনিটরিং এবং ফলাফল চূড়ান্তকরণ',
    icon: Vote,
  },
  campaigns: {
    title: 'ক্যাম্পেইন ও দান অনুদান ব্যবস্থাপনা',
    subtitle: 'জনকল্যাণমূলক ক্যাম্পেইন পরিচালনা, দান যাচাই ও পৃথক আর্থিক খতিয়ান',
    icon: Heart,
  },
};

export default function AdminModulePage() {
  const router = useRouter();
  const params = useParams();
  const rawModule = params?.module;
  const moduleKey = (Array.isArray(rawModule) ? rawModule[0] : rawModule)?.toLowerCase() || '';

  React.useEffect(() => {
    if (moduleKey === 'funds') {
      router.replace('/organization/admin/contributions');
    }
  }, [moduleKey, router]);

  const { setBadgeCounts } = useAdminNav();

  // Application Filters & Search
  const [appFilter, setAppFilter] = React.useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Transactions Sub-filter
  const [trxView, setTrxView] = React.useState<'FUNDS' | 'PAYMENTS'>('PAYMENTS');

  // Queries
  const { data: stats } = useOrgAdminStatsQuery();
  const { data: applications = [], isLoading: appsLoading } = useOrgApplicationsQuery(
    appFilter === 'ALL' ? undefined : appFilter,
  );
  const { data: funds = [] } = useOrgFundsQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const { data: notices = [] } = useOrgNoticesQuery();
  const mutations = useOrgMutations();

  React.useEffect(() => {
    setBadgeCounts({
      fundsCount: funds.length,
      noticesCount: notices.length,
    });
  }, [funds.length, notices.length, setBadgeCounts]);

  // Modals state
  const [reviewModalApp, setReviewModalApp] = React.useState<OrgApplication | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [trxModalOpen, setTrxModalOpen] = React.useState(false);
  const [noticeModalOpen, setNoticeModalOpen] = React.useState(false);
  const [electionModalOpen, setElectionModalOpen] = React.useState(false);

  // Professional Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = React.useState<{
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'primary';
    confirmText?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Unified Expense & Transparency Activity Modal State
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
  const [viewingTrxDetails, setViewingTrxDetails] = React.useState<any | null>(null);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন।');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট (10MB) হতে পারবে।');
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
      toast.error(err?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে। আপনি সরাসরি ছবির ওয়েব লিংকও দিতে পারেন।');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddExpenseItem = () => {
    if (!draftItemName.trim() || !draftItemAmount || Number(draftItemAmount) <= 0) {
      toast.warning(
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
      toast.success(status === 'APPROVED' ? 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে।' : 'আবেদনটি বাতিল করা হয়েছে।');
    } catch (err: any) {
      toast.error(err.message || 'পর্যালোচনা সম্পন্ন করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleQuickApprove = async (appId: string) => {
    try {
      await mutations.reviewApplication.mutateAsync({
        id: appId,
        status: 'APPROVED',
      });
      toast.success('আবেদনটি দ্রুত অনুমোদন করা হয়েছে।');
    } catch (err: any) {
      toast.error(err.message || 'অনুমোদন ব্যর্থ হয়েছে।');
    }
  };

  const handleCreateTrx = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedItemsTotal = expenseItems.reduce((s, it) => s + it.amount, 0);
    const finalAmount = expenseItems.length > 0 ? calculatedItemsTotal : (Number(trxAmount) || 0);
    if (finalAmount <= 0) {
      toast.warning('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।');
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
          description: trxDesc.trim() || 'মোহাম্মদপুরের অসহায় ও সুবিধাবঞ্চিত পরিবারের জন্য মানবিক সহায়তা কার্যক্রম।',
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
          ? expenseItems.map((i) => i.itemName).join(', ')
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
        if (!defaultFundId) {
          toast.error('কোনো সক্রিয় তহবিল পাওয়া যায়নি।');
          return;
        }
        await mutations.recordTransaction.mutateAsync({
          fundId: defaultFundId,
          type: 'EXPENSE',
          amount: finalAmount,
          title: trxTitle.trim() || 'সাধারণ প্রাতিষ্ঠানিক খরচ',
          description: trxDesc.trim() || undefined,
          receiptUrl: receiptImageUrl || undefined,
          items: expenseItems.length > 0 ? expenseItems : undefined,
        });
      } else if (entryCategory === 'INCOME') {
        if (!defaultFundId) {
          toast.error('কোনো সক্রিয় তহবিল পাওয়া যায়নি।');
          return;
        }
        await mutations.recordTransaction.mutateAsync({
          fundId: defaultFundId,
          type: 'INCOME',
          amount: finalAmount,
          title: trxTitle.trim() || 'সাধারণ অনুদান / জমা',
          description: trxDesc.trim() || undefined,
          receiptUrl: receiptImageUrl || undefined,
        });
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
      toast.success('সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      toast.error(err.message || 'সংরক্ষণে সমস্যা হয়েছে।');
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
      toast.warning('শিরোনাম ও বিবরণ আবশ্যক।');
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
        toast.success('বিজ্ঞপ্তি হালনাগাদ করা হয়েছে।');
      } else {
        await mutations.createNotice.mutateAsync({
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          priority: noticePriority,
          isPinned: false,
          isPublic: noticeIsPublic,
        });
        toast.success('নতুন বিজ্ঞপ্তি প্রকাশ করা হয়েছে।');
      }
      setNoticeModalOpen(false);
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err: any) {
      toast.error(err.message || 'বিজ্ঞপ্তি সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const handleToggleVotingConfig = async () => {
    const nextState = !isVotingEnabled;
    try {
      await mutations.updateVotingConfig.mutateAsync({ isVotingEnabled: nextState });
      toast.success(nextState ? 'ভোটিং সিস্টেম সক্রিয় করা হয়েছে' : 'ভোটিং সিস্টেম সাময়িকভাবে স্থগিত করা হয়েছে');
    } catch (err: any) {
      toast.error(err.message || 'ভোট সিস্টেম কনফিগারেশন আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleUploadCandidateImage = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন।');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('ছবির আকার সর্বোচ্চ ১০ মেগাবাইট হতে পারবে।');
      return;
    }

    setUploadingCandidateIdx(index);

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
      // Continue
    }

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
      toast.error('ভোটিং সিস্টেম বর্তমানে স্থগিত রয়েছে। নতুন নির্বাচন তৈরি করতে প্রথমে উপরে ভোটিং সিস্টেম সক্রিয় করুন।');
      return;
    }
    if (!pollTitle.trim()) {
      toast.warning('ভোটের শিরোনাম আবশ্যক।');
      return;
    }
    if (!pollPosition.trim()) {
      toast.warning('পদের নাম আবশ্যক।');
      return;
    }
    const validCandidates = pollCandidates.filter((c) => c.name.trim().length > 0);
    if (validCandidates.length < 2) {
      toast.warning('কমপক্ষে ২ জন প্রার্থীর নাম আবশ্যক।');
      return;
    }
    if (!pollStartDate || !pollEndDate) {
      toast.warning('ভোটের শুরু ও সমাপ্তির সময় নির্ধারণ করুন।');
      return;
    }
    if (new Date(pollEndDate) <= new Date(pollStartDate)) {
      toast.warning('সমাপ্তির সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।');
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

      toast.success(isDraft ? 'নির্বাচনের খসড়া সংরক্ষিত হয়েছে' : 'নতুন নির্বাচন সফলভাবে তৈরি হয়েছে');
      setElectionModalOpen(false);
      setPollTitle('');
      setPollPosition('সভাপতি');
      setPollDesc('');
      setPollCandidates([
        { name: '', image: '', bio: '' },
        { name: '', image: '', bio: '' },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'ভোট তৈরি করতে ব্যর্থ হয়েছে');
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
      toast.success('সময়সূচি সফলভাবে হালনাগাদ করা হয়েছে');
      setScheduleModalElection(null);
    } catch (err: any) {
      toast.error(err.message || 'সময়সূচি হালনাগাদ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleStartVoting = (electionId: string, title: string) => {
    setConfirmDialog({
      title: 'ভোটগ্রহণ শুরু',
      description: `"${title}" নির্বাচনের লাইভ ভোটগ্রহণ শুরু করতে চান? এর ফলে সক্রিয় সদস্যরা ভোটকেন্দ্রে ব্যালট দেখতে পাবেন ও ভোট দিতে পারবেন।`,
      variant: 'primary',
      confirmText: 'ভোটগ্রহণ শুরু করুন',
      onConfirm: async () => {
        await mutations.updateElectionStatus.mutateAsync({
          electionId,
          status: 'VOTING_ACTIVE',
        });
        toast.success('ভোটগ্রহণ সফলভাবে শুরু হয়েছে');
      },
    });
  };

  const handleCloseVoting = (electionId: string, title: string) => {
    setConfirmDialog({
      title: 'ভোটগ্রহণ সমাপ্তি',
      description: `"${title}" নির্বাচনের ভোটগ্রহণ সমাপ্ত করতে চান? এর পর আর কোনো নতুন ভোট গ্রহণ করা হবে না।`,
      variant: 'warning',
      confirmText: 'ভোটগ্রহণ সমাপ্ত করুন',
      onConfirm: async () => {
        await mutations.updateElectionStatus.mutateAsync({
          electionId,
          status: 'VOTING_CLOSED',
        });
        toast.success('ভোটগ্রহণ সমাপ্ত করা হয়েছে');
      },
    });
  };

  const handleFinalizeElection = (electionId: string, title: string) => {
    setConfirmDialog({
      title: 'ফলাফল চূড়ান্তকরণ',
      description: `"${title}" নির্বাচনের ফলাফল চূড়ান্ত করতে চান? এর ফলে বিজয়ী প্রার্থীকে কার্যনির্বাহী পদবি স্বয়ংক্রিয়ভাবে প্রদান করা হবে।`,
      variant: 'primary',
      confirmText: 'ফলাফল চূড়ান্ত করুন',
      onConfirm: async () => {
        await mutations.finalizeElection.mutateAsync({ electionId });
        toast.success('নির্বাচনের ফলাফল চূড়ান্ত করা হয়েছে');
      },
    });
  };

  const handleDeleteElection = (electionId: string, title: string) => {
    setConfirmDialog({
      title: 'নির্বাচন মুছে ফেলা',
      description: `আপনি কি নিশ্চিত যে "${title}" নির্বাচনটি স্থায়ীভাবে মুছে ফেলতে চান?`,
      variant: 'danger',
      confirmText: 'মুছে ফেলুন',
      onConfirm: async () => {
        await mutations.deleteElection.mutateAsync({ electionId });
        toast.success('নির্বাচনটি সফলভাবে মুছে ফেলা হয়েছে');
      },
    });
  };

  const handleDeleteNotice = (noticeId: string, title: string) => {
    setConfirmDialog({
      title: 'বিজ্ঞপ্তি মুছে ফেলা',
      description: `আপনি কি নিশ্চিত যে "${title}" বিজ্ঞপ্তিটি মুছে ফেলতে চান?`,
      variant: 'danger',
      confirmText: 'মুছে ফেলুন',
      onConfirm: async () => {
        await mutations.deleteNotice.mutateAsync({ noticeId });
        toast.success('বিজ্ঞপ্তিটি সফলভাবে মুছে ফেলা হয়েছে');
      },
    });
  };

  const meta = MODULE_META[moduleKey];

  if (!meta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          মডিউলটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          অনুগ্রহ করে সঠিক মডিউল নির্বাচন করুন অথবা অ্যাডমিন ড্যাশবোর্ডে ফিরে যান।
        </p>
        <div className="pt-2">
          <Link
            href="/organization/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>অ্যাডমিন ড্যাশবোর্ডে ফিরুন</span>
          </Link>
        </div>
      </div>
    );
  }

  const ModuleIcon = meta.icon;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <Link
          href="/organization/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>ড্যাশবোর্ডে ফিরুন</span>
        </Link>

        <span className="text-slate-300 dark:text-white/20">|</span>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ModuleIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-brand-emerald dark:text-emerald-400">
            {meta.title.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* =========================================================================
          MODULE 0: REGISTERED WEBSITE USERS (GENERAL USERS DIRECTORY)
         ========================================================================= */}
      {moduleKey === 'users' && <RegisteredUsersManagement />}

      {/* =========================================================================
          MODULE 1: MEMBERS
         ========================================================================= */}
      {moduleKey === 'members' && <OrganizationMemberManagement />}

      {/* =========================================================================
          MODULE 2: CONTRIBUTIONS
         ========================================================================= */}
      {moduleKey === 'contributions' && <MonthlyContributionTracking />}

      {/* =========================================================================
          MODULE 3: APPLICATIONS
         ========================================================================= */}
      {moduleKey === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {meta.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-brand-emerald dark:text-brand-mint bg-brand-emerald/10">
                  {toBengaliNumber(filteredApplications.length)} টি আবেদন
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {meta.subtitle}
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
                  অপেক্ষমাণ
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
                      <td className="py-3.5 px-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative ring-1 ring-brand-emerald/20">
                            {app.user?.image ? (
                              <Image
                                src={app.user.image}
                                alt={app.fullName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              app.fullName?.charAt(0) || 'আ'
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block group-hover:text-brand-emerald transition-colors leading-tight">
                              {app.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                              পেশা: {app.profession}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 min-w-[170px] text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{app.phone}</span>
                        </div>
                        {app.user?.email && (
                          <div className="flex items-center gap-1.5 text-[11px] truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{app.user.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 min-w-[130px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="font-bold text-brand-emerald dark:text-brand-mint text-xs">
                          ৳ {toBengaliNumber(app.monthlyContribution || 0)} / মাস
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{new Date(app.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center min-w-[100px]">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : app.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {app.status === 'PENDING'
                            ? 'অপেক্ষমাণ'
                            : app.status === 'APPROVED'
                            ? 'অনুমোদিত'
                            : 'বাতিলকৃত'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right min-w-[90px] whitespace-nowrap">
                        {app.status === 'PENDING' ? (
                          <div className="inline-flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickApprove(app.id);
                                notificationAudio.play(1.0);
                              }}
                              className="text-emerald-500 hover:text-emerald-400 hover:scale-125 active:scale-75 transition-transform cursor-pointer p-1"
                              title="আবেদন অনুমোদন করুন"
                              aria-label="অনুমোদন করুন"
                            >
                              <Check className="w-5 h-5 stroke-[2.5]" />
                            </button>
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
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 4: FUNDS (Removed per organization policy)
         ========================================================================= */}
      {moduleKey === 'funds' && null}

      {/* =========================================================================
          MODULE 5: TRANSACTIONS
         ========================================================================= */}
      {moduleKey === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {meta.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-brand-emerald dark:text-brand-mint bg-brand-emerald/10">
                  {toBengaliNumber((stats?.recentTransactions?.length || 0) + (stats?.recentPayments?.length || 0))} টি রেকর্ড
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {meta.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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

              <button
                type="button"
                onClick={() => {
                  setEntryCategory('HUMANITARIAN');
                  setTrxModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ নতুন খরচ ও কার্যক্রম এন্ট্রি</span>
              </button>
            </div>
          </div>

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
                          {tx.items && tx.items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setViewingTrxDetails(tx)}
                              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              <Receipt className="w-3 h-3 text-brand-emerald" />
                              <span>{toBengaliNumber(tx.items.length)} টি আইটেম ব্রেকডাউন</span>
                            </button>
                          )}
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
                    তহবিল মডিউলে গিয়ে লেনদেন এন্ট্রি দিন।
                  </p>
                </div>
              )}
            </div>
          )}

          {trxView === 'PAYMENTS' && (
            <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5 min-w-[560px]">
                  {stats.recentPayments.map((p) => {
                    const isPending = p.status === 'PENDING';
                    const isRejected = p.status === 'REJECTED';

                    return (
                      <div
                        key={p.id}
                        className="py-3 px-2 sm:px-3 grid grid-cols-[minmax(180px,1.4fr)_minmax(150px,1.1fr)_minmax(140px,auto)] items-center gap-4 sm:gap-6 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
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
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              মাসিক কিস্তি • {toBengaliNumber(p.periodMonth)}/{toBengaliNumber(p.periodYear)}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-mono truncate">
                            {p.user?.phone ? p.user.phone : '—'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {p.paymentMethod && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {p.paymentMethod}
                              </span>
                            )}
                            {p.trxId && (
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={p.trxId}>
                                Trx: {p.trxId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end text-right justify-center shrink-0">
                          <div
                            className={`font-mono font-bold text-xs sm:text-sm ${
                              isPending
                                ? 'text-amber-600 dark:text-amber-400'
                                : isRejected
                                ? 'text-rose-600 dark:text-rose-400 line-through'
                                : 'text-brand-emerald dark:text-brand-mint'
                            }`}
                          >
                            + ৳ {toBengaliNumber(p.amount)}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                            {isPending ? (
                              <Link
                                href="/organization/admin/contributions"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-colors whitespace-nowrap cursor-pointer"
                                title="মাসিক চাঁদা ট্র্যাকিং ড্যাশবোর্ডে গিয়ে যাচাই করুন"
                              >
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>যাচাই অপেক্ষমাণ</span>
                                <span className="text-[9px] opacity-75 font-normal">→ যাচাই</span>
                              </Link>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                                <X className="w-2.5 h-2.5" />
                                বাতিলকৃত
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                                পরিশোধিত
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          MODULE 6: COMMITTEES & DESIGNATIONS
         ========================================================================= */}
      {moduleKey === 'committees' && (
        <CommitteeRoleManagementSection />
      )}

      {/* =========================================================================
          MODULE 7: NOTICES
         ========================================================================= */}
      {moduleKey === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {meta.title}
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
                      <td className="py-3 px-3 min-w-[240px] max-w-[380px]">
                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors line-clamp-1">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.content}
                        </div>
                      </td>

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
          MODULE 8: ELECTIONS
         ========================================================================= */}
      {moduleKey === 'elections' && (
        <div className="space-y-5">
          <div className="flex items-start sm:items-center justify-between gap-3 pb-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {meta.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-amber-500 bg-amber-500/10 shrink-0">
                  {toBengaliNumber(elections.length)} টি নির্বাচন
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {meta.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isVotingEnabled) {
                  toast.warning('ভোটিং সিস্টেম বর্তমানে স্থগিত রয়েছে। নতুন নির্বাচন তৈরি করতে প্রথমে ভোটিং সিস্টেম সক্রিয় করুন।');
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

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 space-y-4">
            <div className="pb-3 border-b border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  গ্লোবাল ভোটিং সিস্টেম কন্ট্রোল
                </h3>
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

                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {elec.title}
                        </h4>
                        {elec.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {elec.description}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
                          <span>
                            শুরু: {new Date(elec.votingStartDate).toLocaleString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>
                            সমাপ্তি: {new Date(elec.votingEndDate).toLocaleString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {elec.positions?.[0]?.nominations && elec.positions[0].nominations.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">প্রার্থী:</span>
                            {elec.positions[0].nominations.map((cand) => (
                              <div
                                key={cand.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-[11px]"
                              >
                                <CandidateAvatar
                                  src={cand.candidatePhoto || cand.user?.image}
                                  name={cand.candidateName || cand.user?.name}
                                  className="w-4 h-4 rounded-full"
                                  textClassName="text-[8px] font-bold text-amber-600"
                                />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {cand.candidateName || cand.user?.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => setMonitoringElectionId(elec.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                          title="লাইভ ব্যালট ও ভোটার মনিটর"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-brand-emerald" />
                          <span>ফলাফল</span>
                        </button>

                        {!isLive && !isCompleted && elec.status !== 'FINALIZED' && (
                          <button
                            type="button"
                            onClick={() => handleStartVoting(elec.id, elec.title)}
                            disabled={mutations.updateElectionStatus.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>ভোট শুরু</span>
                          </button>
                        )}

                        {isLive && (
                          <button
                            type="button"
                            onClick={() => handleCloseVoting(elec.id, elec.title)}
                            disabled={mutations.updateElectionStatus.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>ভোট সমাপ্ত</span>
                          </button>
                        )}

                        {elec.status === 'VOTING_CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleFinalizeElection(elec.id, elec.title)}
                            disabled={mutations.finalizeElection.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>ফলাফল চূড়ান্ত</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setScheduleModalElection(elec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          title="ভোটের সময়সূচি পরিবর্তন"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>সময়</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteElection(elec.id, elec.title)}
                          disabled={mutations.deleteElection.isPending}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="নির্বাচন মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                কোনো নির্বাচন রেকর্ড নেই
              </h3>
              <p className="text-xs text-slate-500">
                নতুন নির্বাচন তৈরি করতে উপরের বোতামটি চাপুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Transaction / Expense Entry Modal */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-3.5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                    নতুন খরচ ও কার্যক্রম এন্ট্রি
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    সহজেই সংগঠনের যেকোনো খরচ, অনুদান বা সহায়তা কার্যক্রম লিপিবদ্ধ করুন
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
              {/* Category Quick Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  কার্যক্রম বা খরচের খাত বেছে নিন *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEntryCategory('HUMANITARIAN')}
                    className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center ${
                      entryCategory === 'HUMANITARIAN'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/50 dark:border-rose-600 dark:text-rose-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-rose-500" />
                    <span className="text-[11px] leading-tight">মানবিক সহায়তা</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('TREE_PLANTATION')}
                    className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center ${
                      entryCategory === 'TREE_PLANTATION'
                        ? 'bg-emerald-50 border-emerald-400 text-brand-emerald dark:bg-emerald-950/50 dark:border-emerald-600 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sprout className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] leading-tight">বৃক্ষরোপণ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('GENERAL_EXPENSE')}
                    className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center ${
                      entryCategory === 'GENERAL_EXPENSE'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-950/50 dark:border-amber-600 dark:text-amber-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px] leading-tight">সাধারণ ব্যয়</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryCategory('INCOME')}
                    className={`p-2.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border text-center ${
                      entryCategory === 'INCOME'
                        ? 'bg-sky-50 border-sky-400 text-sky-700 dark:bg-sky-950/50 dark:border-sky-600 dark:text-sky-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-sky-600" />
                    <span className="text-[11px] leading-tight">জমা / অনুদান</span>
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

      {/* 1.5 Viewing Transaction Breakdown Modal */}
      {viewingTrxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
                  <Receipt className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    খরচের আইটেমাইজড ব্রেকডাউন
                  </h3>
                  <p className="text-[11px] text-slate-500">{viewingTrxDetails.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTrxDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">তহবিল: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingTrxDetails.fund?.name || 'তহবিল'}</span>
              </div>
              <div>
                <span className="text-slate-500">সর্বমোট ব্যয়: </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">৳ {toBengaliNumber(Math.abs(viewingTrxDetails.amount))}</span>
              </div>
            </div>

            {viewingTrxDetails.items && viewingTrxDetails.items.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-left text-xs min-w-[340px]">
                  <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">খরচের বিবরণ</th>
                      <th className="py-2 px-3">খাত / ক্যাটাগরি</th>
                      <th className="py-2 px-3 text-right">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {viewingTrxDetails.items.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 dark:text-white">{item.itemName}</span>
                          {item.description && (
                            <p className="text-[10px] text-slate-400">{item.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {item.category || 'সাধারণ'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳ {toBengaliNumber(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-white/5 font-bold">
                      <td colSpan={2} className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        মোট খরচ
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        ৳ {toBengaliNumber(viewingTrxDetails.items.reduce((s: number, i: any) => s + i.amount, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">এই লেনদেনের কোনো পৃথক আইটেম তালিকা নেই।</p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTrxDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rejection Modal */}
      {reviewModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">
                আবেদন বাতিলের কারণ
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{reviewModalApp.fullName}</strong>-এর আবেদনটি বাতিলের সুনির্দিষ্ট কারণ উল্লেখ করুন।
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="বাতিলের কারণ লিখুন (যেমন: অপূর্ণ তথ্য, অস্পষ্ট ছবি ইত্যাদি)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs outline-none focus:border-rose-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={mutations.reviewApplication.isPending}
                onClick={() => handleReviewAction('REJECTED')}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingNotice ? 'বিজ্ঞপ্তি সম্পাদনা' : 'নতুন বিজ্ঞপ্তি প্রকাশ'}
              </h3>
              <button
                type="button"
                onClick={() => setNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিজ্ঞপ্তির শিরোনাম *
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="যেমন: জরুরি মাসিক সাধারণ সভা আহ্বান"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  গুরুত্ব / ধরন
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoticePriority('NORMAL')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                      noticePriority === 'NORMAL'
                        ? 'bg-brand-emerald text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    সাধারণ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticePriority('URGENT')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                      noticePriority === 'URGENT'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    জরুরি
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিজ্ঞপ্তির বিষয়বস্তু *
                </label>
                <textarea
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="বিস্তারিত বিবরণ, তারিখ ও স্থান..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="noticePublic"
                  checked={noticeIsPublic}
                  onChange={(e) => setNoticeIsPublic(e.target.checked)}
                  className="rounded text-brand-emerald"
                />
                <label htmlFor="noticePublic" className="font-semibold text-slate-700 dark:text-slate-300">
                  সর্বজনীন নোটিশ বোর্ডে প্রদর্শন করুন
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  className="px-5 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow-xs hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingNotice && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingNotice ? 'আপডেট করুন' : 'প্রকাশ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Election Modal */}
      {electionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                নতুন গণতান্ত্রিক নির্বাচন ও ভোটিং পোল
              </h3>
              <button
                type="button"
                onClick={() => setElectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নির্বাচনের শিরোনাম *
                </label>
                <input
                  type="text"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="যেমন: কার্যনির্বাহী পরিষদ নির্বাচন ২০২৬"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পদের নাম *
                </label>
                <input
                  type="text"
                  value={pollPosition}
                  onChange={(e) => setPollPosition(e.target.value)}
                  placeholder="যেমন: সভাপতি / সাধারণ সম্পাদক"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    শুরুর সময় *
                  </label>
                  <input
                    type="datetime-local"
                    value={pollStartDate}
                    onChange={(e) => setPollStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সমাপ্তির সময় *
                  </label>
                  <input
                    type="datetime-local"
                    value={pollEndDate}
                    onChange={(e) => setPollEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
                  />
                </div>
              </div>

              {/* Candidates list */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    প্রার্থীদের তালিকা (কমপক্ষে ২ জন) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPollCandidates((prev) => [...prev, { name: '', image: '', bio: '' }])
                    }
                    className="text-brand-emerald font-bold text-[11px] hover:underline"
                  >
                    + প্রার্থী যোগ করুন
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pollCandidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cand.name}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPollCandidates((prev) => {
                              const next = [...prev];
                              const cur = next[idx] ?? { name: '', image: '', bio: '' };
                              next[idx] = { name: v, image: cur.image, bio: cur.bio };
                              return next;
                            });
                          }}
                          placeholder={`প্রার্থী ${toBengaliNumber(idx + 1)}-এর নাম`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 text-xs"
                        />
                        {pollCandidates.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPollCandidates((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-2 py-1 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-semibold cursor-pointer hover:bg-slate-300 dark:hover:bg-white/15">
                          {uploadingCandidateIdx === idx ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadCandidateImage(f, idx);
                            }}
                          />
                        </label>
                        {cand.image && (
                          <span className="text-[10px] text-emerald-500 font-semibold truncate">
                            ✓ ছবি যুক্ত হয়েছে
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setElectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPoll}
                  onClick={() => handleCreateVotingPoll(false)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingPoll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>নির্বাচন তৈরি করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Schedule Modal */}
      {scheduleModalElection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                ভোটের সময়সূচি পরিবর্তন
              </h3>
              <button
                type="button"
                onClick={() => setScheduleModalElection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শুরুর সময়
                </label>
                <input
                  type="datetime-local"
                  defaultValue={
                    scheduleModalElection.votingStartDate
                      ? new Date(scheduleModalElection.votingStartDate).toISOString().slice(0, 16)
                      : ''
                  }
                  id="newStartDate"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সমাপ্তির সময়
                </label>
                <input
                  type="datetime-local"
                  defaultValue={
                    scheduleModalElection.votingEndDate
                      ? new Date(scheduleModalElection.votingEndDate).toISOString().slice(0, 16)
                      : ''
                  }
                  id="newEndDate"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalElection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isUpdatingSchedule}
                  onClick={() => {
                    const s = (document.getElementById('newStartDate') as HTMLInputElement)?.value;
                    const e = (document.getElementById('newEndDate') as HTMLInputElement)?.value;
                    if (!s || !e) {
                      toast.warning('শুরু ও সমাপ্তির সঠিক সময় নির্ধারণ করুন');
                      return;
                    }
                    handleSaveSchedule({
                      votingStartDate: new Date(s).toISOString(),
                      votingEndDate: new Date(e).toISOString(),
                    });
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-xs hover:bg-amber-600 disabled:opacity-50"
                >
                  {isUpdatingSchedule ? 'সংরক্ষণ হচ্ছে...' : 'হালনাগাদ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: CAMPAIGNS & DONATIONS */}
      {moduleKey === 'campaigns' && <CampaignAdminManagement />}

      {/* 6. Voting Poll Monitoring Modal */}
      {monitoringElectionId && (
        <VotingPollMonitoringModal
          electionId={monitoringElectionId}
          onClose={() => setMonitoringElectionId(null)}
        />
      )}

      {/* Professional Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={Boolean(confirmDialog)}
          onClose={() => !isConfirming && setConfirmDialog(null)}
          onConfirm={async () => {
            setIsConfirming(true);
            try {
              await confirmDialog.onConfirm();
              setConfirmDialog(null);
            } catch (err: any) {
              toast.error(err.message || 'অপারেশন ব্যর্থ হয়েছে');
            } finally {
              setIsConfirming(false);
            }
          }}
          isLoading={isConfirming}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.confirmText}
        />
      )}
    </div>
  );
}

function VotingPollMonitoringModal({
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs text-slate-400">লাইভ ফলাফল সিঙ্ক করা হচ্ছে...</p>
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
                            src={cand.candidatePhoto || cand.photo}
                            name={cand.candidateName || cand.name}
                            className="w-9 h-9 rounded-xl"
                            textClassName="text-xs font-bold text-amber-600"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {cand.candidateName || cand.name}
                            </h5>
                            <span className="text-[11px] text-slate-400">
                              {toBengaliNumber(cand.voteCount ?? cand.votesCount ?? 0)} ভোট
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                            {toBengaliNumber(cand.votePercentage ?? cand.percentage ?? 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${cand.votePercentage ?? cand.percentage ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Voter Audit Trail */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ভোটার অডিট লগ ({toBengaliNumber(voters.length)} জন)
                  </h4>
                  <span className="text-[10px] text-slate-400">গোপন ব্যালট সুরক্ষিত</span>
                </div>
                {voters.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-white/5">
                    {voters.map((v: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.name || 'সদস্য'}
                          </span>
                          {v.memberNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({v.memberNumber})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {v.votedAt ? new Date(v.votedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'সম্পন্ন'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">এখনও কোনো ভোট জমা পড়েনি</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}