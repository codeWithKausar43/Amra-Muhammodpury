'use client';

import * as React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Story } from '../types';

interface StoriesCarouselProps {
  stories: Story[];
  userImage?: string | null;
  onAddStory?: () => void;
}

export function StoriesCarousel({ stories, userImage, onAddStory }: StoriesCarouselProps) {
  return (
    <div className="w-full bg-white/80 dark:bg-brand-charcoal/80 border border-slate-200/80 dark:border-white/10 rounded-2.5xl sm:rounded-3xl p-3 sm:p-4 mb-4 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto scrollbar-none py-1 px-1">
        {/* User's Own Story Action */}
        <button
          type="button"
          onClick={onAddStory}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 border-2 border-dashed border-brand-emerald/40 group-hover:border-brand-emerald transition-colors">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/5">
              {userImage ? (
                <Image
                  src={userImage}
                  alt="Your story"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                  <span>আপ</span>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-brand-emerald text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-brand-charcoal">
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[68px]">
            আপনার স্টোরি
          </span>
        </button>

        {/* Community Stories */}
        {stories
          .filter((s) => s.id !== 'story-1')
          .map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 ring-2 ring-brand-emerald ring-offset-2 ring-offset-white dark:ring-offset-brand-charcoal transition-transform group-hover:scale-105">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/5">
                  {story.author.image ? (
                    <Image
                      src={story.author.image}
                      alt={story.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald text-sm">
                      {story.author.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[68px]">
                {story.author.name}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

