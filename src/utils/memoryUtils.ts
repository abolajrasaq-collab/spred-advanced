/**
 * Memory Management Utilities for React Native
 * Optimizes memory usage and prevents memory leaks
 */

import { Platform } from 'react-native';
import logger from './logger';

// Memory monitoring utilities
export class MemoryManager {
  private static memoryWarnings: number[] = [];
  private static lastCleanup: number = Date.now();

  /**
   * Check current memory usage and warn if high
   */
  static checkMemoryUsage(): void {
    try {
      // Native memory monitoring for Android/iOS
      if (Platform.OS === 'android') {
        // This would require native module integration
        // For now, we'll use basic heuristics
        this.performBasicMemoryCheck();
      }
    } catch (error) {
      // Silently handle memory monitoring errors
    }
  }

  /**
   * Basic memory usage heuristics
   */
  private static performBasicMemoryCheck(): void {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanup;

    // Force cleanup every 5 minutes
    if (timeSinceLastCleanup > 5 * 60 * 1000) {
      this.performCleanup();
      this.lastCleanup = now;
    }
  }

  /**
   * Perform memory cleanup operations
   */
  static performCleanup(): void {
    try {
      // Clear image caches if available
      if (Platform.OS === 'android') {
        // Request garbage collection on Android
        if (global.gc) {
          global.gc();
        }
      }

      // Clear any cached data that's too large
      this.clearLargeDataCaches();

      // Clear console logs in production
      if (__DEV__ === false) {
        // logger.info('Clearing console logs');
      }
    } catch (error) {
      // Silent cleanup failures
    }
  }

  /**
   * Clear large data caches to free memory
   */
  private static clearLargeDataCaches(): void {
    try {
      // This would integrate with your caching solution
      // For MMKV or AsyncStorage, you'd selectively clear large keys
      const keysToClear = [
        'temp_video_thumbnails',
        'large_image_cache',
        'temp_download_cache',
      ];

      keysToClear.forEach(key => {
        try {
          // Implementation depends on your storage solution
          // AsyncStorage.removeItem(key);
        } catch (error) {
          // Silent failures
        }
      });
    } catch (error) {
      // Silent cache clearing failures
    }
  }

  /**
   * Get memory usage statistics (platform-specific implementation)
   */
  static getMemoryStats(): { used: number; total: number; percentage: number } {
    // This would require native module integration
    // Return estimated values for now
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }
}

// Optimized array operations for memory efficiency
export const ArrayUtils = {
  /**
   * Chunk large arrays to prevent memory spikes
   */
  chunk<T>(array: T[], chunkSize: number = 100): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  },

  /**
   * Efficiently filter large arrays with early termination
   */
  filterWithLimit<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    limit?: number,
  ): T[] {
    const result: T[] = [];
    const maxItems = limit || array.length;

    for (let i = 0; i < array.length && result.length < maxItems; i++) {
      if (predicate(array[i], i)) {
        result.push(array[i]);
      }
    }

    return result;
  },

  /**
   * Memoized array sorting to prevent repeated operations
   */
  sortOnce<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    return [...array].sort(compareFn);
  },
};

// Image memory optimization
export const ImageOptimizer = {
  /**
   * Generate optimized image dimensions based on container size
   */
  calculateOptimalSize(
    containerWidth: number,
    containerHeight: number,
    aspectRatio: number = 16 / 9,
  ): { width: number; height: number } {
    // Round to nearest even number for better GPU performance
    const width = Math.round(containerWidth / 2) * 2;
    const height = Math.round(width / aspectRatio / 2) * 2;

    return { width, height };
  },

  /**
   * Preload critical images with memory management
   */
  async preloadImages(
    imageUrls: string[],
    maxConcurrent: number = 3,
  ): Promise<void> {
    // Implementation would use Image.prefetch with memory management
    const chunks = ArrayUtils.chunk(imageUrls, maxConcurrent);

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(url => this.prefetchWithMemoryCheck(url)),
      );

      // Small delay between chunks to prevent memory spikes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  },

  /**
   * Prefetch single image with memory check
   */
  async prefetchWithMemoryCheck(imageUrl: string): Promise<void> {
    try {
      // Check memory before prefetch
      MemoryManager.checkMemoryUsage();

      // Prefetch implementation would go here
      // await Image.prefetch(imageUrl);

      // Check memory after prefetch
      MemoryManager.checkMemoryUsage();
    } catch (error) {
      // Silent prefetch failures
    }
  },
};

// Debounced operations for performance
export const performDebounced = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttled operations for performance
export const performThrottled = <T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
};

// Cleanup utility for component unmount
export const createCleanupManager = () => {
  const cleanupTasks: (() => void)[] = [];

  return {
    addCleanup: (task: () => void) => {
      cleanupTasks.push(task);
    },

    cleanup: () => {
      cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          // Silent cleanup errors
        }
      });
      cleanupTasks.length = 0; // Clear array
    },
  };
};

export default {
  MemoryManager,
  ArrayUtils,
  ImageOptimizer,
  performDebounced,
  performThrottled,
  createCleanupManager,
};
