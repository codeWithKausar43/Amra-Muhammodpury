'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Vote,
  Users,
  Building,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  useOrgOverviewQuery,
  useOrgMembershipStatusQuery,
  useOrgElectionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';

export default function OrganizationPage() {
  const { data: session } = useSession();
  const { data: overview } = useOrgOverviewQuery();
  const { data: membershipData } = useOrgMembershipStatusQuery();
  const { data: elections = [] } = useOrgElectionsQuery();

  const membership = membershipData?.membership;
  const application = membershipData?.latestApplication;
  const isActiveMember = membership?.status === 'ACTIVE';
  const isOfficer =
    Boolean(membership && ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR'].includes(membership.orgRole)) ||
    (session?.user as any)?.role === 'ADMIN';

  const activeElection = elections.find((e) => e.status === 'VOTING_ACTIVE' || e.status === 'NOMINATION_OPEN');

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. Hero / Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>নিবন্ধিত নাগরিক উন্নয়ন পরিষদ • প্রতিষ্ঠা ২০২৬</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              আমরা মোহাম্মদপুরী
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              মুহাম্মদপুরের নাগরিক উন্নয়ন, নিরাপত্তা, সামাজিক ঐক্য ও জবাবদিহিতা নিশ্চিতকরণে স্থানীয় বাসিন্দাদের প্রাতিষ্ঠানিক সংগঠন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {isActiveMember ? (
              <div className="space-y-2">
                <Link
                  href="/organization/member"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-brand-emerald font-bold text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>সদস্য ড্যাশবোর্ড</span>
                </Link>
                {isOfficer && (
                  <Link
                    href="/organization/admin"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 rounded-2xl bg-brand-gold/90 text-slate-900 font-bold text-xs shadow hover:bg-brand-gold active:scale-95 transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>প্রশাসনিক প্যানেল</span>
                  </Link>
                )}
              </div>
            ) : application?.status === 'PENDING' ? (
              <div className="px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-brand-gold text-xs font-bold mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>আবেদন পর্যালোচনায় আছে</span>
                </div>
                <p className="text-[11px] text-emerald-100">মাসিক অনুদান: ৳{application.monthlyContribution}</p>
              </div>
            ) : application?.status === 'APPROVED' && membership?.status === 'APPROVED_PAYMENT_PENDING' ? (
              <Link
                href="/organization/payment"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-gold text-slate-900 font-bold text-sm shadow-lg hover:brightness-105 active:scale-95 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>প্রারম্ভিক কিস্তি পরিশোধ করুন</span>
              </Link>
            ) : (
              <Link
                href="/organization/apply"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-brand-emerald font-bold text-sm shadow-xl hover:bg-emerald-50 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span>সদস্যপদের জন্য আবেদন</span>
              </Link>
            )}

            <Link
              href="/organization/elections"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
            >
              <Vote className="w-3.5 h-3.5 text-brand-gold" />
              <span>ডিজিটাল নির্বাচন কেন্দ্র</span>
            </Link>
          </div>
        </div>

        {/* Real Metrics Counter */}
        <div className="grid grid-cols-3 gap-2 pt-6 mt-6 border-t border-white/15 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {overview?.stats.activeMembers ?? 1} জন
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-200">নিবন্ধিত সক্রিয় সদস্য</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-brand-gold">
              {overview?.stats.activeProjects ?? 2} টি
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-200">চলমান উন্নয়ন প্রকল্প</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {overview?.stats.totalFundsCount ?? 4} টি
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-200">স্বচ্ছ নাগরিক তহবিল</div>
          </div>
        </div>
      </div>

      {/* 2. Status Banner for Current User */}
      {session?.user && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 dark:bg-brand-emerald/20 flex items-center justify-center text-brand-emerald shrink-0">
                {isActiveMember ? (
                  <CheckCircle2 className="w-6 h-6 text-brand-emerald" />
                ) : application?.status === 'PENDING' ? (
                  <Clock className="w-6 h-6 text-amber-500" />
                ) : (
                  <Building className="w-6 h-6 text-brand-emerald" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isActiveMember
                      ? 'আপনি একজন সক্রিয় প্রাতিষ্ঠানিক সদস্য'
                      : application?.status === 'PENDING'
                      ? 'আপনার সদস্যপদ আবেদন প্রক্রিয়াধীন'
                      : 'সাধারণ সামাজিক প্ল্যাটফর্ম ব্যবহারকারী'}
                  </h3>
                  {isActiveMember && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald">
                      {membership.memberId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isActiveMember
                    ? `পদবি: ${membership.designation?.title || 'সাধারণ সদস্য'} • মাসিক অনুদান: ৳${membershipData?.currentAgreement?.agreedAmount || 50}`
                    : application?.status === 'PENDING'
                    ? 'কার্যনির্বাহী কমিটির অনুমোদন সম্পন্ন হলে প্রারম্ভিক কিস্তির জন্য জানানো হবে।'
                    : 'সামাজিক টাইমলাইন সবার জন্য উন্মুক্ত। প্রাতিষ্ঠানিক সুবিধা ও ভোটাধিকার পেতে সদস্যপদ আবেদন করুন।'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isActiveMember ? (
                <Link
                  href="/organization/member"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold hover:bg-emerald-800 transition-colors text-center"
                >
                  সদস্য ড্যাশবোর্ডে প্রবেশ
                </Link>
              ) : application?.status === 'APPROVED' && membership?.status === 'APPROVED_PAYMENT_PENDING' ? (
                <Link
                  href="/organization/payment"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-gold text-slate-900 text-xs font-bold hover:brightness-105 transition-all text-center"
                >
                  কিস্তি পরিশোধ
                </Link>
              ) : !application ? (
                <Link
                  href="/organization/apply"
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold hover:bg-emerald-800 transition-colors text-center"
                >
                  সদস্য হতে আবেদন করুন
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Election Notice Card */}
      {activeElection && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  ডিজিটাল নির্বাচন চলমান
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {activeElection.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                গোপন ব্যালটের মাধ্যমে আপনার ভোটাধিকার প্রয়োগ করুন।
              </p>
            </div>
          </div>
          <Link
            href="/organization/elections"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors text-center shrink-0"
          >
            ভোটকেন্দ্রে যান →
          </Link>
        </div>
      )}

      {/* 4. Two Tier Architecture Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier A: General Social Platform */}
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Users className="w-5 h-5 text-slate-500" />
            <span>১. উন্মুক্ত সামাজিক যোগাযোগ মাধ্যম</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            মুহাম্মদপুরের যে কোনো সাধারণ নাগরিক কোনো ফি বা সদস্যপদ ছাড়াই প্ল্যাটফর্মের সোশ্যাল ফিচারগুলো ব্যবহার করতে পারেন:
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4">
            <li>টাইমলাইনে পোস্ট তৈরি, ছবি ও ভিডিও প্রকাশ</li>
            <li>লাইক, কমেন্ট ও বন্ধুদের সাথে মেসেজিং</li>
            <li>এলাকা ভিত্তিক ফোরাম ও গ্রুপে মত প্রকাশ</li>
            <li>জরুরি সামাজিক বিজ্ঞপ্তি পর্যবেক্ষণ</li>
          </ul>
        </div>

        {/* Tier B: Institutional Organization Member */}
        <div className="bg-gradient-to-br from-brand-emerald/5 to-brand-mint/10 dark:from-brand-emerald/10 dark:to-transparent rounded-2xl p-5 border border-brand-emerald/30 space-y-3">
          <div className="flex items-center gap-2 text-brand-emerald dark:text-brand-mint font-bold text-base">
            <Award className="w-5 h-5 text-brand-emerald" />
            <span>২. প্রাতিষ্ঠানিক সংগঠন সদস্যপদ</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            অনুমোদিত ও নিয়মিত মাসিক চাঁদা (সর্বনিম্ন ৳৫০) প্রদানকারী সদস্যদের জন্য বিশেষ প্রাতিষ্ঠানিক অধিকার:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4">
            <li>ডিজিটাল সদস্য পরিচয়পত্র ও আজীবন সদস্য নম্বর</li>
            <li>ডিজিটাল গোপন ব্যালট নির্বাচনের প্রার্থী হওয়া ও ভোটাধিকার</li>
            <li>নাগরিক তহবিল ব্যয় ও অর্থ বরাদ্দে সিদ্ধান্ত নেওয়ার ক্ষমতা</li>
            <li>মাসিক সাধারণ সভা ও নীতি-নির্ধারণে সরাসরি অংশগ্রহণ</li>
          </ul>
        </div>
      </div>

      {/* 5. Organization Transparency & Funds */}
      <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-emerald" />
              <span>স্বচ্ছ আর্থিক তহবিল ও নাগরিক হিসাবরক্ষণ</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সংগঠনের প্রতিটি টাকার আয়, ব্যয় ও অনুদান সম্পূর্ণ উন্মুক্ত লেজারে সংরক্ষিত
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-brand-emerald hover:underline hidden sm:inline"
          >
            বিস্তারিত লেজার দেখুন →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">সাধারণ পরিচালন তহবিল</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">৳১,০০,০০০</div>
            <span className="text-[10px] text-brand-emerald font-semibold">কার্যক্রম সক্রিয়</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">শিক্ষা ও মেধা সহায়তা</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">৳৫০,০০০</div>
            <span className="text-[10px] text-blue-500 font-semibold">স্কলারশিপ ফান্ড</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">চিকিৎসা সহায়তা তহবিল</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">৳৭৫,০০০</div>
            <span className="text-[10px] text-rose-500 font-semibold">স্বাস্থ্যসেবা ফান্ড</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">জরুরি ত্রাণ ও দুর্যোগ</span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">৳২৫,০০০</div>
            <span className="text-[10px] text-amber-500 font-semibold">রিজার্ভ ফান্ড</span>
          </div>
        </div>
      </div>

      {/* 6. Ongoing Projects & Public Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Notices */}
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-emerald" />
              <span>সাংগঠনিক নোটিশ ও ঘোষণা</span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {overview?.publicNotices && overview.publicNotices.length > 0 ? (
              overview.publicNotices.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-left"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-brand-emerald">{n.priority}</span>
                    <span>{new Date(n.publishedAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই</p>
            )}
          </div>
        </div>

        {/* Public Projects */}
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-emerald" />
              <span>চলমান এলাকা উন্নয়ন প্রকল্প</span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {overview?.publicProjects && overview.publicProjects.length > 0 ? (
              overview.publicProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-left"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.title}</span>
                    <span className="text-brand-emerald font-semibold">{p.progress}% সম্পন্ন</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-brand-emerald rounded-full transition-all"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">বর্তমানে কোনো চলমান প্রকল্প নেই</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
