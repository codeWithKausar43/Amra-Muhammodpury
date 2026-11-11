'use client';

import * as React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Story } from '../types';

interface StoriesCarouselProps {
  stories: Story[];
  userImage?: string | null;
  onAddStory?: () => void;
  onSelectStory?: (index: number) => void;
}

export function StoriesCarousel({
  stories,
  userImage,
  onAddStory,
  onSelectStory,
}: StoriesCarouselProps) {
  const communityStories = stories.filter((s) => s.id !== 'story-1');

  return (
    <div className="w-full overflow-hidden select-none mb-3.5">
      <div
        className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scrollbar-none py-1 px-0.5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Card 1: Create Story (Facebook Style) */}
        <button
          type="button"
          onClick={onAddStory}
          className="w-32 sm:w-36 md:w-40 h-52 sm:h-56 md:h-60 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 relative bg-white dark:bg-brand-charcoal-dark border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all group flex flex-col text-left focus:outline-none cursor-pointer"
        >
          {/* Top 70% Image Area */}
          <div className="relative w-full h-[70%] overflow-hidden bg-slate-100 dark:bg-white/5">
            {userImage ? (
              <Image
                src={userImage}
                alt="Create story"
                fill
                unoptimized
                sizes="(max-width: 640px) 128px, 160px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-brand-charcoal text-brand-emerald dark:text-brand-mint font-bold text-2xl">
                ম
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>

          {/* Elevated Floating Plus Circle */}
          <div className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-emerald text-white flex items-center justify-center ring-4 ring-white dark:ring-brand-charcoal-dark shadow-md z-10 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>

          {/* Bottom 30% Label */}
          <div className="w-full h-[30%] pt-4 pb-2 px-1.5 flex items-center justify-center text-center">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              স্টোরি তৈরি করুন
            </span>
          </div>
        </button>

        {/* Community Stories (Facebook Vertical Cards) */}
        {communityStories.map((story, index) => {
          const backgroundPhoto =
            story.mediaUrl ||
            story.author.image ||
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';

          return (
            <div
              key={story.id}
              onClick={() => onSelectStory?.(index)}
              className="w-32 sm:w-36 md:w-40 h-52 sm:h-56 md:h-60 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 relative shadow-sm hover:shadow-md transition-all cursor-pointer group border border-slate-200/60 dark:border-white/10 bg-slate-900"
            >
              {/* Full Cover Background */}
              <Image
                src={backgroundPhoto}
                alt={story.title || story.author.name}
                fill
                unoptimized
                sizes="(max-width: 640px) 128px, 160px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Dark Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />

              {/* Top-Left Author Avatar with Ring */}
              <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-brand-emerald p-0.5 bg-white dark:bg-brand-charcoal z-10 overflow-hidden shadow-sm">
                {story.author.image ? (
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={story.author.image}
                      alt={story.author.name}
                      fill
                      unoptimized
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-emerald text-white text-[11px] font-bold">
                    {story.author.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Bottom Author Name */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                <p className="text-xs font-bold text-white leading-tight drop-shadow-md truncate">
                  {story.author.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
