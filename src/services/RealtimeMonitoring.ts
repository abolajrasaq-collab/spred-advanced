/**
 * Real-time Monitoring Service
 * Provides comprehensive real-time monitoring for development and production
 */

import { Platform, AppState, Dimensions } from 'react-native';
import { performanceMonitor } from './AdvancedPerformanceMonitor';
import { cacheManager } from './AdvancedCacheManager';
import { networkOptimizer } from './NetworkOptimizer';
import logger from '../utils/logger';

export interface RealtimeMetrics {
  timestamp: number;
  performance: {
    score: number;
    renderTime: number;
    memoryUsage: number;
    frameDrops: number;
    cpuUsage: number;
  };
  network: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    cacheHitRate: number;
  };
  cache: {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictions: number;
  };
  user: {
    sessionId: string;
    screenName: string;
    userId?: string;
    deviceInfo: DeviceInfo;
  };
  errors: {
    totalErrors: number;
    recentErrors: ErrorEvent[];
    errorRate: number;
  };
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  screenSize: string;
  memory: number;
  batteryLevel?: number;
  isConnected: boolean;
  connectionType?: string;
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  type: 'javascript' | 'native' | 'network' | 'performance';
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
}

export interface MonitoringConfig {
  enabled: boolean;
  reportingInterval: number;
  maxErrors: number;
  enableCrashReporting: boolean;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableNetworkTracking: boolean;
  enableCacheTracking: boolean;
  remoteEndpoint?: string;
  apiKey?: string;
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'error' | 'memory' | 'network';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata: Record<string, any>;
}

class RealtimeMonitoring {
  private static instance: RealtimeMonitoring;
  private config: MonitoringConfig;
  private metrics: RealtimeMetrics;
  private sessionId: string;
  private currentScreen: string = 'unknown';
  private errorCount = 0;
  private recentErrors: ErrorEvent[] = [];
  private alerts: MonitoringAlert[] = [];
  private subscribers: Set<(metrics: RealtimeMetrics) => void> = new Set();
  private alertSubscribers: Set<(alert: MonitoringAlert) => void> = new Set();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private deviceInfo: DeviceInfo;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.config = {
      enabled: true,
      reportingInterval: 5000, // 5 seconds
      maxErrors: 100,
      enableCrashReporting: true,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      enableNetworkTracking: true,
      enableCacheTracking: true,
    };

    this.deviceInfo = this.getDeviceInfo();
    this.metrics = this.initializeMetrics();

    this.setupErrorHandling();
    this.setupAppStateListener();
  }

  static getInstance(): RealtimeMonitoring {
    if (!RealtimeMonitoring.instance) {
      RealtimeMonitoring.instance = new RealtimeMonitoring();
    }
    return RealtimeMonitoring.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    const { width, height } = Dimensions.get('window');
    
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.select({
        ios: 'iOS Device',
        android: 'Android Device',
        default: 'Unknown',
      }),
      screenSize: `${width}x${height}`,
      memory: this.estimateMemory(),
      isConnected: true, // Will be updated by network listener
    };
  }

  private estimateMemory(): number {
    if (Platform.OS === 'ios') {
      return 4096; // 4GB average for modern iOS devices
    } else {
      return 6144; // 6GB average for modern Android devices
    }
  }

  private initializeMetrics(): RealtimeMetrics {
    return {
      timestamp: Date.now(),
      performance: {
        score: 100,
        renderTime: 0,
        memoryUsage: 0,
        frameDrops: 0,
        cpuUsage: 0,
      },
      network: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        cacheHitRate: 0,
      },
      cache: {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        evictions: 0,
      },
      user: {
        sessionId: this.sessionId,
        screenName: this.currentScreen,
        deviceInfo: this.deviceInfo,
      },
      errors: {
        totalErrors: 0,
        recentErrors: [],
        errorRate: 0,
      },
    };
  }

  private setupErrorHandling(): void {
    if (!this.config.enableCrashReporting) return;

    // Global error handler
    const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();
    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      this.captureError({
        type: 'javascript',
        message: error.message || 'Unknown error',
        stack: error.stack,
        severity: isFatal ? 'critical' : 'high',
        context: {
          isFatal,
          timestamp: Date.now(),
        },
      });

      // Call original handler
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });

    // Unhandled promise rejections
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      this.captureError({
        type: 'javascript',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          reason: event.reason,
          timestamp: Date.now(),
        },
      });

      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.onAppBecameActive();
      } else if (nextAppState === 'background') {
        this.onAppWentToBackground();
      }
    });
  }

  private onAppBecameActive(): void {
    logger.info('📱 App became active - resuming monitoring');
    this.deviceInfo.isConnected = true;
    
    if (this.config.enabled && !this.isMonitoring) {
      this.startMonitoring();
    }
  }

  private onAppWentToBackground(): void {
    logger.info('📱 App went to background - pausing monitoring');
    this.deviceInfo.isConnected = false;
    
    if (this.isMonitoring) {
      this.stopMonitoring();
    }
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring || !this.config.enabled) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.notifySubscribers();
    }, this.config.reportingInterval);

    logger.info('🚀 Real-time monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    logger.info('🛑 Real-time monitoring stopped');
  }

  /**
   * Collect current metrics from all services
   */
  private collectMetrics(): void {
    try {
      const now = Date.now();
      
      // Performance metrics
      if (this.config.enablePerformanceTracking) {
        const performanceMetrics = performanceMonitor.getCurrentMetrics();
        this.metrics.performance = {
          score: performanceMonitor.getPerformanceScore(),
          renderTime: performanceMetrics.renderTime,
          memoryUsage: performanceMetrics.memoryUsage,
          frameDrops: performanceMetrics.frameDrops,
          cpuUsage: performanceMetrics.cpuUsage,
        };
      }

      // Network metrics
      if (this.config.enableNetworkTracking) {
        const networkStats = networkOptimizer.getStats();
        this.metrics.network = {
          totalRequests: networkStats.totalRequests,
          successfulRequests: networkStats.successfulRequests,
          failedRequests: networkStats.failedRequests,
          averageLatency: networkStats.averageResponseTime,
          cacheHitRate: networkStats.cacheHitRate,
        };
      }

      // Cache metrics
      if (this.config.enableCacheTracking) {
        const cacheStats = cacheManager.getStats();
        this.metrics.cache = {
          totalItems: cacheStats.totalItems,
          totalSize: cacheStats.totalSize,
          hitRate: cacheStats.hitRate,
          missRate: cacheStats.missRate,
          evictions: cacheStats.evictions,
        };
      }

      // User metrics
      if (this.config.enableUserTracking) {
        this.metrics.user.screenName = this.currentScreen;
        this.metrics.user.deviceInfo = this.deviceInfo;
      }

      // Error metrics
      this.metrics.errors = {
        totalErrors: this.errorCount,
        recentErrors: this.recentErrors.slice(-10), // Keep last 10 errors
        errorRate: this.calculateErrorRate(),
      };

      this.metrics.timestamp = now;

      // Check for alerts
      this.checkForAlerts();
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
    }
  }

  private calculateErrorRate(): number {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const recentErrors = this.recentErrors.filter(
      error => now - error.timestamp < timeWindow
    );
    return (recentErrors.length / (timeWindow / 1000)) * 60; // Errors per minute
  }

  private checkForAlerts(): void {
    const { performance, network, cache, errors } = this.metrics;

    // Performance alerts
    if (performance.score < 70) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `Performance score is low: ${performance.score}`,
        metadata: { score: performance.score },
      });
    }

    if (performance.memoryUsage > 90) {
      this.createAlert({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage is critical: ${performance.memoryUsage}%`,
        metadata: { memoryUsage: performance.memoryUsage },
      });
    }

    // Network alerts
    if (network.errorRate > 0.1) {
      this.createAlert({
        type: 'network',
        severity: 'error',
        message: `High network error rate: ${(network.errorRate * 100).toFixed(1)}%`,
        metadata: { errorRate: network.errorRate },
      });
    }

    // Cache alerts
    if (cache.hitRate < 0.5) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        message: `Low cache hit rate: ${(cache.hitRate * 100).toFixed(1)}%`,
        metadata: { hitRate: cache.hitRate },
      });
    }

    // Error alerts
    if (errors.errorRate > 5) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        message: `High error rate: ${errors.errorRate.toFixed(1)} errors/minute`,
        metadata: { errorRate: errors.errorRate },
      });
    }
  }

  private createAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: MonitoringAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(newAlert);
    this.notifyAlertSubscribers(newAlert);
    
    logger.warn(`🚨 Alert created: ${alert.message}`);
  }

  /**
   * Capture an error event
   */
  public captureError(error: Omit<ErrorEvent, 'id' | 'timestamp'>): void {
    const errorEvent: ErrorEvent = {
      ...error,
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.recentErrors.push(errorEvent);
    this.errorCount++;

    // Keep only recent errors
    if (this.recentErrors.length > this.config.maxErrors) {
      this.recentErrors = this.recentErrors.slice(-this.config.maxErrors);
    }

    logger.error(`❌ Error captured: ${error.message}`, error.context);
  }

  /**
   * Track screen navigation
   */
  public trackScreen(screenName: string): void {
    this.currentScreen = screenName;
    logger.debug(`📱 Screen tracked: ${screenName}`);
  }

  /**
   * Track user action
   */
  public trackUserAction(action: string, metadata?: Record<string, any>): void {
    logger.debug(`👤 User action: ${action}`, metadata);
  }

  /**
   * Update device information
   */
  public updateDeviceInfo(updates: Partial<DeviceInfo>): void {
    this.deviceInfo = { ...this.deviceInfo, ...updates };
  }

  /**
   * Subscribe to real-time metrics
   */
  public subscribe(callback: (metrics: RealtimeMetrics) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Subscribe to alerts
   */
  public subscribeToAlerts(callback: (alert: MonitoringAlert) => void): () => void {
    this.alertSubscribers.add(callback);
    return () => this.alertSubscribers.delete(callback);
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

  private notifyAlertSubscribers(alert: MonitoringAlert): void {
    this.alertSubscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Alert subscriber callback error:', error);
      }
    });
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): RealtimeMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info(`✅ Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Get monitoring configuration
   */
  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.reportingInterval) {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      if (this.isMonitoring) {
        this.startMonitoring();
      }
    }
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.isMonitoring) {
      this.startMonitoring();
    } else if (!enabled && this.isMonitoring) {
      this.stopMonitoring();
    }
  }

  /**
   * Send metrics to remote endpoint
   */
  public async sendMetricsToRemote(): Promise<void> {
    if (!this.config.remoteEndpoint || !this.config.apiKey) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metrics: this.metrics,
          alerts: this.getActiveAlerts(),
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug('📊 Metrics sent to remote endpoint');
    } catch (error) {
      logger.error('Failed to send metrics to remote endpoint:', error);
    }
  }

  /**
   * Clear all monitoring data
   */
  public clearData(): void {
    this.recentErrors = [];
    this.alerts = [];
    this.errorCount = 0;
    this.metrics = this.initializeMetrics();
    logger.info('🧹 Monitoring data cleared');
  }

  /**
   * Destroy monitoring service
   */
  public destroy(): void {
    this.stopMonitoring();
    this.subscribers.clear();
    this.alertSubscribers.clear();
    this.clearData();
    logger.info('🧹 Real-time monitoring destroyed');
  }
}

export default RealtimeMonitoring;
export const realtimeMonitoring = RealtimeMonitoring.getInstance();
