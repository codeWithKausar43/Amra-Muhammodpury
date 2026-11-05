'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useActivePopupCampaignQuery } from '../hooks/useCampaignQueries';
import { DonationModal } from './DonationModal';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export const CampaignEntryPopup: React.FC = () => {
  const { data: campaign, isLoading } = useActivePopupCampaignQuery();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDonateOpen, setIsDonateOpen] = React.useState(false);

  React.useEffect(() => {
    // Only check sessionStorage on the client
    if (typeof window === 'undefined') return;

    try {
      const hasSeenInSession = sessionStorage.getItem('amp_campaign_popup_seen');
      if (!hasSeenInSession && campaign) {
        // Small delay so page renders first smoothly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
    return undefined;
  }, [campaign]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('amp_campaign_popup_seen', 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleOpenDonate = () => {
    setIsOpen(false);
    setIsDonateOpen(true);
  };

  if (isLoading || !campaign || !isOpen) {
    return isDonateOpen && campaign ? (
      <DonationModal
        campaign={campaign}
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />
    ) : null;
  }

  const goal = campaign.goalAmount || 0;
  const collected = campaign.collectedAmount || 0;
  const progressPercent = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
  const remaining = goal > 0 ? Math.max(0, goal - collected) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-300 overflow-y-auto">
        <div className="relative w-full max-w-md bg-white dark:bg-brand-charcoal rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
          {/* Close button top right */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-sm"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Cover Image & Category Badge */}
          <div className="relative h-44 sm:h-48 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
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
                <Heart className="w-12 h-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badge on Image */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-emerald/90 backdrop-blur-md shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{campaign.categoryName || 'জরুরি ক্যাম্পেইন'}</span>
              </span>
              {campaign.isFeatured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  বিশেষ উদ্যোগ
                </span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {campaign.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                {campaign.shortDescription}
              </p>
            </div>

            {/* Live Progress Bar */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">সংগৃহীত: </span>
                  <span className="font-black text-brand-emerald dark:text-brand-mint text-sm">
                    ৳ {toBengaliNumber(collected)}
                  </span>
                </div>
                {goal > 0 && (
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">লক্ষ্য: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      ৳ {toBengaliNumber(goal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-brand-emerald rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
                <span>{toBengaliNumber(progressPercent)}% সম্পন্ন</span>
                {remaining > 0 && <span>বাকি ৳ {toBengaliNumber(remaining)}</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                href={`/campaigns/${campaign.slug || campaign.id}`}
                onClick={handleClose}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>বিস্তারিত দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleOpenDonate}
                className="py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs text-center transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>দান করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDonateOpen && (
        <DonationModal
          campaign={campaign}
          isOpen={isDonateOpen}
          onClose={() => setIsDonateOpen(false)}
        />
      )}
    </>
  );
};
