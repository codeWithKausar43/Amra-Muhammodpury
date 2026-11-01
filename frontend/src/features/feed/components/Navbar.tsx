'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { Search, Bell, LogIn, UserPlus, LogOut, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export function Navbar({ onSearch }: NavbarProps) {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch?.(val);
  };

  const clearSearch = () => {
    setSearchValue('');
    onSearch?.('');
    setSearchOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-brand-charcoal-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 select-none">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-brand-emerald to-emerald-800 flex items-center justify-center text-white font-bold text-base shadow-glow">
            <span>ম</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base sm:text-lg font-bold tracking-tight text-brand-emerald dark:text-brand-mint leading-tight">
              আমরা মুহাম্মদপুরী
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden xs:inline">
              Community Timeline
            </span>
          </div>
        </Link>

        {/* Center Search Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="মুহাম্মদপুরের পোস্ট, ব্লক বা বিষয় খুঁজুন..."
              className="w-full pl-10 pr-9 py-2 rounded-full text-xs sm:text-sm bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications button with red badge */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="নোটিফিকেশন"
            title="নোটিফিকেশন"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-brand-charcoal" />
          </button>

          {/* Theme switcher */}
          <ThemeToggle />

          {/* User state / Profile menu */}
          {session?.user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 p-0.5 rounded-full ring-2 ring-brand-emerald/30 hover:ring-brand-emerald transition-all"
              >
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-brand-emerald/20">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-brand-emerald">
                      {session.user.name?.charAt(0) || 'ইউ'}
                    </div>
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 shadow-xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    ড্যাশবোর্ড
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-brand-emerald dark:text-brand-mint hover:bg-brand-mint/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-emerald text-white hover:bg-brand-emerald-hover shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">নিবন্ধন</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search input expander */}
      {searchOpen && (
        <div className="md:hidden px-3 py-2 border-t border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-brand-charcoal">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="মুহাম্মদপুরের পোস্ট বা বিষয় খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
