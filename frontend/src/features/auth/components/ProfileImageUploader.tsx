'use client';

import * as React from 'react';
import { Camera, X, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import Image from 'next/image';

interface ProfileImageUploaderProps {
  onImageUploaded: (url: string | null, tempToken: string | null) => void;
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

export function ProfileImageUploader({
  onImageUploaded,
  disabled = false,
}: ProfileImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setError('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে পারবে।');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(15);

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      // 2. Request signed upload credentials from backend
      const tempToken = `reg_temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const sigResponse = await apiClient<ApiResponse<UploadSignatureResponse>>(
        '/uploads/signature',
        {
          method: 'POST',
          body: JSON.stringify({
            folder: 'profiles',
            resourceType: 'image',
            isRegistration: true,
            tempToken,
          }),
        },
      );

      const signData = sigResponse.data;
      if (!signData) {
        throw new Error('Upload signature generation failed');
      }

      setProgress(45);

      // 3. Direct upload to Cloudinary
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
        const errorData = await uploadRes.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'Cloudinary upload failed');
      }

      const uploadedAsset = await uploadRes.json();
      setProgress(85);

      // 4. Confirm upload with backend
      await apiClient('/uploads/confirm', {
        method: 'POST',
        body: JSON.stringify({
          publicId: uploadedAsset.public_id,
          secureUrl: uploadedAsset.secure_url,
          resourceType: 'image',
          format: uploadedAsset.format,
          bytes: uploadedAsset.bytes,
          width: uploadedAsset.width,
          height: uploadedAsset.height,
          tempToken,
        }),
      });

      setProgress(100);
      setSuccess(true);
      setPreviewUrl(uploadedAsset.secure_url);
      onImageUploaded(uploadedAsset.secure_url, tempToken);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      setError(message);
      setPreviewUrl(null);
      onImageUploaded(null, null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUploaded(null, null);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-1.5 py-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      {/* Compact, Consistent Avatar Frame */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer w-20 h-20 rounded-full border-2 transition-all duration-200 flex items-center justify-center overflow-hidden ${
          previewUrl
            ? 'border-brand-emerald shadow-sm ring-2 ring-brand-emerald/20'
            : 'border-dashed border-slate-300 dark:border-white/20 hover:border-brand-emerald dark:hover:border-brand-emerald bg-slate-50/80 dark:bg-brand-charcoal-dark/60 hover:bg-slate-100 dark:hover:bg-brand-charcoal'
        }`}
        title={previewUrl ? 'ছবি পরিবর্তন করুন' : 'প্রোফাইল ছবি যোগ করুন'}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Profile preview"
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
            {uploading ? (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
                <Loader2 className="w-5 h-5 animate-spin text-brand-mint" />
                <span className="text-[9px] mt-0.5 font-semibold">{progress}%</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white z-10">
                <Camera className="w-4 h-4 text-brand-mint" />
                <span className="text-[9px] font-semibold mt-0.5">পরিবর্তন</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-brand-emerald transition-colors">
            <Camera className="w-6 h-6 stroke-[1.75]" />
            <span className="text-[10px] font-medium mt-1">ছবি যোগ</span>
          </div>
        )}

        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow transition-colors z-20 cursor-pointer"
            title="ছবি মুছে ফেলুন"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        প্রোফাইল ছবি <span className="text-[11px] text-slate-400 dark:text-slate-500">(ঐচ্ছিক)</span>
      </p>

      {success && !uploading && (
        <div className="flex items-center gap-1 text-[11px] text-brand-emerald dark:text-brand-mint font-medium animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ছবি সফলভাবে যুক্ত হয়েছে</span>
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>}
    </div>
  );
}
