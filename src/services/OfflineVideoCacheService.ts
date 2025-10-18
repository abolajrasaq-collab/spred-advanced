// Offline Video Caching Service - Phase 3 Optimization
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';

interface CachedVideo {
  id: string;
  filePath: string;
  originalUrl: string;
  title: string;
  thumbnailUrl: string;
  fileSize: number;
  createdAt: number;
  lastAccessedAt: number;
  downloadProgress?: number;
  status: 'downloading' | 'completed' | 'failed';
}

interface CacheAnalytics {
  totalSize: number;
  fileCount: number;
  maxCacheSize: number;
  autoDownloadEnabled: boolean;
  preferredDownloadNetwork: 'wifi' | 'cellular' | 'any';
}

class OfflineVideoCacheService {
  private static instance: OfflineVideoCacheService;
  private cacheConfig: CacheAnalytics;
  private cacheBasePath: string;
  private cacheAnalyticsKey = '@offline_cache_analytics';
  private cacheIndexKey = '@offline_cache_index';

  constructor() {
    this.cacheBasePath = `${RNFS.DocumentDirectoryPath}/SpredOfflineCache`;
    this.cacheConfig = {
      totalSize: 0,
      fileCount: 0,
      maxCacheSize: 2 * 1024 * 1024 * 1024, // 2GB default
      autoDownloadEnabled: true,
      preferredDownloadNetwork: 'wifi',
    };
    this.initializeCache();
  }

  static getInstance(): OfflineVideoCacheService {
    if (!OfflineVideoCacheService.instance) {
      OfflineVideoCacheService.instance = new OfflineVideoCacheService();
    }
    return OfflineVideoCacheService.instance;
  }

  // Initialize cache directory and load analytics
  private async initializeCache(): Promise<void> {
    try {
      // Create cache directory if it doesn't exist
      const exists = await RNFS.exists(this.cacheBasePath);
      if (!exists) {
        await RNFS.mkdir(this.cacheBasePath);
      }

      // Load saved cache configuration
      const savedAnalytics = await AsyncStorage.getItem(this.cacheAnalyticsKey);
      if (savedAnalytics) {
        this.cacheConfig = {
          ...this.cacheConfig,
          ...JSON.parse(savedAnalytics),
        };
      }

      // Clean up any orphaned files
      await this.cleanupOrphanedFiles();
      logger.info('🎬 Offline cache initialized:', this.cacheBasePath);
    } catch (error) {
      logger.warn('Failed to initialize offline cache:', error);
    }
  }

  // Download video for offline viewing
  async downloadVideo(
    videoId: string,
    videoUrl: string,
    title: string,
    thumbnailUrl?: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    try {
      // Check if video is already cached
      const cachedVideo = await this.getCachedVideo(videoId);
      if (cachedVideo && cachedVideo.status === 'completed') {
        await this.updateLastAccessed(videoId);
        return cachedVideo.filePath;
      }

      // Check network conditions
      const networkState = await NetInfo.fetch();
      const isWifi = networkState.type === 'wifi' || networkState.isConnected;

      if (this.cacheConfig.preferredDownloadNetwork === 'wifi' && !isWifi) {
        throw new Error('Download requires WiFi connection');
      }

      // Check if we have enough space for this video
      const estimatedFileSize = await this.estimateVideoFileSize(videoUrl);
      await this.ensureCacheSpaceForNewFile(estimatedFileSize);

      const fileName = `${videoId}_${Date.now()}.mp4`;
      const filePath = `${this.cacheBasePath}/${fileName}`;

      // Create cache entry
      const cacheEntry: CachedVideo = {
        id: videoId,
        filePath,
        originalUrl: videoUrl,
        title: title || 'Unknown Video',
        thumbnailUrl,
        fileSize: 0,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        status: 'downloading',
      };

      await this.saveCacheEntry(cacheEntry);

      // Start download with progress tracking
      const downloadOptions = {
        fromUrl: videoUrl,
        toFile: filePath,
        begin: (res: any) => {
          logger.info('Download started:', videoId);
        },
        progress: (res: any) => {
          const progress = Math.round(
            (res.bytesWritten / res.contentLength) * 100,
          );
          onProgress?.(progress);

          // Update progress in cache entry
          this.updateDownloadProgress(videoId, progress).catch(logger.warn);
        },
      };

      const result = await RNFS.downloadFile(downloadOptions).promise;

      if (result.statusCode === 200) {
        // Get actual file size
        const fileSize = await this.getFileSize(filePath);

        // Update cache entry as completed
        await this.updateCacheEntry(videoId, {
          status: 'completed',
          fileSize,
        });

        // Update analytics
        this.cacheConfig.totalSize += fileSize;
        this.cacheConfig.fileCount++;
        await this.saveCacheAnalytics();

        logger.info('✅ Video cached successfully:', videoId, filePath);
        return filePath;
      } else {
        await this.removeCacheEntry(videoId);
        throw new Error(
          `Download failed with status code: ${result.statusCode}`,
        );
      }
    } catch (error) {
      await this.updateCacheEntry(videoId, { status: 'failed' }).catch(
        logger.warn,
      );
      throw error;
    }
  }

  // Check if video is cached and return local path
  async getOfflineVideoPath(videoId: string): Promise<string | null> {
    try {
      const cachedVideo = await this.getCachedVideo(videoId);
      if (cachedVideo?.status === 'completed') {
        // Update last accessed time
        await this.updateLastAccessed(videoId);
        return cachedVideo.filePath;
      }
      return null;
    } catch (error) {
      logger.warn('Failed to get offline video path:', error);
      return null;
    }
  }

  // Get all cached videos
  async getCachedVideos(): Promise<CachedVideo[]> {
    try {
      const cacheIndex = await AsyncStorage.getItem(this.cacheIndexKey);
      if (!cacheIndex) {
        return [];
      }

      const videos: CachedVideo[] = JSON.parse(cacheIndex);

      // Verify files still exist and sort by last accessed
      const validVideos = [];
      for (const video of videos) {
        const exists = await RNFS.exists(video.filePath);
        if (exists) {
          validVideos.push(video);
        } else {
          // Remove orphaned cache entry
          this.cacheConfig.totalSize -= video.fileSize || 0;
          this.cacheConfig.fileCount--;
        }
      }

      // Update analytics if we removed orphaned entries
      if (validVideos.length !== videos.length) {
        await this.saveCacheIndex(validVideos);
        await this.saveCacheAnalytics();
      }

      return validVideos.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
    } catch (error) {
      logger.warn('Failed to get cached videos:', error);
      return [];
    }
  }

  // Remove video from cache
  async removeFromCache(videoId: string): Promise<void> {
    try {
      const cachedVideo = await this.getCachedVideo(videoId);
      if (!cachedVideo) {
        return;
      }

      // Delete file
      if (await RNFS.exists(cachedVideo.filePath)) {
        await RNFS.unlink(cachedVideo.filePath);
      }

      // Update analytics
      this.cacheConfig.totalSize -= cachedVideo.fileSize || 0;
      this.cacheConfig.fileCount--;

      // Remove from cache index
      await this.removeCacheEntry(videoId);
      await this.saveCacheAnalytics();

      logger.info('🗑️ Removed from cache:', videoId);
    } catch (error) {
      logger.warn('Failed to remove from cache:', error);
    }
  }

  // Clean up old videos when cache is full (LRU eviction)
  private async ensureCacheSpaceForNewFile(
    requiredSize: number,
  ): Promise<void> {
    const currentUsage = this.cacheConfig.totalSize;
    const maxSize = this.cacheConfig.maxCacheSize;

    if (currentUsage + requiredSize <= maxSize) {
      return; // Enough space
    }

    // Get all cached videos sorted by last accessed (oldest first for LRU)
    const cachedVideos = await this.getCachedVideos();
    const videosToRemove = cachedVideos.sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt,
    );

    let spaceToFree = currentUsage + requiredSize - maxSize;
    let removedIndex = 0;

    while (spaceToFree > 0 && removedIndex < videosToRemove.length) {
      const videoToRemove = videosToRemove[removedIndex];
      await this.removeFromCache(videoToRemove.id);
      spaceToFree -= videoToRemove.fileSize || 0;
      removedIndex++;

      logger.info(
        '♻️ Evicted old video from cache for new download:',
        videoToRemove.id,
      );
    }

    // If we still don't have enough space, throw error
    if (spaceToFree > 0) {
      throw new Error('Not enough space in cache even after cleanup');
    }
  }

  // Auto-download favorite videos in background (smart preloading)
  async autoDownloadVideos(
    videoList: Array<{ id: string; url: string; title: string }>,
  ): Promise<void> {
    if (!this.cacheConfig.autoDownloadEnabled) {
      return;
    }

    try {
      // Limit concurrent downloads to prevent overwhelming network
      const maxConcurrentDownloads = 2;
      const downloadPromises: Promise<void>[] = [];

      for (
        let i = 0;
        i < Math.min(videoList.length, maxConcurrentDownloads);
        i++
      ) {
        const video = videoList[i];

        // Skip if already cached
        const existingPath = await this.getOfflineVideoPath(video.id);
        if (existingPath) {
          continue;
        }

        const downloadPromise = this.downloadVideo(
          video.id,
          video.url,
          video.title,
          undefined,
          progress => {
            logger.info(`📥 Auto-downloading ${video.title}: ${progress}%`);
          },
        ).catch(error => {
          logger.warn(`Auto-download failed for ${video.title}:`, error);
        });

        downloadPromises.push(downloadPromise);
      }

      await Promise.allSettled(downloadPromises);
    } catch (error) {
      logger.warn('Auto-download failed:', error);
    }
  }

  // Get cache analytics
  getCacheAnalytics(): CacheAnalytics {
    return { ...this.cacheConfig };
  }

  // Update cache configuration
  async updateCacheConfig(config: Partial<CacheAnalytics>): Promise<void> {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    await this.saveCacheAnalytics();

    // If max cache size reduced, clean up if needed
    if (config.maxCacheSize) {
      await this.enforceCacheSize();
    }
  }

  // Enforce cache size limits
  private async enforceCacheSize(): Promise<void> {
    const cachedVideos = await this.getCachedVideos();
    const videosToRemove: CachedVideo[] = [];

    let currentSize = 0;

    // Sort by last accessed (LRU), keep most recently accessed videos
    cachedVideos.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

    for (const video of cachedVideos) {
      if (currentSize + video.fileSize <= this.cacheConfig.maxCacheSize) {
        currentSize += video.fileSize;
      } else {
        videosToRemove.push(video);
      }
    }

    // Remove old videos to stay within limits
    for (const video of videosToRemove) {
      await this.removeFromCache(video.id);
      logger.info('♻️ Cleaned up cache, removed old video:', video.id);
    }
  }

  // Clear entire cache
  async clearCache(): Promise<void> {
    try {
      const cachedVideos = await this.getCachedVideos();

      for (const video of cachedVideos) {
        if (await RNFS.exists(video.filePath)) {
          await RNFS.unlink(video.filePath);
        }
      }

      this.cacheConfig.totalSize = 0;
      this.cacheConfig.fileCount = 0;

      await AsyncStorage.removeItem(this.cacheIndexKey);
      await this.saveCacheAnalytics();

      logger.info('🧹 Cache cleared completely');
    } catch (error) {
      logger.warn('Failed to clear cache:', error);
    }
  }

  // Private helper methods
  private async getCachedVideo(videoId: string): Promise<CachedVideo | null> {
    const cacheIndex = await AsyncStorage.getItem(this.cacheIndexKey);
    if (!cacheIndex) {
      return null;
    }

    const videos: CachedVideo[] = JSON.parse(cacheIndex);
    return videos.find(v => v.id === videoId) || null;
  }

  private async saveCacheEntry(video: CachedVideo): Promise<void> {
    const cacheIndex = (await AsyncStorage.getItem(this.cacheIndexKey)) || '[]';
    const videos: CachedVideo[] = JSON.parse(cacheIndex);

    const existingIndex = videos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
      videos[existingIndex] = video;
    } else {
      videos.push(video);
    }

    await AsyncStorage.setItem(this.cacheIndexKey, JSON.stringify(videos));
  }

  private async updateCacheEntry(
    videoId: string,
    updates: Partial<CachedVideo>,
  ): Promise<void> {
    const video = await this.getCachedVideo(videoId);
    if (!video) {
      return;
    }

    Object.assign(video, updates);
    await this.saveCacheEntry(video);
  }

  private async removeCacheEntry(videoId: string): Promise<void> {
    const cacheIndex = await AsyncStorage.getItem(this.cacheIndexKey);
    if (!cacheIndex) {
      return;
    }

    const videos: CachedVideo[] = JSON.parse(cacheIndex);
    const filteredVideos = videos.filter(v => v.id !== videoId);

    await AsyncStorage.setItem(
      this.cacheIndexKey,
      JSON.stringify(filteredVideos),
    );
  }

  private async saveCacheIndex(videos: CachedVideo[]): Promise<void> {
    await AsyncStorage.setItem(this.cacheIndexKey, JSON.stringify(videos));
  }

  private async saveCacheAnalytics(): Promise<void> {
    await AsyncStorage.setItem(
      this.cacheAnalyticsKey,
      JSON.stringify(this.cacheConfig),
    );
  }

  private async updateLastAccessed(videoId: string): Promise<void> {
    await this.updateCacheEntry(videoId, { lastAccessedAt: Date.now() });
  }

  private async updateDownloadProgress(
    videoId: string,
    progress: number,
  ): Promise<void> {
    await this.updateCacheEntry(videoId, { downloadProgress: progress });
  }

  private async estimateVideoFileSize(videoUrl: string): Promise<number> {
    // In a real implementation, you might make a HEAD request to get Content-Length
    // For now, return a conservative estimate
    return 50 * 1024 * 1024; // 50MB estimate
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await RNFS.stat(filePath);
      return stat.size;
    } catch (error) {
      return 0;
    }
  }

  private async cleanupOrphanedFiles(): Promise<void> {
    try {
      const files = await RNFS.readDir(this.cacheBasePath);
      const cacheIndex =
        (await AsyncStorage.getItem(this.cacheIndexKey)) || '[]';
      const cachedVideos: CachedVideo[] = JSON.parse(cacheIndex);

      const cachedFileNames = new Set(
        cachedVideos.map(v => v.filePath.split('/').pop()),
      );

      for (const file of files) {
        if (!cachedFileNames.has(file.name)) {
          // Orphaned file - remove it
          await RNFS.unlink(file.path);
          logger.info('🧹 Cleaned up orphaned cache file:', file.name);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup orphaned files:', error);
    }
  }
}

export default OfflineVideoCacheService;
export type { CachedVideo, CacheAnalytics };
