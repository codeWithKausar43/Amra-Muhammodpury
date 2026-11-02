'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  X,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  RefreshCw,
  Send,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { feedService } from '../services/feed.service';
import { Story } from '../types';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onStoryCreated: (story: Story) => void;
}

export function CreateStoryModal({
  isOpen,
  onClose,
  user,
  onStoryCreated,
}: CreateStoryModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [caption, setCaption] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCaption('');
      setIsSubmitting(false);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল বাছাই করুন');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      // 1. Get signed signature for story upload
      const sigRes = await apiClient<
        ApiResponse<{
          apiKey: string;
          timestamp: number;
          signature: string;
          folder: string;
          cloudName: string;
          resourceType: string;
        }>
      >('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({
          folder: 'posts',
          resourceType: 'image',
          isRegistration: false,
        }),
      });

      const signData = sigRes.data;
      if (!signData) {
        throw new Error('আপলোড সিগনেচার গ্রহণ করা সম্ভব হয়নি');
      }

      // 2. Direct Cloudinary upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType}/upload`,
        { method: 'POST', body: formData },
      );

      const asset = await res.json();
      if (!res.ok || asset.error || !asset.secure_url) {
        throw new Error(asset.error?.message || 'ছবি আপলোড সম্পন্ন হয়নি');
      }

      // 3. Register media in DB
      await apiClient<ApiResponse<{ id: string }>>('/uploads/confirm', {
        method: 'POST',
        body: JSON.stringify({
          publicId: asset.public_id,
          secureUrl: asset.secure_url,
          resourceType: 'image',
          format: asset.format || 'jpg',
          bytes: asset.bytes || selectedFile.size || 100,
          width: asset.width || 800,
          height: asset.height || 1200,
        }),
      });

      // 4. Create real story record in database
      const createdStory = await feedService.createStory({
        title: caption.trim() || 'মোহাম্মদপুরী স্টোরি',
        mediaUrl: asset.secure_url,
      });

      onStoryCreated(createdStory);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'স্টোরি প্রকাশ করতে ব্যর্থ হয়েছে';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-emerald/10 dark:bg-brand-emerald/20 text-brand-emerald flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              স্টোরি তৈরি করুন
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!previewUrl ? (
            /* Upload Initial State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-80 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-emerald dark:hover:border-brand-emerald/50 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all p-6 group select-none text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100/70 dark:bg-emerald-950/70 text-brand-emerald flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  ছবি আপলোড করুন
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  আপনার ডিভাইস থেকে একটি সুন্দর ছবি বাছাই করুন। স্টোরি ২৪ ঘণ্টা সচল থাকবে।
                </p>
              </div>
              <span className="mt-2 px-4 py-2 rounded-full bg-brand-emerald text-white text-xs font-semibold shadow-glow">
                ডিভাইস ব্রাউজ করুন
              </span>
            </div>
          ) : (
            /* Story Vertical Preview (Facebook Style) */
            <div className="w-full space-y-3">
              <div className="relative w-full max-w-[260px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/15 bg-black">
                <Image
                  src={previewUrl}
                  alt="Story preview"
                  fill
                  className="object-cover"
                />

                {/* Top overlay: User info */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent p-1 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative ring-2 ring-brand-emerald">
                      {user?.image ? (
                        <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand-emerald text-white font-bold text-xs flex items-center justify-center">
                          {user?.name?.charAt(0) || 'ম'}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md truncate max-w-[140px]">
                      {user?.name || 'মোহাম্মদপুরী'}
                    </span>
                  </div>
                </div>

                {/* Bottom overlay: Caption */}
                {caption.trim() && (
                  <div className="absolute bottom-4 left-3 right-3 z-10 p-2.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs text-center font-medium drop-shadow-md">
                    {caption}
                  </div>
                )}
              </div>

              {/* Change Photo Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-brand-emerald font-semibold hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>অন্য ছবি বাছাই করুন</span>
                </button>
              </div>

              {/* Story Caption Input */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ক্যাপশন বা বিবরণ (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="স্টোরির সাথে কিছু লিখতে চান?..."
                  maxLength={150}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-brand-emerald"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewUrl && (
          <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedFile}
              className="px-5 py-2.5 rounded-full bg-brand-emerald hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-glow active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>শেয়ার হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>স্টোরি শেয়ার করুন</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

