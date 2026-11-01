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
} from 'lucide-react';
import { Post, Comment } from '../types';
import { feedService } from '../services/feed.service';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
  onRequireAuth?: () => void;
}

export function PostCard({
  post,
  currentUserId,
  onPostDeleted,
  onRequireAuth,
}: PostCardProps) {
  const [likesCount, setLikesCount] = React.useState(post.likesCount);
  const [hasLiked, setHasLiked] = React.useState(post.hasLiked);
  const [likeLoading, setLikeLoading] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(post.recentComments || []);
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [submittingComment, setSubmittingComment] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [expandedContent, setExpandedContent] = React.useState(false);

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

  const handleToggleLike = async () => {
    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }

    if (likeLoading) return;
    setLikeLoading(true);

    const previousLiked = hasLiked;
    const previousCount = likesCount;
    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await feedService.toggleLike(post.id);
      setHasLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
    } finally {
      setLikeLoading(false);
    }
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
          title: `আমরা মুহাম্মদপুরী - ${post.author.name}-এর পোস্ট`,
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
  const isLongContent = post.content.length > 200;
  const displayContent =
    isLongContent && !expandedContent
      ? post.content.slice(0, 180) + '...'
      : post.content;

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

      {/* Post Text Body */}
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

      {/* Engagement Summary Row (Facebook Reaction Bubbles + Counts) */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs py-2 px-1 select-none">
        {/* Overlapping Reaction Icons */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center -space-x-1">
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white text-[9px] shadow-xs ring-1 ring-white dark:ring-brand-charcoal-dark z-30">
              👍
            </span>
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white text-[9px] shadow-xs ring-1 ring-white dark:ring-brand-charcoal-dark z-20">
              ❤️
            </span>
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white text-[9px] shadow-xs ring-1 ring-white dark:ring-brand-charcoal-dark z-10">
              🥰
            </span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {hasLiked
              ? `আপনি এবং আরও ${likesCount > 1 ? likesCount - 1 : 0} জন`
              : `মিসকাতুর রহমান এবং আরও ${likesCount > 1 ? likesCount - 1 : likesCount} জন`}
          </span>
        </div>

        {/* Comment and Share Counts */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{comments.length || post.commentsCount} মন্তব্য</span>
          <span>•</span>
          <span>{post.sharesCount} শেয়ার</span>
        </div>
      </div>

      {/* Action Buttons Row: Like, Comment, Share (Facebook Style) */}
      <div className="grid grid-cols-3 gap-1 py-1 border-y border-slate-200/80 dark:border-white/10 text-xs font-semibold select-none">
        {/* Like */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-colors cursor-pointer ${
            hasLiked
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <ThumbsUp
            className={`w-4 h-4 ${hasLiked ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400' : ''}`}
          />
          <span>লাইক</span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={handleOpenComments}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>মন্তব্য</span>
        </button>

        {/* Share */}
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
              className="p-2 rounded-full bg-brand-emerald text-white hover:bg-emerald-800 disabled:opacity-40 transition-colors"
            >
              {submittingComment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          {/* Comment items list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-2">
                প্রথম মন্তব্যটি আপনিই করুন!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 relative shrink-0">
                    {comment.author.image ? (
                      <Image
                        src={comment.author.image}
                        alt={comment.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {comment.author.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-100 dark:bg-white/5 rounded-2xl px-3 py-2 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                      {comment.author.name}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
