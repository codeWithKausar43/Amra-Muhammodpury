'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Vote,
  ArrowRight,
  Loader2,
  Building2,
  Clock,
  Download,
  Printer,
  FileText,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import {
  useOrgMemberDashboardQuery,
  useOrgElectionsQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { cleanImageUrl } from '@/features/organization/components/CandidateAvatar';
import type { ContributionPayment } from '@/features/organization/types';

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

// Function to generate and trigger instant high-resolution PNG download with official watermark
function downloadReceiptCanvas(receipt: ContributionPayment, membership: any) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fontSans = '"SolaimanLipi", "Noto Sans Bengali", "Segoe UI", system-ui, sans-serif';

  // Crisp White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Decorative Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#059669'; // brand emerald
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Inner Border
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#a7f3d0';
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  // Security Watermark (Diagonal repeating pattern across the canvas)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-24 * Math.PI) / 180);
  ctx.font = `bold 28px ${fontSans}`;
  ctx.fillStyle = 'rgba(5, 150, 105, 0.08)'; // 8% opacity watermark
  ctx.textAlign = 'center';
  for (let y = -460; y <= 460; y += 85) {
    ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL VERIFIED RECEIPT', 0, y);
  }
  ctx.restore();

  // Watermark Seal in the Center
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 + 30, 160, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(5, 150, 105, 0.06)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Top Organization Branding: Monogram Badge
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 75, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${fontSans}`;
  ctx.textAlign = 'center';
  ctx.fillText('ম', canvas.width / 2, 84);

  // Organization Title
  ctx.fillStyle = '#064e3b';
  ctx.font = `bold 30px ${fontSans}`;
  ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা', canvas.width / 2, 132);

  ctx.fillStyle = '#475569';
  ctx.font = `bold 15px ${fontSans}`;
  ctx.fillText('অফিসিয়াল ডিজিটাল সদস্য অনুদান রসিদ (OFFICIAL CONTRIBUTION RECEIPT)', canvas.width / 2, 160);

  ctx.fillStyle = '#64748b';
  ctx.font = `13px ${fontSans}`;
  ctx.fillText('রেজিস্টার্ড সামাজিক ও নাগরিক কল্যাণ সোসাইটি • মোহাম্মদপুর, ঢাকা', canvas.width / 2, 183);

  // Dividing Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 202);
  ctx.lineTo(canvas.width - 50, 202);
  ctx.stroke();

  // Receipt Number & Date Banner
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 216, canvas.width - 100, 46);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 216, canvas.width - 100, 46);

  const recNo =
    receipt.receiptNumber ||
    `AMP-REC-${receipt.periodYear}${String(receipt.periodMonth).padStart(2, '0')}-${receipt.id.slice(0, 4).toUpperCase()}`;
  const issueDateStr = new Date(receipt.paidAt).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 15px ${fontSans}`;
  ctx.fillText(`রশিদ নম্বর: ${recNo}`, 70, 245);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 15px ${fontSans}`;
  ctx.fillText(`তারিখ: ${issueDateStr}`, canvas.width - 70, 245);

  // Information Table / Key-Value Pairs
  const memberName = membership?.user?.name || 'সম্মানিত সদস্য';
  const memberId = membership?.memberId
    ? membership.memberId.startsWith('#')
      ? membership.memberId
      : `#${membership.memberId}`
    : '#AMP-2026-0042';
  const designation = `${membership?.designation?.title || 'সাধারণ সদস্য'} • ${membership?.orgRole || 'MEMBER'}`;
  const purpose = `${MONTH_NAMES_BN[receipt.periodMonth - 1]} ${toBengaliDigits(receipt.periodYear)} এর মাসিক অনুদান`;

  let currentY = 300;
  const rowGap = 38;
  const col1LabelX = 70;
  const col1ValX = 220;
  const col2LabelX = 640;
  const col2ValX = 800;

  const renderRow = (l1: string, v1: string, l2: string, v2: string) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = `14px ${fontSans}`;
    ctx.fillText(l1, col1LabelX, currentY);

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold 15px ${fontSans}`;
    ctx.fillText(v1, col1ValX, currentY);

    ctx.fillStyle = '#64748b';
    ctx.font = `14px ${fontSans}`;
    ctx.fillText(l2, col2LabelX, currentY);

    ctx.fillStyle = '#0f172a';
    ctx.font = `bold 15px ${fontSans}`;
    ctx.fillText(v2, col2ValX, currentY);

    // Subtle dotted horizontal line
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, currentY + 12);
    ctx.lineTo(canvas.width - 50, currentY + 12);
    ctx.stroke();

    currentY += rowGap;
  };

  renderRow('সদস্যের নাম:', memberName, 'অনুদানের খাত:', purpose);
  renderRow('সদস্য আইডি:', memberId, 'পেমেন্ট মাধ্যম:', receipt.paymentMethod || 'BKASH');
  renderRow('পদবী ও দায়িত্ব:', designation, 'ট্রানজেকশন ID:', receipt.trxId || 'TRX-AUTO');
  renderRow('পরিশোধের তারিখ:', issueDateStr, 'অনুমোদনের স্ট্যাটাস:', receipt.status === 'PENDING' ? 'যাচাই প্রক্রিয়াধীন (PENDING)' : receipt.status === 'REJECTED' ? 'বাতিলকৃত (REJECTED)' : 'অনুমোদিত ও সংরক্ষিত (VERIFIED)');

  // Amount Highlight Box
  currentY += 15;
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(50, currentY, canvas.width - 100, 90);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, currentY, canvas.width - 100, 90);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#065f46';
  ctx.font = `bold 17px ${fontSans}`;
  ctx.fillText('প্রাপ্ত অনুদানের মোট পরিমাণ:', 75, currentY + 40);

  ctx.font = `13px ${fontSans}`;
  ctx.fillStyle = '#047857';
  ctx.fillText('কেন্দ্রীয় ফান্ড লেজারে সরাসরি সংযোজিত ও নিরীক্ষিত', 75, currentY + 65);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#059669';
  ctx.font = `bold 38px ${fontSans}`;
  ctx.fillText(`৳ ${toBengaliNumber(receipt.amount)}`, canvas.width - 75, currentY + 56);

  // Signatures & Official Seals
  currentY += 140;

  // Left Signature: Treasurer
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(110, currentY);
  ctx.lineTo(330, currentY);
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = `bold 12px ${fontSans}`;
  ctx.fillText('✓ DIGITAL SIGNATURE VERIFIED', 220, currentY - 10);
  ctx.fillStyle = '#334155';
  ctx.font = `bold 14px ${fontSans}`;
  ctx.fillText('অর্থ সম্পাদক / কোষাধ্যক্ষ', 220, currentY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = `12px ${fontSans}`;
  ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা', 220, currentY + 38);

  // Center Seal Stamp Box
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(canvas.width / 2 - 130, currentY - 30, 260, 65);
  ctx.fillStyle = '#065f46';
  ctx.font = `bold 13px ${fontSans}`;
  ctx.fillText('OFFICIAL DIGITAL SEAL', canvas.width / 2, currentY - 8);
  ctx.fillStyle = '#047857';
  ctx.font = `bold 12px ${fontSans}`;
  ctx.fillText('AUTHENTICATED & RECORDED', canvas.width / 2, currentY + 12);
  ctx.fillStyle = '#64748b';
  ctx.font = `10px ${fontSans}`;
  ctx.fillText(`SECURITY HASH: ${recNo.replace(/[^A-Z0-9]/g, '')}`, canvas.width / 2, currentY + 26);

  // Right Signature: General Secretary / President
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width - 330, currentY);
  ctx.lineTo(canvas.width - 110, currentY);
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = `bold 12px ${fontSans}`;
  ctx.fillText('✓ DIGITAL AUTHORIZED', canvas.width - 220, currentY - 10);
  ctx.fillStyle = '#334155';
  ctx.font = `bold 14px ${fontSans}`;
  ctx.fillText('সাধারণ সম্পাদক / সভাপতি', canvas.width - 220, currentY + 20);
  ctx.fillStyle = '#64748b';
  ctx.font = `12px ${fontSans}`;
  ctx.fillText('আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা', canvas.width - 220, currentY + 38);

  // Bottom Notice
  ctx.fillStyle = '#94a3b8';
  ctx.font = `12px ${fontSans}`;
  ctx.fillText(
    'এটি একটি কম্পিউটার-জেনারেটেড ডিজিটাল অফিসিয়াল রসিদ। সংগঠনের জেনারেল ফান্ডে সফলভাবে ক্রেডিট হয়েছে।',
    canvas.width / 2,
    canvas.height - 35,
  );

  // Trigger browser download
  const downloadLink = document.createElement('a');
  downloadLink.download = `${recNo}.png`;
  downloadLink.href = canvas.toDataURL('image/png');
  downloadLink.click();
}

export default function MemberDashboardPage() {
  const { data: dashboard, isLoading } = useOrgMemberDashboardQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const mutations = useOrgMutations();

  const activeElection = elections.find(
    (e) => e.status === 'VOTING_ACTIVE' || e.status === 'NOMINATION_OPEN',
  );

  const membership = dashboard?.membership;
  const agreement = dashboard?.agreement;
  const agreedAmount = agreement?.agreedAmount || membership?.monthlyContribution || 100;

  const currentYear = new Date().getFullYear();
  const calendar = dashboard?.calendar || [];
  const paidMonthsCount = calendar.filter((c) => c.isPaid).length;
  const payments = dashboard?.payments || [];

  // Unpaid months of current year
  const unpaidMonths = React.useMemo(() => {
    return calendar.filter((c) => !c.isPaid).map((c) => c.month);
  }, [calendar]);

  // Due months up to current month of this year
  const dueMonths = React.useMemo(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    return calendar
      .filter((c) => !c.isPaid && c.month <= currentMonthNum)
      .map((c) => c.month);
  }, [calendar]);

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = React.useState(false);
  const [payYear, setPayYear] = React.useState(currentYear);
  const [selectedMonths, setSelectedMonths] = React.useState<number[]>([]);
  const [payMethod, setPayMethod] = React.useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH'>('BKASH');
  const [payTrxId, setPayTrxId] = React.useState('');
  const [payError, setPayError] = React.useState<string | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = React.useState<string | null>(null);

  // Dynamic 12-month calendar state based on selected payYear
  const yearCalendar = React.useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      // Check if verified paid for this specific payYear
      const isPaid =
        payments.some(
          (p) =>
            p.periodYear === payYear &&
            p.periodMonth === m &&
            p.status === 'VERIFIED',
        ) ||
        (payYear === currentYear && Boolean(calendar.find((c) => c.month === m)?.isPaid));

      // Check if pending approval for this specific payYear
      const isPending =
        payments.some(
          (p) =>
            p.periodYear === payYear &&
            p.periodMonth === m &&
            p.status === 'PENDING',
        ) ||
        (payYear === currentYear && Boolean(calendar.find((c) => c.month === m)?.isPending));

      // Calculate overdue / due status based on year & current month
      let isDue = false;
      if (!isPaid && !isPending) {
        if (payYear < curY) {
          isDue = true; // All past unpaid months in previous years are due
        } else if (payYear === curY) {
          isDue = m <= curM; // Unpaid months up to current month this year are due
        } else {
          isDue = false; // Future years are not overdue
        }
      }

      return {
        month: m,
        year: payYear,
        isPaid,
        isPending,
        isDue,
      };
    });
  }, [payYear, payments, calendar, currentYear]);

  // Unpaid months of the currently selected payYear (excluding paid and pending)
  const unpaidMonthsForYear = React.useMemo(() => {
    return yearCalendar.filter((c) => !c.isPaid && !c.isPending).map((c) => c.month);
  }, [yearCalendar]);

  // Due months of the currently selected payYear
  const dueMonthsForYear = React.useMemo(() => {
    return yearCalendar.filter((c) => c.isDue).map((c) => c.month);
  }, [yearCalendar]);

  const handleYearChange = (newYear: number) => {
    setPayYear(newYear);
    setSelectedMonths([]);
    setPayError(null);
  };

  // Download / View Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = React.useState<ContributionPayment | null>(null);

  // Receipt filtering state (by Year and Month)
  const [receiptFilterYear, setReceiptFilterYear] = React.useState<string>('ALL');
  const [receiptFilterMonth, setReceiptFilterMonth] = React.useState<string>('ALL');

  const availableReceiptYears = React.useMemo(() => {
    const years = Array.from(new Set(payments.map((p) => p.periodYear)));
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [payments, currentYear]);

  const filteredReceipts = React.useMemo(() => {
    return payments.filter((p) => {
      if (receiptFilterYear !== 'ALL' && p.periodYear !== Number(receiptFilterYear)) {
        return false;
      }
      if (receiptFilterMonth !== 'ALL' && p.periodMonth !== Number(receiptFilterMonth)) {
        return false;
      }
      return true;
    });
  }, [payments, receiptFilterYear, receiptFilterMonth]);

  // Initialize or reset selected months when opening modal
  const openPaymentModal = React.useCallback(
    (focusDueOnly = false) => {
      setPayError(null);
      setPaySuccessMsg(null);
      if (focusDueOnly && dueMonths.length > 0) {
        setSelectedMonths([...dueMonths]);
      } else if (dueMonths.length > 0) {
        setSelectedMonths([...dueMonths]);
      } else if (unpaidMonths.length > 0) {
        const firstUnpaid = unpaidMonths[0];
        setSelectedMonths(firstUnpaid !== undefined ? [firstUnpaid] : []);
      } else {
        setSelectedMonths([]);
      }
      setPayModalOpen(true);
    },
    [dueMonths, unpaidMonths],
  );

  // Handle month click with strict due-first sequential constraint for the selected payYear
  const handleMonthToggle = (monthNum: number) => {
    if (!unpaidMonthsForYear.includes(monthNum)) return;
    const targetIdx = unpaidMonthsForYear.indexOf(monthNum);
    if (targetIdx === -1) return;

    // If clicking the current highest selected month and more than 1 month is selected, unselect it
    if (
      selectedMonths.length > 1 &&
      selectedMonths[selectedMonths.length - 1] === monthNum
    ) {
      setSelectedMonths(selectedMonths.slice(0, -1));
    } else {
      // Select all consecutive unpaid months from 0 up to targetIdx
      // Guarantees all earlier unpaid months (including dues) are selected first!
      setSelectedMonths(unpaidMonthsForYear.slice(0, targetIdx + 1));
    }
  };

  const totalPayableAmount = selectedMonths.length * agreedAmount;

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) {
      setPayError('কমপক্ষে একটি মাস নির্বাচন করুন।');
      return;
    }
    setPayError(null);
    setPaySuccessMsg(null);

    try {
      await mutations.payMonthlyContribution.mutateAsync({
        months: selectedMonths,
        periodYear: payYear,
        amount: totalPayableAmount,
        paymentMethod: payMethod,
        trxId: payTrxId.trim() || undefined,
      });
      setPaySuccessMsg('মাসিক অনুদানের তথ্য জমা দেওয়া হয়েছে! অ্যাডমিন যাচাইয়ের পর এটি অনুমোদিত হবে।');
      setTimeout(() => {
        setPayModalOpen(false);
        setPaySuccessMsg(null);
        setPayTrxId('');
      }, 1500);
    } catch (err: any) {
      setPayError(err.message || 'পরিশোধ সম্পন্ন হয়নি। পুনরায় চেষ্টা করুন।');
    }
  };

  if (isLoading && !dashboard) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
        <p className="text-xs text-slate-500 font-medium">সদস্য ড্যাশবোর্ড তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">সদস্যপদ খুঁজে পাওয়া যায়নি</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          এই ড্যাশবোর্ডটি শুধুমাত্র আমরা মোহাম্মদপুরী সংগঠনের সক্রিয় সদস্যদের জন্য।
        </p>
        <Link
          href="/organization/apply"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-semibold"
        >
          সদস্য হতে আবেদন করুন
        </Link>
      </div>
    );
  }

  const avatarUrl = membership.user?.image ? cleanImageUrl(membership.user.image) : '';
  const memberIdDisplay = membership.memberId
    ? membership.memberId.startsWith('#')
      ? membership.memberId
      : `#${membership.memberId}`
    : '#AMP-2026-0042';

  return (
    <div className="max-w-xl sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-5">
      {/* =========================================================================
          1. Official Digital Membership Identity Card
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 dark:from-[#07241C] dark:via-[#091F18] dark:to-[#051812] border border-emerald-200/70 dark:border-emerald-500/30 text-slate-900 dark:text-white p-5 sm:p-6 shadow-soft dark:shadow-xl space-y-4 transition-colors">
        {/* Subtle geometric background watermark pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5 dark:opacity-10 pointer-events-none text-emerald-900 dark:text-emerald-400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="memberIdPattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="24" cy="24" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#memberIdPattern)" />
        </svg>

        {/* Glow overlay */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Member Profile Info (Avatar + Name + Role + ID) */}
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 pt-1">
          {/* Member Photo with building badge */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/60 border-2 border-brand-emerald/30 dark:border-emerald-400/40 relative shadow-md">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={membership.user?.name || 'Member'}
                  fill
                  className="object-cover object-top"
                  unoptimized={avatarUrl.startsWith('data:')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-emerald dark:text-white text-2xl font-black bg-emerald-100/60 dark:bg-emerald-900/60">
                  {membership.user?.name?.charAt(0) || 'ম'}
                </div>
              )}
            </div>
            {/* Small Green Badge on Avatar */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-emerald dark:bg-emerald-500 border-2 border-white dark:border-[#091F18] text-white dark:text-slate-950 flex items-center justify-center shadow">
              <Building2 className="w-3 h-3" />
            </div>
          </div>

          {/* Member Name, Role and ID */}
          <div className="space-y-1 min-w-0">
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-tight truncate">
              {membership.user?.name}
            </h1>
            <p className="text-xs text-slate-600 dark:text-emerald-200/90 font-medium truncate">
              {membership.designation?.title || 'সাধারণ সদস্য'} • {membership.orgRole}
            </p>
            <div className="inline-block px-3 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] sm:text-xs font-bold tracking-wider">
              ID: {memberIdDisplay}
            </div>
          </div>
        </div>

        {/* Bottom Details Row: Joining Date & Monthly Commitment */}
        <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-emerald-300/80 block uppercase font-medium">
              যোগদানের তারিখ
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {new Date(membership.joinedAt).toLocaleDateString('bn-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-emerald-300/80 block uppercase font-medium">
              মাসিক অঙ্গীকার
            </span>
            <span className="text-xs sm:text-sm font-bold text-brand-emerald dark:text-emerald-400">
              ৳{toBengaliNumber(agreedAmount)} / মাস
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. মাসিক অনুদান (২০২৬) Card (Clean Seamless Stats & Perfect Alignment)
         ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-emerald-500/20 p-5 sm:p-6 shadow-soft dark:shadow-xl space-y-4 text-slate-900 dark:text-white transition-colors">
        {/* Header: Icon + Title + Status Pill (Aligned on 1 line with shrink protection) */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              মাসিক অনুদান ({toBengaliDigits(currentYear)})
            </h2>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 whitespace-nowrap border ${
              (dashboard?.pendingDueCount ?? 0) === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/40'
                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-500/40'
            }`}
          >
            {(dashboard?.pendingDueCount ?? 0) === 0 ? 'নিয়মিত' : 'বকেয়া আছে'}
          </span>
        </div>

        {/* 2-Column Stats Area (Pixel-perfect alignment, no truncation, conditional due action) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3.5 px-3.5 sm:px-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
          {/* Column 1: মোট প্রদত্ত অনুদান */}
          <div className="space-y-1 min-w-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block whitespace-nowrap">
              মোট প্রদত্ত অনুদান
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand-emerald dark:text-emerald-400 tracking-tight whitespace-nowrap h-9 flex items-center">
              ৳{toBengaliNumber(dashboard?.totalContributed ?? 0)}
            </div>
          </div>

          {/* Column 2: বকেয়া কিস্তি (Aligned perfectly with Column 1) */}
          <div className="space-y-1 min-w-0 pl-3 sm:pl-4 border-l border-slate-200/80 dark:border-white/10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block whitespace-nowrap">
              বকেয়া কিস্তি
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight whitespace-nowrap h-9 flex items-center gap-2">
              <span
                className={
                  (dashboard?.pendingDueCount ?? 0) > 0
                    ? 'text-rose-500'
                    : 'text-slate-900 dark:text-white'
                }
              >
                {toBengaliDigits(dashboard?.pendingDueCount ?? 0)} টি
              </span>

            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => openPaymentModal(false)}
          className="w-full py-3.5 rounded-2xl bg-brand-emerald hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
        >
          <span className="text-base font-black leading-none">৳</span>
          <span>মাসিক কিস্তি পরিশোধ করুন</span>
        </button>
      </div>

      {/* =========================================================================
          3. ২০২৬ সালের অনুদান অগ্রগতি (Yearly Contribution Progress - Clean Open Layout, 4 per row)
         ========================================================================= */}
      <div className="space-y-3 pt-1 text-slate-900 dark:text-white transition-colors">
        {/* Header: Progress Summary */}
        <div className="flex items-center justify-between text-xs sm:text-sm px-1">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {toBengaliDigits(currentYear)} সালের অনুদান অগ্রগতি
          </span>
          <span className="font-bold text-brand-emerald dark:text-emerald-400">
            {toBengaliDigits(paidMonthsCount)} / {toBengaliDigits(12)} মাস পূর্ণ
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
          <div
            style={{ width: `${Math.min(100, Math.round((paidMonthsCount / 12) * 100))}%` }}
            className="h-full rounded-full bg-brand-emerald dark:bg-emerald-400 transition-all duration-500"
          />
        </div>

        {/* 12-Month Calendar Chips (4 Per Row, Clean Open Layout) */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2 pt-0.5">
          {calendar.map((item) => {
            const isDue = !item.isPaid && !item.isPending && item.month <= new Date().getMonth() + 1;

            return (
              <div
                key={item.month}
                className={`py-2 px-1 sm:py-2.5 sm:px-2 rounded-xl text-center flex flex-col items-center justify-center gap-0.5 transition-all ${
                  item.isPaid
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/20 text-brand-emerald dark:text-emerald-400'
                    : item.isPending
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : isDue
                    ? 'bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-0.5 leading-none">
                  {item.isPaid ? (
                    <span className="text-brand-emerald dark:text-emerald-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span>পরিশোধিত</span>
                    </span>
                  ) : item.isPending ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                      <span>প্রক্রিয়াধীন</span>
                    </span>
                  ) : isDue ? (
                    <span className="text-rose-600 dark:text-rose-400 whitespace-nowrap">বকেয়া</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">আসন্ন</span>
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-bold leading-tight mt-0.5 truncate max-w-full ${
                    item.isPaid
                      ? 'text-slate-900 dark:text-white'
                      : item.isPending
                      ? 'text-amber-900 dark:text-amber-200'
                      : isDue
                      ? 'text-rose-950 dark:text-rose-200'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {MONTH_NAMES_BN[item.month - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4. সর্বশেষ অনুদান রসিদসমূহ (Clean Unboxed Layout, Horizontal Scroll, Amount over Status)
         ========================================================================= */}
      <div className="space-y-3 pt-1 text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/20 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
              সর্বশেষ অনুদান রসিদসমূহ
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shrink-0 whitespace-nowrap">
            {filteredReceipts.length === payments.length
              ? `মোট ${toBengaliDigits(payments.length)} টি রসিদ`
              : `${toBengaliDigits(filteredReceipts.length)} / ${toBengaliDigits(payments.length)} টি রসিদ`}
          </span>
        </div>

        {/* Filter Bar: Clean Dropdowns without Boxy Container */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-emerald dark:text-emerald-400" />
              <span>ফিল্টার:</span>
            </div>

            {/* Year Selector */}
            <select
              value={receiptFilterYear}
              onChange={(e) => setReceiptFilterYear(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">
                সকল বছর
              </option>
              {availableReceiptYears.map((y) => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900">
                  {toBengaliDigits(y)} সাল
                </option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={receiptFilterMonth}
              onChange={(e) => setReceiptFilterMonth(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">
                সকল মাস
              </option>
              {MONTH_NAMES_BN.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-white dark:bg-slate-900">
                  {name}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
            {(receiptFilterYear !== 'ALL' || receiptFilterMonth !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setReceiptFilterYear('ALL');
                  setReceiptFilterMonth('ALL');
                }}
                className="px-2 py-1 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Spacious Ledger with Horizontal Scrolling (Unboxed) */}
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="min-w-[420px] sm:min-w-full divide-y divide-slate-200/60 dark:divide-white/10">
            {filteredReceipts.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {receiptFilterYear !== 'ALL' || receiptFilterMonth !== 'ALL'
                    ? 'নির্বাচিত বছর ও মাসে কোনো অনুদান রসিদ পাওয়া যায়নি'
                    : 'এখনও কোনো কিস্তি জমা হয়নি'}
                </p>
                {(receiptFilterYear !== 'ALL' || receiptFilterMonth !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptFilterYear('ALL');
                      setReceiptFilterMonth('ALL');
                    }}
                    className="text-xs font-bold text-brand-emerald hover:underline cursor-pointer"
                  >
                    সকল রসিদ প্রদর্শন করুন
                  </button>
                )}
              </div>
            ) : (
              filteredReceipts.map((p) => {
                const formattedDate = new Date(p.paidAt).toLocaleDateString('bn-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div
                    key={p.id}
                    className="py-3.5 px-2 sm:px-3 hover:bg-slate-500/5 transition-colors flex items-center justify-between gap-6 rounded-xl"
                  >
                    {/* Left: Title & Date (stacked with breathing space) */}
                    <div className="space-y-1 shrink-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {MONTH_NAMES_BN[p.periodMonth - 1]} {toBengaliDigits(p.periodYear)} এর মাসিক অনুদান
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </p>
                    </div>

                    {/* Right: Amount on top of Status, plus 'রশিদ দেখুন' Button */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Amount directly over Status */}
                      <div className="text-right space-y-0.5">
                        <div className="text-xs sm:text-sm font-black text-brand-emerald dark:text-emerald-400 whitespace-nowrap">
                          ৳{toBengaliNumber(p.amount)}
                        </div>
                        {p.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5" />
                            অপেক্ষমাণ
                          </span>
                        ) : p.status === 'REJECTED' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30 whitespace-nowrap">
                            বাতিলকৃত
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 whitespace-nowrap">
                            অনুমোদিত
                          </span>
                        )}
                      </div>

                      {/* 'রশিদ দেখুন' Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-brand-emerald dark:hover:text-emerald-300 border border-slate-200/80 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-emerald dark:text-emerald-400" />
                        <span>রশিদ দেখুন</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. আসন্ন সাধারণ সভা ও মিটিং (Upcoming Meetings)
         ========================================================================= */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071317] border border-slate-200/80 dark:border-emerald-500/20 p-5 sm:p-6 shadow-soft dark:shadow-xl space-y-4 text-slate-900 dark:text-white transition-colors">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
            আসন্ন সাধারণ সভা ও মিটিং
          </h3>
        </div>

        {/* Content */}
        {(dashboard?.upcomingMeetings || []).length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-2">
            {(dashboard?.upcomingMeetings || []).map((m) => (
              <div key={m.id} className="pt-2 text-left space-y-1">
                <div className="flex items-center justify-between text-[11px] text-brand-emerald dark:text-emerald-400 font-bold">
                  <span>
                    {new Date(m.date).toLocaleDateString('bn-BD', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-slate-500 font-normal">{m.location}</span>
                </div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</h5>
                {m.agenda && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    এজেন্ডা: {m.agenda}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 text-slate-400 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 text-brand-emerald dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              বর্তমানে কোনো নির্ধারিত মিটিং নেই
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              নতুন সভার তারিখ নির্ধারিত হলে নোটিফিকেশন দেয়া হবে
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          6. Digital Election Banner (If election is active)
         ========================================================================= */}
      {activeElection && (
        <div className="rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Vote className="w-4 h-4" />
              <span>ডিজিটাল ভোটাধিকার</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
              চলমান নির্বাচন
            </span>
          </div>
          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{activeElection.title}</h5>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            সক্রিয় সদস্য হিসেবে আপনি কার্যনির্বাহী পরিষদ নির্বাচনে ভোটাধিকার প্রয়োগ করতে পারেন।
          </p>
          <div className="pt-1">
            <Link
              href="/organization/elections"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors"
            >
              <span>নির্বাচনী বুথে প্রবেশ করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. Pay Contribution Modal (Multi-Month & Due-First Sequential Rule)
         ========================================================================= */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#081519] border border-slate-200 dark:border-emerald-500/20 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl space-y-4 text-left text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-emerald dark:text-emerald-400" />
                <span>মাসিক কিস্তি পরিশোধ ({toBengaliDigits(payYear)})</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error / Success Feedback */}
            {payError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs shrink-0 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}
            {paySuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs shrink-0 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{paySuccessMsg}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handlePaySubmit} className="overflow-y-auto space-y-4 pr-1">
              {/* Overdue Warning Banner */}
              {dueMonthsForYear.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{toBengaliDigits(payYear)} সালে আপনার {toBengaliDigits(dueMonthsForYear.length)} টি কিস্তি বকেয়া রয়েছে</span>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-relaxed">
                    সংগঠনের নিয়ম অনুযায়ী পূর্বের বকেয়া কিস্তি পরিশোধ না করে পরবর্তী মাসের কিস্তি দেওয়া যাবে না। অনুগ্রহ করে বকেয়া মাস আগে পরিশোধ করুন।
                  </p>
                </div>
              )}

              {/* Month Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    পরিশোধের মাস নির্বাচন করুন
                  </label>
                  <select
                    value={payYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 text-xs cursor-pointer outline-none"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y} className="bg-white dark:bg-slate-900">
                        {toBengaliDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 12-Month Interactive Grid (Linked Dynamically to Selected payYear) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {yearCalendar.map((item) => {
                    const m = item.month;
                    const isPaid = item.isPaid;
                    const isDue = item.isDue;
                    const isSelected = selectedMonths.includes(m);

                    if (isPaid) {
                      return (
                        <div
                          key={m}
                          className="p-2 rounded-xl text-center bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 opacity-60 cursor-not-allowed select-none"
                        >
                          <div className="text-[10px] text-brand-emerald dark:text-emerald-400 font-bold flex items-center justify-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>পরিশোধিত</span>
                          </div>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {MONTH_NAMES_BN[m - 1]}
                          </div>
                        </div>
                      );
                    }

                    if (item.isPending) {
                      return (
                        <div
                          key={m}
                          className="p-2 rounded-xl text-center bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 opacity-80 cursor-not-allowed select-none"
                        >
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            <span>প্রক্রিয়াধীন</span>
                          </div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                            {MONTH_NAMES_BN[m - 1]}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMonthToggle(m)}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-brand-emerald dark:border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-white font-bold'
                            : isDue
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-300 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] font-bold flex items-center justify-center gap-1">
                          {isSelected ? (
                            <span className="text-brand-emerald dark:text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>নির্বাচিত</span>
                            </span>
                          ) : isDue ? (
                            <span className="text-rose-600 dark:text-rose-400">বকেয়া</span>
                          ) : (
                            <span className="text-slate-400">আসন্ন</span>
                          )}
                        </div>
                        <div className="text-xs font-bold mt-0.5">{MONTH_NAMES_BN[m - 1]}</div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  💡 নিয়ম: পূর্বের কোনো বকেয়া কিস্তি বাদ রেখে পরবর্তী মাসের অনুদান দেওয়া যাবে না। মাস নির্বাচন করলে পূর্বের বকেয়া মাসগুলো স্বয়ংক্রিয়ভাবে ধারাবাহিকভাবে যুক্ত হবে।
                </p>
              </div>

              {/* Payment Summary Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>মাসিক নির্ধারিত অনুদান:</span>
                  <span className="font-bold">৳{toBengaliNumber(agreedAmount)} / মাস</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>নির্বাচিত কিস্তি:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {toBengaliDigits(selectedMonths.length)} মাস
                  </span>
                </div>
                {selectedMonths.length > 0 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 truncate">
                    মাস: {selectedMonths.map((m) => MONTH_NAMES_BN[m - 1]).join(', ')}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-emerald-500/20 font-black text-brand-emerald dark:text-emerald-400">
                  <span>সর্বমোট প্রদেয় অনুদান:</span>
                  <span className="text-base sm:text-lg">৳{toBengaliNumber(totalPayableAmount)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="BKASH" className="bg-white dark:bg-slate-900">
                    bKash (০১৭৫০০০০০০০)
                  </option>
                  <option value="NAGAD" className="bg-white dark:bg-slate-900">
                    Nagad (০১৮৫০০০০০০০)
                  </option>
                  <option value="ROCKET" className="bg-white dark:bg-slate-900">
                    Rocket (০১৯৫০০০০০০০)
                  </option>
                  <option value="BANK" className="bg-white dark:bg-slate-900">
                    Bank Transfer
                  </option>
                  <option value="CASH" className="bg-white dark:bg-slate-900">
                    Cash (কোষাধ্যক্ষ অফিস)
                  </option>
                </select>
              </div>

              {/* TrxID Field */}
              {payMethod !== 'CASH' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    value={payTrxId}
                    onChange={(e) => setPayTrxId(e.target.value)}
                    placeholder="TrxID লিখুন (যেমন: 8N2K9L3M)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none uppercase text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutations.payMonthlyContribution.isPending || selectedMonths.length === 0}
                className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {mutations.payMonthlyContribution.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>
                    ৳{toBengaliNumber(totalPayableAmount)} অনুদান নিশ্চিত করুন (
                    {toBengaliDigits(selectedMonths.length)} মাস)
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. Official Watermarked Receipt Modal (Preview, Print & High-Res Download)
         ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#07151a] border border-slate-200 dark:border-emerald-500/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl space-y-4 text-left text-slate-900 dark:text-white">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-emerald dark:text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  অফিসিয়াল ডিজিটাল রসিদ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Printable Receipt Body with Security Watermark */}
            <div className="overflow-y-auto pr-1">
              <div
                id="official-receipt-print"
                className="relative overflow-hidden rounded-2xl bg-white border-2 border-emerald-600/30 p-5 sm:p-7 text-slate-900 space-y-5 shadow-inner"
              >
                {/* Official Security Diagonal Repeating Watermark */}
                <div
                  className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden opacity-[0.06] rotate-[-24deg]"
                  aria-hidden="true"
                >
                  <div className="text-center font-black text-xl sm:text-2xl leading-loose text-emerald-900 tracking-wider">
                    আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL VERIFIED RECEIPT<br />
                    আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL VERIFIED RECEIPT<br />
                    আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL VERIFIED RECEIPT<br />
                    আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা • OFFICIAL VERIFIED RECEIPT<br />
                  </div>
                </div>

                {/* Organization Header */}
                <div className="relative z-10 text-center space-y-1 pb-3 border-b border-slate-200">
                  <div className="w-11 h-11 rounded-full bg-brand-emerald text-white font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                    ম
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-emerald-950 tracking-tight">
                    আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা
                  </h2>
                  <p className="text-xs font-bold text-slate-600">
                    অফিসিয়াল ডিজিটাল সদস্য অনুদান রসিদ
                  </p>
                  <p className="text-[11px] text-slate-500">
                    রেজিস্টার্ড সামাজিক ও নাগরিক কল্যাণ সোসাইটি • মোহাম্মদপুর, ঢাকা
                  </p>
                </div>

                {/* Receipt Number & Date Banner */}
                <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>
                    রশিদ নং:{' '}
                    <span className="font-mono text-emerald-800">
                      {selectedReceipt.receiptNumber ||
                        `AMP-REC-${selectedReceipt.periodYear}${String(selectedReceipt.periodMonth).padStart(2, '0')}-${selectedReceipt.id.slice(0, 4).toUpperCase()}`}
                    </span>
                  </span>
                  <span>
                    তারিখ:{' '}
                    <span className="font-medium text-slate-600">
                      {new Date(selectedReceipt.paidAt).toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                </div>

                {/* Details Table */}
                <div className="relative z-10 grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-y border-slate-100 py-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">সদস্যের নাম:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {membership.user?.name || 'সম্মানিত সদস্য'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">অনুদানের খাত:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {MONTH_NAMES_BN[selectedReceipt.periodMonth - 1]}{' '}
                      {toBengaliDigits(selectedReceipt.periodYear)} এর মাসিক অনুদান
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">সদস্য আইডি:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {memberIdDisplay}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">পেমেন্ট মাধ্যম:</span>
                    <span className="font-bold text-slate-900">
                      {selectedReceipt.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">পদবী ও ভূমিকা:</span>
                    <span className="font-medium text-slate-800">
                      {membership.designation?.title || 'সাধারণ সদস্য'} • {membership.orgRole}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">ট্রানজেকশন ID:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedReceipt.trxId || 'TRX-AUTO'}
                    </span>
                  </div>
                </div>

                {/* Amount Box / Status Banner */}
                {selectedReceipt.status === 'PENDING' ? (
                  <div className="relative z-10 rounded-2xl bg-amber-50 border border-amber-500/30 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        জমা সম্পন্ন (যাচাই ও অনুমোদন প্রক্রিয়াধীন)
                      </span>
                      <span className="text-[11px] text-amber-700 block">
                        অ্যাডমিনের যাচাই ও অনুমোদনের পর চূড়ান্ত রসিদ কার্যকর হবে
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600">
                      ৳{toBengaliNumber(selectedReceipt.amount)}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 rounded-2xl bg-emerald-50 border border-emerald-500/30 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        প্রাপ্ত অনুদানের মোট পরিমাণ:
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        কেন্দ্রীয় ফান্ড লেজারে সরাসরি সংযোজিত ও নিরীক্ষিত
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-brand-emerald">
                      ৳{toBengaliNumber(selectedReceipt.amount)}
                    </div>
                  </div>
                )}

                {/* Official Seals & Signature */}
                {selectedReceipt.status === 'PENDING' ? (
                  <div className="relative z-10 pt-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      অ্যাডমিন অনুমোদন ও নিরীক্ষা প্রক্রিয়াধীন
                    </span>
                  </div>
                ) : (
                  <div className="relative z-10 pt-4 grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="border-t border-slate-400 pt-1.5 w-3/4 mx-auto" />
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        ✓ ডিজিটালভাবে স্বাক্ষরিত
                      </span>
                      <span className="text-xs font-bold text-slate-800 block">
                        অর্থ সম্পাদক / কোষাধ্যক্ষ
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="border-t border-slate-400 pt-1.5 w-3/4 mx-auto" />
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        ✓ ডিজিটালভাবে অনুমোদিত
                      </span>
                      <span className="text-xs font-bold text-slate-800 block">
                        সাধারণ সম্পাদক / সভাপতি
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                <div className="relative z-10 text-center pt-2 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400">
                    এটি একটি কম্পিউটার-জেনারেটেড ডিজিটাল প্রাতিষ্ঠানিক রসিদ। কোনো ম্যানুয়াল সিল বা স্বাক্ষরের প্রয়োজন নেই।
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 shrink-0 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => downloadReceiptCanvas(selectedReceipt, membership)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>রশিদ ডাউনলোড করুন (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট / PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 font-bold text-xs transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
