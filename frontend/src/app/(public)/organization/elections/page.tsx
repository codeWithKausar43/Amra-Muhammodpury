'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Vote,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowLeft,
  Loader2,
  Lock,
  EyeOff,
  BarChart3,
  Sparkles,
  Clock,
  Power,
} from 'lucide-react';
import {
  useOrgElectionsQuery,
  useOrgElectionDetailQuery,
  useOrgTurnoutQuery,
  useOrgMembershipStatusQuery,
  useOrgVotingConfigQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';
import { CandidateAvatar } from '@/features/organization/components/CandidateAvatar';
import type { Election } from '@/features/organization/types';

function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return Number(num || 0)
    .toLocaleString('en-US')
    .replace(/[0-9]/g, (d) => bengaliDigits[+d] || d);
}

function CountdownView({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal border border-amber-500/30 text-center min-w-[50px]">
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
            {toBengaliNumber(timeLeft.days)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold">দিন</span>
        </div>
        <span className="font-bold text-amber-500">:</span>
        <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal border border-amber-500/30 text-center min-w-[50px]">
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
            {toBengaliNumber(timeLeft.hours)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold">ঘণ্টা</span>
        </div>
        <span className="font-bold text-amber-500">:</span>
        <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal border border-amber-500/30 text-center min-w-[50px]">
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
            {toBengaliNumber(timeLeft.minutes)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold">মিনিট</span>
        </div>
        <span className="font-bold text-amber-500">:</span>
        <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-brand-charcoal border border-amber-500/30 text-center min-w-[50px]">
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
            {toBengaliNumber(timeLeft.seconds)}
          </span>
          <span className="text-[9px] text-slate-400 font-bold">সেকেন্ড</span>
        </div>
      </div>
    </div>
  );
}

export default function DigitalElectionPage() {
  const { data: session } = useSession();
  const { data: membershipData } = useOrgMembershipStatusQuery();
  const { data: votingConfig } = useOrgVotingConfigQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const mutations = useOrgMutations();

  const isVotingEnabled = votingConfig?.isVotingEnabled ?? true;

  // Active or selected election
  const [selectedElectionId, setSelectedElectionId] = React.useState<string>('');

  React.useEffect(() => {
    if (elections.length > 0 && !selectedElectionId) {
      // Pick first active or latest election
      const active = elections.find((e) => e.status === 'VOTING_ACTIVE') || elections[0];
      if (active) {
        setSelectedElectionId(active.id);
      }
    }
  }, [elections, selectedElectionId]);

  const { data: electionDetail } = useOrgElectionDetailQuery(
    selectedElectionId,
    Boolean(selectedElectionId),
  );

  // Normalize election details whether wrapped or flat
  const currentElection: Election | undefined = React.useMemo(() => {
    if (!electionDetail) return undefined;
    const raw = (electionDetail as any).election;
    if (raw && typeof raw === 'object') {
      return { ...raw, ...electionDetail } as Election;
    }
    return electionDetail as Election;
  }, [electionDetail]);

  const { data: turnout } = useOrgTurnoutQuery(
    selectedElectionId,
    Boolean(selectedElectionId && currentElection?.status === 'VOTING_ACTIVE'),
  );

  // Voting State: positionId -> candidateNominationId
  const [selectedCandidates, setSelectedCandidates] = React.useState<Record<string, string>>({});
  const [confirmCandidate, setConfirmCandidate] = React.useState<{
    candidateName: string;
    candidatePhoto?: string | null;
    positionTitle?: string;
  } | null>(null);
  const [voteReceiptToken, setVoteReceiptToken] = React.useState<string | null>(null);
  const [voteError, setVoteError] = React.useState<string | null>(null);

  // Nomination modal state
  const [nomModalOpen, setNomModalOpen] = React.useState(false);
  const [nomPositionId, setNomPositionId] = React.useState('');
  const [nomName, setNomName] = React.useState(session?.user?.name || '');
  const [nomExp, setNomExp] = React.useState('');
  const [nomManifesto, setNomManifesto] = React.useState('');
  const [nomSuccessMsg, setNomSuccessMsg] = React.useState<string | null>(null);

  const isActiveMember =
    membershipData?.membership?.status === 'ACTIVE' ||
    currentElection?.isEligible ||
    (session?.user as any)?.role === 'ADMIN';

  const memberNumber =
    membershipData?.membership?.memberNumber ||
    (membershipData?.membership as any)?.memberId;

  const hasVoted = currentElection?.hasVoted || Boolean(voteReceiptToken);
  const isOfficer =
    Boolean(
      membershipData?.membership &&
        ['PRESIDENT', 'VICE_PRESIDENT', 'GENERAL_SECRETARY', 'TREASURER', 'MODERATOR'].includes(
          membershipData.membership.orgRole,
        ),
    ) || (session?.user as any)?.role === 'ADMIN';

  // Dynamic Time & Status Evaluation
  const now = new Date();
  const startDate = currentElection?.votingStartDate ? new Date(currentElection.votingStartDate) : null;
  const endDate = currentElection?.votingEndDate ? new Date(currentElection.votingEndDate) : null;
  const isTimeBefore = Boolean(startDate && now < startDate);
  const isTimeBetween = Boolean(startDate && endDate && now >= startDate && now <= endDate);
  const isTimeAfter = Boolean(endDate && now > endDate);

  const isDraft = currentElection?.status === 'DRAFT' && isTimeBefore;
  const isCompleted =
    currentElection?.status === 'COMPLETED' ||
    currentElection?.status === 'FINALIZED' ||
    currentElection?.status === 'VOTING_CLOSED' ||
    (Boolean(currentElection) && !isDraft && isTimeAfter);
  const isUpcoming =
    !isCompleted && !isDraft && (currentElection?.status === 'UPCOMING' || isTimeBefore);
  const isLive =
    !isCompleted &&
    !isUpcoming &&
    !isDraft &&
    (currentElection?.status === 'VOTING_ACTIVE' || isTimeBetween || Boolean(currentElection?.positions?.length));

  const handleSelectCandidate = (positionId: string, candidateNominationId: string) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [positionId]: candidateNominationId,
    }));
  };

  const handleOpenConfirmVote = () => {
    if (!isVotingEnabled) {
      setVoteError('ভোট ব্যবস্থা বর্তমানে সাময়িকভাবে বন্ধ রয়েছে।');
      return;
    }
    if (!selectedElectionId || !currentElection) return;
    setVoteError(null);

    const positions = currentElection.positions || [];
    const missingPositions = positions.filter((p) => !selectedCandidates[p.id]);

    if (missingPositions.length > 0) {
      setVoteError('অনুগ্রহ করে পছন্দের প্রার্থী নির্বাচন করুন');
      return;
    }

    const pos = positions[0];
    const candId = pos ? selectedCandidates[pos.id] : undefined;
    const candNom = pos?.nominations?.find((n) => n.id === candId);

    setConfirmCandidate({
      candidateName: candNom?.candidateName || 'নির্বাচিত প্রার্থী',
      candidatePhoto: candNom?.candidatePhoto || candNom?.user?.image,
      positionTitle: pos?.designation?.name || (pos?.designation as any)?.title || 'পদবি',
    });
  };

  const handleConfirmVote = async () => {
    if (!selectedElectionId || !currentElection) return;
    setVoteError(null);

    const ballots = Object.entries(selectedCandidates).map(([posId, candId]) => ({
      positionId: posId,
      candidateNominationId: candId,
    }));

    try {
      const res = await mutations.castVote.mutateAsync({
        electionId: selectedElectionId,
        ballots,
      });
      setVoteReceiptToken(res.receiptToken);
      setConfirmCandidate(null);
    } catch (err: any) {
      setVoteError(err.message || 'ভোট প্রদান ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setConfirmCandidate(null);
    }
  };

  const handleNominationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElectionId || !nomPositionId || !nomName.trim() || !nomManifesto.trim()) return;

    try {
      await mutations.submitNomination.mutateAsync({
        electionId: selectedElectionId,
        data: {
          positionId: nomPositionId,
          candidateName: nomName.trim(),
          experience: nomExp.trim() || undefined,
          manifesto: nomManifesto.trim(),
        },
      });
      setNomSuccessMsg('মনোনয়নপত্র জমা হয়েছে! পর্যালোচনার পর প্রার্থী তালিকায় যুক্ত হবে।');
      setTimeout(() => {
        setNomModalOpen(false);
        setNomSuccessMsg(null);
        setNomExp('');
        setNomManifesto('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'মনোনয়নপত্র জমা দিতে ব্যর্থ');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/organization"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-emerald transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>সংগঠন হোমে ফিরুন</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-brand-charcoal text-white p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-200">
              <Vote className="w-4 h-4 text-brand-gold" />
              <span>ডিজিটাল নির্বাচন ও সম্পূর্ণ গোপন ব্যালট ভোটিং</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentElection?.title || 'আমরা মোহাম্মদপুরী পরিষদ নির্বাচন'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              সক্রিয় সদস্যদের প্রত্যক্ষ ভোটের মাধ্যমে গণতান্ত্রিক নেতৃত্ব নির্বাচন। সম্পূর্ণ নিরপেক্ষ, স্বচ্ছ ও ক্রিপ্টোগ্রাফিক গোপন ব্যালট।
            </p>
          </div>

          {/* Voter eligibility badge */}
          <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">ভোটার স্ট্যাটাস</span>
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-white mt-1">
              {isActiveMember ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>বৈধ সক্রিয় ভোটার</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>ভোটাধিকার মুলতুবি (সদস্য নন)</span>
                </>
              )}
            </div>
            {isActiveMember && memberNumber && (
              <span className="text-[10px] text-amber-200 block mt-0.5 font-mono">
                {memberNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Voting Suspended Banner (Section 3) */}
      {!isVotingEnabled && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-left">
          <Power className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
              ভোট ব্যবস্থা বর্তমানে সাময়িকভাবে স্থগিত রয়েছে
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              সংগঠনের নির্বাচন ব্যবস্থা বর্তমানে সুপারঅ্যাডমিন কর্তৃক সাময়িকভাবে স্থগিত রাখা হয়েছে। অ্যাডমিন সিস্টেমটি পুনরায় চালু করা মাত্রই আপনারা নির্ধারিত তফশিল অনুযায়ী ভোট প্রদান করতে পারবেন।
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Bengali Announcement Banner (Section 9) */}
      {currentElection && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-brand-charcoal-dark/80 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              {isUpcoming
                ? 'আসন্ন নির্বাচন ঘোষণা'
                : isLive
                ? 'লাইভ নির্বাচন ঘোষণা'
                : isCompleted
                ? 'নির্বাচন সমাপ্তি ও ফলাফল'
                : 'নির্বাচনী ঘোষণা'}
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {currentElection.announcement ||
                (isUpcoming
                  ? (currentElection.announcements?.start || 'আসন্ন নির্বাচনের তফশিল ঘোষণা করা হয়েছে। নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে লাইভ ভোটগ্রহণ শুরু হবে।')
                  : isLive
                  ? (currentElection.announcements?.start || 'ভোটগ্রহণ লাইভ চলছে! অনুগ্রহ করে নির্ধারিত সময়ের মধ্যে আপনার মূল্যবান ভোটাধিকার প্রয়োগ করুন।')
                  : isCompleted
                  ? (currentElection.announcements?.end || 'ভোটগ্রহণ সফলভাবে সমাপ্ত হয়েছে এবং চূড়ান্ত ফলাফল প্রকাশিত হয়েছে।')
                  : 'নির্বাচনী কার্যক্রমে অংশগ্রহণ করুন।')}
            </p>
          </div>
        </div>
      )}

      {/* Elections Selector Tabs (if multiple) */}
      {elections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {elections.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => setSelectedElectionId(el.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedElectionId === el.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-white dark:bg-brand-charcoal-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
              }`}
            >
              {el.title} ({el.status})
            </button>
          ))}
        </div>
      )}

      {/* If No Elections Exist */}
      {(!currentElection || elections.length === 0) && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-white/10 text-center space-y-4 shadow-soft">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <Vote className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              বর্তমানে কোনো সক্রিয় নির্বাচন চলমান নেই
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              সুপারঅ্যাডমিন কর্তৃক নতুন নির্বাচনী তফশিল ঘোষণা ও লাইভ ভোটগ্রহণ চালু করা হলে এই কেন্দ্রে আপনার গোপন ডিজিটাল ব্যালট প্রদর্শিত হবে।
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/organization"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              সংগঠন হোমে ফিরুন
            </Link>
            {isOfficer && (
              <Link
                href="/organization/admin"
                className="px-4 py-2 rounded-xl bg-brand-gold hover:brightness-105 text-slate-950 text-xs font-bold shadow transition-all"
              >
                প্রশাসনিক প্যানেল থেকে তফশিল ঘোষণা করুন →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Draft State Notice */}
      {currentElection && isDraft && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
            <Vote className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {currentElection.title} (খসড়া তফশিল)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              এই নির্বাচনের তফশিল বর্তমানে খসড়া আকারে সংরক্ষিত রয়েছে। সুপারঅ্যাডমিন কর্তৃক লাইভ ভোটগ্রহণ শুরু করা হলে সকল সক্রিয় সদস্যের জন্য গোপন ব্যালট উন্মুক্ত হবে।
            </p>
          </div>
          {isOfficer && (
            <Link
              href="/organization/admin"
              className="inline-block px-4 py-2 rounded-xl bg-brand-gold text-slate-950 text-xs font-bold shadow hover:brightness-105"
            >
              অ্যাডমিন প্যানেল থেকে ভোটগ্রহণ শুরু করুন →
            </Link>
          )}
        </div>
      )}

      {/* =========================================================================
          UPCOMING VOTING STATE: Countdown to Start & Candidates Preview (Section 5)
         ========================================================================= */}
      {isUpcoming && currentElection && (
        <div className="space-y-5 text-left">
          {/* Countdown to Start */}
          <CountdownView
            targetDate={currentElection.votingStartDate}
            label="আসন্ন নির্বাচন • ভোটগ্রহণ শুরু হতে আর বাকি"
          />

          {/* Details Card */}
          <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                  নির্বাচনী তফশিল
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {currentElection.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  পদ: {currentElection.positions?.[0]?.designation?.name || (currentElection.positions?.[0]?.designation as any)?.title || 'নির্বাহী পদ'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  শুরু:{' '}
                  {new Date(currentElection.votingStartDate).toLocaleString('bn-BD', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Candidates Preview Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                মনোনীত প্রার্থী তালিকা
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentElection.positions?.[0]?.nominations?.filter((n) => !n.status || n.status === 'APPROVED').map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-start gap-3"
                  >
                    <CandidateAvatar
                      src={cand.candidatePhoto || cand.user?.image}
                      name={cand.candidateName}
                      className="w-12 h-12 rounded-2xl"
                      textClassName="text-sm font-bold text-brand-emerald"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {cand.candidateName}
                      </h5>
                      {cand.experience && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{cand.experience}</p>
                      )}
                      {cand.manifesto && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-2">
                          &ldquo;{cand.manifesto}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 text-center">
              নির্ধারিত শুরুর সময়ে এই ভোটকেন্দ্রে ব্যালট স্বয়ংক্রিয়ভাবে সক্রিয় হবে এবং সক্রিয় সদস্যরা গোপন ব্যালটে ভোট দিতে পারবেন।
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIVE VOTING STATE: Countdown to End & Secret Ballot Booth (Section 5, 7, 8)
         ========================================================================= */}
      {isLive && currentElection && (
        <div className="space-y-5 text-left">
          {/* Live Countdown to End */}
          <CountdownView
            targetDate={currentElection.votingEndDate}
            label="ভোটগ্রহণ লাইভ চলছে • সমাপ্ত হতে আর বাকি"
          />

          {/* Turnout Progress Bar (Active Voting - Strict Result Visibility: Candidates Hidden) */}
          <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-soft text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900 dark:text-white">লাইভ ভোটার টার্নআউট</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                {turnout?.turnoutPercentage ?? 0}% ভোট গৃহীত
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${turnout?.turnoutPercentage ?? 0}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              মোট যোগ্য ভোটার: {turnout?.totalEligible ?? 1} জন • ভোট দিয়েছেন:{' '}
              {turnout?.votesCast ?? (hasVoted ? 1 : 0)} জন। গোপন ব্যালটের নিরপেক্ষতা রক্ষায় ফলাফল চূড়ান্ত হওয়ার পূর্বে কোনো প্রার্থীর প্রাপ্ত ভোট সংখ্যা প্রকাশ করা হয় না।
            </p>
          </div>

          {/* Secret Ballot Voting Booth */}
          <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-6 text-left">
            {/* Booth Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    ডিজিটাল গোপন ভোটদান বুথ
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  আপনার পছন্দের প্রার্থীর কার্ডটিতে ট্যাপ করে নির্বাচন করুন।
                </p>
              </div>

              {/* Cryptographic decoupling privacy badge */}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold flex items-center gap-2 self-start sm:self-auto">
                <EyeOff className="w-4 h-4 shrink-0" />
                <span>১০০% এনক্রিপ্টেড পরিচয়হীন ব্যালট</span>
              </div>
            </div>

            {/* Already Voted Receipt Display */}
            {hasVoted ? (
              <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-brand-emerald/10 border border-brand-emerald/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-emerald text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  আপনি ভোট দিয়েছেন! আপনার ভোট সফলভাবে ও গোপনে গৃহীত হয়েছে
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  গণতান্ত্রিক প্রক্রিয়ায় অংশ নেওয়ার জন্য ধন্যবাদ। আপনার ভোটার উপস্থিতি নিশ্চিত হয়েছে এবং ব্যালটটি বেনামে সুরক্ষিতভাবে জমা হয়েছে।
                </p>
                {(voteReceiptToken || currentElection.userVoterToken) && (
                  <div className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 font-mono text-xs font-bold text-brand-emerald shadow-sm">
                    রশিদ টোকেন: {voteReceiptToken || currentElection.userVoterToken}
                  </div>
                )}
              </div>
            ) : !isActiveMember ? (
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 text-center space-y-3">
                <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ভোট প্রদানে সক্রিয় সদস্যপদ আবশ্যক
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  ডিজিটাল নির্বাচনে ভোট প্রদান ও নেতৃত্ব নির্বাচনে অংশগ্রহণের জন্য সংগঠনের সক্রিয় সদস্যপদ থাকতে হবে।
                </p>
                <Link
                  href="/organization/apply"
                  className="inline-block px-5 py-2 rounded-xl bg-brand-emerald text-white text-xs font-semibold"
                >
                  সদস্যপদ আবেদন করুন
                </Link>
              </div>
            ) : (
              /* Active Ballot Form with Candidate Selection Cards */
              <div className="space-y-6">
                {voteError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{voteError}</span>
                  </div>
                )}

                {/* Positions and Candidates */}
                {(currentElection.positions || []).map((pos) => {
                  const posTitle = pos.designation?.name || (pos.designation as any)?.title || 'পদবি';
                  const approvedCands = (pos.nominations || []).filter((n) => !n.status || n.status === 'APPROVED');

                  return (
                    <div
                      key={pos.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-brand-emerald uppercase">নির্বাচনী পদ</span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {posTitle} (১ জন নির্বাচিত হবেন)
                          </h4>
                        </div>
                        {selectedCandidates[pos.id] && (
                          <span className="px-2.5 py-1 rounded-lg bg-brand-emerald/15 text-brand-emerald text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>প্রার্থী নির্বাচিত</span>
                          </span>
                        )}
                      </div>

                      {/* Candidates Touch-Friendly Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {approvedCands.length === 0 ? (
                          <div className="col-span-full py-4 text-center text-xs text-slate-400">
                            এই পদের প্রার্থী তালিকা চূড়ান্তকরণ চলমান
                          </div>
                        ) : (
                          approvedCands.map((cand) => {
                            const isSelected = selectedCandidates[pos.id] === cand.id;
                            return (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() => handleSelectCandidate(pos.id, cand.id)}
                                className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99] select-none ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500 shadow-sm'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal hover:border-emerald-500/50'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <CandidateAvatar
                                    src={cand.candidatePhoto || cand.user?.image}
                                    name={cand.candidateName}
                                    className="w-12 h-12 rounded-2xl"
                                    textClassName="text-base font-bold text-brand-emerald"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {cand.candidateName}
                                      </h5>
                                      <div
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                          isSelected
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : 'border-slate-300 dark:border-white/20'
                                        }`}
                                      >
                                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                    {cand.experience && (
                                      <p className="text-[11px] text-slate-400 mt-0.5">{cand.experience}</p>
                                    )}
                                    {cand.manifesto && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-2">
                                        &ldquo;{cand.manifesto}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Cast Vote CTA Button (Opens Confirmation Modal) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenConfirmVote}
                    disabled={mutations.castVote.isPending || !isVotingEnabled}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Vote className="w-4 h-4" />
                    <span>ভোট দিন</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          FINAL RESULTS STATE (Section 8: Automatically Visible When COMPLETED)
         ========================================================================= */}
      {isCompleted && currentElection && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  চূড়ান্ত নির্বাচনী ফলাফল ও নির্বাচিত নেতৃত্ব
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ভোটগ্রহণ সমাপ্তি এবং নিরপেক্ষ ডিজিটাল ব্যালট গণনার ফলাফল
                </p>
              </div>
            </div>

            {currentElection.votesCastCount !== undefined && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-300 font-semibold self-start sm:self-auto">
                মোট ভোট সংগৃহীত: {toBengaliNumber(currentElection.votesCastCount)} টি
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(currentElection.results || []).map((res: any) => {
              const totalVotes = currentElection.votesCastCount || 1;
              const candName = res.candidateName || res.candidate?.candidateName || 'প্রার্থী';
              const candPhoto = res.candidatePhoto || res.candidate?.candidatePhoto;
              const posName = res.position?.designation?.name || res.position?.designation?.title || 'পদবি';
              const voteCount = res.votesCount ?? res.voteCount ?? 0;
              const pct = res.votePercentage !== undefined ? res.votePercentage : Math.round((voteCount / Math.max(totalVotes, 1)) * 100);

              return (
                <div
                  key={res.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 transition-all ${
                    res.isWinner
                      ? 'border-brand-gold bg-brand-gold/10 shadow-xs'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CandidateAvatar
                        src={candPhoto}
                        name={candName}
                        className="w-10 h-10 rounded-xl"
                        textClassName="text-sm font-bold text-amber-600"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-brand-emerald uppercase">
                          {posName}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {candName}
                        </h4>
                        {res.isWinner && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-brand-gold text-slate-950 font-black text-[10px]">
                            <Award className="w-3 h-3" />
                            <span>বিজয়ী নির্বাচিত</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                        {toBengaliNumber(voteCount)}{' '}
                        <span className="text-xs font-normal text-slate-400">ভোট</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {toBengaliNumber(pct)}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        res.isWinner
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL: Vote Submission Confirmation (Section 7)
         ========================================================================= */}
      {confirmCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-center space-y-4">
            {confirmCandidate.candidatePhoto ? (
              <CandidateAvatar
                src={confirmCandidate.candidatePhoto}
                name={confirmCandidate.candidateName}
                className="w-16 h-16 rounded-2xl mx-auto shadow-md border-2 border-amber-500/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Vote className="w-7 h-7" />
              </div>
            )}

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ভোট প্রদানের নিশ্চয়তা
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                আপনি কি নিশ্চিত যে আপনার মূল্যবান ভোটটি{' '}
                <span className="font-bold text-slate-900 dark:text-white underline decoration-amber-500 decoration-2">
                  &ldquo;{confirmCandidate.candidateName}&rdquo;
                </span>
                -কে প্রদান করতে চান?
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              একবার ভোট নিশ্চিত করলে তা কোনোভাবেই পরিবর্তন বা প্রত্যাহার করা যাবে না। আপনার ব্যালট ১০০% পরিচয়হীন ও গোপন থাকবে।
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmCandidate(null)}
                className="py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={mutations.castVote.isPending}
                onClick={handleConfirmVote}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {mutations.castVote.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>হ্যাঁ, ভোট দিন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nomination Form Modal */}
      {nomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">মনোনয়নপত্র জমা</h3>
              <button onClick={() => setNomModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            {nomSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs">
                {nomSuccessMsg}
              </div>
            )}

            <form onSubmit={handleNominationSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1">প্রার্থিতা পদের নাম</label>
                <select
                  value={nomPositionId}
                  onChange={(e) => setNomPositionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                >
                  {(currentElection?.positions || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.designation?.name || (p.designation as any)?.title || 'পদবি'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">প্রার্থীর নাম</label>
                <input
                  type="text"
                  required
                  value={nomName}
                  onChange={(e) => setNomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">অভিজ্ঞতা / সাংগঠনিক ভূমিকা</label>
                <input
                  type="text"
                  value={nomExp}
                  onChange={(e) => setNomExp(e.target.value)}
                  placeholder="যেমন: তাজমহল রোড নাগরিক কমিটির সক্রিয় কর্মী"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">নির্বাচনী ইশতেহার ও প্রতিশ্রুতি *</label>
                <textarea
                  required
                  rows={3}
                  value={nomManifesto}
                  onChange={(e) => setNomManifesto(e.target.value)}
                  placeholder="নির্বাচিত হলে এলাকার জন্য আপনার পরিকল্পনা লিখুন (কমপক্ষে ১০ অক্ষর)"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={mutations.submitNomination.isPending}
                className="w-full py-2.5 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                মনোনয়নপত্র দাখিল করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
