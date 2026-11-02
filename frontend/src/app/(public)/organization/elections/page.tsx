'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import {
  useOrgElectionsQuery,
  useOrgElectionDetailQuery,
  useOrgTurnoutQuery,
  useOrgMembershipStatusQuery,
  useOrgMutations,
} from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';

export default function DigitalElectionPage() {
  const { data: session } = useSession();
  const { data: membershipData } = useOrgMembershipStatusQuery();
  const { data: elections = [] } = useOrgElectionsQuery();
  const mutations = useOrgMutations();

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
  const { data: turnout } = useOrgTurnoutQuery(
    selectedElectionId,
    Boolean(selectedElectionId && electionDetail?.status === 'VOTING_ACTIVE'),
  );

  // Voting State: positionId -> candidateNominationId
  const [selectedCandidates, setSelectedCandidates] = React.useState<Record<string, string>>({});
  const [voteReceiptToken, setVoteReceiptToken] = React.useState<string | null>(null);
  const [voteError, setVoteError] = React.useState<string | null>(null);

  // Nomination modal state
  const [nomModalOpen, setNomModalOpen] = React.useState(false);
  const [nomPositionId, setNomPositionId] = React.useState('');
  const [nomName, setNomName] = React.useState(session?.user?.name || '');
  const [nomExp, setNomExp] = React.useState('');
  const [nomManifesto, setNomManifesto] = React.useState('');
  const [nomSuccessMsg, setNomSuccessMsg] = React.useState<string | null>(null);

  const isActiveMember = membershipData?.membership?.status === 'ACTIVE';
  const hasVoted = electionDetail?.hasVoted || Boolean(voteReceiptToken);

  const handleSelectCandidate = (positionId: string, candidateNominationId: string) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [positionId]: candidateNominationId,
    }));
  };

  const handleCastVote = async () => {
    if (!selectedElectionId || !electionDetail) return;
    setVoteError(null);

    const positions = electionDetail.positions || [];
    const missingPositions = positions.filter((p) => !selectedCandidates[p.id]);

    if (missingPositions.length > 0) {
      setVoteError('অনুগ্রহ করে প্রতিটি পদের জন্য একজন প্রার্থী নির্বাচন করুন');
      return;
    }

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
    } catch (err: any) {
      setVoteError(err.message || 'ভোট প্রদান ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
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
              {electionDetail?.title || 'আমরা মোহাম্মদপুরী পরিষদ নির্বাচন'}
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
            {isActiveMember && (
              <span className="text-[10px] text-amber-200 block mt-0.5 font-mono">
                {membershipData?.membership?.memberId}
              </span>
            )}
          </div>
        </div>
      </div>

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

      {/* Turnout Progress Bar (Active Voting) */}
      {electionDetail?.status === 'VOTING_ACTIVE' && (
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
            মোট যোগ্য ভোটার: {turnout?.totalEligible ?? 1} জন • ভোট দিয়েছেন: {turnout?.votesCast ?? (hasVoted ? 1 : 0)} জন। গোপন ব্যালটের পবিত্রতা রক্ষায় ফলাফল চূড়ান্ত হওয়ার পূর্বে কোনো প্রার্থীর ভোট সংখ্যা প্রকাশ করা হয় না।
          </p>
        </div>
      )}

      {/* Secret Ballot Voting Booth */}
      {electionDetail?.status === 'VOTING_ACTIVE' && (
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
                প্রতিটি পদের বিপরীতে আপনার পছন্দের প্রার্থী নির্বাচন করুন।
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
                আপনার ভোট সফলভাবে ও গোপনে গৃহীত হয়েছে!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                গণতান্ত্রিক প্রক্রিয়ায় অংশ নেওয়ার জন্য ধন্যবাদ। আপনার ভোটার উপস্থিতি নিশ্চিত হয়েছে এবং ব্যালটটি বেনামে ব্যালট বাক্সে জমা হয়েছে।
              </p>
              {voteReceiptToken && (
                <div className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 font-mono text-xs font-bold text-brand-emerald shadow-sm">
                  রশিদ টোকেন: {voteReceiptToken}
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
            /* Active Ballot Form */
            <div className="space-y-6">
              {voteError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voteError}</span>
                </div>
              )}

              {/* Positions and Candidates */}
              {(electionDetail?.positions || []).map((pos) => (
                <div
                  key={pos.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-brand-emerald uppercase">নির্বাচনী পদ</span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {pos.designation.title} (১ জন নির্বাচিত হবেন)
                      </h4>
                    </div>
                    {selectedCandidates[pos.id] && (
                      <span className="px-2.5 py-1 rounded-lg bg-brand-emerald/15 text-brand-emerald text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>প্রার্থী নির্বাচিত</span>
                      </span>
                    )}
                  </div>

                  {/* Candidates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(pos.nominations || []).filter((n) => n.status === 'APPROVED').length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400">
                        এই পদের প্রার্থী তালিকা চূড়ান্তকরণ চলমান
                      </div>
                    ) : (
                      (pos.nominations || [])
                        .filter((n) => n.status === 'APPROVED')
                        .map((cand) => {
                          const isSelected = selectedCandidates[pos.id] === cand.id;
                          return (
                            <div
                              key={cand.id}
                              onClick={() => handleSelectCandidate(pos.id, cand.id)}
                              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-brand-emerald bg-brand-emerald/10 ring-2 ring-brand-emerald shadow-sm'
                                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-brand-charcoal hover:border-brand-emerald/50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0 relative">
                                  {cand.candidatePhoto ? (
                                    <Image
                                      src={cand.candidatePhoto}
                                      alt={cand.candidateName}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald">
                                      {cand.candidateName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {cand.candidateName}
                                    </h5>
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        isSelected
                                          ? 'border-brand-emerald bg-brand-emerald text-white'
                                          : 'border-slate-300'
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                  {cand.experience && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">{cand.experience}</p>
                                  )}
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic line-clamp-2">
                                    &ldquo;{cand.manifesto}&rdquo;
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              ))}

              {/* Cast Vote CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCastVote}
                  disabled={mutations.castVote.isPending}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {mutations.castVote.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>গোপন ব্যালট সুরক্ষিতভাবে জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>গোপন ব্যালটে ভোট প্রদান নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nomination Window Notice */}
      {electionDetail?.status === 'NOMINATION_OPEN' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-soft text-left space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              <span>প্রার্থী মনোনয়ন উইন্ডো উন্মুক্ত</span>
            </h3>
            {isActiveMember && (
              <button
                type="button"
                onClick={() => {
                  setNomPositionId(electionDetail.positions[0]?.id || '');
                  setNomModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                মনোনয়নপত্র জমা দিন
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            মনোনয়নপত্র জমার সময়সীমা:{' '}
            {new Date(electionDetail.nominationEndDate).toLocaleDateString('bn-BD', {
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Finalized Election Results */}
      {electionDetail?.status === 'FINALIZED' && (
        <div className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-4 text-left">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
            <Award className="w-5 h-5 text-brand-gold" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              চূড়ান্ত সরকারি নির্বাচনী ফলাফল
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(electionDetail.results || []).map((res) => (
              <div
                key={res.id}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  res.isWinner
                    ? 'border-brand-gold bg-brand-gold/10'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {res.position.designation.title}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {res.candidate.candidateName}
                  </h4>
                  {res.isWinner && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-gold text-slate-950 font-black text-[10px]">
                      বিজয়ী নির্বাচিত
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {res.voteCount}
                  </div>
                  <span className="text-[10px] text-slate-400">ভোট</span>
                </div>
              </div>
            ))}
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
                  {(electionDetail?.positions || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.designation.title}</option>
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
