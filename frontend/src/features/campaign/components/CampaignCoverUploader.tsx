'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

interface CampaignCoverUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

interface UploadSignatureResponse {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
  resourceType: string;
}

/**
 * Fast client-side image downscaling & WebP compression.
 * Ensures large smartphone photos (e.g. 10MB) are resized to max 1600x900
 * in ~50ms, reducing bandwidth to <300KB and keeping the website lightning fast.
 */
async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.85
): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = document.createElement('img');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.webp',
              {
                type: 'image/webp',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function CampaignCoverUploader({
  value,
  onChange,
  disabled = false,
}: CampaignCoverUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    // 1. Validation
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/jpg',
    ];
    if (!allowedTypes.includes(originalFile.type)) {
      setError('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।');
      return;
    }

    if (originalFile.size > 15 * 1024 * 1024) {
      setError('ছবির মূল ফাইল সর্বোচ্চ ১৫ মেগাবাইট (15MB) হতে পারবে।');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      // 2. Client-side compression for blazing speed & small bundle
      const file = await compressImage(originalFile, 1600, 900, 0.85);
      setUploadProgress(35);

      // 3. Request signed upload credentials from backend
      const sigResponse = await apiClient<ApiResponse<UploadSignatureResponse>>(
        '/uploads/signature',
        {
          method: 'POST',
          body: JSON.stringify({
            folder: 'campaigns',
            resourceType: 'image',
            isRegistration: false,
          }),
        }
      );

      const signData = sigResponse.data;
      if (!signData) {
        throw new Error('ক্লাউডিনারি আপলোড অনুমোদন পাওয়া যায়নি');
      }

      setUploadProgress(60);

      // 4. Direct upload from browser to Cloudinary CDN
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => null);
        throw new Error(errJson?.error?.message || 'ক্লাউডিনারিতে আপলোড ব্যর্থ হয়েছে');
      }

      const uploadedAsset = await uploadRes.json();
      setUploadProgress(85);

      // 5. Confirm asset metadata in database
      await apiClient('/uploads/confirm', {
        method: 'POST',
        body: JSON.stringify({
          publicId: uploadedAsset.public_id,
          secureUrl: uploadedAsset.secure_url,
          resourceType: 'image',
          format: uploadedAsset.format || 'webp',
          bytes: uploadedAsset.bytes || file.size,
          width: uploadedAsset.width,
          height: uploadedAsset.height,
        }),
      });

      setUploadProgress(100);
      onChange(uploadedAsset.secure_url);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {/* When Image Exists: Show Cover Banner Preview */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/5 aspect-[16/8] sm:aspect-[16/7] w-full flex items-center justify-center">
          <Image
            src={value}
            alt="ক্যাম্পেইন কভার প্রিভিউ"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-102"
            unoptimized
          />

          {/* Floating Action Buttons (Top-Right) */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              title="ছবি পরিবর্তন করুন"
              aria-label="ছবি পরিবর্তন করুন"
              className="w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              title="ছবি মুছে ফেলুন"
              aria-label="ছবি মুছে ফেলুন"
              className="w-8 h-8 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-white/20 shadow-md hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loading State Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-brand-mint" />
              <span className="text-xs font-bold">আপলোড হচ্ছে... {uploadProgress}%</span>
              <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-emerald transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* When No Image: Show Drag & Drop / Upload Area */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="relative group cursor-pointer border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-brand-emerald dark:hover:border-brand-emerald rounded-2xl p-5 sm:p-6 text-center transition-all bg-slate-50/80 dark:bg-white/[0.02] hover:bg-emerald-50/40 dark:hover:bg-white/[0.04]"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                অপ্টিমাইজ ও আপলোড হচ্ছে... {uploadProgress}%
              </div>
              <div className="w-48 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-brand-emerald transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-brand-emerald/10 text-brand-emerald dark:text-brand-mint flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <UploadCloud className="w-5 h-5 stroke-[2]" />
              </div>

              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white block">
                  ক্যাম্পেইনের কভার ছবি আপলোড করুন
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium px-1 pt-1">
          {error}
        </p>
      )}
    </div>
  );
}

