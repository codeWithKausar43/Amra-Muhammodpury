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

interface CommunityStoryCardProps {
  story: Story;
  index: number;
  onSelectStory?: (index: number) => void;
}

function CommunityStoryCard({ story, index, onSelectStory }: CommunityStoryCardProps) {
  const [bgError, setBgError] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);

  const authorName = story.author?.name || story.title || 'কমিউনিটি সদস্য';
  const initial = (authorName.trim().charAt(0) || 'ম').toUpperCase();
  const backgroundPhoto =
    story.mediaUrl ||
    story.author?.image ||
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={() => onSelectStory?.(index)}
      className="w-32 sm:w-36 md:w-40 h-52 sm:h-56 md:h-60 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 relative shadow-sm hover:shadow-md transition-all cursor-pointer group border border-slate-200/60 dark:border-white/10 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900"
    >
      {/* Full Cover Background */}
      {backgroundPhoto && !bgError ? (
        <Image
          src={backgroundPhoto}
          alt={story.title || authorName}
          fill
          unoptimized
          sizes="(max-width: 640px) 128px, 160px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setBgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 flex flex-col items-center justify-center p-3 text-center">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-lg font-bold mb-1 shadow-sm">
            {initial}
          </div>
          <span className="text-[11px] font-semibold text-emerald-100 line-clamp-2 px-1">
            {story.title || authorName}
          </span>
        </div>
      )}

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15 pointer-events-none" />

      {/* Top-Left Author Avatar with Ring */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-brand-emerald p-0.5 bg-white dark:bg-brand-charcoal z-20 overflow-hidden shadow-sm">
        {story.author?.image && !avatarError ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={story.author.image}
              alt={authorName}
              fill
              unoptimized
              sizes="36px"
              className="object-cover"
              onError={() => setAvatarError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-emerald text-white text-[11px] font-bold">
            {initial}
          </div>
        )}
      </div>

      {/* Bottom Author Name */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 pointer-events-none">
        <p className="text-xs font-bold text-white leading-tight drop-shadow-md truncate">
          {authorName}
        </p>
      </div>
    </div>
  );
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
        {communityStories.map((story, index) => (
          <CommunityStoryCard
            key={story.id}
            story={story}
            index={index}
            onSelectStory={onSelectStory}
          />
        ))}
      </div>
    </div>
  );
}

