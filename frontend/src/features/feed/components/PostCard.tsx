'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  MapPin,
  CheckCircle2,
  Globe,
  MoreHorizontal,
  Send,
  Loader2,
  Trash2,
  CornerDownRight,
} from 'lucide-react';
import { Post, Comment, ReactionType } from '../types';
import { feedService } from '../services/feed.service';
import { getBgPreset } from '../utils/bgPresets';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  onPostDeleted?: (postId: string) => void;
  onRequireAuth?: () => void;
}

const REACTIONS: { type: ReactionType; label: string; emoji: string; color: string }[] = [
  { type: 'LIKE', label: 'লাইক', emoji: '👍', color: 'text-blue-600 dark:text-blue-400' },
  { type: 'LOVE', label: 'লাভ', emoji: '❤️', color: 'text-rose-600 dark:text-rose-400' },
  { type: 'CARE', label: 'কেয়ার', emoji: '🥰', color: 'text-amber-500 dark:text-amber-400' },
  { type: 'HAHA', label: 'হা হা', emoji: '😆', color: 'text-amber-500 dark:text-amber-400' },
  { type: 'WOW', label: 'ওয়াও', emoji: '😮', color: 'text-amber-500 dark:text-amber-400' },
  { type: 'SAD', label: 'স্যাড', emoji: '😢', color: 'text-amber-600 dark:text-amber-400' },
  { type: 'ANGRY', label: 'রাগী', emoji: '😡', color: 'text-orange-600 dark:text-orange-400' },
];

const EMOJI_MAP: Record<ReactionType, { emoji: string; bg: string }> = {
  LIKE: { emoji: '👍', bg: 'from-blue-600 to-sky-500' },
  LOVE: { emoji: '❤️', bg: 'from-rose-600 to-red-500' },
  CARE: { emoji: '🥰', bg: 'from-amber-500 to-yellow-400' },
  HAHA: { emoji: '😆', bg: 'from-amber-500 to-yellow-400' },
  WOW: { emoji: '😮', bg: 'from-amber-500 to-yellow-400' },
  SAD: { emoji: '😢', bg: 'from-amber-500 to-yellow-400' },
  ANGRY: { emoji: '😡', bg: 'from-orange-600 to-red-600' },
};

export function PostCard({
  post,
  currentUserId,
  currentUserName,
  onPostDeleted,
  onRequireAuth,
}: PostCardProps) {
  const [likesCount, setLikesCount] = React.useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = React.useState(post.hasLiked || false);
  const [userReaction, setUserReaction] = React.useState<ReactionType | null>(
    post.userReaction || (post.hasLiked ? 'LIKE' : null),
  );
  const [topReactions, setTopReactions] = React.useState<ReactionType[]>(post.topReactions || []);
  const [recentLikers, setRecentLikers] = React.useState<string[]>(post.recentLikers || []);

  const [showReactionsBar, setShowReactionsBar] = React.useState(false);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(post.recentComments || []);
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [expandedContent, setExpandedContent] = React.useState(false);

  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = React.useRef(false);
  const hoverTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const likeContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Close reaction popup on outside click
  React.useEffect(() => {
    if (!showReactionsBar) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (likeContainerRef.current && !likeContainerRef.current.contains(e.target as Node)) {
        setShowReactionsBar(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showReactionsBar]);

  // Clean up timers
  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মি.`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা`;
    return `${diffDays} দিন`;
  };

  // Generate real text based purely on database state
  const getReactionsText = () => {
    if (likesCount <= 0) return null;

    const otherLikers = recentLikers.filter(
      (name) => Boolean(name) && (!currentUserName || name !== currentUserName),
    );

    if (hasLiked) {
      if (likesCount === 1) {
        return 'আপনি';
      }
      if (likesCount === 2 && otherLikers.length > 0) {
        return `আপনি এবং ${otherLikers[0]}`;
      }
      return `আপনি এবং আরও ${likesCount - 1} জন`;
    }

    // Unauthenticated or not liked yet
    if (otherLikers.length === 1 && likesCount === 1) {
      return otherLikers[0];
    }
    if (otherLikers.length >= 2 && likesCount === 2) {
      return `${otherLikers[0]} এবং ${otherLikers[1]}`;
    }
    if (otherLikers.length >= 1 && likesCount > 1) {
      return `${otherLikers[0]} এবং আরও ${likesCount - 1} জন`;
    }

    return `${likesCount} জন`;
  };

  // Select a specific reaction (LIKE, LOVE, CARE, etc.)
  const handleSelectReaction = async (type: ReactionType) => {
    if (!currentUserId) {
      setShowReactionsBar(false);
      onRequireAuth?.();
      return;
    }

    setShowReactionsBar(false);
    if (likeLoading) return;
    setLikeLoading(true);

    const prevLiked = hasLiked;
    const prevReaction = userReaction;
    const prevCount = likesCount;
    const prevTopReactions = topReactions;
    const prevRecentLikers = recentLikers;

    // Optimistic update
    if (prevLiked && prevReaction === type) {
      // Toggle off / unlike
      setHasLiked(false);
      setUserReaction(null);
      setLikesCount(Math.max(0, prevCount - 1));
      setTopReactions(prevTopReactions.filter((t) => t !== type));
    } else {
      // Set or change reaction
      setHasLiked(true);
      setUserReaction(type);
      if (!prevLiked) {
        setLikesCount(prevCount + 1);
      }
      if (!prevTopReactions.includes(type)) {
        setTopReactions([...prevTopReactions, type]);
      }
    }

    try {
      const res = await feedService.toggleLike(post.id, type);
      setHasLiked(res.liked);
      setUserReaction(res.userReaction);
      setLikesCount(res.likesCount);
      if (res.topReactions) setTopReactions(res.topReactions);
      if (res.recentLikers) setRecentLikers(res.recentLikers);
    } catch {
      // Revert on error
      setHasLiked(prevLiked);
      setUserReaction(prevReaction);
      setLikesCount(prevCount);
      setTopReactions(prevTopReactions);
      setRecentLikers(prevRecentLikers);
    } finally {
      setLikeLoading(false);
    }
  };

  // Regular single tap / click on the Like button
  const handleLikeButtonClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }
    if (hasLiked) {
      handleSelectReaction(userReaction || 'LIKE');
    } else {
      handleSelectReaction('LIKE');
    }
  };

  // Long press for touch devices (Mobile/Tablet)
  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowReactionsBar(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // Ignore
        }
      }
    }, 380);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Hover for Desktop
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowReactionsBar(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowReactionsBar(false);
    }, 300);
  };

  const handleOpenComments = async () => {
    setCommentsOpen((prev) => !prev);
    if (!commentsLoaded && !commentsOpen) {
      try {
        const fullComments = await feedService.getComments(post.id);
        setComments(fullComments);
        setCommentsLoaded(true);
      } catch {
        // fallback to recent
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }

    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const created = await feedService.createComment(post.id, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'মন্তব্য যোগ করা যায়নি';
      alert(message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `আমরা মোহাম্মদপুরী - ${post.author.name}-এর পোস্ট`,
          text: post.content.slice(0, 100),
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('পোস্টের লিংক কপি করা হয়েছে!');
    }
  };

  const handleDelete = async () => {
    if (!confirm('আপনি কি নিশ্চিতভাবে এই পোস্টটি মুছে ফেলতে চান?')) return;
    try {
      await feedService.deletePost(post.id);
      onPostDeleted?.(post.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পোস্ট মুছে ফেলা যায়নি';
      alert(message);
    }
  };

  const isAuthor = currentUserId === post.author.id;
  const bgPreset = getBgPreset(post.bgColor);
  const isColoredPost = Boolean(bgPreset && (!post.media || post.media.length === 0));
  const isLongContent = post.content.length > 200;
  const displayContent =
    isLongContent && !expandedContent
      ? post.content.slice(0, 180) + '...'
      : post.content;

  const reactionsText = getReactionsText();
  const activeReaction = hasLiked
    ? REACTIONS.find((r) => r.type === (userReaction || 'LIKE')) || REACTIONS[0]
    : null;

  // Visible reaction emoji bubbles (max 3 distinct types)
  const visibleReactionTypes: ReactionType[] = React.useMemo(() => {
    if (likesCount <= 0) return [];
    if (topReactions && topReactions.length > 0) {
      return topReactions.slice(0, 3);
    }
    if (userReaction) {
      return [userReaction];
    }
    return ['LIKE'];
  }, [likesCount, topReactions, userReaction]);

  const hasEngagementSummary =
    reactionsText !== null ||
    comments.length > 0 ||
    post.commentsCount > 0 ||
    post.sharesCount > 0;

  return (
    <article className="w-full bg-white dark:bg-brand-charcoal-dark border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-soft transition-all">
      {/* Header: Author, Verification, Time & Menu */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Avatar with Green Online Dot */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 relative">
              {post.author.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald bg-slate-100 dark:bg-white/10">
                  {post.author.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Green Online Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-brand-charcoal-dark" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight hover:underline cursor-pointer">
                {post.author.name}
              </h3>
              {/* Blue Verified Badge */}
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 dark:text-blue-400 dark:fill-blue-400 text-white shrink-0" />
              {post.blockBadge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-mint/40 dark:bg-brand-emerald/20 text-brand-emerald dark:text-brand-mint border border-brand-emerald/20">
                  {post.blockBadge}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span>{getRelativeTime(post.createdAt)}</span>
              <span>•</span>
              <Globe className="w-3 h-3 text-slate-400 inline" />
            </p>
          </div>
        </div>

        {/* Top-Right Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-40 bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleShare();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-left"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>লিংক কপি করুন</span>
              </button>
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>পোস্ট মুছুন</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Body / Colored Post Card */}
      {isColoredPost ? (
        <div
          style={bgPreset?.style}
          className="w-full min-h-[220px] sm:min-h-[270px] rounded-2xl p-6 sm:p-10 flex items-center justify-center text-center mb-3 shadow-inner transition-transform relative overflow-hidden"
        >
          <p
            style={{
              color: bgPreset?.style.color,
              textShadow: bgPreset?.style.textShadow,
            }}
            className={`text-lg sm:text-2xl leading-relaxed font-bold tracking-wide whitespace-pre-wrap max-w-xl ${
              bgPreset?.textClass || 'text-white'
            }`}
          >
            {post.content}
          </p>
        </div>
      ) : (
        <div className="text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {displayContent.split(' ').map((word, i) => {
            if (word.startsWith('#')) {
              return (
                <span
                  key={i}
                  className="font-semibold text-brand-emerald dark:text-brand-mint hover:underline cursor-pointer mr-1"
                >
                  {word}
                </span>
              );
            }
            return word + ' ';
          })}
          {isLongContent && (
            <button
              type="button"
              onClick={() => setExpandedContent(!expandedContent)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold text-xs ml-1 focus:outline-none"
            >
              {expandedContent ? ' সংক্ষেপ করুন' : '... See more'}
            </button>
          )}
        </div>
      )}

      {/* Attached Media Photo/Video */}
      {post.media && post.media.length > 0 && post.media[0] && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/5">
          <div className="relative w-full aspect-16/10 sm:aspect-16/9">
            <Image
              src={post.media[0].secureUrl}
              alt="Post attachment"
              fill
              className="object-cover"
            />
          </div>
          {post.location && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>{post.location}</span>
            </div>
          )}
        </div>
      )}

      {/* Engagement Summary Row (ONLY shown when there is real data) */}
      {hasEngagementSummary && (
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs py-2 px-1 select-none min-h-[28px]">
          {/* Reaction Icons & Text: only if real reactions exist */}
          {reactionsText ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center -space-x-1">
                {visibleReactionTypes.map((rType, idx) => (
                  <span
                    key={rType}
                    style={{ zIndex: 30 - idx * 10 }}
                    className={`w-4 h-4 rounded-full bg-gradient-to-tr ${EMOJI_MAP[rType]?.bg || 'from-blue-600 to-sky-500'} flex items-center justify-center text-white text-[9px] shadow-xs ring-1 ring-white dark:ring-brand-charcoal-dark`}
                  >
                    {EMOJI_MAP[rType]?.emoji || '👍'}
                  </span>
                ))}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {reactionsText}
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Comment and Share Counts */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-auto">
            {(comments.length > 0 || post.commentsCount > 0) && (
              <span>{comments.length || post.commentsCount} মন্তব্য</span>
            )}
            {(comments.length > 0 || post.commentsCount > 0) && post.sharesCount > 0 && (
              <span>•</span>
            )}
            {post.sharesCount > 0 && <span>{post.sharesCount} শেয়ার</span>}
          </div>
        </div>
      )}

      {/* Action Buttons Row: Like, Comment, Share (Facebook Style) */}
      <div className="grid grid-cols-3 gap-1 py-1 border-y border-slate-200/80 dark:border-white/10 text-xs font-semibold select-none relative">
        {/* Like Button with Hover & Long-Press Reaction Bar */}
        <div
          ref={likeContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative flex items-center justify-center"
        >
          {/* Floating Reaction Bar (Facebook Style) */}
          {showReactionsBar && (
            <div
              onMouseEnter={() => {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              }}
              onMouseLeave={() => {
                setShowReactionsBar(false);
              }}
              className="absolute -top-12 left-0 sm:left-2 z-50 bg-white/95 dark:bg-brand-charcoal/95 backdrop-blur-md shadow-2xl rounded-full border border-slate-200 dark:border-white/10 px-2 py-1 flex items-center gap-1 sm:gap-2 animate-in fade-in zoom-in-90 slide-in-from-bottom-2 duration-150 select-none"
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectReaction(r.type);
                  }}
                  className="p-1 hover:scale-135 active:scale-110 transition-transform duration-150 rounded-full cursor-pointer relative group flex items-center justify-center"
                  title={r.label}
                >
                  <span className="text-xl sm:text-2xl leading-none">{r.emoji}</span>
                  {/* Tooltip on hover */}
                  <span className="absolute -top-7 px-1.5 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Main Like Button */}
          <button
            type="button"
            onClick={handleLikeButtonClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onTouchMove={handleTouchMove}
            disabled={likeLoading}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl transition-colors cursor-pointer select-none ${
              hasLiked && activeReaction
                ? `${activeReaction.color} font-bold bg-slate-100/60 dark:bg-white/5`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {hasLiked && activeReaction ? (
              <>
                <span className="text-base leading-none">{activeReaction.emoji}</span>
                <span>{activeReaction.label}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-4 h-4" />
                <span>লাইক</span>
              </>
            )}
          </button>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={handleOpenComments}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>মন্তব্য</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>শেয়ার</span>
        </button>
      </div>

      {/* Comments Drawer / List */}
      {commentsOpen && (
        <div className="mt-3 pt-2 space-y-3 animate-in fade-in duration-150">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="একটি শালীন মন্তব্য লিখুন..."
              className="flex-1 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-full px-3.5 py-2 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="p-2 rounded-full bg-brand-emerald text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {submittingComment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Comment items list (Hierarchical Tree with unlimited reply-to-reply depth) */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {comments.filter((c) => !c.parentId).length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-2">
                প্রথম মন্তব্যটি আপনিই করুন!
              </p>
            ) : (
              comments
                .filter((c) => !c.parentId)
                .map((rootComment) => (
                  <CommentThreadItem
                    key={rootComment.id}
                    comment={rootComment}
                    allComments={comments}
                    postId={post.id}
                    currentUserId={currentUserId}
                    onRequireAuth={onRequireAuth}
                    onReplyAdded={(reply) => setComments((prev) => [...prev, reply])}
                    getRelativeTime={getRelativeTime}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}

interface CommentThreadItemProps {
  comment: Comment;
  allComments: Comment[];
  postId: string;
  currentUserId?: string;
  onRequireAuth?: () => void;
  onReplyAdded: (reply: Comment) => void;
  getRelativeTime: (iso: string) => string;
  depth?: number;
}

function CommentThreadItem({
  comment,
  allComments,
  postId,
  currentUserId,
  onRequireAuth,
  onReplyAdded,
  getRelativeTime,
  depth = 0,
}: CommentThreadItemProps) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');
  const [submittingReply, setSubmittingReply] = React.useState(false);

  // Direct child replies to this comment
  const childReplies = allComments.filter((c) => c.parentId === comment.id);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }
    if (!replyText.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const created = await feedService.createComment(postId, replyText.trim(), comment.id);
      onReplyAdded(created);
      setReplyText('');
      setIsReplying(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'রিপ্লাই পাঠানো সম্ভব হয়নি';
      alert(message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="text-xs space-y-1.5">
      <div className="flex items-start gap-2">
        {/* User avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 relative shrink-0 ring-1 ring-slate-200 dark:ring-white/10">
          {comment.author.image ? (
            <Image
              src={comment.author.image}
              alt={comment.author.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald bg-slate-100 dark:bg-white/10">
              {comment.author.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Comment Bubble & Reply action */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-100 dark:bg-white/5 rounded-2xl px-3 py-2 inline-block max-w-full">
            <p className="font-bold text-slate-900 dark:text-white text-[11px]">
              {comment.author.name}
            </p>
            <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Action Row: Timestamp & Reply Button */}
          <div className="flex items-center gap-3 px-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{getRelativeTime(comment.createdAt)}</span>
            <button
              type="button"
              onClick={() => {
                if (!currentUserId) {
                  onRequireAuth?.();
                  return;
                }
                setIsReplying(!isReplying);
              }}
              className="font-bold text-slate-600 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-brand-mint hover:underline cursor-pointer flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3 inline" />
              <span>রিপ্লাই</span>
            </button>
          </div>

          {/* Inline Reply Box */}
          {isReplying && (
            <form onSubmit={handleSendReply} className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
              <input
                type="text"
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${comment.author.name.split(' ')[0]}-কে রিপ্লাই দিন...`}
                className="flex-1 bg-slate-100 dark:bg-white/5 border border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-full px-3 py-1.5 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="px-3 py-1.5 rounded-full bg-brand-emerald text-white hover:bg-emerald-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {submittingReply ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>পাঠান</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText('');
                }}
                className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                বাতিল
              </button>
            </form>
          )}

          {/* Recursive Nested Replies (unlimited reply-to-reply depth) */}
          {childReplies.length > 0 && (
            <div className="ml-2 sm:ml-4 pl-2.5 sm:pl-3 border-l-2 border-slate-200/80 dark:border-white/10 space-y-2.5 mt-2">
              {childReplies.map((reply) => (
                <CommentThreadItem
                  key={reply.id}
                  comment={reply}
                  allComments={allComments}
                  postId={postId}
                  currentUserId={currentUserId}
                  onRequireAuth={onRequireAuth}
                  onReplyAdded={onReplyAdded}
                  getRelativeTime={getRelativeTime}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
