'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  X,
  Image as ImageIcon,
  MapPin,
  Loader2,
  Trash2,
  Globe,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onPostCreated: (post: Post) => void;
}

const BLOCKS = [
  'তাজমহল রোড',
  'সলিমুল্লাহ রোড',
  'বাবর রোড',
  'হুমায়ুন রোড',
  'নুরজাহান রোড',
  'জাপান গার্ডেন সিটি',
  'কাটাসুর',
  'বসিলা',
];

export function CreatePostModal({
  isOpen,
  onClose,
  user,
  onPostCreated,
}: CreatePostModalProps) {
  const [content, setContent] = React.useState('');
  const [blockName, setBlockName] = React.useState('তাজমহল রোড');
  const [location, setLocation] = React.useState('');
  const [showLocation, setShowLocation] = React.useState(false);
  const [selectedMedia, setSelectedMedia] = React.useState<{ url: string; id: string }[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
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
    if (!content.trim() && selectedMedia.length === 0) return;

    setSubmitting(true);
    try {
      const res = await apiClient<ApiResponse<Post>>('/feed/posts', {
        method: 'POST',
        body: JSON.stringify({
          content,
          blockName: blockName || 'মুহাম্মদপুর',
          location: location || undefined,
          mediaIds: selectedMedia.map((m) => m.id),
        }),
      });

      if (res.data) {
        onPostCreated(res.data);
      }
      setContent('');
      setSelectedMedia([]);
      setLocation('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পোস্ট প্রকাশ করা সম্ভব হয়নি';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            নতুন পোস্ট তৈরি করুন
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* User info & Block selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 relative">
              {user?.image ? (
                <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-brand-emerald">
                  {user?.name?.charAt(0) || 'ম'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {user?.name || 'মুহাম্মদপুরী সদস্য'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300 outline-none"
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b} className="dark:bg-brand-charcoal-dark">
                      {b}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> সার্বজনীন
                </span>
              </div>
            </div>
          </div>

          {/* Text input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="আপনার মনে কী চলছে? মুহাম্মদপুরের খবর, উন্নয়ন বা অভিজ্ঞতা শেয়ার করুন..."
            rows={4}
            className="w-full resize-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent outline-none border-0 focus:ring-0 leading-relaxed"
          />

          {/* Location input */}
          {showLocation && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2 rounded-xl">
              <MapPin className="w-4 h-4 text-brand-emerald shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="লোকেশন বা সড়ক উল্লেখ করুন (যেমন: তাজমহল রোড এলাকা)"
                className="w-full text-xs bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setShowLocation(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Media previews */}
          {selectedMedia.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {selectedMedia.map((m, idx) => (
                <div key={m.id || idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100">
                  <Image src={m.url} alt="Upload" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-xs text-brand-emerald">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ছবি/ভিডিও আপলোড হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              title="ছবি / ভিডিও"
            >
              <ImageIcon className="w-5 h-5 text-emerald-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaUpload}
            />

            <button
              type="button"
              onClick={() => setShowLocation(!showLocation)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              title="অবস্থান"
            >
              <MapPin className="w-5 h-5 text-red-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && selectedMedia.length === 0)}
            className="px-5 py-2.5 rounded-full bg-brand-emerald hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-glow active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>প্রকাশ হচ্ছে...</span>
              </>
            ) : (
              <span>পোস্ট করুন</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
