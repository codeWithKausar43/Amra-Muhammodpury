'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Heart,
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  Share2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { usePublicCampaignDetailsQuery } from '@/features/campaign/hooks/useCampaignQueries';
import { DonationModal } from '@/features/campaign/components/DonationModal';
import { useRealtime } from '@/providers/RealtimeProvider';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function formatBengaliDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const idOrSlug = (Array.isArray(params?.id) ? params.id[0] : params?.id) || '';

  const { data: campaign, isLoading, error } = usePublicCampaignDetailsQuery(idOrSlug);
  const { subscribeToCampaign } = useRealtime();
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Subscribe to real-time campaign updates
  React.useEffect(() => {
    if (campaign?.id) {
      return subscribeToCampaign(campaign.id);
    }
    return undefined;
  }, [campaign?.id, subscribeToCampaign]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-brand-emerald mx-auto" />
        <p className="text-xs text-slate-500 font-medium">ক্যাম্পেইনের বিবরণ লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          ক্যাম্পেইনটি খুঁজে পাওয়া যায়নি
        </h2>
        <p className="text-xs text-slate-500">
          ক্যাম্পেইনটি সমাপ্ত বা স্থগিত হয়ে থাকতে পারে অথবা ঠিকানাটি সঠিক নয়।
        </p>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>সকল ক্যাম্পেইনে ফিরে যান</span>
        </Link>
      </div>
    );
  }

  const goal = campaign.goalAmount || 0;
  const collected = campaign.collectedAmount || 0;
  const progress = campaign.progressPercent || 0;
  const remaining = campaign.remainingAmount || 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6">
      {/* Back button & Category */}
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-emerald transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল ক্যাম্পেইন</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'লিংক কপি হয়েছে' : 'শেয়ার করুন'}</span>
          </button>
        </div>
      </div>

      {/* Main Campaign Card */}
      <div className="bg-white dark:bg-brand-charcoal rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        {/* Cover Image Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-slate-100 dark:bg-white/5">
          {campaign.coverImage ? (
            <Image
              src={campaign.coverImage}
              alt={campaign.title}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-emerald/10 text-brand-emerald">
              <Heart className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-emerald text-white backdrop-blur-md shadow-xs">
              {campaign.categoryName || 'সাধারণ ক্যাম্পেইন'}
            </span>
            {campaign.status === 'ACTIVE' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>সক্রিয় ক্যাম্পেইন</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-slate-950">
                {campaign.status}
              </span>
            )}
          </div>

          {/* Title & Metadata over Image bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug drop-shadow-sm">
              {campaign.title}
            </h1>
            <div className="flex items-center gap-4 text-xs font-medium text-emerald-100/90 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatBengaliDate(campaign.startDate)} - {formatBengaliDate(campaign.endDate)}</span>
              </span>
              {campaign.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{campaign.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Progress & Quick Action Box */}
        <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            {/* Progress Stats Column */}
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">মোট যাচাইকৃত সংগ্রহ:</span>
                  <div className="text-2xl sm:text-3xl font-black text-brand-emerald dark:text-brand-mint">
                    ৳ {toBengaliNumber(collected)}
                  </div>
                </div>
                {goal > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ক্যাম্পেইন লক্ষ্য:</span>
                    <div className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">
                      ৳ {toBengaliNumber(goal)}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar track */}
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-brand-emerald rounded-full transition-all duration-700 shadow-inner"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {toBengaliNumber(progress)}% সংগৃহীত
                </span>
                {remaining > 0 ? (
                  <span>লক্ষ্য পূরণে বাকি ৳ {toBengaliNumber(remaining)}</span>
                ) : (
                  <span className="text-brand-emerald dark:text-brand-mint font-bold">আলহামদুলিল্লাহ, লক্ষ্য সম্পূর্ণ অর্জিত!</span>
                )}
                {campaign.totalVerifiedDonationsCount !== undefined && (
                  <span>মোট {toBengaliNumber(campaign.totalVerifiedDonationsCount)} টি অনুদান</span>
                )}
              </div>
            </div>

            {/* Donate Action Button */}
            <div className="md:col-span-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsDonateOpen(true)}
                disabled={campaign.status !== 'ACTIVE'}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-emerald hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>এখনই দান করুন</span>
              </button>
              <p className="text-[10.5px] text-center text-slate-400">
                🔒 কোনো লগইন বা পাসওয়ার্ডের প্রয়োজন নেই
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ক্যাম্পেইনের বিস্তারিত উদ্দেশ্য ও পরিকল্পনা</span>
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-normal">
              {campaign.description || campaign.shortDescription}
            </div>
          </div>

          {/* Transparency & Security Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-brand-mint shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                ১০০% স্বচ্ছতা ও আমানতদারি নিশ্চয়তা
              </h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                আপনার দেওয়া প্রতিটি পয়সা সরাসরি নির্ধারিত কল্যাণ কার্যক্রমে ব্যয় করা হয়। ক্যাম্পেইনের অর্থ সাধারণ প্রাতিষ্ঠানিক তহবিল থেকে সম্পূর্ণ পৃথক খতিয়ানে সংরক্ষিত ও নিরীক্ষিত হয়।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile screens */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsDonateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-emerald text-white font-bold text-sm shadow-xl active:scale-95 transition-transform"
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>দান করুন</span>
        </button>
      </div>

      {/* Donation Modal */}
      {isDonateOpen && (
        <DonationModal
          campaign={campaign}
          isOpen={isDonateOpen}
          onClose={() => setIsDonateOpen(false)}
        />
      )}
    </div>
  );
}
