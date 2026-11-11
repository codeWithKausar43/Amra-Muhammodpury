'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  Pause,
  Play,
} from 'lucide-react';
import { Story } from '../types';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  initialStoryIndex?: number;
}

const EMOJI_REACTIONS = [
  { emoji: '❤️', label: 'লাভ' },
  { emoji: '👍', label: 'লাইক' },
  { emoji: '🥰', label: 'কেয়ার' },
  { emoji: '🔥', label: 'ফায়ার' },
  { emoji: '😮', label: 'ওয়াও' },
  { emoji: '👏', label: 'তালি' },
];

export function StoryViewerModal({
  isOpen,
  onClose,
  stories,
  initialStoryIndex = 0,
}: StoryViewerModalProps) {
  // Filter out the "Create story" card
  const activeStories = React.useMemo(
    () => stories.filter((s) => s.id !== 'story-1'),
    [stories],
  );

  const [currentIndex, setCurrentIndex] = React.useState(initialStoryIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');
  const [floatingReaction, setFloatingReaction] = React.useState<string | null>(null);
  const [sentFeedback, setSentFeedback] = React.useState<string | null>(null);
  const [viewsMap, setViewsMap] = React.useState<Record<string, number>>({});

  // Reset or adjust index when initialStoryIndex changes
  React.useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(
        0,
        Math.min(initialStoryIndex, activeStories.length - 1),
      );
      setCurrentIndex(validIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialStoryIndex, activeStories.length]);

  const currentStory = activeStories[currentIndex];

  const handleNext = React.useCallback(() => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, activeStories.length, onClose]);

  const handlePrev = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Increment view count when a story is viewed
  React.useEffect(() => {
    if (isOpen && currentStory) {
      setViewsMap((prev) => {
        const current = prev[currentStory.id] || currentStory.viewsCount || 120;
        return {
          ...prev,
          [currentStory.id]: current + 1,
        };
      });
    }
  }, [isOpen, currentIndex, currentStory]);

  // Lock body scroll and handle Escape & Arrow keys
  React.useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Story Timer (5 seconds auto-advance)
  React.useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = 50; // update every 50ms
    const step = 100 / (5000 / interval); // 5000ms total

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex]);

  // When progress reaches 100%, advance cleanly outside state updater
  React.useEffect(() => {
    if (isOpen && progress >= 100) {
      handleNext();
    }
  }, [isOpen, progress, handleNext]);

  if (!isOpen || !currentStory) return null;

  const currentViews = viewsMap[currentStory.id] || currentStory.viewsCount || 120;
  const storyImage =
    currentStory.mediaUrl ||
    currentStory.author.image ||
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80';

  const handleReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setViewsMap((prev) => ({
      ...prev,
      [currentStory.id]: (prev[currentStory.id] || currentViews) + 1,
    }));
    setTimeout(() => {
      setFloatingReaction(null);
    }, 1500);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSentFeedback('উত্তর পাঠানো হয়েছে!');
    setReplyText('');
    setTimeout(() => {
      setSentFeedback(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 sm:bg-black/90 flex items-center justify-center p-0 sm:p-4 select-none backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Close Button on Desktop */}
      <button
        type="button"
        onClick={onClose}
        className="hidden sm:flex absolute top-5 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors cursor-pointer z-50"
        title="বন্ধ করুন (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Story Container (Phone 9:16 aspect ratio) */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-slate-950 flex flex-col justify-between shadow-2xl border border-white/10">
        {/* Full Cover Story Background Image */}
        <div className="absolute inset-0">
          <Image
            src={storyImage}
            alt={currentStory.author.name}
            fill
            unoptimized
            className="object-cover"
            priority
          />
          {/* Top & Bottom dark gradients for controls readability */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        </div>

        {/* Floating Animation Reaction */}
        {floatingReaction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <span className="text-6xl animate-bounce drop-shadow-2xl">
              {floatingReaction}
            </span>
          </div>
        )}

        {/* Top Controls Header */}
        <div className="relative z-30 p-3 sm:p-4 space-y-3">
          {/* Multi-segment Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {activeStories.map((s, idx) => {
              let fillWidth = '0%';
              if (idx < currentIndex) fillWidth = '100%';
              else if (idx === currentIndex) fillWidth = `${progress}%`;

              return (
                <div
                  key={s.id}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Header, View Count & Action Buttons */}
          <div className="flex items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full ring-2 ring-brand-emerald overflow-hidden shrink-0 bg-white/10">
                {currentStory.author.image ? (
                  <Image
                    src={currentStory.author.image}
                    alt={currentStory.author.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-brand-emerald">
                    {currentStory.author.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold truncate leading-tight">
                  {currentStory.author.name}
                </p>
                {/* View count indicator */}
                <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">
                    {currentViews} জন দেখেছেন
                  </span>
                </p>
              </div>
            </div>

            {/* Pause, Play and Mobile Close */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isPaused ? 'চালিয়ে যান' : 'থামান'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="sm:hidden w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Middle Screen Tap Zones (Left for Previous, Right for Next) */}
        <div className="absolute inset-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={handlePrev}
            title="আগের স্টোরি"
          />
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
          />
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={handleNext}
            title="পরের স্টোরি"
          />
        </div>

        {/* Desktop Left / Right Arrow Buttons */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center z-30 transition-transform hover:scale-110"
            title="আগের স্টোরি"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentIndex < activeStories.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center z-30 transition-transform hover:scale-110"
            title="পরের স্টোরি"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Bottom Reaction & Reply Bar */}
        <div className="relative z-30 p-3 sm:p-4 space-y-2.5">
          {/* Feedback banner when replied */}
          {sentFeedback && (
            <div className="bg-brand-emerald text-white text-xs font-semibold py-1.5 px-3 rounded-full text-center shadow-lg animate-in fade-in zoom-in-95">
              {sentFeedback}
            </div>
          )}

          {/* Quick Reaction Emojis Row */}
          <div className="flex items-center justify-around bg-black/40 backdrop-blur-md rounded-2xl py-1.5 px-2 border border-white/10">
            {EMOJI_REACTIONS.map((item) => (
              <button
                key={item.emoji}
                type="button"
                onClick={() => handleReaction(item.emoji)}
                className="text-xl sm:text-2xl hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          {/* Quick Message Input Field */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder={`${currentStory.author.name}-কে উত্তর পাঠান...`}
              className="flex-1 bg-white/20 backdrop-blur-md border border-white/25 rounded-full py-2 px-4 text-xs sm:text-sm text-white placeholder:text-white/60 outline-none focus:border-brand-emerald"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-9 h-9 rounded-full bg-brand-emerald hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
