'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Vote,
  ArrowRight,
  Loader2,
  DollarSign,
} from 'lucide-react';
import {
  useOrgMemberDashboardQuery,
  useOrgElectionsQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';

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

export default function MemberDashboardPage() {
  const { data: dashboard, isLoading } = useOrgMemberDashboardQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const mutations = useOrgMutations();

  const activeElection = elections.find(
    (e) => e.status === 'VOTING_ACTIVE' || e.status === 'NOMINATION_OPEN',
  );

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = React.useState(false);
  const [payMonth, setPayMonth] = React.useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = React.useState(new Date().getFullYear());
  const [payMethod, setPayMethod] = React.useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'CASH'>('BKASH');
  const [payTrxId, setPayTrxId] = React.useState('');
  const [payError, setPayError] = React.useState<string | null>(null);
  const [paySuccessMsg, setPaySuccessMsg] = React.useState<string | null>(null);

  const membership = dashboard?.membership;
  const agreement = dashboard?.agreement;
  const agreedAmount = agreement?.agreedAmount || 100;

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    setPaySuccessMsg(null);

    try {
      await mutations.payMonthlyContribution.mutateAsync({
        periodMonth: payMonth,
        periodYear: payYear,
        amount: agreedAmount,
        paymentMethod: payMethod,
        trxId: payTrxId.trim() || undefined,
      });
      setPaySuccessMsg('মাসিক অনুদান সফলভাবে পরিশোধিত হয়েছে!');
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
        <p className="text-xs text-slate-500">সদস্য ড্যাশবোর্ড তথ্য লোড হচ্ছে...</p>
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

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. Official Digital Membership Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-emerald via-emerald-800 to-brand-charcoal text-white p-6 sm:p-7 shadow-xl border border-white/10">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-brand-emerald flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              ম
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-emerald-100">
                আমরা মোহাম্মদপুরী নাগরিক উন্নয়ন সংস্থা
              </h2>
              <span className="text-[10px] uppercase font-semibold text-brand-gold tracking-widest">
                Official Digital Membership Identity
              </span>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center gap-1.5 text-xs text-brand-gold font-bold self-end sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span>সক্রিয় সদস্য (ভেরিফাইড)</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
          {/* User Photo & Name */}
          <div className="sm:col-span-2 flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/10 ring-2 ring-brand-gold/60 shrink-0">
              {membership.user?.image ? (
                <Image
                  src={membership.user.image}
                  alt={membership.user.name || 'Member'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">
                  {membership.user?.name?.charAt(0) || 'ম'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-black text-white">
                {membership.user?.name}
              </h1>
              <p className="text-xs text-emerald-100 font-medium">
                {membership.designation?.title || 'সাধারণ সদস্য'} • {membership.orgRole}
              </p>
              <div className="inline-block px-2.5 py-0.5 rounded-lg bg-white/10 text-brand-gold font-mono text-xs font-bold tracking-wider">
                ID: {membership.memberId}
              </div>
            </div>
          </div>

          {/* Joining Date & Contribution Summary */}
          <div className="flex flex-col justify-between sm:text-right border-t sm:border-t-0 sm:border-l border-white/15 pt-4 sm:pt-0 sm:pl-6 space-y-2">
            <div>
              <span className="text-[10px] text-emerald-200 block uppercase">যোগদানের তারিখ</span>
              <span className="text-xs font-bold text-white">
                {new Date(membership.joinedAt).toLocaleDateString('bn-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 block uppercase">মাসিক অঙ্গীকার</span>
              <span className="text-base font-black text-brand-gold">৳{agreedAmount} / মাস</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Contribution & Financial Status (Seamless Modern Layout) */}
      <div className="py-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-emerald" />
              <span>মাসিক অনুদান ({new Date().getFullYear()})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              মোট প্রদত্ত অনুদান: <strong className="text-brand-emerald font-bold">৳{dashboard?.totalContributed ?? 0}</strong> • বকেয়া কিস্তি:{' '}
              <strong className={dashboard?.pendingDueCount ? 'text-red-500 font-bold' : 'text-brand-emerald font-bold'}>
                {dashboard?.pendingDueCount ?? 0} টি
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPayModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-brand-gold" />
            <span>মাসিক কিস্তি পরিশোধ করুন</span>
          </button>
        </div>

        {/* 12-Month Calendar Grid - Soft Fluid Chips */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {new Date().getFullYear()} সালের অনুদান অগ্রগতি:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {(dashboard?.calendar || []).map((item) => (
              <div
                key={item.month}
                className={`p-2.5 rounded-xl transition-all flex flex-col justify-between ${
                  item.isPaid
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : item.month <= new Date().getMonth() + 1
                    ? 'bg-rose-500/10 text-rose-800 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{MONTH_NAMES_BN[item.month - 1]}</span>
                  {item.isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />}
                </div>
                <div className="mt-1 text-[11px] font-semibold">
                  {item.isPaid ? (
                    <span className="text-brand-emerald font-bold">৳{item.amount}</span>
                  ) : item.month <= new Date().getMonth() + 1 ? (
                    <span className="text-rose-500 font-bold">বকেয়া</span>
                  ) : (
                    <span className="text-slate-400">আসন্ন</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Receipts List - Clean Flat Divided Rows */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              সর্বশেষ অনুদান রসিদসমূহ:
            </span>
            {(dashboard?.payments || []).length > 0 && (
              <span className="text-[11px] text-slate-400">
                মোট {dashboard?.payments?.length} টি রসিদ
              </span>
            )}
          </div>

          <div className="overflow-x-auto no-scrollbar scrollbar-none pb-2">
            <div className="min-w-[460px] divide-y divide-slate-200/60 dark:divide-white/10">
              {(dashboard?.payments || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">এখনও কোনো কিস্তি জমা হয়নি</p>
              ) : (
                (dashboard?.payments || []).map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-base sm:text-lg font-black text-brand-emerald shrink-0 leading-none select-none">
                        ৳
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {MONTH_NAMES_BN[p.periodMonth - 1]} {p.periodYear} এর মাসিক অনুদান
                        </h5>
                        <p className="text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
                          পেমেন্ট: <span className="font-semibold text-slate-600 dark:text-slate-300">{p.paymentMethod}</span> • TrxID: <span className="font-mono text-slate-600 dark:text-slate-300">{p.trxId || 'N/A'}</span> • {new Date(p.paidAt).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="text-xs sm:text-sm font-extrabold text-brand-emerald whitespace-nowrap">
                        + ৳{p.amount}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-emerald/15 text-brand-emerald mt-0.5 whitespace-nowrap">
                        পরিশোধিত
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Upcoming Meetings & Notices (Seamless Layout) */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-emerald" />
                <span>আসন্ন সাধারণ সভা ও মিটিং</span>
              </h4>
            </div>

            <div className="divide-y divide-slate-200/60 dark:divide-white/10">
              {(dashboard?.upcomingMeetings || []).length > 0 ? (
                (dashboard?.upcomingMeetings || []).map((m) => (
                  <div key={m.id} className="py-2.5 text-left space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-brand-emerald font-bold">
                      <span>{new Date(m.date).toLocaleDateString('bn-BD', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-slate-500 font-normal">{m.location}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</h5>
                    {m.agenda && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">এজেন্ডা: {m.agenda}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">বর্তমানে কোনো নির্ধারিত মিটিং নেই</p>
              )}
            </div>
          </div>

          {/* Digital Election Quick Action */}
          {activeElection && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Vote className="w-4 h-4" />
                  <span>ডিজিটাল ভোটাধিকার</span>
                </h4>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{activeElection.title}</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
            </div>
          )}
        </div>
      </div>

      {/* Pay Contribution Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-emerald" />
                <span>মাসিক অনুদান পরিশোধ</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-xs">
                {payError}
              </div>
            )}
            {paySuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs">
                {paySuccessMsg}
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    মাস
                  </label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                  >
                    {MONTH_NAMES_BN.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    বছর
                  </label>
                  <input
                    type="number"
                    value={payYear}
                    onChange={(e) => setPayYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পরিশোধের পরিমাণ (অঙ্গীকার অনুযায়ী)
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-black text-brand-emerald">
                  ৳{agreedAmount}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                >
                  <option value="BKASH">bKash (০১৭৫০০০০০০০)</option>
                  <option value="NAGAD">Nagad (০১৮৫০০০০০০০)</option>
                  <option value="ROCKET">Rocket (০১৯৫০০০০০০০)</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CASH">Cash (কোষাধ্যক্ষ অফিস)</option>
                </select>
              </div>

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
                    placeholder="TrxID লিখুন"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none uppercase"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={mutations.payMonthlyContribution.isPending}
                className="w-full py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-800 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {mutations.payMonthlyContribution.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>জমা নিশ্চিত করুন</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
