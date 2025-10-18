/**
 * Global Performance Manager
 * Coordinates app-wide performance optimizations and memory management
 */

import { Platform, AppState } from 'react-native';
import { MemoryManager, createCleanupManager } from '../utils/memoryUtils';
import logger from '../utils/logger';

type PerformanceMode = 'low' | 'normal' | 'high';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  lastCleanup: number;
}

class PerformanceManager {
  private static instance: PerformanceManager;
  private mode: PerformanceMode = 'normal';
  private metrics: PerformanceMetrics = {
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    lastCleanup: Date.now(),
  };
  private cleanupManager = createCleanupManager();
  private subscribers: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private appState = 'active';

  private constructor() {
    this.initialize();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private initialize(): void {
    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));

    // Set up periodic performance monitoring
    this.startPerformanceMonitoring();

    // Initial memory cleanup
    MemoryManager.performCleanup();
  }

  private handleAppStateChange(nextAppState: string): void {
    const previousAppState = this.appState;
    this.appState = nextAppState;

    // Perform cleanup when app goes to background
    if (previousAppState === 'active' && nextAppState === 'background') {
      this.performBackgroundCleanup();
    }

    // Restore performance when app becomes active
    else if (previousAppState === 'background' && nextAppState === 'active') {
      this.performForegroundOptimization();
    }
  }

  private performBackgroundCleanup(): void {
    logger.info('🧹 Performing background cleanup...');

    // Aggressive cleanup when app is in background
    MemoryManager.performCleanup();

    // Clear image caches
    this.clearImageCaches();

    // Update metrics
    this.metrics.lastCleanup = Date.now();
    this.notifySubscribers();
  }

  private performForegroundOptimization(): void {
    logger.info('⚡ Optimizing for foreground performance...');

    // Check memory usage
    MemoryManager.checkMemoryUsage();

    // Optimize rendering performance
    this.optimizeRendering();
  }

  private clearImageCaches(): void {
    try {
      // This would integrate with your image caching solution
      // For now, we'll trigger general cleanup
      if (Platform.OS === 'android' && global.gc) {
        global.gc();
      }
    } catch (error) {
      logger.error('Image cache cleanup failed:', error);
    }
  }

  private optimizeRendering(): void {
    // This could include:
    // - Preloading critical components
    // - Optimizing animation performance
    // - Adjusting rendering quality based on device performance
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance every 30 seconds
    setInterval(() => {
      if (this.appState === 'active') {
        this.monitorPerformance();
      }
    }, 30000);
  }

  private monitorPerformance(): void {
    try {
      // Update memory usage
      const memoryStats = MemoryManager.getMemoryStats();
      this.metrics.memoryUsage = memoryStats.percentage;

      // Adjust performance mode based on metrics
      this.adjustPerformanceMode();

      // Notify subscribers
      this.notifySubscribers();
    } catch (error) {
      logger.error('Performance monitoring error:', error);
    }
  }

  private adjustPerformanceMode(): void {
    const { memoryUsage } = this.metrics;

    if (memoryUsage > 80) {
      this.mode = 'low';
      this.enableLowPowerMode();
    } else if (memoryUsage > 60) {
      this.mode = 'normal';
      this.enableNormalMode();
    } else {
      this.mode = 'high';
      this.enableHighPerformanceMode();
    }
  }

  private enableLowPowerMode(): void {
    logger.info('🔋 Enabling low power mode...');
    // Reduce animation quality
    // Limit background processes
    // Increase cleanup frequency
  }

  private enableNormalMode(): void {
    logger.info('⚙️ Enabling normal mode...');
    // Standard performance settings
  }

  private enableHighPerformanceMode(): void {
    logger.info('🚀 Enabling high performance mode...');
    // Maximum performance settings
    // Preload more content
    // Higher quality animations
  }

  // Public API
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.metrics });
      } catch (error) {
        logger.error('Subscriber callback error:', error);
      }
    });
  }

  getPerformanceMode(): PerformanceMode {
    return this.mode;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  forceCleanup(): void {
    logger.info('🧹 Force cleanup requested...');
    MemoryManager.performCleanup();
    this.clearImageCaches();
    this.metrics.lastCleanup = Date.now();
    this.notifySubscribers();
  }

  optimizeForMemoryPressure(): void {
    logger.warn('⚠️ Optimizing for memory pressure...');
    this.mode = 'low';
    this.enableLowPowerMode();
    MemoryManager.performCleanup();
  }

  // Component-specific optimizations
  optimizeForHeavyComponent(componentName: string): void {
    logger.info(`🔧 Optimizing for heavy component: ${componentName}`);

    // Pre-cleanup before heavy component mounts
    MemoryManager.checkMemoryUsage();

    // Add cleanup task for when component unmounts
    this.cleanupManager.addCleanup(() => {
      logger.info(`🧹 Cleaning up after component: ${componentName}`);
      MemoryManager.performCleanup();
    });
  }

  // Navigation-specific optimizations
  optimizeForNavigation(from: string, to: string): void {
    logger.info(`🧭 Optimizing navigation: ${from} → ${to}`);

    // Light cleanup during navigation
    if (this.metrics.memoryUsage > 70) {
      MemoryManager.performCleanup();
    }
  }

  // Get current performance mode
  getCurrentMode(): PerformanceMode {
    return this.mode;
  }

  // Set performance mode
  setPerformanceMode(mode: PerformanceMode): void {
    this.mode = mode;
    logger.info(`🎯 Performance mode set to: ${mode}`);
    
    // Apply mode-specific optimizations
    switch (mode) {
      case 'high':
        this.enableHighPerformanceMode();
        break;
      case 'low':
        this.enableLowPowerMode();
        break;
      case 'normal':
      default:
        this.enableNormalMode();
        break;
    }
  }

  destroy(): void {
    // Cleanup all resources
    this.cleanupManager.cleanup();
    this.subscribers.clear();
    AppState.removeEventListener(
      'change',
      this.handleAppStateChange.bind(this),
    );
  }
}

export default PerformanceManager;

// Export singleton instance for easy access
export const performanceManager = PerformanceManager.getInstance();
