'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Search,
  Users,
  Briefcase,
  Award,
  ChevronRight,
  Loader2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useOrgMemberDirectoryQuery } from '../hooks/useOrganizationQueries';
import { useDebounce } from '@/hooks/useDebounce';
import type { MemberDirectoryItem } from '../types';
import { MemberProfileModal } from './MemberProfileModal';
import { cleanImageUrl } from './CandidateAvatar';

function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

export const MemberDirectorySection: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), 250);
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
  const [selectedMember, setSelectedMember] = React.useState<MemberDirectoryItem | null>(null);

  const { data, isLoading, isFetching } = useOrgMemberDirectoryQuery({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    page: 1,
    limit: 100,
  });

  const rawMembers = data?.members || [];
  
  // Instant client-side response combined with debounced server queries
  const members = React.useMemo(() => {
    if (!searchTerm.trim()) return rawMembers;
    const term = searchTerm.trim().toLowerCase();
    return rawMembers.filter((m) => {
      const nameMatch = m.user?.name?.toLowerCase().includes(term);
      const phoneMatch = m.user?.phone?.includes(term);
      const profMatch = m.profession?.toLowerCase().includes(term);
      const idMatch = m.memberNumber?.toLowerCase().includes(term);
      const roleMatch =
        m.designation?.name?.toLowerCase().includes(term) ||
        m.orgRole?.toLowerCase().includes(term);
      return Boolean(nameMatch || phoneMatch || profMatch || idMatch || roleMatch);
    });
  }, [rawMembers, searchTerm]);

  const totalCount = data?.pagination?.total ?? members.length;

  return (
    <div className="space-y-4">
      {/* Directory Header & Search Bar Card */}
      <div className="rounded-3xl bg-white dark:bg-[#0E1A16] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 shadow-soft space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                সদস্য ডিরেক্টরি ও পরিচিতি
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-10">
              সংগঠনের সকল সক্রিয় সদস্যদের তালিকা, পরিচিতি ও প্রাতিষ্ঠানিক তথ্য।
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-brand-emerald dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>মোট সদস্য: {toBengaliDigits(totalCount)} জন</span>
          </div>
        </div>

        {/* Search Input with inline loader and clear button */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম, পদবী, পেশা বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {isFetching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-emerald shrink-0" />
            )}
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
                title="মুছে ফেলুন"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            সকল সদস্য
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('OFFICER')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'OFFICER'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            নেতৃত্ব ও কার্যনির্বাহী
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('MEMBER')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'MEMBER'
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            সাধারণ সদস্য
          </button>
        </div>
      </div>

      {/* Members Grid / List with stable height container */}
      <div className="min-h-[220px]">
        {isLoading && !data ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0E1A16] border border-slate-200/80 dark:border-white/10 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-brand-emerald mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              সদস্য তালিকা লোড হচ্ছে...
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#0E1A16] border border-slate-200/80 dark:border-white/10 space-y-2">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">কোনো সদস্য পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchTerm ? 'অনুসন্ধানের সাথে মিল পাওয়া যায়নি। ভিন্ন কীওয়ার্ড দিয়ে চেষ্টা করুন।' : 'সংগঠনে কোনো সদস্য রেকর্ড নেই।'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => {
              const avatarUrl = member.user?.image ? cleanImageUrl(member.user.image) : '';
              const memberIdDisplay = member.memberNumber
                ? member.memberNumber.startsWith('#')
                  ? member.memberNumber
                  : `#${member.memberNumber}`
                : '#AMP-2026-0042';

              const roleTitle =
                member.designation?.name ||
                (member.orgRole === 'PRESIDENT'
                  ? 'সভাপতি'
                  : member.orgRole === 'VICE_PRESIDENT'
                  ? 'সহ-সভাপতি'
                  : member.orgRole === 'GENERAL_SECRETARY'
                  ? 'সাধারণ সম্পাদক'
                  : member.orgRole === 'TREASURER'
                  ? 'কোষাধ্যক্ষ'
                  : member.orgRole === 'MODERATOR'
                  ? 'সমন্বয়ক'
                  : 'সাধারণ সদস্য');

              const isOfficer = [
                'PRESIDENT',
                'VICE_PRESIDENT',
                'GENERAL_SECRETARY',
                'TREASURER',
                'MODERATOR',
              ].includes(member.orgRole);

              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="group p-3.5 rounded-2xl bg-white dark:bg-[#0E1A16] border border-slate-200/80 dark:border-white/10 hover:border-brand-emerald/50 dark:hover:border-brand-emerald/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 text-left"
                >
                  {/* Avatar & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/60 border border-brand-emerald/30 relative">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={member.user?.name || 'Member'}
                            fill
                            className="object-cover object-top"
                            unoptimized={avatarUrl.startsWith('data:')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-emerald dark:text-white text-base font-black bg-emerald-100/60 dark:bg-emerald-900/60">
                            {member.user?.name?.charAt(0) || 'স'}
                          </div>
                        )}
                      </div>
                      {isOfficer && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-white dark:border-[#0E1A16] text-white flex items-center justify-center shadow-xs">
                          <Award className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-emerald dark:group-hover:text-emerald-400 transition-colors">
                        {member.user?.name}
                      </h4>

                      {/* Role Badge & Profession */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOfficer
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {roleTitle}
                        </span>
                        {member.profession && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[130px]">
                            <Briefcase className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{member.profession}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400">
                        {memberIdDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Right Arrow / Action */}
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 group-hover:bg-brand-emerald/10 text-slate-400 group-hover:text-brand-emerald dark:group-hover:text-emerald-400 flex items-center justify-center shrink-0 transition-colors">
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Details Popup Modal */}
      <MemberProfileModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
};
