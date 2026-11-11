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
  UploadCloud,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { toast } from '@/components/feedback/Toast';
import { feedService } from '../services/feed.service';
import { Post } from '../types';
import { BG_PRESETS, getBgPreset, BgCategory } from '../utils/bgPresets';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onPostCreated: (post: Post) => void;
  initialAddPhoto?: boolean;
}

export function CreatePostModal({
  isOpen,
  onClose,
  user,
  onPostCreated,
  initialAddPhoto = false,
}: CreatePostModalProps) {
  const [content, setContent] = React.useState('');
  const [selectedBg, setSelectedBg] = React.useState<string | null>(null);
  const [bgFilter, setBgFilter] = React.useState<BgCategory>('all');
  const [location, setLocation] = React.useState('');
  const [showLocation, setShowLocation] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [statusText, setStatusText] = React.useState('প্রকাশ হচ্ছে...');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen || !initialAddPhoto) return;
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, initialAddPhoto]);

  // Clean up object URLs when modal unmounts or closes
  React.useEffect(() => {
    if (!isOpen) {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviewUrls([]);
      setSelectedFiles([]);
      setContent('');
      setSelectedBg(null);
      setBgFilter('all');
      setLocation('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const filteredPresets = React.useMemo(() => {
    if (bgFilter === 'all') return BG_PRESETS;
    return BG_PRESETS.filter((p) => p.category === bgFilter);
  }, [bgFilter]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      toast.warning('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল বাছাই করুন');
      return;
    }

    // When images are added, clear any selected background preset
    setSelectedBg(null);

    const newUrls = validImageFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...validImageFiles]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;

    setSubmitting(true);
    try {
      const mediaIds: string[] = [];

      // 1. Upload files to Cloudinary if user attached any
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          if (!file) continue;
          setStatusText(`ছবি আপলোড হচ্ছে (${i + 1}/${selectedFiles.length})...`);
          // Get upload signature
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

          // Upload to Cloudinary
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
          if (!res.ok || asset.error || !asset.secure_url) {
            throw new Error(asset.error?.message || 'ছবি আপলোড সম্পন্ন হয়নি');
          }

          // Confirm asset in DB
          const confirmRes = await apiClient<ApiResponse<{ id: string }>>('/uploads/confirm', {
            method: 'POST',
            body: JSON.stringify({
              publicId: asset.public_id,
              secureUrl: asset.secure_url,
              resourceType: 'image',
              format: asset.format || 'jpg',
              bytes: asset.bytes || file.size || 100,
              width: asset.width || 800,
              height: asset.height || 600,
            }),
          });

          if (!confirmRes.data?.id) {
            throw new Error('মিডিয়া নিবন্ধন ব্যর্থ হয়েছে');
          }

          mediaIds.push(confirmRes.data.id);
        }
      }

      // 2. Publish post via feedService
      setStatusText('পোস্ট প্রকাশ হচ্ছে...');
      const created = await feedService.createPost({
        content: content.trim(),
        blockBadge: 'মোহাম্মদপুর',
        location: location || undefined,
        bgColor: selectedFiles.length === 0 && selectedBg ? selectedBg : undefined,
        mediaIds,
      });

      toast.success('পোস্ট সফলভাবে প্রকাশিত হয়েছে!');
      onPostCreated(created);

      // Clean up & Close
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviewUrls([]);
      setSelectedFiles([]);
      setContent('');
      setSelectedBg(null);
      setLocation('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'পোস্ট প্রকাশ করা সম্ভব হয়নি';
      toast.error(message);
    } finally {
      setSubmitting(false);
      setStatusText('প্রকাশ হচ্ছে...');
    }
  };

  const activePreset = getBgPreset(selectedBg);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-brand-charcoal-dark w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            নতুন পোস্ট তৈরি করুন
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {/* User info & Public badge */}
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
                {user?.name || 'মোহাম্মদপুরী সদস্য'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  <Globe className="w-3 h-3 text-slate-400" /> সার্বজনীন
                </span>
              </div>
            </div>
          </div>

          {/* Text input: Standard OR Facebook-Style Natural & Patterned Card */}
          {selectedBg && previewUrls.length === 0 ? (
            <div
              style={activePreset?.style}
              className="w-full min-h-[200px] sm:min-h-[240px] rounded-2xl p-6 sm:p-8 flex items-center justify-center transition-all duration-300 shadow-inner relative overflow-hidden"
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="আপনার মনে কী চলছে?"
                rows={4}
                style={{
                  color: activePreset?.style.color,
                  textShadow: activePreset?.style.textShadow,
                }}
                className={`w-full resize-none text-lg sm:text-2xl font-bold text-center bg-transparent outline-none border-0 focus:ring-0 leading-relaxed ${
                  activePreset?.textClass || 'text-white'
                }`}
                autoFocus
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="আপনার মনে কী চলছে? মোহাম্মদপুরের খবর, উন্নয়ন বা অভিজ্ঞতা শেয়ার করুন..."
              rows={previewUrls.length > 0 ? 3 : 4}
              className="w-full resize-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent outline-none border-0 focus:ring-0 leading-relaxed"
            />
          )}

          {/* Natural & Pattern Background Presets Selector (only when no photos attached) */}
          {previewUrls.length === 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto no-scrollbar">
                <span className="text-slate-400 font-semibold shrink-0 mr-0.5">থিম:</span>
                <button
                  type="button"
                  onClick={() => setBgFilter('all')}
                  className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
                    bgFilter === 'all'
                      ? 'bg-brand-emerald text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  সকল ({BG_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBgFilter('natural')}
                  className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    bgFilter === 'natural'
                      ? 'bg-brand-emerald text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  🌿 প্রকৃতি (Natural)
                </button>
                <button
                  type="button"
                  onClick={() => setBgFilter('pattern')}
                  className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    bgFilter === 'pattern'
                      ? 'bg-brand-emerald text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  ✨ প্যাটার্ন
                </button>
                <button
                  type="button"
                  onClick={() => setBgFilter('gradient')}
                  className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    bgFilter === 'gradient'
                      ? 'bg-brand-emerald text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  🎨 গ্রেডিয়েন্ট
                </button>
              </div>

              {/* Swatches Horizontal Carousel */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Reset / Standard button */}
                <button
                  type="button"
                  onClick={() => setSelectedBg(null)}
                  className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 border shrink-0 transition-all ${
                    selectedBg === null
                      ? 'bg-slate-200 dark:bg-white/20 border-slate-400 text-slate-900 dark:text-white ring-2 ring-brand-emerald'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                  title="স্বাভাবিক টেক্সট (কোন ব্যাকগ্রাউন্ড নেই)"
                >
                  <span className="font-bold text-xs">Aa</span>
                  {selectedBg && <span className="text-[10px] ml-0.5">রিমুভ</span>}
                </button>

                {/* Theme Swatches */}
                {filteredPresets.map((preset) => {
                  const isSelected = selectedBg === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedBg(preset.id)}
                      style={{
                        background: preset.previewBg,
                      }}
                      className={`w-8 h-8 rounded-xl shrink-0 transition-all transform hover:scale-115 cursor-pointer shadow-sm relative overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-brand-emerald scale-110 shadow-md border-2 border-white'
                          : 'opacity-90 hover:opacity-100 border border-slate-300 dark:border-white/20'
                      }`}
                      title={preset.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Instant Photo Previews with Add More button */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {previewUrls.map((url, idx) => (
                <div
                  key={url}
                  className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group shadow-xs"
                >
                  <Image
                    src={url}
                    alt={`Selected photo ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    disabled={submitting}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer z-10 shadow-sm"
                    title="ছবি মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add more photos button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-brand-emerald dark:hover:border-brand-emerald flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-emerald dark:hover:text-brand-emerald bg-slate-50/50 dark:bg-white/[0.02] transition-colors cursor-pointer group"
                title="আরও ছবি যোগ করুন"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-brand-emerald/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-brand-emerald transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold">আরও ছবি যোগ করুন</span>
              </button>
            </div>
          )}

          {/* Big Photo Dropzone if no photo is chosen yet and no background active */}
          {previewUrls.length === 0 && !selectedBg && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-emerald dark:hover:border-brand-emerald/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 group select-none"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-brand-emerald flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ছবি বা ভিডিও যোগ করুন
                </p>
                <p className="text-[11px] text-slate-400">
                  ক্লিক করে আপনার ফোন বা কম্পিউটার থেকে ছবি বাছাই করুন
                </p>
              </div>
            </div>
          )}

          {submitting && (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs text-brand-emerald border border-brand-emerald/20 font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{statusText}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="ছবি যোগ করুন"
            >
              <ImageIcon className="w-5 h-5 text-emerald-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => setShowLocation(!showLocation)}
              disabled={submitting}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="অবস্থান"
            >
              <MapPin className="w-5 h-5 text-red-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!content.trim() && selectedFiles.length === 0)}
            className="px-5 py-2.5 rounded-full bg-brand-emerald hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-glow active:scale-95 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusText}</span>
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
