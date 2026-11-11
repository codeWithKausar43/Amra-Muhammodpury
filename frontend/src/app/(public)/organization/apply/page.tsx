'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { useOrgMutations } from '@/features/organization/hooks/useOrganizationQueries';
import { useSession } from '@/lib/auth/auth-client';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function MembershipApplyPage() {
  const { data: session } = useSession();
  const mutations = useOrgMutations();

  const [fullName, setFullName] = React.useState(session?.user?.name || '');
  const [phone, setPhone] = React.useState('');
  const [profession, setProfession] = React.useState('');
  const [monthlyContribution, setMonthlyContribution] = React.useState<number>(100);
  const [agreedToMonthlyFee, setAgreedToMonthlyFee] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Sync session name once loaded
  React.useEffect(() => {
    if (session?.user?.name && !fullName) {
      setFullName(session.user.name);
    }
  }, [session, fullName]);

  const isBelowMinimum = monthlyContribution < 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!session?.user) {
      setErrorMsg('সদস্যপদের জন্য আবেদন করার পূর্বে অনুগ্রহ করে লগইন করুন।');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      return;
    }

    if (!phone.trim() || phone.trim().length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন');
      return;
    }

    if (!profession.trim()) {
      setErrorMsg('আপনার পেশা উল্লেখ করুন');
      return;
    }

    if (monthlyContribution < 50) {
      setErrorMsg('সংগঠনের গঠনতন্ত্র অনুযায়ী মাসিক অনুদান সর্বনিম্ন ৫০ টাকা হতে হবে');
      return;
    }

    if (!agreedToMonthlyFee) {
      setErrorMsg('আপনাকে নিয়মিত মাসিক অনুদান প্রদানে সম্মতি প্রদান করতে হবে');
      return;
    }

    try {
      await mutations.applyMembership.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        profession: profession.trim(),
        monthlyContribution: Number(monthlyContribution),
        agreedToMonthlyFee: true,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            আবেদন সফলভাবে গৃহীত হয়েছে!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            ধন্যবাদ! আপনার সদস্যপদ আবেদন ও প্রতি মাসে ৳{monthlyContribution} অনুদানের অঙ্গীকারপত্রটি কার্যনির্বাহী কমিটির পর্যালোচনায় পাঠানো হয়েছে।
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-slate-500 text-left space-y-1.5 max-w-md mx-auto">
          <p className="font-semibold text-slate-700 dark:text-slate-200">পরবর্তী ধাপসমূহ:</p>
          <p>১. সভাপতি/কার্যনির্বাহী কমিটি আপনার আবেদন যাচাই করবেন।</p>
          <p>২. অনুমোদন সম্পন্ন হলে আপনাকে এসএমএস বা নোটিফিকেশনের মাধ্যমে জানানো হবে।</p>
          <p>৩. এরপর প্রারম্ভিক কিস্তি পরিশোধ করলেই আপনার সক্রিয় সদস্য আইডি তৈরি হবে।</p>
        </div>
        <div className="pt-2">
          <Link
            href="/organization"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-emerald text-white text-sm font-semibold hover:bg-emerald-800 transition-colors"
          >
            <span>সাংগঠনিক পাতায় ফিরুন</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top back link */}
      <div>
        <Link
          href="/organization"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-emerald transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>সংগঠন ড্যাশবোর্ডে ফিরুন</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-brand-emerald/10 via-brand-mint/15 to-transparent rounded-2xl p-5 sm:p-6 border border-brand-emerald/20 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-brand-emerald/30 bg-white dark:bg-white/5 p-0.5 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="মোহাম্মদপুর কমিউনিটি লোগো"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white text-balance">
            সংগঠনের সম্মানিত সদস্য হোন
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-balance">
          মোহাম্মদপুরের টেকসই উন্নয়ন ও সেবামূলক কার্যক্রমে অংশ নিতে এবং নির্বাচনে ভোটাধিকার প্রয়োগ করতে প্রাতিষ্ঠানিক সদস্যপদ গ্রহণ করুন।
        </p>
      </div>

      {/* Main Application Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-brand-charcoal-dark/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5"
      >
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            পূর্ণ নাম *
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="যেমন: মোঃ কাউসার আহমেদ"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald outline-none transition-all"
          />
        </div>

        {/* Mobile Number */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            মোবাইল নম্বর *
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="০১৭xxxxxxxx"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald outline-none transition-all"
          />
        </div>

        {/* Profession */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            পেশা ও কর্মক্ষেত্র *
          </label>
          <input
            type="text"
            required
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার / ব্যবসায়ী / শিক্ষক"
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald outline-none transition-all"
          />
        </div>

        {/* Monthly Contribution Selector (Strict Min ৳50) */}
        <div className="space-y-2 text-left pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-brand-emerald" />
              <span>মাসিক অনুদানের পরিমাণ *</span>
            </label>
            <span className="text-xs font-extrabold text-brand-emerald">
              ৳{monthlyContribution} / মাস
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            এই অর্থ সংগঠনের স্বচ্ছ নাগরিক তহবিলে জমা হবে এবং এলাকার উন্নয়ন ও জনকল্যাণে ব্যয় হবে।
          </p>

          {/* Quick preset chips - clean 4-column balanced layout */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setMonthlyContribution(amt)}
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all text-center ${
                  monthlyContribution === amt
                    ? 'bg-brand-emerald text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="pt-2">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">৳</span>
              <input
                type="number"
                min={50}
                value={monthlyContribution || ''}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className={`w-full pl-8 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-white/5 border outline-none transition-all ${
                  isBelowMinimum
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald'
                }`}
                placeholder="অন্য পরিমাণ লিখুন (কমপক্ষে ৫০)"
              />
            </div>
            {isBelowMinimum && (
              <p className="text-[11px] font-semibold text-red-500 mt-1">
                মাসিক অনুদান অবশ্যই সর্বনিম্ন ৫০ টাকা হতে হবে।
              </p>
            )}
          </div>
        </div>

        {/* Commitment Agreement Checkbox */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/5 text-left">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToMonthlyFee}
              onChange={(e) => setAgreedToMonthlyFee(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald cursor-pointer"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              আমি স্বেচ্ছায় ঘোষণা করছি যে প্রতি মাসে নির্ধারিত <strong>৳{monthlyContribution}</strong> অনুদান নিয়মিত পরিশোধ করব এবং <strong>মোহাম্মদপুর কমিউনিটি</strong> সংগঠনের গঠনতন্ত্র ও নাগরিক সংহতি নীতি মেনে চলব।
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={mutations.applyMembership.isPending || isBelowMinimum || !agreedToMonthlyFee}
            className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {mutations.applyMembership.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>আবেদন জমা হচ্ছে...</span>
              </>
            ) : (
              <>
                <HeartHandshake className="w-4 h-4 text-brand-gold" />
                <span>সদস্যপদ আবেদন জমা দিন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
