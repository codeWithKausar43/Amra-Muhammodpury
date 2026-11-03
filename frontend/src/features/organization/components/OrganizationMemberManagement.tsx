'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Phone,
  Briefcase,
  CreditCard,
  Edit2,
  Loader2,
  Eye,
} from 'lucide-react';
import {
  useAdminMembersQuery,
  useAdminMemberDetailsQuery,
  useOrgMutations,
} from '../hooks/useOrganizationQueries';
import type { AdminMemberItem } from '../types';

function toBengaliNumber(num: number | string | undefined | null): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'সক্রিয় সদস্য', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  APPROVED_PAYMENT_PENDING: { label: 'পেমেন্ট অপেক্ষমাণ', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  SUSPENDED: { label: 'স্থগিত', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  ARCHIVED: { label: 'আর্কাইভকৃত', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PAID: { label: 'পরিশোধিত', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  UNPAID: { label: 'বকেয়া', color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  PENDING: { label: 'যাচাই বাকি', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  OVERDUE: { label: 'মেয়াদোত্তীর্ণ', color: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' },
  NOT_APPLICABLE: { label: 'প্রযোজ্য নয়', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
};

export function OrganizationMemberManagement() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>('ALL');
  const [designationId, setDesignationId] = React.useState<string>('ALL');
  const [committeeId, setCommitteeId] = React.useState<string>('ALL');
  const [paymentStatus, setPaymentStatus] = React.useState<string>('ALL');
  const [page, setPage] = React.useState<number>(1);

  // Modals & Drawer State
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const [statusModalMember, setStatusModalMember] = React.useState<AdminMemberItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<any>('ACTIVE');
  const [statusNote, setStatusNote] = React.useState('');

  const [designationModalMember, setDesignationModalMember] = React.useState<AdminMemberItem | null>(null);
  const [targetDesignationId, setTargetDesignationId] = React.useState<string>('');
  const [targetCommitteeId, setTargetCommitteeId] = React.useState<string>('');
  const [customTitle, setCustomTitle] = React.useState<string>('');

  const { data, isLoading } = useAdminMembersQuery({
    search: search || undefined,
    status: status !== 'ALL' ? status : undefined,
    designationId: designationId !== 'ALL' ? designationId : undefined,
    committeeId: committeeId !== 'ALL' ? committeeId : undefined,
    paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
    page,
    limit: 15,
  });

  const { data: memberDetails, isLoading: isDetailsLoading } = useAdminMemberDetailsQuery(selectedMemberId);
  const mutations = useOrgMutations();

  const summary = data?.summary;
  const members = data?.members || [];
  const pagination = data?.pagination;
  const designations = data?.designations || [];
  const committees = data?.committees || [];

  const handleUpdateStatus = async () => {
    if (!statusModalMember) return;
    try {
      await mutations.updateMemberStatus.mutateAsync({
        id: statusModalMember.id,
        data: {
          status: newStatus,
          notes: statusNote || undefined,
        },
      });
      setStatusModalMember(null);
      setStatusNote('');
    } catch (err: any) {
      alert(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleAssignDesignation = async () => {
    if (!designationModalMember) return;
    try {
      await mutations.assignMemberDesignation.mutateAsync({
        id: designationModalMember.id,
        data: {
          designationId: targetDesignationId || null,
          committeeId: targetCommitteeId || null,
          customTitle: customTitle || null,
        },
      });
      setDesignationModalMember(null);
      setCustomTitle('');
    } catch (err: any) {
      alert(err.message || 'পদবি নির্ধারণ ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Summary Statistics Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-emerald" />
              <span>সংগঠন সদস্য ব্যবস্থাপনা ও ডিরেক্টরি</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              নিবন্ধিত সদস্যদের তথ্য, পদবি নির্ধারণ, মাসিক চাঁদা আদায় স্ট্যাটাস ও সদস্যপদ নিয়ন্ত্রণ
            </p>
          </div>
        </div>

        {/* 9 Accurate DB Counts Grid */}
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
          <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">মোট নিবন্ধিত</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {toBengaliNumber(summary?.totalRegistered)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-brand-emerald/10 border border-brand-emerald/30 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">সক্রিয় সদস্য</span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {toBengaliNumber(summary?.totalActive)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 shadow-xs">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">নতুন আবেদন</span>
            <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
              {toBengaliNumber(summary?.pendingApps)} <span className="text-xs font-normal">টি</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 shadow-xs">
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 block">পেমেন্ট অপেক্ষমাণ</span>
            <div className="text-lg sm:text-xl font-black text-sky-700 dark:text-sky-400 mt-0.5">
              {toBengaliNumber(summary?.approvedPaymentPending)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">চলতি মাস পরিশোধিত</span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {toBengaliNumber(summary?.paidThisMonth)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">চলতি মাস বকেয়া</span>
            <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {toBengaliNumber(summary?.unpaidThisMonth)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/50 shadow-xs">
            <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block">মেয়াদোত্তীর্ণ বকেয়া</span>
            <div className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
              {toBengaliNumber(summary?.overdueCount)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">স্থগিত সদস্য</span>
            <div className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
              {toBengaliNumber(summary?.suspendedCount)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs col-span-2 min-[420px]:col-span-1">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">আর্কাইভকৃত</span>
            <div className="text-lg sm:text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
              {toBengaliNumber(summary?.archivedCount)} <span className="text-xs font-normal">জন</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search, Filters & Quick Selectors */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, ফোন বা সদস্য আইডি (যেমন AM-2026) দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-brand-emerald"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 outline-none"
            >
              <option value="ALL">সব স্ট্যাটাস</option>
              <option value="ACTIVE">সক্রিয় সদস্য</option>
              <option value="APPROVED_PAYMENT_PENDING">পেমেন্ট অপেক্ষমাণ</option>
              <option value="SUSPENDED">স্থগিত</option>
              <option value="ARCHIVED">আর্কাইভ</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 outline-none"
            >
              <option value="ALL">সব চাঁদা অবস্থা</option>
              <option value="PAID">পরিশোধিত</option>
              <option value="UNPAID">বকেয়া</option>
              <option value="PENDING">যাচাই অপেক্ষমাণ</option>
              <option value="OVERDUE">মেয়াদোত্তীর্ণ</option>
            </select>

            <select
              value={designationId}
              onChange={(e) => {
                setDesignationId(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 outline-none truncate"
            >
              <option value="ALL">সকল পদবি</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={committeeId}
              onChange={(e) => {
                setCommitteeId(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 outline-none truncate"
            >
              <option value="ALL">সকল কমিটি</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Members List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
            <p className="text-xs text-slate-400">সদস্য তথ্য লোড হচ্ছে...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              কোনো সদস্য পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-400">
              অনুসন্ধানের শর্ত পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {members.map((member) => {
              const statusBadge = STATUS_LABELS[member.status] ?? STATUS_LABELS['ACTIVE']!;
              const payBadge = PAYMENT_STATUS_LABELS[member.currentMonthStatus] ?? PAYMENT_STATUS_LABELS['NOT_APPLICABLE']!;

              return (
                <div
                  key={member.id}
                  className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/10 shrink-0 overflow-hidden relative border border-slate-200 dark:border-white/10">
                      {member.user.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-sm">
                          {member.user.name?.charAt(0) || 'ম'}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {member.user.name}
                        </h4>
                        {member.memberNumber && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            #{member.memberNumber}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        {member.user.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <a href={`tel:${member.user.phone}`} className="hover:underline">
                              {member.user.phone}
                            </a>
                          </span>
                        )}

                        {member.designation ? (
                          <span className="flex items-center gap-1 text-brand-emerald dark:text-brand-mint font-semibold">
                            <Award className="w-3 h-3" />
                            <span>{member.designation.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">সাধারণ সদস্য</span>
                        )}

                        {member.user.profession && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{member.user.profession}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Contribution Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-white/5">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        ৳ {toBengaliNumber(member.monthlyContribution)} <span className="text-[10px] font-normal text-slate-500">/মাস</span>
                      </div>
                      <div className="mt-0.5 flex items-center sm:justify-end gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${payBadge.color}`}>
                          চলতি মাস: {payBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusModalMember(member);
                          setNewStatus(member.status);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
                        title="স্ট্যাটাস পরিবর্তন"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDesignationModalMember(member);
                          setTargetDesignationId(member.designationId || '');
                        }}
                        className="p-2 rounded-xl bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint transition-colors"
                        title="পদবি নির্ধারণ"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 px-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              মোট {toBengaliNumber(pagination.total)} জনের মধ্যে পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 text-slate-700 dark:text-slate-300"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 text-slate-700 dark:text-slate-300"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Member Details Drawer (Mobile-first full sheet) */}
      {selectedMemberId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end animate-in fade-in">
          <div className="w-full sm:max-w-lg h-full bg-white dark:bg-[#141F1B] border-l border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-emerald" />
                <span>সদস্যের সম্পূর্ণ প্রোফাইল ও রেকর্ড</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMemberId(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isDetailsLoading || !memberDetails ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-emerald mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">তথ্য লোড হচ্ছে...</p>
                </div>
              ) : (() => {
                const user = memberDetails.user || memberDetails.membership?.user;
                const membership = memberDetails.membership;
                const recentPayments = memberDetails.recentPayments || (memberDetails as any).payments || [];
                const committeesList = memberDetails.committees || (memberDetails as any).committeeHistory || [];
                const remindersList = memberDetails.reminders || (memberDetails as any).reminderHistory || [];

                return (
                  <div className="space-y-4">
                    {/* Top Profile Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/10 relative overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                        {user?.image ? (
                          <Image
                            src={user.image}
                            alt={user?.name || 'সদস্য'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">
                            {user?.name?.charAt(0) || 'ম'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {user?.name || 'অজ্ঞাত সদস্য'}
                        </h4>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>আইডি: #{membership?.memberNumber || 'নির্ধারিত নয়'}</span>
                          <span>•</span>
                          <span>{membership?.designation?.name || 'সাধারণ সদস্য'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Core Information Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">ফোন নম্বর</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {user?.phone || 'দেওয়া হয়নি'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">ইমেইল</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {user?.email || 'দেওয়া হয়নি'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">পেশা</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {user?.profession || 'সাধারণ'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">যোগদানের তারিখ</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {membership?.joinedAt ? new Date(membership.joinedAt).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : 'N/A'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">নির্ধারিত মাসিক চাঁদা</span>
                        <span className="font-bold text-brand-emerald dark:text-brand-mint text-sm">
                          ৳ {toBengaliNumber(membership?.monthlyContribution)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                        <span className="text-[10px] text-slate-400 block">সদস্য স্ট্যাটাস</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {membership ? (STATUS_LABELS[membership.status]?.label || membership.status) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Committees List */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-brand-emerald" />
                        <span>কমিটি সংশ্লিষ্টতা</span>
                      </h5>
                      {committeesList.length === 0 ? (
                        <p className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                          বর্তমানে কোনো বিশেষ কমিটিতে যুক্ত নেই।
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {committeesList.map((c: any) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {c.committee?.name || c.committeeName || 'কমিটি'}
                              </span>
                              <span className="text-[11px] text-brand-emerald dark:text-brand-mint font-semibold">
                                {c.customTitle || 'সদস্য'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Payments History */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-brand-emerald" />
                        <span>চাঁদা প্রদানের ইতিহাস (সর্বশেষ ১০টি)</span>
                      </h5>
                      {recentPayments.length === 0 ? (
                        <p className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                          এখনো কোনো চাঁদা প্রদানের রেকর্ড নেই।
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {recentPayments.map((p: any) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs flex items-center justify-between"
                            >
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {toBengaliNumber(p.periodMonth)}/{toBengaliNumber(p.periodYear)} কিস্তি • {p.paymentMethod}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Trx: {p.trxId || 'N/A'} • {new Date(p.paidAt).toLocaleDateString('bn-BD')}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-brand-emerald dark:text-brand-mint">
                                  + ৳ {toBengaliNumber(p.amount)}
                                </span>
                                <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {p.status === 'COMPLETED' || p.status === 'VERIFIED' ? 'পরিশোধিত' : p.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reminder History */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>তাগিদ প্রেরণের ইতিহাস</span>
                      </h5>
                      {remindersList.length === 0 ? (
                        <p className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                          এই সদস্যকে কোনো তাগিদ পাঠানো হয়নি।
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {remindersList.map((r: any) => (
                            <div
                              key={r.id}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs flex items-center justify-between"
                            >
                              <span>
                                {toBengaliNumber(r.periodMonth)}/{toBengaliNumber(r.periodYear)} মাসের তাগিদ ({r.slot})
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(r.sentAt).toLocaleString('bn-BD', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberId(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Member Status Update Modal */}
      {statusModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-emerald" />
                <span>সদস্য স্ট্যাটাস পরিবর্তন</span>
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalMember(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              সদস্য: <strong>{statusModalMember.user.name}</strong> (#{statusModalMember.memberNumber || 'N/A'})
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  নতুন স্ট্যাটাস নির্বাচন করুন
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                >
                  <option value="ACTIVE">সক্রিয় সদস্য (ACTIVE)</option>
                  <option value="APPROVED_PAYMENT_PENDING">পেমেন্ট অপেক্ষমাণ (APPROVED_PAYMENT_PENDING)</option>
                  <option value="SUSPENDED">স্থগিত (SUSPENDED)</option>
                  <option value="ARCHIVED">আর্কাইভ (ARCHIVED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  মন্তব্য / কারণ (ঐচ্ছিক)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="স্ট্যাটাস পরিবর্তনের যৌক্তিকতা বা কারণ লিখুন..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setStatusModalMember(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={mutations.updateMemberStatus.isPending}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                {mutations.updateMemberStatus.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Member Designation Assignment Modal */}
      {designationModalMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-emerald" />
                <span>পদবি ও দায়িত্ব নির্ধারণ</span>
              </h3>
              <button
                type="button"
                onClick={() => setDesignationModalMember(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              সদস্য: <strong>{designationModalMember.user.name}</strong>
              <div className="text-[11px] text-slate-400 mt-0.5">
                বর্তমান পদবি: {designationModalMember.designation?.name || 'সাধারণ সদস্য'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  সাংগঠনিক পদবি নির্বাচন করুন
                </label>
                <select
                  value={targetDesignationId}
                  onChange={(e) => setTargetDesignationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                >
                  <option value="">সাধারণ সদস্য (কোনো বিশেষ পদবি নেই)</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (মর্যাদা স্তর: {toBengaliNumber(d.rank)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  কমিটিতে অন্তর্ভুক্তি (ঐচ্ছিক)
                </label>
                <select
                  value={targetCommitteeId}
                  onChange={(e) => setTargetCommitteeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                >
                  <option value="">কোনো বিশেষ কমিটি নয়</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {targetCommitteeId && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    কমিটিতে কাস্টম পদবি / ভূমিকা (যেমন আহ্বায়ক, যুগ্ম সদস্য সচিব)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="ভূমিকা লিখুন..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-emerald"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDesignationModalMember(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAssignDesignation}
                disabled={mutations.assignMemberDesignation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                {mutations.assignMemberDesignation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
