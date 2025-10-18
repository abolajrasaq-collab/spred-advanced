export interface VideoQuality {
  id: string;
  label: string;
  resolution: string;
  bitrate: number;
  sizeMultiplier: number;
  recommendedForLowEnd: boolean;
  recommendedForSavingData: boolean;
}

export interface VideoSource {
  url: string;
  quality: VideoQuality;
  size?: number;
}

export interface VideoWithQualities {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  qualities: VideoSource[];
  defaultQualityId: string;
}

export const VIDEO_QUALITIES: VideoQuality[] = [
  {
    id: '360p',
    label: '360p (Good)',
    resolution: '640x360',
    bitrate: 500000, // 500 kbps
    sizeMultiplier: 0.3,
    recommendedForLowEnd: true,
    recommendedForSavingData: true,
  },
  {
    id: '480p',
    label: '480p (Better)',
    resolution: '854x480',
    bitrate: 1000000, // 1 Mbps
    sizeMultiplier: 0.5,
    recommendedForLowEnd: true,
    recommendedForSavingData: false,
  },
  {
    id: '720p',
    label: '720p (HD)',
    resolution: '1280x720',
    bitrate: 2500000, // 2.5 Mbps
    sizeMultiplier: 1,
    recommendedForLowEnd: false,
    recommendedForSavingData: false,
  },
  {
    id: '1080p',
    label: '1080p (Full HD)',
    resolution: '1920x1080',
    bitrate: 5000000, // 5 Mbps
    sizeMultiplier: 2,
    recommendedForLowEnd: false,
    recommendedForSavingData: false,
  },
];

export const DEFAULT_QUALITY = '480p';

export function getQualityById(id: string): VideoQuality | undefined {
  return VIDEO_QUALITIES.find(q => q.id === id);
}

export function getRecommendedQualityForDevice(): VideoQuality {
  // For now, return 480p as default for African market
  // In real implementation, this would check device capabilities
  return getQualityById('480p') || VIDEO_QUALITIES[1];
}

export function estimateFileSize(baseSize: number, qualityId: string): number {
  const quality = getQualityById(qualityId);
  if (!quality) {
    return baseSize;
  }

  return Math.floor(baseSize * quality.sizeMultiplier);
}
