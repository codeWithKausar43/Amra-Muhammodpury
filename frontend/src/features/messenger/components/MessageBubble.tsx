'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  FileText,
  Download,
  Play,
  Pause,
  Smile,
  MoreVertical,
} from 'lucide-react';
import { MessageItem } from '../types/messenger.types';

interface MessageBubbleProps {
  message: MessageItem;
  currentUserId?: string;
  isGroup?: boolean;
  onImageClick?: (url: string) => void;
  onReply?: (message: MessageItem) => void;
  onEdit?: (message: MessageItem) => void;
  onDelete?: (message: MessageItem) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

const POPULAR_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export function MessageBubble({
  message,
  currentUserId,
  isGroup,
  onImageClick,
  onReply,
  onEdit,
  onDelete,
  onReaction,
}: MessageBubbleProps) {
  const isMine = message.senderId === currentUserId;
  const isSystem = message.type === 'SYSTEM';

  // State for voice player if message has AUDIO
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioProgress, setAudioProgress] = React.useState(0);
  const [showReactionsMenu, setShowReactionsMenu] = React.useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Toggle audio playback
  const toggleAudio = () => {
    if (!message.mediaUrl) return;

    if (!audioRef.current) {
      const audio = new Audio(message.mediaUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setAudioProgress(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Format timestamp in Bengali
  const timeStr = React.useMemo(() => {
    return new Date(message.createdAt).toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.createdAt]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
          {message.content}
        </span>
      </div>
    );
  }

  // Group reactions by emoji
  const reactionGroups = React.useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; hasReacted: boolean }>();
    for (const r of message.reactions || []) {
      const existing = map.get(r.emoji) || { emoji: r.emoji, count: 0, hasReacted: false };
      existing.count += 1;
      if (r.userId === currentUserId) existing.hasReacted = true;
      map.set(r.emoji, existing);
    }
    return Array.from(map.values());
  }, [message.reactions, currentUserId]);

  return (
    <div
      className={`group relative flex gap-2.5 items-end my-1 ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Sender Avatar for incoming message (especially useful in group chats) */}
      {!isMine && (
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-brand-emerald/10 ring-1 ring-slate-200 dark:ring-white/10 shrink-0 mb-1">
          {message.sender?.image ? (
            <Image
              src={message.sender.image}
              alt={message.sender.name || 'User'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-brand-emerald">
              {message.sender?.name?.charAt(0) || 'ম'}
            </div>
          )}
        </div>
      )}

      {/* Bubble Content Wrapper */}
      <div className={`relative max-w-[82%] sm:max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender Name in Group Chat */}
        {!isMine && isGroup && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 ml-2 mb-0.5">
            {message.sender?.name}
          </span>
        )}

        {/* Bubble Box */}
        <div
          className={`relative px-3.5 py-2 rounded-2xl shadow-2xs leading-relaxed transition-all ${
            isMine
              ? 'bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white rounded-br-xs'
              : 'bg-white dark:bg-white/10 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/70 dark:border-white/5'
          } ${message.isDeleted ? 'italic opacity-80' : ''}`}
        >
          {/* Reply-to quote box */}
          {message.replyTo && (
            <div
              className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                isMine
                  ? 'bg-emerald-700/50 border-emerald-300 text-emerald-100'
                  : 'bg-slate-100 dark:bg-white/5 border-brand-emerald text-slate-600 dark:text-slate-300'
              }`}
            >
              <p className="font-semibold text-[10px]">
                {message.replyTo.sender?.name || 'পূর্ববর্তী বার্তা'}:
              </p>
              <p className="truncate line-clamp-1">{message.replyTo.content}</p>
            </div>
          )}

          {/* Deleted Message Placeholder */}
          {message.isDeleted ? (
            <div className="flex items-center gap-1.5 text-xs">
              <Trash2 className="w-3.5 h-3.5 opacity-60" />
              <span>এই বার্তাটি মুছে ফেলা হয়েছে</span>
            </div>
          ) : (
            <>
              {/* IMAGE TYPE */}
              {message.type === 'IMAGE' && message.mediaUrl && (
                <div
                  onClick={() => onImageClick?.(message.mediaUrl!)}
                  className="relative w-52 sm:w-64 h-48 sm:h-56 rounded-xl overflow-hidden mb-2 cursor-pointer bg-slate-900/10 group/img"
                >
                  <Image
                    src={message.mediaUrl}
                    alt="ছবি"
                    fill
                    className="object-cover transition-transform group-hover/img:scale-105 duration-200"
                  />
                </div>
              )}

              {/* AUDIO / VOICE NOTE TYPE */}
              {message.type === 'AUDIO' && message.mediaUrl && (
                <div className="flex items-center gap-2.5 py-1 min-w-[180px]">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer ${
                      isMine ? 'bg-white text-brand-emerald' : 'bg-brand-emerald text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          isMine ? 'bg-white' : 'bg-brand-emerald'
                        }`}
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    <span
                      className={`text-[9px] mt-1 block ${
                        isMine ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {message.fileMeta?.duration
                        ? `${Math.floor(message.fileMeta.duration / 60)}:${
                            message.fileMeta.duration % 60 < 10 ? '0' : ''
                          }${message.fileMeta.duration % 60}`
                        : 'ভয়েস বার্তা'}
                    </span>
                  </div>
                </div>
              )}

              {/* FILE ATTACHMENT TYPE */}
              {message.type === 'FILE' && message.mediaUrl && (
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl mb-1.5 ${
                    isMine ? 'bg-emerald-700/40' : 'bg-slate-100 dark:bg-white/5'
                  }`}
                >
                  <FileText className="w-6 h-6 shrink-0 opacity-80" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {message.fileMeta?.fileName || 'ফাইল'}
                    </p>
                    {message.fileMeta?.fileSize && (
                      <span className="text-[10px] opacity-70">
                        {(message.fileMeta.fileSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  <a
                    href={message.mediaUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer"
                    title="ডাউনলোড"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Message text content */}
              {message.content && (
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </>
          )}

          {/* Footer inside bubble: Time, Edited status, Read receipt */}
          <div
            className={`flex items-center gap-1.5 mt-1 text-[9px] ${
              isMine ? 'text-emerald-100 justify-end' : 'text-slate-400 justify-start'
            }`}
          >
            <span>{timeStr}</span>
            {message.isEdited && <span>(সম্পাদিত)</span>}
            {isMine && !message.isDeleted && (
              <span>
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-emerald-200 inline" />
                ) : (
                  <Check className="w-3 h-3 text-emerald-200 inline" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges below bubble */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1 px-1">
            {reactionGroups.map((rg) => (
              <button
                key={rg.emoji}
                type="button"
                onClick={() => onReaction?.(message.id, rg.emoji)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border cursor-pointer transition-all ${
                  rg.hasReacted
                    ? 'bg-brand-emerald/15 border-brand-emerald/40 text-brand-emerald font-bold scale-105'
                    : 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:scale-105'
                }`}
              >
                <span>{rg.emoji}</span>
                {rg.count > 1 && <span className="text-[10px]">{rg.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Hover/Tap Actions (Reactions, Reply, Edit, Delete) */}
      {!message.isDeleted && (
        <div
          className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5 mb-1 ${
            isMine ? 'order-first' : 'order-last'
          }`}
        >
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactionsMenu(!showReactionsMenu)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              title="প্রতিক্রিয়া দিন"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Quick Reactions Bar Popover */}
            {showReactionsMenu && (
              <div
                className={`absolute bottom-full mb-1 flex items-center gap-1 p-1 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-full shadow-lg z-20 animate-in fade-in zoom-in-95 ${
                  isMine ? 'right-0' : 'left-0'
                }`}
              >
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReaction?.(message.id, emoji);
                      setShowReactionsMenu(false);
                    }}
                    className="w-7 h-7 text-sm hover:scale-125 transition-transform flex items-center justify-center cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Button */}
          <button
            type="button"
            onClick={() => onReply?.(message)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            title="উত্তর দিন"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* More options for own messages: Edit, Delete */}
          {isMine && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showActionsDropdown && (
                <div
                  className="absolute bottom-full right-0 mb-1 w-28 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-1 z-20 text-xs animate-in fade-in"
                >
                  {message.type === 'TEXT' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsDropdown(false);
                        onEdit?.(message);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-blue-500" />
                      <span>সম্পাদনা</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onDelete?.(message);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>মুছুন</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
