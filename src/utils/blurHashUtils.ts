// BlurHash utility functions for image optimization
// These functions help generate placeholder hashes for images

// Common BlurHash templates for different image types
export const BLUR_HASH_TEMPLATES = {
  // Generic content images (movies, videos)
  content: 'L6Pj0^jE.AyE_3t7t7R*XKNa|kW',
  // Portrait/profile images
  portrait: 'L8OXHA0B00_3%M%M.8%Mxv%MxufQx',
  // Landscape/scenic images
  landscape: 'L9By.0_3%M%M.8%Mxv%MxufQx_3',
  // High-contrast/action images
  action: 'L5P$QJ00_3%M%MxufQx_3%M skewed',
  // Low-contrast/subtle images
  subtle: 'L6NzK400_3%M%M.8%MxufQx_3%M',
} as const;

// Generate a consistently random BlurHash based on image URL
export const generateBlurHashFromUrl = (
  url: string,
  type: keyof typeof BLUR_HASH_TEMPLATES = 'content',
): string => {
  if (!url) {
    return BLUR_HASH_TEMPLATES.content;
  }

  // Use the URL hash to create a deterministic selection
  // This ensures the same image always gets the same BlurHash variant
  const hash = url.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const allHashes = Object.values(BLUR_HASH_TEMPLATES);
  const index = hash % allHashes.length;

  return allHashes[index];
};

// Pre-optimized BlurHash sets for common image categories
export const CATEGORY_BLUR_HASHES = {
  action: [
    'L6Pj0^jE.AyE_3t7t7R*XKNa|kW',
    'L8OXHA0B00_3%M%M.8%Mxv%MxufQx',
    'L5P$QJ00_3%M%MxufQx_3%M skewed',
  ],
  drama: [
    'L6NzK400_3%M%M.8%MxufQx_3%M',
    'L9By.0_3%M%M.8%Mxv%MxufQx_3',
    'L7A?Zb9F~qof~qj[fQj[fQfQfQfQ',
  ],
  comedy: [
    'L6Mj3_~q%MxufQx_3%M~q%Mxu',
    'L8A@H0~q%MxufQx_3%M~q%Mxu',
    'L7B?Xb9F~qof~qj[fQj[fQfQfQ',
  ],
  generic: BLUR_HASH_TEMPLATES.content,
} as const;

// Get a BlurHash based on video category (useful for content cards)
export const getCategoryBlurHash = (category?: string): string => {
  const normalizedCategory = category?.toLowerCase();

  if (normalizedCategory === 'action') {
    return CATEGORY_BLUR_HASHES.action[0];
  }
  if (normalizedCategory === 'drama') {
    return CATEGORY_BLUR_HASHES.drama[0];
  }
  if (normalizedCategory === 'comedy') {
    return CATEGORY_BLUR_HASHES.comedy[0];
  }

  return CATEGORY_BLUR_HASHES.generic;
};

// Utility to determine if an optimized image should be lazy loaded
export const shouldLazyLoad = (
  containerHeight?: number,
  priority?: 'low' | 'normal' | 'high',
): boolean => {
  // Always load high priority images
  if (priority === 'high') {
    return false;
  }

  // If container height is small, don't lazy load
  if (containerHeight && containerHeight < 100) {
    return false;
  }

  return true;
};

// Optimize image URL for faster loading
export const optimizeImageUrl = (
  url: string,
  width?: number,
  quality: number = 80,
): string => {
  if (!url || !width) {
    return url;
  }

  try {
    // If it's a real CDN URL, add optimization parameters
    if (
      url.includes('cdn.') ||
      url.includes('img.') ||
      url.includes('media.')
    ) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      return urlObj.toString();
    }
  } catch {
    // Invalid URL, return as-is
  }

  return url;
};
