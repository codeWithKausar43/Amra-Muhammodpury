'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Award,
  Vote,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  Lock,
  HeartHandshake,
} from 'lucide-react';
import {
  useOrgOverviewQuery,
  useOrgMembershipStatusQuery,
  useOrgElectionsQuery,
} from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';
import { MemberFinancialTransparency } from '@/features/organization/components/MemberFinancialTransparency';

export default function OrganizationPage() {
  const { data: session } = useSession();
  const { data: overview } = useOrgOverviewQuery();
  const { data: membershipData, isLoading: isMembershipLoading } = useOrgMembershipStatusQuery();
  const { data: elections = [] } = useOrgElectionsQuery();

  const membership = membershipData?.membership;
  const application = membershipData?.latestApplication;
  const isOfficer =
    Boolean(
      membership &&
        ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(
          membership.orgRole,
        ),
    ) ||
    Boolean(
      membership?.designation?.title &&
        /সভাপতি/i.test(membership.designation.title),
    ) ||
    (session?.user as any)?.role === 'ADMIN' ||
    (session?.user as any)?.role === 'SUPER_ADMIN' ||
    session?.user?.email === 'itskausarprodhan@gmail.com' ||
    session?.user?.email === 'itskausarprod@gmail.com';

  const isActiveMember = membership?.status === 'ACTIVE' || isOfficer;

  // Only elections with active voting or open nomination are considered active
  const activeElection = elections.find(
    (e) => e.status === 'VOTING_ACTIVE' || e.status === 'NOMINATION_OPEN',
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. Hero / Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              মোহাম্মদপুর কমিউনিটি
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              মোহাম্মদপুরের নাগরিক উন্নয়ন, নিরাপত্তা, সামাজিক ঐক্য ও জবাবদিহিতা নিশ্চিতকরণে স্থানীয় বাসিন্দাদের প্রাতিষ্ঠানিক সংগঠন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {isActiveMember || isOfficer ? (
              <div className="space-y-2">
                {isActiveMember && (
                  <Link
                    href="/organization/member"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-brand-emerald font-bold text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>সদস্য ড্যাশবোর্ড</span>
                  </Link>
                )}
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

            {/* Voting Center Button: ONLY visible when an election is created and active AND user is a member/officer */}
            {activeElection && (isActiveMember || isOfficer) && (
              <Link
                href="/organization/elections"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition-all animate-in fade-in"
              >
                <Vote className="w-3.5 h-3.5 text-slate-950" />
                <span>ডিজিটাল নির্বাচন কেন্দ্র</span>
              </Link>
            )}

            {/* Jump Link: About organization for general users */}
            {!isActiveMember && !isOfficer && (
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-300" />
                <span>সংগঠন সম্পর্কে জানুন</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. Active Election Notice Card (Strictly visible ONLY when an election is created & active by Superadmin AND user is a member/officer) */}
      {activeElection && (isActiveMember || isOfficer) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
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
                সক্রিয় প্রাতিষ্ঠানিক সদস্য হিসেবে গোপন ব্যালটের মাধ্যমে আপনার ভোটাধিকার প্রয়োগ করুন।
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

      {/* 3. Organization Financial Transparency & Complete Accounts Ledger (Protected: Visible ONLY to Active Members & Officers) */}
      {isActiveMember || isOfficer ? (
        <section id="transparency" className="pt-2 animate-in fade-in">
          <MemberFinancialTransparency />
        </section>
      ) : (
        /* For General / Non-member Users: Preview Banner explaining accounts are for members, and directing to membership */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-7 shadow-md animate-in fade-in">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>সদস্যদের জন্য সংরক্ষিত</span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
                অভ্যন্তরীণ তহবিল হিসাবরক্ষণ ও প্রাতিষ্ঠানিক সুযোগ
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
                সংগঠনের বিস্তারিত আয়-ব্যয় অডিট লেজার, মানবিক সহায়তা ও বৃক্ষরোপণ খতিয়ান শুধুমাত্র অনুমোদিত প্রাতিষ্ঠানিক সদস্যদের জন্য সংরক্ষিত। মোহাম্মদপুরের নাগরিক উন্নয়ন ও স্বচ্ছ কার্যক্রমে সরাসরি অংশীদার হতে সদস্যপদ গ্রহণ করুন।
              </p>
            </div>

            <div className="shrink-0 pt-1 md:pt-0">
              <Link
                href="/organization/apply"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md active:scale-95 transition-all"
              >
                <span>সদস্য হতে আবেদন করুন</span>
                <span className="text-emerald-700">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Why Join & Membership Benefits (Visible to Non-Members so general visitors learn all about the organization) */}
      {!isActiveMember && !(session?.user && isMembershipLoading) && (
        <section id="about" className="py-4 sm:py-6 space-y-6 animate-in fade-in">
          <div className="text-left space-y-1.5 max-w-3xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              কেন আমরা সংগঠনে যুক্ত হবো?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              মোহাম্মদপুরের নাগরিক উন্নয়ন, নিরাপত্তা ও পারস্পরিক সহযোগিতায় স্থানীয় বাসিন্দাদের একমাত্র গণতান্ত্রিক ও স্বচ্ছ প্রাতিষ্ঠানিক ঐক্যমঞ্চ।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 pt-2">
            {/* Column 1: Core Values & Why Join */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <div className="w-7 h-7 rounded-xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  সামাজিক লক্ষ্য ও নাগরিক অংশীদারিত্ব
                </h3>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      নাগরিক অধিকার ও সার্বিক নিরাপত্তা
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      মহল্লাভিত্তিক শান্তি-শৃঙ্খলা, পরিচ্ছন্ন পরিবেশ এবং সম্মিলিত নাগরিক নিরাপত্তা নেটওয়ার্ক গড়ে তোলা।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      জরুরি মানবিক ও চিকিৎসা সহায়তা
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      মোহাম্মদপুরের অস্বচ্ছল, অসুস্থ বা দুর্যোগকবলিত প্রতিবেশীদের চিকিৎসাসেবা ও অর্থ সহায়তায় তাৎক্ষণিক পাশে থাকা।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      শতভাগ স্বচ্ছতা ও উন্মুক্ত হিসাবরক্ষণ
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      সদস্যদের অবদানের প্রতিটি টাকার প্রকাশ্য লাইভ হিসাব ও নাগরিক নজরদারির পূর্ণ নিশ্চয়তা।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      সামাজিক ঐক্য ও ভ্রাতৃত্ববোধ
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      রাজনৈতিক প্রভাবমুক্ত একটি নিরপেক্ষ মঞ্চ, যেখানে এলাকা উন্নয়নের প্রশ্নে সব বাসিন্দা একতাবদ্ধ।
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Membership Rights & Privileges */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  সদস্যদের বিশেষ অধিকার ও সুবিধাসমূহ
                </h3>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      ডিজিটাল সদস্য পরিচয়পত্র
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      ভেরিফায়েড কিউআর কোড সম্বলিত আজীবন সদস্য নম্বর ও ডিজিটাল স্মার্ট আইডি কার্ড।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      গণতান্ত্রিক নেতৃত্ব ও ভোটাধিকার
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      কার্যনির্বাহী কমিটির বিভিন্ন পদে নির্বাচনে প্রার্থী হওয়ার যোগ্যতা এবং ডিজিটাল গোপন ব্যালটে ভোটদানের ক্ষমতা।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      তহবিল বরাদ্দে সরাসরি সিদ্ধান্ত
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      সংগঠনের নাগরিক কল্যাণ তহবিলের অর্থ কোন উন্নয়নমূলক খাতে ব্যয় হবে সে বিষয়ে ভোটাধিকার প্রয়োগ।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      নীতি-নির্ধারণে সরাসরি অংশীদারিত্ব
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      মাসিক সাধারণ সভা, ফোরাম বিতর্ক এবং সংগঠনের বার্ষিক কর্মপরিকল্পনা প্রণয়নে সক্রিয় অংশগ্রহণ।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Organizational Notices (Protected: ONLY visible to Active Members) */}
      {isActiveMember && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 space-y-3 animate-in fade-in">
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
      )}
    </div>
  );
}
