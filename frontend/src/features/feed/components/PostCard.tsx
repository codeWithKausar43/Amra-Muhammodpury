'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Heart,
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

  // Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    return `${diffDays} দিন আগে`;
  };

  const handleToggleLike = async () => {
    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }

    if (likeLoading) return;
    setLikeLoading(true);

    // Optimistic UI update
    const previousLiked = hasLiked;
    const previousCount = likesCount;
    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    try {
      const res = await feedService.toggleLike(post.id);
      setHasLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      // Revert if API fails
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
        // keep recent comments
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
        // cancelled
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

  return (
    <article className="w-full bg-white/95 dark:bg-brand-charcoal/85 border border-slate-200/80 dark:border-white/10 rounded-2.5xl sm:rounded-3xl p-3.5 sm:p-5 mb-4 shadow-xs backdrop-blur-md transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-brand-emerald/10 shrink-0 ring-2 ring-brand-emerald/20">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-brand-emerald">
                {post.author.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {post.author.name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald fill-brand-emerald/20 shrink-0" />
              {post.blockBadge && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald dark:text-brand-mint border border-brand-emerald/20">
                  {post.blockBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              <span>{getRelativeTime(post.createdAt)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <span>{post.location}</span>
                </>
              )}
              <span>•</span>
              <Globe className="w-3 h-3 text-slate-400" />
              <span>সর্বজনীন</span>
            </div>
          </div>
        </div>

        {/* 3-dots Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 rounded-2xl bg-white dark:bg-brand-charcoal border border-slate-200 dark:border-white/10 shadow-lg py-1.5 z-30 animate-fadeIn text-xs">
              <button
                type="button"
                onClick={() => {
                  handleShare();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>লিংক কপি করুন</span>
              </button>
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    handleDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>পোস্ট মুছুন</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Text with Bengali hashtag highlights */}
      <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed mb-3 whitespace-pre-wrap">
        {post.content.split(' ').map((word, i) => {
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
              unoptimized
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

      {/* Engagement Counter Row */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs py-2 px-1 border-b border-slate-100 dark:border-white/5 select-none">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px]">
            ❤
          </div>
          <span>{likesCount} পছন্দ</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{post.commentsCount} মন্তব্য</span>
          <span>{post.sharesCount} শেয়ার</span>
        </div>
      </div>

      {/* Action Buttons: Like, Comment, Share */}
      <div className="grid grid-cols-3 gap-1 pt-1.5 text-xs font-semibold select-none">
        {/* Like */}
        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
            hasLiked
              ? 'text-red-500 font-bold bg-red-50/50 dark:bg-red-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>পছন্দ</span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={handleOpenComments}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>মন্তব্য</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>শেয়ার</span>
        </button>
      </div>

      {/* Comments Drawer / List */}
      {commentsOpen && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 space-y-3 animate-fadeIn">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="একটি শালীন মন্তব্য লিখুন..."
              className="flex-1 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-full px-3.5 py-1.5 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="p-1.5 rounded-full bg-brand-emerald text-white hover:bg-brand-emerald-hover disabled:opacity-40 transition-colors"
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
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-200 shrink-0 mt-0.5">
                    {comment.author.image ? (
                      <Image
                        src={comment.author.image}
                        alt={comment.author.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-brand-emerald">
                        {comment.author.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-2xl px-3 py-1.5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {comment.author.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
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
