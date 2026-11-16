'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Smile,
  X,
  Loader2,
  FileText,
} from 'lucide-react';
import { MessageItem, FileMetadata } from '../types/messenger.types';
import { messengerService } from '../services/messenger.service';
import { VoiceRecorder } from './VoiceRecorder';

interface MessageComposerProps {
  onSendMessage: (data: {
    content?: string;
    mediaUrl?: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
    fileMeta?: FileMetadata;
    replyToId?: string;
  }) => Promise<void>;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  replyingTo: MessageItem | null;
  onCancelReply: () => void;
  editingMessage: MessageItem | null;
  onCancelEdit: () => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '👍', '👎', '👏', '🙌', '🙏', '🤝', '❤️', '💖', '🔥', '🎉',
  '✨', '💯', '🌸', '🌹', '🌿', '⚡', '💡', '📌', '⭐', '☕',
];

export function MessageComposer({
  onSendMessage,
  onEditMessage,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onTyping,
  disabled,
}: MessageComposerProps) {
  const [text, setText] = React.useState('');
  const [isVoiceRecording, setIsVoiceRecording] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  // Pending attachment before sending
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [attachmentType, setAttachmentType] = React.useState<'IMAGE' | 'FILE'>('IMAGE');
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync editing text
  React.useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onTyping(val.length > 0);
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAttachmentType('IMAGE');
    setFilePreview(URL.createObjectURL(file));
  };

  const handleSelectDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAttachmentType('FILE');
    setFilePreview(file.name);
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled || isUploading) return;

    // Handle Edit Mode
    if (editingMessage && onEditMessage) {
      if (!text.trim()) return;
      setIsUploading(true);
      try {
        await onEditMessage(editingMessage.id, text.trim());
        setText('');
        onCancelEdit();
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle New Message
    if (!text.trim() && !selectedFile) return;

    setIsUploading(true);
    onTyping(false);

    try {
      let mediaUrl: string | undefined;
      let type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' = 'TEXT';
      let fileMeta: FileMetadata | undefined;

      if (selectedFile) {
        type = attachmentType;
        const uploadRes = await messengerService.uploadMedia(
          selectedFile,
          attachmentType === 'IMAGE' ? 'image' : 'raw',
        );
        mediaUrl = uploadRes.secure_url;
        fileMeta = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        };
      }

      await onSendMessage({
        content: text.trim(),
        mediaUrl,
        type,
        fileMeta,
        replyToId: replyingTo?.id,
      });

      setText('');
      clearAttachment();
      onCancelReply();
    } catch (err: any) {
      alert(err.message || 'বার্তা পাঠাতে ত্রুটি হয়েছে');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceSend = async (file: File, duration: number) => {
    setIsUploading(true);
    try {
      const uploadRes = await messengerService.uploadMedia(file, 'video'); // Cloudinary handles audio under video
      await onSendMessage({
        content: '',
        mediaUrl: uploadRes.secure_url,
        type: 'AUDIO',
        fileMeta: {
          fileName: 'ভয়েস বার্তা',
          fileSize: file.size,
          duration,
          mimeType: 'audio/webm',
        },
        replyToId: replyingTo?.id,
      });
      setIsVoiceRecording(false);
      onCancelReply();
    } catch (err: any) {
      alert(err.message || 'ভয়েস বার্তা আপলোড হয়নি');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-brand-charcoal-dark/95 backdrop-blur-md p-2.5 sm:p-3">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectImage}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        className="hidden"
        onChange={handleSelectDoc}
      />

      {/* Reply-to preview banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-emerald-50 dark:bg-brand-emerald/15 rounded-xl border border-brand-emerald/20 text-xs">
          <div className="truncate pr-2">
            <span className="font-bold text-brand-emerald">
              {replyingTo.sender?.name}-এর বার্তার উত্তর:{' '}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {replyingTo.content || (replyingTo.type === 'IMAGE' ? '📷 ছবি' : 'ফাইল')}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editing message preview banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            বার্তা সম্পাদনা করছেন...
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="relative inline-flex items-center gap-2 mb-2 p-2 bg-slate-100 dark:bg-white/10 rounded-xl max-w-xs border border-slate-200 dark:border-white/10">
          {attachmentType === 'IMAGE' && filePreview ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <Image src={filePreview} alt="Preview" fill className="object-cover" />
            </div>
          ) : (
            <FileText className="w-8 h-8 text-brand-emerald shrink-0" />
          )}
          <span className="text-xs truncate flex-1">{selectedFile.name}</span>
          <button
            type="button"
            onClick={clearAttachment}
            className="p-1 rounded-full bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Recording Mode or Standard Input Form */}
      {isVoiceRecording ? (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setIsVoiceRecording(false)}
        />
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Action icon buttons: Photos, Documents, Voice */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-slate-400">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-emerald transition-colors cursor-pointer"
              title="ছবি পাঠান"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => docInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-emerald transition-colors cursor-pointer"
              title="ফাইল বা ডকুমেন্ট পাঠান"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => setIsVoiceRecording(true)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-emerald transition-colors cursor-pointer"
              title="ভয়েস বার্তা রেকর্ড করুন"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Text Input with Emoji Button inside */}
          <div className="relative flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center px-3 py-1.5 focus-within:border-brand-emerald focus-within:ring-2 focus-within:ring-brand-emerald/20 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              disabled={disabled}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={disabled ? 'বার্তা পাঠানো সাময়িকভাবে নিষ্ক্রিয়' : 'একটি বার্তা লিখুন...'}
              className="w-full bg-transparent outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-white max-h-28 placeholder:text-slate-400"
            />

            {/* Emoji Trigger */}
            <div className="relative shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-slate-400 hover:text-brand-emerald transition-colors cursor-pointer"
                title="ইমোজি"
              >
                <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 w-64 max-h-48 overflow-y-auto p-2 bg-white dark:bg-brand-charcoal-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl grid grid-cols-8 gap-1 z-30 animate-in fade-in zoom-in-95">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-lg hover:scale-125 transition-transform flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || isUploading || (!text.trim() && !selectedFile)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-emerald to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:scale-100 active:scale-95 shadow-md shadow-brand-emerald/20 cursor-pointer shrink-0"
            title="বার্তা পাঠান"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
