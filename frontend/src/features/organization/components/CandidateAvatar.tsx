'use client';

import * as React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

export function cleanImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes('googleusercontent.com')) {
      return trimmed.replace(/=s\d+(-c)?/gi, '=s800-c');
    }
    if (trimmed.includes('google.') && trimmed.includes('/imgres')) {
      const parsed = new URL(trimmed);
      const directImg = parsed.searchParams.get('imgurl');
      if (directImg) {
        return decodeURIComponent(directImg);
      }
    }
    if (trimmed.includes('unsplash.com')) {
      const parsed = new URL(trimmed);
      if (parsed.searchParams.get('fit') === 'crop' && !parsed.searchParams.has('crop')) {
        parsed.searchParams.set('crop', 'faces');
        return parsed.toString();
      }
    }
  } catch {
    // Return original if parsing fails
  }

  return trimmed;
}

export function fileToDataUrl(file: File, maxDim = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve('');
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface CandidateAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
}

export function CandidateAvatar({
  src,
  name = 'প্রার্থী',
  className = 'w-10 h-10 rounded-xl',
  textClassName = 'text-sm font-bold text-amber-600 dark:text-amber-400',
  imgClassName = '',
}: CandidateAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const cleanedUrl = React.useMemo(() => cleanImageUrl(src), [src]);

  // Reset error state if src changes
  React.useEffect(() => {
    setHasError(false);
  }, [cleanedUrl]);

  if (!cleanedUrl || hasError) {
    return (
      <div
        className={`${className} overflow-hidden bg-gradient-to-br from-amber-100/70 to-slate-200 dark:from-white/10 dark:to-white/5 border border-slate-200/80 dark:border-white/10 shrink-0 flex items-center justify-center select-none`}
      >
        <User className={`w-1/2 h-1/2 ${textClassName || 'text-slate-500 dark:text-slate-400'}`} />
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0 relative select-none`}>
      <Image
        src={cleanedUrl}
        alt={name}
        fill
        unoptimized
        className={`object-cover object-top ${imgClassName || ''}`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}

