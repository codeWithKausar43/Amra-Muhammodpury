/**
 * Utility to ensure images loaded from external providers (Google, Cloudinary, Unsplash)
 * are always served in high-definition crystal-clear quality instead of low-res blurry thumbnails.
 *
 * For post/feed images: pass quality: 'best' (default) and a suitable width.
 * c_limit only scales DOWN if the original is larger — it never upscales, never crops.
 * q_auto:best = Cloudinary's highest quality auto setting (lossless-ish).
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: {
    width?: number;
  } = {},
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const { width = 1920 } = options;

  // 1. Google User Avatars: Upgrade default low-res =s96-c thumbnail to full HD
  if (trimmed.includes('googleusercontent.com')) {
    if (/=s\d+(-c)?/i.test(trimmed)) {
      return trimmed.replace(/=s\d+(-c)?/gi, `=s${width}-c`);
    }
    return `${trimmed}=s${width}-c`;
  }

  // 2. Cloudinary: Deliver with auto-format (WebP/AVIF), best quality, device-aware sizing.
  //    c_limit ensures we never upscale (original quality preserved).
  //    fl_lossy is NOT applied so quality stays maximum.
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    // If transformation is already present, do not duplicate
    if (trimmed.includes('/q_') || trimmed.includes('/f_auto') || trimmed.includes('/w_')) {
      return trimmed;
    }
    // Use q_auto:best and c_limit to preserve original quality as much as possible
    const transform = `f_auto,q_auto:best,w_${width},c_limit`;
    return trimmed.replace('/image/upload/', `/image/upload/${transform}/`);
  }

  // 3. Unsplash: Ensure high quality query parameters
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set('w', Math.max(width, 800).toString());
      u.searchParams.set('q', '90');
      u.searchParams.set('auto', 'format');
      return u.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

