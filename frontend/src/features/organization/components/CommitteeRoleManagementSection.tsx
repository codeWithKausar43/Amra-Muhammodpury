'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Award,
  X,
  Phone,
  Briefcase,
  Edit2,
  Loader2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  useAdminMembersQuery,
  useAdminDesignationsQuery,
  useOrgMutations,
} from '../hooks/useOrganizationQueries';
import { toast } from '@/components/feedback/Toast';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { DesignationManagementSection } from './DesignationManagementSection';
import type { AdminMemberItem } from '../types';

function toBengaliNumber(num: number | string | undefined | null): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export function CommitteeRoleManagementSection() {
  const [activeTab, setActiveTab] = React.useState<'MEMBERS' | 'DESIGNATIONS'>('MEMBERS');
  const [search, setSearch] = React.useState('');
  const [selectedDesignationId, setSelectedDesignationId] = React.useState<string>('ALL');
  const [page, setPage] = React.useState<number>(1);

  // Modal State for Assigning / Updating Role
  const [assignmentMember, setAssignmentMember] = React.useState<AdminMemberItem | null>(null);
  const [targetDesignationId, setTargetDesignationId] = React.useState<string>('');
  const [targetCommitteeId, setTargetCommitteeId] = React.useState<string>('');
  const [customTitle, setCustomTitle] = React.useState<string>('');

  // Queries
  const { data: membersData, isLoading: isMembersLoading } = useAdminMembersQuery({
    search: search || undefined,
    designationId: selectedDesignationId !== 'ALL' ? selectedDesignationId : undefined,
    page,
    limit: 25,
  });

  const { data: designations = [] } = useAdminDesignationsQuery();
  const mutations = useOrgMutations();

  const members = membersData?.members || [];
  const pagination = membersData?.pagination;
  const summary = membersData?.summary;

  // Open modal with pre-selected member details
  const handleOpenAssignModal = (member: AdminMemberItem) => {
    setAssignmentMember(member);
    setTargetDesignationId(member.designationId || '');
    const firstCommittee = member.committees?.[0];
    setTargetCommitteeId(firstCommittee ? (firstCommittee as any).committeeId || '' : '');
    setCustomTitle(firstCommittee ? (firstCommittee as any).customTitle || '' : '');
  };

  // Save the member's role / designation
  const handleSaveMemberRole = async () => {
    if (!assignmentMember) return;

    try {
      await mutations.assignMemberDesignation.mutateAsync({
        id: assignmentMember.id,
        data: {
          designationId: targetDesignationId || null,
          committeeId: targetCommitteeId || null,
          customTitle: customTitle.trim() || null,
        },
      });

      toast.success('সদস্যের পদবি ও ভূমিকা সফলভাবে হালনাগাদ করা হয়েছে!');
      setAssignmentMember(null);
    } catch (err: any) {
      toast.error(err?.message || 'পদবি হালনাগাদ করতে ব্যর্থ হয়েছে');
    }
  };

  // Quick stats
  const totalMembersCount = summary?.totalRegistered ?? members.length;
  const designatedCount = designations.reduce((acc, d) => acc + (d.memberCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                কমিটি ও পদবি ব্যবস্থাপনা
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সংগঠনের সকল সদস্যের পদবি, ভূমিকা ও কমিটি দায়িত্ব এক ক্লিকে হালনাগাদ করুন
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MEMBERS'
                ? 'bg-brand-emerald text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>সদস্য ও পদবি বণ্টন</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DESIGNATIONS')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DESIGNATIONS'
                ? 'bg-brand-emerald text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>পদবি ডিরেক্টরি</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {toBengaliNumber(designations.length)}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MEMBERS & ROLE ASSIGNMENT (Default View)
         ========================================================================= */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-5">
          {/* Quick Metrics Bar - Always in a Single Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <Users className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                <span className="truncate">মোট সদস্য</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {toBengaliNumber(totalMembersCount)} জন
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">পদবিপ্রাপ্ত কর্মকর্তা</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {toBengaliNumber(designatedCount)} জন
              </div>
            </div>

            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">মোট প্রাতিষ্ঠানিক পদবি</span>
              </div>
              <div className="text-sm sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {toBengaliNumber(designations.length)} টি
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Search Bar */}
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="সদস্যের নাম, মোবাইল নম্বর বা আইডি দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-brand-emerald"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Designation Filter */}
              <div className="sm:col-span-4">
                <select
                  value={selectedDesignationId}
                  onChange={(e) => {
                    setSelectedDesignationId(e.target.value);
                    setPage(1);
                  }}
                  aria-label="পদবি অনুসারে ফিল্টার করুন"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-emerald cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                    সকল পদবি / রোল
                  </option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                      {d.name} ({toBengaliNumber(d.rank)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Members List (Flat & Clean, no boxy card wrapper) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  সদস্য তালিকা
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                  {toBengaliNumber(pagination?.total ?? members.length)} জন
                </span>
              </div>
            </div>

            {isMembersLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-brand-emerald" />
                <p className="text-xs">সদস্য তথ্য লোড হচ্ছে...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">কোনো সদস্য খুঁজে পাওয়া যায়নি</p>
                {(search || selectedDesignationId !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedDesignationId('ALL');
                    }}
                    className="text-xs text-brand-emerald font-bold hover:underline cursor-pointer"
                  >
                    সকল ফিল্টার রিসেট করুন
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto pb-1 scrollbar-none sm:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                <div className="min-w-[580px] divide-y divide-slate-100 dark:divide-white/5">
                  {members.map((member) => {
                    const designationName = member.designation?.name || null;
                    const designationRank = member.designation?.rank;

                    return (
                      <div
                        key={member.id}
                        className="grid grid-cols-[minmax(190px,1.5fr)_minmax(160px,1.2fr)_minmax(130px,1fr)_40px] items-center gap-3 px-1.5 sm:px-2 py-2.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] rounded-xl transition-colors"
                      >
                        {/* 1. Member Profile & Identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 shrink-0">
                            {member.user?.image ? (
                              <Image
                                src={member.user.image}
                                alt={member.user.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                                {member.user?.name?.slice(0, 1) || 'স'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {member.user?.name || 'নাম নেই'}
                              </span>
                              <VerifiedBadge size="xs" />
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              #{member.memberNumber || 'AMP-NEW'}
                            </div>
                          </div>
                        </div>

                        {/* 2. Contact details */}
                        <div className="min-w-0 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                          {member.user?.phone ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono text-[11px] truncate">{member.user.phone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-300 dark:text-slate-600 font-mono">—</div>
                          )}
                          {member.user?.profession ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate text-[11px]">{member.user.profession}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* 3. Designation Badge */}
                        <div className="min-w-0 flex items-center">
                          {designationName ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold shadow-2xs max-w-full">
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">{designationName}</span>
                              {designationRank && (
                                <span className="text-[9px] font-mono opacity-80 shrink-0">
                                  ({toBengaliNumber(designationRank)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 text-[11px] font-medium">
                              <span>সাধারণ সদস্য</span>
                            </div>
                          )}
                        </div>

                        {/* 4. Action Button (Icon only) */}
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(member)}
                            title="পদবি / রোল পরিবর্তন করুন"
                            aria-label="পদবি / রোল পরিবর্তন করুন"
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-brand-emerald hover:text-white dark:hover:bg-brand-emerald dark:hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs px-1">
                <span className="text-slate-500 dark:text-slate-400">
                  পৃষ্ঠা {toBengaliNumber(pagination.page)} / {toBengaliNumber(pagination.totalPages)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    পূর্ববর্তী
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    পরবর্তী
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DESIGNATIONS DIRECTORY (Full CRUD)
         ========================================================================= */}
      {activeTab === 'DESIGNATIONS' && (
        <div className="space-y-4">
          <DesignationManagementSection />
        </div>
      )}

      {/* =========================================================================
          MODAL: ASSIGN / UPDATE MEMBER ROLE & DESIGNATION
         ========================================================================= */}
      {assignmentMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0E1714] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                সদস্যের পদবি ও ভূমিকা নির্ধারণ
              </h3>
              <button
                type="button"
                onClick={() => setAssignmentMember(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Member Summary Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#162420]/70 border border-slate-200/60 dark:border-white/10">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0">
                  {assignmentMember.user?.image ? (
                    <Image
                      src={assignmentMember.user.image}
                      alt={assignmentMember.user.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-base">
                      {assignmentMember.user?.name?.slice(0, 1) || 'স'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {assignmentMember.user?.name}
                    </span>
                    <VerifiedBadge size="sm" />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {assignmentMember.user?.phone || 'ফোন নেই'} • #{assignmentMember.memberNumber || 'AMP-NEW'}
                  </div>
                  <div className="mt-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      বর্তমান পদবি:{' '}
                      <strong className="text-brand-emerald dark:text-emerald-400 font-bold">
                        {assignmentMember.designation?.name || 'সাধারণ সদস্য'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Designation / Role Selector */}
              <div className="space-y-1.5">
                <label htmlFor="designation-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  রোল / পদবি নির্ধারণ করুন
                </label>

                <select
                  id="designation-select"
                  value={targetDesignationId}
                  onChange={(e) => setTargetDesignationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-brand-emerald cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                    — সাধারণ সদস্য (কোনো বিশেষ পদবি নয়) —
                  </option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id} className="bg-white dark:bg-[#162420] text-slate-900 dark:text-white">
                      {d.name} (মর্যাদা স্তর: {toBengaliNumber(d.rank)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">
                  সভাপতি, সাধারণ সম্পাদক বা কোষাধ্যক্ষ পদবি দিলে স্বয়ংক্রিয়ভাবে সিস্টেম রোল হালনাগাদ হবে।
                </p>
              </div>

              {/* Custom Title / Responsibility (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="custom-title-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  কাস্টম পদবি বা অতিরিক্ত দায়িত্বের শিরোনাম (ঐচ্ছিক)
                </label>
                <input
                  id="custom-title-input"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="যেমন: আহ্বায়ক, সহ-সমন্বয়ক, বিশেষ প্রতিনিধি..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#162420] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAssignmentMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveMemberRole}
                disabled={mutations.assignMemberDesignation.isPending}
                className="px-5 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {mutations.assignMemberDesignation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>পদবি সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
