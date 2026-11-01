'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-white/10 animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/70 dark:bg-brand-charcoal/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-brand-charcoal-light transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
      aria-label={isDark ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
      title={isDark ? 'লাইট মোড' : 'ডার্ক মোড'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-brand-gold transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-emerald transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
