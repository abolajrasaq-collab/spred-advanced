import { MMKV } from 'react-native-mmkv';

/**
 * Fast Storage Service using MMKV
 * Provides high-performance caching for video metadata, URLs, and user data
 */
class FastStorage {
  private static instance: FastStorage;
  
  // Separate MMKV instances for different data types for better performance
  private videoCache = new MMKV({ id: 'video-cache' });
  private userCache = new MMKV({ id: 'user-cache' });
  private contentCache = new MMKV({ id: 'content-cache' });
  private settingsCache = new MMKV({ id: 'settings-cache' });

  // Cache durations in milliseconds
  private readonly CACHE_DURATIONS = {
    VIDEO_URL: 2 * 60 * 60 * 1000, // 2 hours
    VIDEO_METADATA: 24 * 60 * 60 * 1000, // 24 hours
    CONTENT_LIST: 30 * 60 * 1000, // 30 minutes
    USER_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
    SETTINGS: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  public static getInstance(): FastStorage {
    if (!FastStorage.instance) {
      FastStorage.instance = new FastStorage();
    }
    return FastStorage.instance;
  }

  /**
   * Generic cache methods
   */
  private createCacheData<T>(data: T, duration: number) {
    return {
      data,
      timestamp: Date.now(),
      expires: Date.now() + duration,
    };
  }

  private getCachedData<T>(storage: MMKV, key: string): T | null {
    try {
      const cached = storage.getString(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheData.expires) {
        storage.delete(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      // If parsing fails, delete the corrupted cache
      storage.delete(key);
      return null;
    }
  }

  private setCachedData<T>(storage: MMKV, key: string, data: T, duration: number): void {
    try {
      const cacheData = this.createCacheData(data, duration);
      storage.set(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Video URL Caching
   */
  cacheVideoUrl(videoKey: string, url: string): void {
    this.setCachedData(this.videoCache, `url_${videoKey}`, url, this.CACHE_DURATIONS.VIDEO_URL);
  }

  getVideoUrl(videoKey: string): string | null {
    return this.getCachedData<string>(this.videoCache, `url_${videoKey}`);
  }

  /**
   * Video Metadata Caching
   */
  cacheVideoMetadata(videoKey: string, metadata: any): void {
    this.setCachedData(this.videoCache, `meta_${videoKey}`, metadata, this.CACHE_DURATIONS.VIDEO_METADATA);
  }

  getVideoMetadata(videoKey: string): any | null {
    return this.getCachedData<any>(this.videoCache, `meta_${videoKey}`);
  }

  /**
   * Content List Caching
   */
  cacheContentList(listKey: string, data: any[]): void {
    this.setCachedData(this.contentCache, listKey, data, this.CACHE_DURATIONS.CONTENT_LIST);
  }

  getContentList(listKey: string): any[] | null {
    return this.getCachedData<any[]>(this.contentCache, listKey);
  }

  /**
   * User Data Caching
   */
  cacheUserData(key: string, data: any): void {
    this.setCachedData(this.userCache, key, data, this.CACHE_DURATIONS.USER_DATA);
  }

  getUserData<T>(key: string): T | null {
    return this.getCachedData<T>(this.userCache, key);
  }

  /**
   * Settings Caching
   */
  cacheSetting(key: string, value: any): void {
    this.setCachedData(this.settingsCache, key, value, this.CACHE_DURATIONS.SETTINGS);
  }

  getSetting<T>(key: string): T | null {
    return this.getCachedData<T>(this.settingsCache, key);
  }

  /**
   * Watch Later specific methods
   */
  cacheWatchLater(watchLaterList: any[]): void {
    this.setCachedData(this.userCache, 'watchLater', watchLaterList, this.CACHE_DURATIONS.USER_DATA);
  }

  getWatchLater(): any[] | null {
    return this.getCachedData<any[]>(this.userCache, 'watchLater');
  }

  /**
   * Download status caching
   */
  cacheDownloadStatus(videoKey: string, isDownloaded: boolean, filePath?: string): void {
    const downloadData = {
      isDownloaded,
      filePath: filePath || null,
      checkedAt: Date.now(),
    };
    this.setCachedData(this.videoCache, `download_${videoKey}`, downloadData, this.CACHE_DURATIONS.VIDEO_METADATA);
  }

  getDownloadStatus(videoKey: string): { isDownloaded: boolean; filePath?: string } | null {
    return this.getCachedData<{ isDownloaded: boolean; filePath?: string }>(this.videoCache, `download_${videoKey}`);
  }

  /**
   * Cache management methods
   */
  clearVideoCache(): void {
    this.videoCache.clearAll();
  }

  clearContentCache(): void {
    this.contentCache.clearAll();
  }

  clearUserCache(): void {
    this.userCache.clearAll();
  }

  clearAllCaches(): void {
    this.videoCache.clearAll();
    this.userCache.clearAll();
    this.contentCache.clearAll();
    this.settingsCache.clearAll();
  }

  /**
   * Cache statistics
   */
  getCacheStats() {
    return {
      videoCache: {
        keys: this.videoCache.getAllKeys().length,
        size: this.videoCache.getAllKeys().reduce((size, key) => {
          const value = this.videoCache.getString(key);
          return size + (value ? value.length : 0);
        }, 0),
      },
      contentCache: {
        keys: this.contentCache.getAllKeys().length,
        size: this.contentCache.getAllKeys().reduce((size, key) => {
          const value = this.contentCache.getString(key);
          return size + (value ? value.length : 0);
        }, 0),
      },
      userCache: {
        keys: this.userCache.getAllKeys().length,
        size: this.userCache.getAllKeys().reduce((size, key) => {
          const value = this.userCache.getString(key);
          return size + (value ? value.length : 0);
        }, 0),
      },
    };
  }

  /**
   * Preload critical data
   */
  async preloadCriticalData(): Promise<void> {
    try {
      // This method can be called on app startup to warm up the cache
      // with frequently accessed data
      console.log('FastStorage: Preloading critical data...');
      
      // Add any critical data preloading logic here
      // For example, user preferences, frequently accessed video metadata, etc.
      
    } catch (error) {
      console.warn('FastStorage: Failed to preload critical data:', error);
    }
  }
}

export default FastStorage;