'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Search,
  ArrowRight,
  Calendar,
  MapPin,
  Loader2,
  Gift,
} from 'lucide-react';
import {
  usePublicCampaignsQuery,
  usePublicCategoriesQuery,
} from '@/features/campaign/hooks/useCampaignQueries';
import { DonationModal } from '@/features/campaign/components/DonationModal';
import type { Campaign } from '@/features/campaign/types';

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
    month: 'short',
    year: 'numeric',
  });
}

export default function PublicCampaignsPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [page, setPage] = React.useState<number>(1);
  const [donatingCampaign, setDonatingCampaign] = React.useState<Campaign | null>(null);

  const { data: categories = [] } = usePublicCategoriesQuery();
  const { data: campaignData, isLoading } = usePublicCampaignsQuery({
    page,
    limit: 12,
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
    search: searchQuery.trim() || undefined,
  });

  const campaigns = campaignData?.items || [];
  const totalPages = campaignData?.totalPages || 1;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6">
      {/* Page Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-emerald via-emerald-800 to-teal-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-emerald-100 border border-white/20">
            <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
            <span>মানবকল্যাণে সরাসরি অংশগ্রহণ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-snug">
            জনকল্যাণমূলক ক্যাম্পেইন ও তহবিল সংগ্রহ
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
            মোহাম্মদপুরের অসহায়, শীতার্ত, দরিদ্র শিক্ষার্থী ও প্রাকৃতিক দুর্যোগে ক্ষতিগ্রস্ত মানুষের পাশে দাঁড়াতে আমাদের উন্মুক্ত ক্যাম্পেইনসমূহে নিঃসংকোচে অনুদান প্রদান করুন। লগইন ছাড়াই যে কেউ অনুদান পাঠাতে পারবেন।
          </p>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-20 top-4 w-32 h-32 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 -mx-1 px-1 flex-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-emerald/40'
            }`}
          >
            সকল ক্যাম্পেইন
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-emerald/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px] sm:min-w-[260px] shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ক্যাম্পেইন খুঁজুন..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald"
          />
        </div>
      </div>

      {/* Campaigns Listing Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
          <p className="text-xs text-slate-500">ক্যাম্পেইন তথ্য লোড হচ্ছে...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-white/5 rounded-3xl border border-slate-200/80 dark:border-white/10 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-400 flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            বর্তমানে কোনো সক্রিয় ক্যাম্পেইন পাওয়া যায়নি
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            অন্য কোনো ক্যাটাগরি বা অনুসন্ধানের শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const goal = camp.goalAmount || 0;
            const collected = camp.collectedAmount || 0;
            const progress = camp.progressPercent || 0;
            const remaining = camp.remainingAmount || 0;

            return (
              <div
                key={camp.id}
                className="group flex flex-col bg-white dark:bg-brand-charcoal rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  {camp.coverImage ? (
                    <Image
                      src={camp.coverImage}
                      alt={camp.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-emerald/10 text-brand-emerald">
                      <Heart className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-black/70 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-xs">
                      {camp.categoryName}
                    </span>
                    {camp.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                        বিশেষ ক্যাম্পেইন
                      </span>
                    )}
                  </div>

                  {camp.location && (
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1 text-[11px] font-medium text-white/90">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{camp.location}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-emerald transition-colors line-clamp-2 leading-snug">
                      <Link href={`/campaigns/${camp.slug || camp.id}`}>{camp.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {camp.shortDescription}
                    </p>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">সংগৃহীত: </span>
                        <span className="font-bold text-brand-emerald dark:text-brand-mint text-sm">
                          ৳ {toBengaliNumber(collected)}
                        </span>
                      </div>
                      {goal > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">লক্ষ্য: </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            ৳ {toBengaliNumber(goal)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-brand-emerald rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{toBengaliNumber(progress)}% সম্পন্ন</span>
                      {remaining > 0 ? (
                        <span>বাকি ৳ {toBengaliNumber(remaining)}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-brand-mint font-bold">লক্ষ্য অর্জিত</span>
                      )}
                    </div>
                  </div>

                  {/* Dates & Actions */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>মেয়াদ: {formatBengaliDate(camp.endDate)} পর্যন্ত</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/campaigns/${camp.slug || camp.id}`}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>বিস্তারিত</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDonatingCampaign(camp)}
                        className="py-2.5 px-3 rounded-xl bg-brand-emerald hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>দান করুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            পূর্ববর্তী
          </button>
          <span className="text-xs text-slate-500 font-medium">
            পৃষ্ঠা {toBengaliNumber(page)} / {toBengaliNumber(totalPages)}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40 cursor-pointer"
          >
            পরবর্তী
          </button>
        </div>
      )}

      {/* Donation Modal when active */}
      {donatingCampaign && (
        <DonationModal
          campaign={donatingCampaign}
          isOpen={Boolean(donatingCampaign)}
          onClose={() => setDonatingCampaign(null)}
        />
      )}
    </div>
  );
}
