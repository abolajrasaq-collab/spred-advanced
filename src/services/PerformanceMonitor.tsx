import FastStorage from './FastStorage';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'network' | 'cache' | 'user_action';
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

/**
 * Performance Monitoring Service
 * Tracks app performance metrics and cache efficiency
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
  };
  private renderTimes: Map<string, number> = new Map();
  private networkRequests: Map<string, number> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track render performance
   */
  startRender(componentName: string): void {
    this.renderTimes.set(componentName, Date.now());
  }

  endRender(componentName: string): void {
    const startTime = this.renderTimes.get(componentName);
    if (startTime) {
      const renderTime = Date.now() - startTime;
      this.addMetric({
        name: `render_${componentName}`,
        value: renderTime,
        timestamp: Date.now(),
        category: 'render',
      });
      this.renderTimes.delete(componentName);
    }
  }

  /**
   * Track network performance
   */
  startNetworkRequest(requestId: string): void {
    this.networkRequests.set(requestId, Date.now());
  }

  endNetworkRequest(requestId: string, success: boolean = true): void {
    const startTime = this.networkRequests.get(requestId);
    if (startTime) {
      const requestTime = Date.now() - startTime;
      this.addMetric({
        name: `network_${requestId}`,
        value: requestTime,
        timestamp: Date.now(),
        category: 'network',
      });
      this.networkRequests.delete(requestId);
    }
  }

  /**
   * Track cache performance
   */
  recordCacheHit(cacheType: string): void {
    this.cacheMetrics.hits++;
    this.cacheMetrics.totalRequests++;
    this.updateCacheHitRate();
    
    this.addMetric({
      name: `cache_hit_${cacheType}`,
      value: 1,
      timestamp: Date.now(),
      category: 'cache',
    });
  }

  recordCacheMiss(cacheType: string): void {
    this.cacheMetrics.misses++;
    this.cacheMetrics.totalRequests++;
    this.updateCacheHitRate();
    
    this.addMetric({
      name: `cache_miss_${cacheType}`,
      value: 1,
      timestamp: Date.now(),
      category: 'cache',
    });
  }

  private updateCacheHitRate(): void {
    if (this.cacheMetrics.totalRequests > 0) {
      this.cacheMetrics.hitRate = 
        (this.cacheMetrics.hits / this.cacheMetrics.totalRequests) * 100;
    }
  }

  /**
   * Track user actions
   */
  recordUserAction(actionName: string, duration?: number): void {
    this.addMetric({
      name: `user_action_${actionName}`,
      value: duration || 1,
      timestamp: Date.now(),
      category: 'user_action',
    });
  }

  /**
   * Add a custom metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > last5Minutes);

    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    const networkMetrics = recentMetrics.filter(m => m.category === 'network');
    const cacheMetrics = recentMetrics.filter(m => m.category === 'cache');

    return {
      cache: {
        ...this.cacheMetrics,
        recentHits: cacheMetrics.filter(m => m.name.includes('hit')).length,
        recentMisses: cacheMetrics.filter(m => m.name.includes('miss')).length,
      },
      render: {
        averageTime: this.calculateAverage(renderMetrics.map(m => m.value)),
        totalRenders: renderMetrics.length,
        slowRenders: renderMetrics.filter(m => m.value > 100).length, // > 100ms
      },
      network: {
        averageTime: this.calculateAverage(networkMetrics.map(m => m.value)),
        totalRequests: networkMetrics.length,
        slowRequests: networkMetrics.filter(m => m.value > 2000).length, // > 2s
      },
      overall: {
        totalMetrics: this.metrics.length,
        recentMetrics: recentMetrics.length,
        memoryUsage: this.getMemoryUsage(),
      },
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getMemoryUsage(): any {
    // This would need to be implemented with a native module
    // For now, return estimated usage
    return {
      estimated: `${Math.round(this.metrics.length * 0.1)}KB`,
      metricsCount: this.metrics.length,
    };
  }

  /**
   * Get detailed performance report
   */
  getDetailedReport() {
    const stats = this.getPerformanceStats();
    const fastStorage = FastStorage.getInstance();
    const cacheStats = fastStorage.getCacheStats();

    return {
      timestamp: new Date().toISOString(),
      performance: stats,
      storage: cacheStats,
      recommendations: this.generateRecommendations(stats),
    };
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.cache.hitRate < 70) {
      recommendations.push('Cache hit rate is low. Consider increasing cache duration or preloading data.');
    }

    if (stats.render.averageTime > 50) {
      recommendations.push('Average render time is high. Consider optimizing component re-renders.');
    }

    if (stats.network.averageTime > 1500) {
      recommendations.push('Network requests are slow. Consider implementing request caching or optimization.');
    }

    if (stats.render.slowRenders > 5) {
      recommendations.push('Multiple slow renders detected. Consider using React.memo or useMemo for expensive components.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! Keep up the optimizations.');
    }

    return recommendations;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
    };
    this.renderTimes.clear();
    this.networkRequests.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      cacheMetrics: this.cacheMetrics,
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

// Higher-order component for tracking render performance
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const monitor = PerformanceMonitor.getInstance();
    
    React.useEffect(() => {
      monitor.startRender(componentName);
      return () => {
        monitor.endRender(componentName);
      };
    }, []);

    return <WrappedComponent {...props} ref={ref} />;
  });
};

// Hook for tracking user actions
export const usePerformanceTracking = () => {
  const monitor = PerformanceMonitor.getInstance();

  const trackUserAction = React.useCallback((actionName: string, duration?: number) => {
    monitor.recordUserAction(actionName, duration);
  }, [monitor]);

  const trackRender = React.useCallback((componentName: string) => {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      monitor.addMetric({
        name: `render_${componentName}`,
        value: duration,
        timestamp: Date.now(),
        category: 'render',
      });
    };
  }, [monitor]);

  return {
    trackUserAction,
    trackRender,
    getStats: () => monitor.getPerformanceStats(),
  };
};

export default PerformanceMonitor;