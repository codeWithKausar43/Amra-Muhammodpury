'use client';

import * as React from 'react';
import Image from 'next/image';
import { Image as ImageIcon, MapPin, Smile, Send, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

import { Post } from '../types';

interface PostComposerProps {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onPostCreated: (newPost: Post) => void;
  onRequireAuth?: () => void;
}

export function PostComposer({ user, onPostCreated, onRequireAuth }: PostComposerProps) {
  const [content, setContent] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [showLocationInput, setShowLocationInput] = React.useState(false);
  const [selectedMedia, setSelectedMedia] = React.useState<{ url: string; id: string }[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      onRequireAuth?.();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get signature
      const sigRes = await apiClient<ApiResponse<{
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        cloudName: string;
        resourceType: string;
      }>>('/uploads/signature', {
        method: 'POST',
        body: JSON.stringify({
          folder: 'posts',
          resourceType: file.type.startsWith('video') ? 'video' : 'image',
          isRegistration: false,
        }),
      });

      const signData = sigRes.data;
      if (!signData) {
        throw new Error('আপলোড সিগনেচার গ্রহণ করা সম্ভব হয়নি');
      }

      // 2. Direct upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/${signData.resourceType}/upload`,
        { method: 'POST', body: formData },
      );

      const asset = await res.json();

      // 3. Confirm with backend
      const confirmRes = await apiClient<ApiResponse<{ id: string }>>('/uploads/confirm', {
        method: 'POST',
        body: JSON.stringify({
          publicId: asset.public_id,
          secureUrl: asset.secure_url,
          resourceType: signData.resourceType,
          format: asset.format || 'jpg',
          bytes: asset.bytes,
          width: asset.width,
          height: asset.height,
        }),
      });

      if (!confirmRes.data) {
        throw new Error('মিডিয়া নিবন্ধন ব্যর্থ হয়েছে');
      }

      setSelectedMedia((prev) => [
        ...prev,
        { url: asset.secure_url, id: confirmRes.data!.id },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'মিডিয়া আপলোড ব্যর্থ হয়েছে';
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      onRequireAuth?.();
      return;
    }

    if (!content.trim() && selectedMedia.length === 0) return;

    setSubmitting(true);
    try {
      const res = await apiClient<ApiResponse<Post>>('/feed/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          location: location.trim() || undefined,
          category: 'GENERAL',
          mediaIds: selectedMedia.map((m) => m.id),
        }),
      });

      if (res.data) {
        onPostCreated(res.data);
      }
      setContent('');
      setLocation('');
      setShowLocationInput(false);
      setSelectedMedia([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পোস্ট প্রকাশ করা যায়নি';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white/90 dark:bg-brand-charcoal/80 border border-slate-200/80 dark:border-white/10 rounded-2.5xl sm:rounded-3xl p-3.5 sm:p-4 mb-4 shadow-xs backdrop-blur-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaUpload}
      />

      {/* Top Input Row */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-brand-emerald/10 shrink-0">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-sm text-brand-emerald">
              {user?.name?.charAt(0) || 'ম'}
            </div>
          )}
        </div>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => {
            if (!user) onRequireAuth?.();
          }}
          placeholder={
            user?.name
              ? `আপনার মনে কী চলছে, ${user.name.split(' ')[0]}?`
              : 'আপনার মনে কী চলছে, প্রতিবেশী? (লগইন করে লিখুন)'
          }
          className="flex-1 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-brand-emerald/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none transition-all"
        />
      </div>

      {/* Location tag input if opened */}
      {showLocationInput && (
        <div className="mt-2.5 flex items-center gap-2 px-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="এলাকা বা রোড উল্লেখ করুন (যেমন: তাজমহল রোড)"
            className="flex-1 bg-transparent border-b border-slate-200 dark:border-white/10 outline-none pb-0.5 text-slate-700 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={() => {
              setLocation('');
              setShowLocationInput(false);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected media thumbnails */}
      {selectedMedia.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {selectedMedia.map((m, index) => (
            <div
              key={index}
              className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0"
            >
              <Image src={m.url} alt="upload" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Photo / Video Action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 text-brand-emerald animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden xs:inline">ছবি/ভিডিও</span>
          </button>

          {/* Location Action */}
          <button
            type="button"
            onClick={() => setShowLocationInput(!showLocationInput)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="hidden xs:inline">অবস্থান</span>
          </button>

          {/* Feeling Action */}
          <button
            type="button"
            onClick={() => setContent((prev) => (prev ? `${prev} 😊` : 'দারুণ অনুভূতি 😊 '))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span className="hidden xs:inline">অনুভূতি</span>
          </button>
        </div>

        {/* Submit Post Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && selectedMedia.length === 0)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-emerald hover:bg-brand-emerald-hover text-white transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>পোস্ট</span>
        </button>
      </div>
    </div>
  );
}
