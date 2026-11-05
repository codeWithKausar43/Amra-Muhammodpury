'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  Users,
  FileText,
  CreditCard,
  Wallet,
  TrendingUp,
  Award,
  Vote,
  ShieldCheck,
  ChevronRight,
  Settings,
  LayoutDashboard,
  ArrowUpRight,
  Heart,
} from 'lucide-react';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fundsCount?: number;
  noticesCount?: number;
  onOpenGeneralSettings?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminDrawer({
  isOpen,
  onClose,
  fundsCount = 0,
  noticesCount = 0,
  onOpenGeneralSettings,
}: AdminDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Lock body scroll and handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sections: NavSection[] = [
    {
      title: 'ওভারভিউ ও সদস্য ব্যবস্থাপনা',
      items: [
        {
          href: '/organization/admin',
          label: 'ড্যাশবোর্ড ওভারভিউ',
          subtext: 'লাইভ আর্থিক অ্যানালিটিক্স ও সারসংক্ষেপ',
          icon: LayoutDashboard,
        },
        {
          href: '/organization/admin/members',
          label: 'সদস্য ব্যবস্থাপনা',
          subtext: 'সদস্য তালিকা, তথ্য যাচাই ও পদবি',
          icon: Users,
        },
        {
          href: '/organization/admin/applications',
          label: 'সদস্য আবেদন',
          subtext: 'নতুন আবেদন পর্যালোচনা ও অনুমোদন',
          icon: FileText,
        },
      ],
    },
    {
      title: 'আর্থিক হিসাব ও তহবিল খতিয়ান',
      items: [
        {
          href: '/organization/admin/contributions',
          label: 'চাঁদা ট্র্যাকিং ও তাগিদ',
          subtext: 'মাসিক চাঁদা যাচাই ও বকেয়া তাগিদ',
          icon: CreditCard,
        },
        {
          href: '/organization/admin/funds',
          label: 'তহবিল ও বাজেট',
          subtext: 'কল্যাণ তহবিল ব্যালেন্স ও হিসেব',
          icon: Wallet,
          badge: fundsCount > 0 ? fundsCount : undefined,
        },
        {
          href: '/organization/admin/transactions',
          label: 'লেনদেন ও চাঁদা',
          subtext: 'আয়-ব্যয় খতিয়ান ও রসিদ তালিকা',
          icon: TrendingUp,
        },
        {
          href: '/organization/admin/campaigns',
          label: 'ক্যাম্পেইন ও দান অনুদান',
          subtext: 'জনকল্যাণমূলক ক্যাম্পেইন ও পৃথক খতিয়ান',
          icon: Heart,
        },
      ],
    },
    {
      title: 'সাংগঠনিক প্রশাসন ও কার্যক্রম',
      items: [
        {
          href: '/organization/admin/committees',
          label: 'কমিটি ও পদবি',
          subtext: 'কার্যনির্বাহী পরিষদ ও পদমর্যাদা',
          icon: Award,
        },
        {
          href: '/organization/admin/notices',
          label: 'বিজ্ঞপ্তি ব্যবস্থাপনা',
          subtext: 'জরুরি নোটিশ প্রকাশ ও মিটিং আপডেট',
          icon: FileText,
          badge: noticesCount > 0 ? noticesCount : undefined,
        },
        {
          href: '/organization/admin/elections',
          label: 'ডিজিটাল নির্বাচন',
          subtext: 'গোপন ব্যালট ভোটিং ও লাইভ ফলাফল',
          icon: Vote,
        },
      ],
    },
  ];

  const allItems = sections.flatMap((s) => s.items);
  const currentItem = allItems.find((item) => item.href === pathname);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible delay-300'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Dimmed Smooth Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel (Smooth Native Slide-In From Right) */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[380px] max-w-full bg-white dark:bg-[#0E1714] h-full shadow-2xl flex flex-col z-10 border-l border-slate-200/80 dark:border-white/10 transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>অ্যাডমিন কন্ট্রোল মেনু</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                আমরা মোহাম্মদপুরী • নির্বাহী পরিষদ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 active:scale-95"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Section Indicator */}
        <div className="px-5 py-2.5 bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            বর্তমান পেজ:
          </span>
          <span className="font-bold text-brand-emerald dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse shrink-0" />
            <span>{currentItem?.label || 'ড্যাশবোর্ড ওভারভিউ'}</span>
          </span>
        </div>

        {/* Scrollable Navigation Options List (Clean, Professional Categorized Layout) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-3 no-scrollbar scrollbar-none">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-1.5 pb-0.5">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className={`w-full group px-3 py-1.5 sm:py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-emerald/10 dark:bg-emerald-500/15 text-brand-emerald dark:text-emerald-300 font-bold border border-brand-emerald/25 dark:border-emerald-500/30 shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-brand-emerald dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-emerald dark:group-hover:text-emerald-400'
                          }`}
                        />

                        <span
                          className={`text-xs sm:text-sm truncate leading-normal py-0.5 ${
                            isActive ? 'font-bold' : 'font-semibold'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isActive
                                ? 'bg-brand-emerald text-white'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-brand-emerald dark:text-emerald-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${
                            isActive ? 'text-brand-emerald dark:text-emerald-400' : 'text-slate-400 opacity-60'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Quick Links */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col gap-2 shrink-0">
          <Link
            href="/organization"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span>সংগঠন পাবলিক হোমপেজ</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {onOpenGeneralSettings && (
            <button
              type="button"
              onClick={onOpenGeneralSettings}
              className="w-full py-2 px-3 rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>সাধারণ ওয়েবসাইট সেটিংস</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
