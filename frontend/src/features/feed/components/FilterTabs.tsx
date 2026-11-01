'use client';

import * as React from 'react';

export type FeedCategory = 'ALL' | 'MY_BLOCK' | 'POPULAR' | 'EMERGENCY' | 'LIVE';

interface FilterTabsProps {
  activeCategory: FeedCategory;
  onSelectCategory: (category: FeedCategory) => void;
}

export function FilterTabs({ activeCategory, onSelectCategory }: FilterTabsProps) {
  const tabs: { id: FeedCategory; label: string; dot?: boolean }[] = [
    { id: 'ALL', label: 'সকল পোস্ট' },
    { id: 'MY_BLOCK', label: 'আমার ব্লক' },
    { id: 'POPULAR', label: 'জনপ্রিয়' },
    { id: 'EMERGENCY', label: 'জরুরী বিজ্ঞপ্তি' },
    { id: 'LIVE', label: 'লাইভ', dot: true },
  ];

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto scrollbar-none py-1 mb-4 select-none">
      {tabs.map((tab) => {
        const isActive = activeCategory === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectCategory(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-brand-emerald text-white shadow-xs'
                : 'bg-white/80 dark:bg-brand-charcoal/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10'
            }`}
          >
            {tab.dot && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            )}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
