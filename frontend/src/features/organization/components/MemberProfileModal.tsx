'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  X,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  Award,
  Check,
  Copy,
  User,
} from 'lucide-react';
import type { MemberDirectoryItem } from '../types';
import { cleanImageUrl } from './CandidateAvatar';

interface MemberProfileModalProps {
  member: MemberDirectoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function formatBengaliDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = toBengaliDigits(d.getDate());
    const year = toBengaliDigits(d.getFullYear());
    const monthNames = [
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
    const month = monthNames[d.getMonth()] || '';
    return `${day} ${month}, ${year}`;
  } catch {
    return String(dateStr);
  }
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !member) return null;

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

  const isOfficer = ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR'].includes(
    member.orgRole,
  );

  const handleCopyPhone = () => {
    if (member.user?.phone) {
      navigator.clipboard.writeText(member.user.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0B1713] text-slate-900 dark:text-white my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-sm"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Banner with Nature & Tree Watermark Backdrop */}
        <div className="relative h-32 sm:h-36 px-5 bg-gradient-to-br from-[#064e3b] via-[#043d2e] to-[#02281e] text-white overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Full Nature & Tree Silhouette Watermark */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-emerald-300"
            viewBox="0 0 600 160"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Ambient Light Halo */}
            <circle cx="300" cy="50" r="55" fill="currentColor" fillOpacity="0.06" />
            <circle cx="300" cy="50" r="35" fill="currentColor" fillOpacity="0.08" />

            {/* Distant Hills / Forest Horizon */}
            <path
              d="M0,160 Q80,120 180,135 T360,130 T520,138 T600,125 L600,160 Z"
              fill="currentColor"
              fillOpacity="0.10"
            />
            <path
              d="M0,160 Q120,130 260,142 T480,136 T600,140 L600,160 Z"
              fill="currentColor"
              fillOpacity="0.14"
            />

            {/* Left Nature Grove (Lush Trees & Foliage) */}
            <g fill="currentColor" fillOpacity="0.18">
              {/* Tree 1 Trunk & Canopy */}
              <path d="M45,160 L47,110 Q48,95 44,85 Q49,95 51,110 L53,160 Z" />
              <circle cx="48" cy="75" r="28" />
              <circle cx="32" cy="82" r="20" />
              <circle cx="64" cy="80" r="22" />
              <circle cx="48" cy="60" r="20" />

              {/* Tree 2 */}
              <path d="M95,160 L96,120 L98,160 Z" />
              <circle cx="97" cy="100" r="22" />
              <circle cx="84" cy="106" r="16" />
              <circle cx="110" cy="104" r="17" />
              <circle cx="97" cy="88" r="15" />
            </g>

            {/* Center Majestic Spreading Tree (Behind Profile Pic) */}
            <g fill="currentColor" fillOpacity="0.22">
              {/* Grand Tree Trunk & Branches */}
              <path d="M295,160 C296,130 293,105 285,85 C295,95 305,95 315,85 C307,105 304,130 305,160 Z" />
              <path d="M290,92 C275,80 255,75 240,78 C255,85 272,88 285,95 Z" />
              <path d="M310,92 C325,80 345,75 360,78 C345,85 328,88 315,95 Z" />

              {/* Grand Spreading Foliage Canopy */}
              <circle cx="300" cy="50" r="38" />
              <circle cx="265" cy="58" r="30" />
              <circle cx="335" cy="58" r="30" />
              <circle cx="235" cy="70" r="24" />
              <circle cx="365" cy="70" r="24" />
              <circle cx="280" cy="38" r="24" />
              <circle cx="320" cy="38" r="24" />
            </g>

            {/* Right Nature Grove (Trees & Foliage) */}
            <g fill="currentColor" fillOpacity="0.18">
              {/* Tree 3 */}
              <path d="M545,160 L547,105 Q548,90 544,80 Q549,90 551,105 L553,160 Z" />
              <circle cx="548" cy="70" r="28" />
              <circle cx="532" cy="78" r="22" />
              <circle cx="566" cy="76" r="20" />
              <circle cx="548" cy="54" r="19" />

              {/* Tree 4 */}
              <path d="M495,160 L496,115 L498,160 Z" />
              <circle cx="497" cy="98" r="24" />
              <circle cx="482" cy="104" r="18" />
              <circle cx="512" cy="102" r="17" />
              <circle cx="497" cy="85" r="16" />
            </g>

            {/* Birds in Flight Nature Accents */}
            <g fill="currentColor" fillOpacity="0.22">
              <path d="M150,45 Q156,40 162,45 Q168,40 174,45 Q168,42 162,44 Q156,42 150,45 Z" />
              <path d="M178,35 Q183,31 188,35 Q193,31 198,35 Q193,32 188,34 Q183,32 178,35 Z" />
              <path d="M420,40 Q426,35 432,40 Q438,35 444,40 Q438,37 432,39 Q426,37 420,40 Z" />
            </g>

            {/* Grassy Horizon Baseline */}
            <path
              d="M0,160 L600,160 L600,152 Q560,155 520,150 T440,152 T360,150 T280,153 T200,150 T120,153 T40,150 L0,152 Z"
              fill="currentColor"
              fillOpacity="0.20"
            />
          </svg>
        </div>

        {/* Floating Avatar & Main Info */}
        <div className="relative px-5 pb-5 -mt-20 sm:-mt-24 space-y-4">
          <div className="flex flex-col items-center text-center">
            {/* Enlarged Avatar with Ring */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden bg-white dark:bg-[#0B1713] p-1.5 sm:p-2 shadow-2xl border-[3px] border-brand-emerald">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/60 shadow-inner">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={member.user?.name || 'Member'}
                    fill
                    className="object-cover object-top"
                    unoptimized={avatarUrl.startsWith('data:')}
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-emerald dark:text-white text-4xl sm:text-5xl font-black bg-emerald-100/60 dark:bg-emerald-900/60">
                    {member.user?.name?.charAt(0) || 'স'}
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <h3
              id="member-profile-modal-title"
              className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-3.5 leading-snug"
            >
              {member.user?.name || 'নাম পাওয়া যায়নি'}
            </h3>

            {/* Role Badge & Member ID */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${isOfficer
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
              >
                <Award className="w-3 h-3" />
                <span>{roleTitle}</span>
              </span>

              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {memberIdDisplay}
              </span>
            </div>
          </div>

          {/* Details List (Exclusively non-financial) */}
          <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 p-3.5 space-y-3">
            {/* Profession */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-brand-emerald dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">পেশা / কর্মক্ষেত্র</p>
                <p className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {member.profession || 'সাধারণ পেশাজীবী'}
                </p>
              </div>
            </div>

            {/* Contact Number */}
            <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">মোবাইল নম্বর</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs sm:text-[13px] font-bold font-mono text-slate-800 dark:text-slate-200">
                    {member.user?.phone || 'নম্বর উন্মুক্ত নয়'}
                  </span>
                  {member.user?.phone && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="নম্বর কপি করুন"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`tel:${member.user.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email (if available) */}
            {member.user?.email && (
              <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">ইমেইল ঠিকানা</p>
                  <a
                    href={`mailto:${member.user.email}`}
                    className="text-xs sm:text-[13px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline truncate block mt-0.5"
                  >
                    {member.user.email}
                  </a>
                </div>
              </div>
            )}

            {/* Member Since / Joining Date */}
            <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">সদস্য হিসেবে যোগদান</p>
                <p className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatBengaliDate(member.joinedAt || member.createdAt)}
                </p>
              </div>
            </div>

            {/* Bio (if available) */}
            {member.user?.bio && (
              <div className="flex items-start gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/5">
                <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">পরিচিতি / বায়ো</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-normal">
                    {member.user.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

