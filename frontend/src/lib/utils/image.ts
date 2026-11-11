/**
 * Utility to ensure images loaded from external providers (Google, Cloudinary, Unsplash)
 * are always served in high-definition crystal-clear quality instead of low-res blurry thumbnails.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: {
    width?: number;
    quality?: 'best' | 'good' | 'auto';
  } = {},
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const { width = 800, quality = 'best' } = options;

  // 1. Google User Avatars: Upgrade default low-res =s96-c thumbnail to full HD (=s800-c)
  if (trimmed.includes('googleusercontent.com')) {
    if (/=s\d+(-c)?/i.test(trimmed)) {
      return trimmed.replace(/=s\d+(-c)?/gi, `=s${width}-c`);
    }
    return `${trimmed}=s${width}-c`;
  }

  // 2. Cloudinary: Deliver with auto-format (WebP/AVIF), crisp quality, and proper sizing
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/image/upload/')) {
    // If transformation is already present, do not duplicate
    if (trimmed.includes('/q_') || trimmed.includes('/f_auto') || trimmed.includes('/w_')) {
      return trimmed;
    }
    const transform = `f_auto,q_auto:${quality},w_${width},c_limit`;
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

