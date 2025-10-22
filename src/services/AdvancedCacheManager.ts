/**
 * Advanced Cache Manager
 * Provides intelligent caching with memory management and performance optimization
 */

import { MMKV } from 'react-native-mmkv';
import logger from '../utils/logger';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CacheConfig {
  maxSize: number; // in bytes
  maxItems: number;
  defaultTTL: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
  compressionEnabled: boolean;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  oldestItem: number;
  newestItem: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  priority?: 'low' | 'medium' | 'high' | 'critical';
  compress?: boolean;
  tags?: string[];
}

class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private storage: MMKV;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;
  private accessTimes: Map<string, number> = new Map();

  private constructor() {
    this.storage = new MMKV();
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxItems: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
    };

    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      oldestItem: Date.now(),
      newestItem: Date.now(),
    };

    this.initializeStats();
    this.startCleanupTimer();
  }

  static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager();
    }
    return AdvancedCacheManager.instance;
  }

  private initializeStats(): void {
    try {
      const statsData = this.storage.getString('cache_stats');
      if (statsData) {
        this.stats = { ...this.stats, ...JSON.parse(statsData) };
      }
    } catch (error) {
      logger.warn('Failed to load cache stats:', error);
    }
  }

  private saveStats(): void {
    try {
      this.storage.set('cache_stats', JSON.stringify(this.stats));
    } catch (error) {
      logger.warn('Failed to save cache stats:', error);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  private performCleanup(): void {
    try {
      const now = Date.now();
      const keys = this.storage.getAllKeys();
      let cleanedItems = 0;
      let cleanedSize = 0;

      // Remove expired items
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          const itemData = this.storage.getString(key);
          if (itemData) {
            try {
              const item: CacheItem = JSON.parse(itemData);
              if (now > item.expiresAt) {
                this.storage.delete(key);
                cleanedItems++;
                cleanedSize += item.size;
              }
            } catch (error) {
              // Remove corrupted items
              this.storage.delete(key);
              cleanedItems++;
            }
          }
        }
      }

      // Update stats
      this.stats.totalItems -= cleanedItems;
      this.stats.totalSize -= cleanedSize;
      this.saveStats();

      // Check if we need to evict items based on size or count
      if (this.stats.totalSize > this.config.maxSize ||
        this.stats.totalItems > this.config.maxItems) {
        this.evictItems();
      }

      logger.info(`🧹 Cache cleanup completed: ${cleanedItems} items removed`);
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
    }
  }

  private evictItems(): void {
    const keys = this.storage.getAllKeys();
    const cacheItems: Array<{ key: string; item: CacheItem }> = [];

    // Collect all cache items with metadata
    for (const key of keys) {
      if (key.startsWith('cache_')) {
        const itemData = this.storage.getString(key);
        if (itemData) {
          try {
            const item: CacheItem = JSON.parse(itemData);
            cacheItems.push({ key, item });
          } catch (error) {
            // Remove corrupted items
            this.storage.delete(key);
          }
        }
      }
    }

    // Sort by priority and access patterns
    cacheItems.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.item.priority];
      const bPriority = priorityOrder[b.item.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // If same priority, sort by access count and last accessed time
      const aScore = a.item.accessCount + (Date.now() - a.item.lastAccessed) / 1000000;
      const bScore = b.item.accessCount + (Date.now() - b.item.lastAccessed) / 1000000;

      return aScore - bScore;
    });

    // Evict items until we're under limits
    let evictedSize = 0;
    let evictedCount = 0;
    const targetSize = this.config.maxSize * 0.8; // Evict to 80% of max size
    const targetCount = this.config.maxItems * 0.8; // Evict to 80% of max items

    for (const { key, item } of cacheItems) {
      if (this.stats.totalSize - evictedSize <= targetSize &&
        this.stats.totalItems - evictedCount <= targetCount) {
        break;
      }

      this.storage.delete(key);
      evictedSize += item.size;
      evictedCount++;
    }

    this.stats.totalSize -= evictedSize;
    this.stats.totalItems -= evictedCount;
    this.stats.evictions += evictedCount;
    this.saveStats();

    logger.info(`🗑️ Evicted ${evictedCount} cache items (${evictedSize} bytes)`);
  }

  public async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const now = Date.now();
      const ttl = options.ttl || this.config.defaultTTL;
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      const cacheKey = `cache_${key}`;
      const item: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        accessCount: 0,
        lastAccessed: now,
        size,
        priority: options.priority || 'medium',
      };

      // Check if we need to make space
      if (this.stats.totalSize + size > this.config.maxSize) {
        this.evictItems();
      }

      this.storage.set(cacheKey, JSON.stringify(item));

      // Update stats
      this.stats.totalItems++;
      this.stats.totalSize += size;
      this.stats.newestItem = now;
      this.saveStats();

      logger.debug(`💾 Cached item: ${key} (${size} bytes)`);
    } catch (error) {
      logger.error('Failed to cache item:', error);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `cache_${key}`;
      const itemData = this.storage.getString(cacheKey);

      if (!itemData) {
        this.stats.missRate++;
        this.saveStats();
        return null;
      }

      const item: CacheItem<T> = JSON.parse(itemData);
      const now = Date.now();

      // Check if expired
      if (now > item.expiresAt) {
        this.storage.delete(cacheKey);
        this.stats.totalItems--;
        this.stats.totalSize -= item.size;
        this.stats.missRate++;
        this.saveStats();
        return null;
      }

      // Update access statistics
      item.accessCount++;
      item.lastAccessed = now;
      this.storage.set(cacheKey, JSON.stringify(item));
      this.accessTimes.set(key, now);

      this.stats.hitRate++;
      this.saveStats();

      return item.data;
    } catch (error) {
      logger.error('Failed to retrieve cached item:', error);
      this.stats.missRate++;
      this.saveStats();
      return null;
    }
  }

  public async has(key: string): Promise<boolean> {
    const cacheKey = `cache_${key}`;
    const itemData = this.storage.getString(cacheKey);

    if (!itemData) {
      return false;
    }

    try {
      const item: CacheItem = JSON.parse(itemData);
      return Date.now() <= item.expiresAt;
    } catch (error) {
      return false;
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      const cacheKey = `cache_${key}`;
      const itemData = this.storage.getString(cacheKey);

      if (itemData) {
        const item: CacheItem = JSON.parse(itemData);
        this.storage.delete(cacheKey);
        this.stats.totalItems--;
        this.stats.totalSize -= item.size;
        this.saveStats();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete cached item:', error);
      return false;
    }
  }

  public async clear(): Promise<void> {
    try {
      const keys = this.storage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));

      for (const key of cacheKeys) {
        this.storage.delete(key);
      }

      this.stats = {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        evictions: 0,
        oldestItem: Date.now(),
        newestItem: Date.now(),
      };

      this.saveStats();
      logger.info('🗑️ Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getConfig(): CacheConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.startCleanupTimer();
    }
  }

  public async preload<T>(
    items: Array<{ key: string; data: T; options?: CacheOptions }>
  ): Promise<void> {
    const promises = items.map(({ key, data, options }) =>
      this.set(key, data, options)
    );

    await Promise.all(promises);
    logger.info(`🚀 Preloaded ${items.length} cache items`);
  }

  // Memory-aware preload with size checking
  public async smartPreload<T>(
    items: Array<{ key: string; data: T; options?: CacheOptions; priority?: 'low' | 'medium' | 'high' | 'critical' }>
  ): Promise<void> {
    const sortedItems = items.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
    });

    const promises: Promise<void>[] = [];
    let estimatedSize = 0;

    for (const item of sortedItems) {
      const itemSize = this.estimateItemSize(item.data);

      // Check if adding this item would exceed cache limits
      if (estimatedSize + itemSize > this.config.maxSize * 0.8) { // Leave 20% buffer
        logger.warn(`⚠️ Cache preload stopped - would exceed size limit`);
        break;
      }

      if (this.stats.totalItems + promises.length >= this.config.maxItems * 0.8) {
        logger.warn(`⚠️ Cache preload stopped - would exceed item limit`);
        break;
      }

      promises.push(this.set(item.key, item.data, {
        ...item.options,
        priority: item.priority || 'medium'
      }));

      estimatedSize += itemSize;
    }

    await Promise.all(promises);
    logger.info(`🧠 Smart preloaded ${promises.length}/${items.length} cache items (${estimatedSize} bytes)`);
  }

  private estimateItemSize(data: any): number {
    try {
      const serialized = JSON.stringify(data);
      return new Blob([serialized]).size;
    } catch (error) {
      // Fallback estimation
      return 1024; // 1KB default
    }
  }

  public async warmup<T>(
    keyGenerator: () => string,
    dataGenerator: (key: string) => Promise<T>,
    count: number = 10
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      const key = keyGenerator();
      const dataPromise = dataGenerator(key);

      promises.push(
        dataPromise.then(data => this.set(key, data))
      );
    }

    await Promise.all(promises);
    logger.info(`🔥 Cache warmed up with ${count} items`);
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.accessTimes.clear();
  }
}

export default AdvancedCacheManager;
export const cacheManager = AdvancedCacheManager.getInstance();
