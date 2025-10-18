/**
 * Performance Integration Service
 * Integrates all performance monitoring and optimization services
 */

import { performanceMonitor } from './AdvancedPerformanceMonitor';
import { cacheManager } from './AdvancedCacheManager';
import { networkOptimizer } from './NetworkOptimizer';
import { PerformanceManager } from './PerformanceManager';
import logger from '../utils/logger';

export interface PerformanceReport {
  timestamp: number;
  overallScore: number;
  components: {
    monitoring: number;
    caching: number;
    network: number;
    memory: number;
  };
  recommendations: string[];
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    solution: string;
  }>;
}

export interface PerformanceConfig {
  monitoringEnabled: boolean;
  cachingEnabled: boolean;
  networkOptimizationEnabled: boolean;
  memoryManagementEnabled: boolean;
  reportingInterval: number;
  thresholds: {
    overallScore: number;
    renderTime: number;
    memoryUsage: number;
    networkLatency: number;
    cacheHitRate: number;
  };
}

class PerformanceIntegration {
  private static instance: PerformanceIntegration;
  private config: PerformanceConfig;
  private isInitialized = false;
  private reportInterval?: NodeJS.Timeout;
  private subscribers: Set<(report: PerformanceReport) => void> = new Set();

  private constructor() {
    this.config = {
      monitoringEnabled: true,
      cachingEnabled: true,
      networkOptimizationEnabled: true,
      memoryManagementEnabled: true,
      reportingInterval: 30000, // 30 seconds
      thresholds: {
        overallScore: 80,
        renderTime: 16,
        memoryUsage: 80,
        networkLatency: 1000,
        cacheHitRate: 70,
      },
    };
  }

  static getInstance(): PerformanceIntegration {
    if (!PerformanceIntegration.instance) {
      PerformanceIntegration.instance = new PerformanceIntegration();
    }
    return PerformanceIntegration.instance;
  }

  /**
   * Initialize all performance services
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Performance integration already initialized');
      return;
    }

    try {
      logger.info('🚀 Initializing performance integration...');

      // Initialize performance monitoring
      if (this.config.monitoringEnabled) {
        performanceMonitor.startMonitoring(10000); // 10 second intervals
        logger.info('✅ Performance monitoring initialized');
      }

      // Initialize caching
      if (this.config.cachingEnabled) {
        // Cache manager is auto-initialized
        logger.info('✅ Advanced caching initialized');
      }

      // Initialize network optimization
      if (this.config.networkOptimizationEnabled) {
        // Network optimizer is auto-initialized
        logger.info('✅ Network optimization initialized');
      }

      // Initialize memory management
      if (this.config.memoryManagementEnabled) {
        const performanceManager = PerformanceManager.getInstance();
        logger.info('✅ Memory management initialized');
      }

      // Start periodic reporting
      this.startPeriodicReporting();

      this.isInitialized = true;
      logger.info('🎉 Performance integration fully initialized');
    } catch (error) {
      logger.error('Failed to initialize performance integration:', error);
      throw error;
    }
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting(): void {
    this.reportInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.reportingInterval);

    logger.info(`📊 Performance reporting started (${this.config.reportingInterval}ms intervals)`);
  }

  /**
   * Generate comprehensive performance report
   */
  public async generatePerformanceReport(): Promise<PerformanceReport> {
    try {
      const timestamp = Date.now();
      
      // Collect metrics from all services
      const monitoringMetrics = performanceMonitor.getCurrentMetrics();
      const cacheStats = cacheManager.getStats();
      const networkStats = networkOptimizer.getStats();
      const performanceScore = performanceMonitor.getPerformanceScore();

      // Calculate component scores
      const components = {
        monitoring: this.calculateMonitoringScore(monitoringMetrics),
        caching: this.calculateCachingScore(cacheStats),
        network: this.calculateNetworkScore(networkStats),
        memory: this.calculateMemoryScore(monitoringMetrics),
      };

      // Calculate overall score
      const overallScore = this.calculateOverallScore(components);

      // Generate recommendations and issues
      const { recommendations, issues } = this.analyzePerformance(
        components,
        monitoringMetrics,
        cacheStats,
        networkStats
      );

      const report: PerformanceReport = {
        timestamp,
        overallScore,
        components,
        recommendations,
        issues,
      };

      // Notify subscribers
      this.notifySubscribers(report);

      // Log performance status
      this.logPerformanceStatus(report);

      return report;
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Calculate monitoring score
   */
  private calculateMonitoringScore(metrics: any): number {
    let score = 100;

    // Deduct for poor render time
    if (metrics.renderTime > this.config.thresholds.renderTime) {
      score -= 20;
    }

    // Deduct for high memory usage
    if (metrics.memoryUsage > this.config.thresholds.memoryUsage) {
      score -= 25;
    }

    // Deduct for frame drops
    if (metrics.frameDrops > 5) {
      score -= 15;
    }

    // Deduct for high CPU usage
    if (metrics.cpuUsage > 80) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate caching score
   */
  private calculateCachingScore(stats: any): number {
    let score = 100;

    // Deduct for low cache hit rate
    if (stats.cacheHitRate < this.config.thresholds.cacheHitRate) {
      score -= 30;
    }

    // Deduct for high eviction rate
    if (stats.evictions > stats.totalItems * 0.1) {
      score -= 20;
    }

    // Deduct for excessive cache size
    if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate network score
   */
  private calculateNetworkScore(stats: any): number {
    let score = 100;

    // Deduct for high error rate
    if (stats.errorRate > 0.1) {
      score -= 30;
    }

    // Deduct for slow average response time
    if (stats.averageResponseTime > this.config.thresholds.networkLatency) {
      score -= 25;
    }

    // Deduct for low cache hit rate
    if (stats.cacheHitRate < 50) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate memory score
   */
  private calculateMemoryScore(metrics: any): number {
    let score = 100;

    // Deduct for high memory usage
    if (metrics.memoryUsage > this.config.thresholds.memoryUsage) {
      score -= 40;
    }

    // Deduct for memory pressure
    if (metrics.memoryUsage > 90) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(components: any): number {
    const weights = {
      monitoring: 0.3,
      caching: 0.2,
      network: 0.25,
      memory: 0.25,
    };

    return Math.round(
      components.monitoring * weights.monitoring +
      components.caching * weights.caching +
      components.network * weights.network +
      components.memory * weights.memory
    );
  }

  /**
   * Analyze performance and generate recommendations
   */
  private analyzePerformance(
    components: any,
    monitoringMetrics: any,
    cacheStats: any,
    networkStats: any
  ): { recommendations: string[]; issues: any[] } {
    const recommendations: string[] = [];
    const issues: any[] = [];

    // Monitor performance issues
    if (components.monitoring < 70) {
      issues.push({
        type: 'monitoring',
        severity: 'high',
        description: 'Poor rendering performance detected',
        solution: 'Optimize component rendering, use React.memo, reduce re-renders',
      });
      recommendations.push('Consider implementing React.memo for expensive components');
      recommendations.push('Review component lifecycle and state management');
    }

    // Caching issues
    if (components.caching < 70) {
      issues.push({
        type: 'caching',
        severity: 'medium',
        description: 'Low cache hit rate affecting performance',
        solution: 'Improve cache strategy, increase cache size, optimize cache keys',
      });
      recommendations.push('Review cache configuration and TTL settings');
      recommendations.push('Consider implementing cache warming strategies');
    }

    // Network issues
    if (components.network < 70) {
      issues.push({
        type: 'network',
        severity: 'medium',
        description: 'Network performance issues detected',
        solution: 'Implement request batching, improve error handling, optimize API calls',
      });
      recommendations.push('Implement request deduplication and batching');
      recommendations.push('Review API response caching strategies');
    }

    // Memory issues
    if (components.memory < 70) {
      issues.push({
        type: 'memory',
        severity: 'critical',
        description: 'High memory usage detected',
        solution: 'Implement memory cleanup, optimize image loading, reduce cache size',
      });
      recommendations.push('Implement aggressive memory cleanup strategies');
      recommendations.push('Review image loading and caching policies');
    }

    // General recommendations
    if (components.monitoring > 90 && components.caching > 90 && components.network > 90) {
      recommendations.push('Performance is excellent! Consider implementing advanced optimizations');
    }

    return { recommendations, issues };
  }

  /**
   * Log performance status
   */
  private logPerformanceStatus(report: PerformanceReport): void {
    const { overallScore, components, issues } = report;

    if (overallScore >= 90) {
      logger.info(`🎉 Excellent performance score: ${overallScore}`);
    } else if (overallScore >= 80) {
      logger.info(`✅ Good performance score: ${overallScore}`);
    } else if (overallScore >= 70) {
      logger.warn(`⚠️ Moderate performance score: ${overallScore}`);
    } else {
      logger.error(`❌ Poor performance score: ${overallScore}`);
    }

    if (issues.length > 0) {
      logger.warn(`🚨 ${issues.length} performance issues detected`);
      issues.forEach(issue => {
        logger.warn(`  - ${issue.type}: ${issue.description}`);
      });
    }

    logger.info(`📊 Component scores:`, {
      monitoring: components.monitoring,
      caching: components.caching,
      network: components.network,
      memory: components.memory,
    });
  }

  /**
   * Subscribe to performance reports
   */
  public subscribe(callback: (report: PerformanceReport) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of performance report
   */
  private notifySubscribers(report: PerformanceReport): void {
    this.subscribers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        logger.error('Performance subscriber callback error:', error);
      }
    });
  }

  /**
   * Get current performance configuration
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update performance configuration
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart reporting if interval changed
    if (newConfig.reportingInterval) {
      if (this.reportInterval) {
        clearInterval(this.reportInterval);
      }
      this.startPeriodicReporting();
    }

    logger.info('⚙️ Performance configuration updated');
  }

  /**
   * Force performance optimization
   */
  public async optimizePerformance(): Promise<void> {
    logger.info('🔧 Forcing performance optimization...');

    try {
      // Force cleanup
      performanceMonitor.forceCleanup();
      await cacheManager.clear();
      networkOptimizer.resetStats();

      // Generate immediate report
      await this.generatePerformanceReport();

      logger.info('✅ Performance optimization completed');
    } catch (error) {
      logger.error('Failed to optimize performance:', error);
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    isInitialized: boolean;
    config: PerformanceConfig;
    lastReport?: PerformanceReport;
  } {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
    };
  }

  /**
   * Destroy performance integration
   */
  public destroy(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    performanceMonitor.stopMonitoring();
    cacheManager.destroy();

    this.subscribers.clear();
    this.isInitialized = false;

    logger.info('🧹 Performance integration destroyed');
  }
}

export default PerformanceIntegration;
export const performanceIntegration = PerformanceIntegration.getInstance();
