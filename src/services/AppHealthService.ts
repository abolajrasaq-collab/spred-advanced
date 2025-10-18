import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from './AnalyticsService';
import PerformanceMonitoringService from './PerformanceMonitoringService';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface AppHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetric[];
  lastUpdated: number;
  recommendations: string[];
}

interface SystemInfo {
  platform: string;
  version: string;
  model?: string;
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  battery: {
    level: number;
    isCharging: boolean;
  };
  network: {
    type: string;
    isConnected: boolean;
    speed?: number;
  };
}

class AppHealthService {
  private static instance: AppHealthService;
  private healthStatus: AppHealthStatus | null = null;
  private systemInfo: SystemInfo | null = null;
  private monitoringActive: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'app_health_data';
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  private constructor() {
    this.initializeHealthMonitoring();
  }

  public static getInstance(): AppHealthService {
    if (!AppHealthService.instance) {
      AppHealthService.instance = new AppHealthService();
    }
    return AppHealthService.instance;
  }

  private async initializeHealthMonitoring(): Promise<void> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🏥 Initializing App Health Service...');

      // Load existing health data
      await this.loadHealthData();

      // Start monitoring
      this.startHealthMonitoring();

      // DISABLED FOR PERFORMANCE
      // console.log('✅ App Health Service initialized');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize App Health Service:', error);
    }
  }

  private async loadHealthData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data);
        this.healthStatus = parsedData.healthStatus;
        this.systemInfo = parsedData.systemInfo;
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load health data:', error);
    }
  }

  private async saveHealthData(): Promise<void> {
    try {
      const data = {
        healthStatus: this.healthStatus,
        systemInfo: this.systemInfo,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save health data:', error);
    }
  }

  public async startHealthMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Health monitoring already active');
      return;
    }

    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🏥 Starting app health monitoring...');

      this.monitoringActive = true;

      // Initial health check
      await this.performHealthCheck();

      // Set up periodic health checks
      this.healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck();
      }, this.HEALTH_CHECK_INTERVAL);

      AnalyticsService.trackEvent('health_monitoring_started');
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Health monitoring started');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to start health monitoring:', error);
    }
  }

  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.monitoringActive = false;
    // DISABLED FOR PERFORMANCE
    // console.log('⏹️ Health monitoring stopped');
  }

  public async performHealthCheck(): Promise<AppHealthStatus> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🔍 Performing health check...');

      // Collect system information
      await this.collectSystemInfo();

      // Collect health metrics
      const metrics = await this.collectHealthMetrics();

      // Determine overall health status
      const overall = this.determineOverallHealth(metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics);

      // Update health status
      this.healthStatus = {
        overall,
        metrics,
        lastUpdated: Date.now(),
        recommendations,
      };

      // Save health data
      await this.saveHealthData();

      // Track health status
      AnalyticsService.trackEvent('health_check_completed', {
        overall,
        metricsCount: metrics.length,
        recommendationsCount: recommendations.length,
      });

      // DISABLED FOR PERFORMANCE
      // console.log(`✅ Health check completed - Status: ${overall}`);
      return this.healthStatus;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Health check failed:', error);
      throw error;
    }
  }

  private async collectSystemInfo(): Promise<void> {
    try {
      // Basic system info
      const systemInfo: SystemInfo = {
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Platform.OS === 'ios' ? Platform.constants?.model : undefined,
        memory: await this.getMemoryInfo(),
        storage: await this.getStorageInfo(),
        battery: await this.getBatteryInfo(),
        network: await this.getNetworkInfo(),
      };

      this.systemInfo = systemInfo;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to collect system info:', error);
    }
  }

  private async getMemoryInfo(): Promise<SystemInfo['memory']> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use native modules to get actual memory info
      return {
        total: 4000, // MB
        used: 2000, // MB
        free: 2000, // MB
        percentage: 50,
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      };
    }
  }

  private async getStorageInfo(): Promise<SystemInfo['storage']> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use react-native-fs to get actual storage info
      return {
        total: 32000, // MB
        used: 16000, // MB
        free: 16000, // MB
        percentage: 50,
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        free: 0,
        percentage: 0,
      };
    }
  }

  private async getBatteryInfo(): Promise<SystemInfo['battery']> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a battery monitoring library
      return {
        level: 75,
        isCharging: false,
      };
    } catch (error) {
      return {
        level: 0,
        isCharging: false,
      };
    }
  }

  private async getNetworkInfo(): Promise<SystemInfo['network']> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use @react-native-community/netinfo
      return {
        type: 'wifi',
        isConnected: true,
        speed: 100, // Mbps
      };
    } catch (error) {
      return {
        type: 'unknown',
        isConnected: false,
      };
    }
  }

  private async collectHealthMetrics(): Promise<HealthMetric[]> {
    const metrics: HealthMetric[] = [];

    try {
      // Memory usage metric
      if (this.systemInfo?.memory) {
        metrics.push({
          name: 'Memory Usage',
          value: this.systemInfo.memory.percentage,
          unit: '%',
          status: this.getMetricStatus(
            this.systemInfo.memory.percentage,
            70,
            90,
          ),
          timestamp: Date.now(),
          threshold: { warning: 70, critical: 90 },
        });
      }

      // Storage usage metric
      if (this.systemInfo?.storage) {
        metrics.push({
          name: 'Storage Usage',
          value: this.systemInfo.storage.percentage,
          unit: '%',
          status: this.getMetricStatus(
            this.systemInfo.storage.percentage,
            80,
            95,
          ),
          timestamp: Date.now(),
          threshold: { warning: 80, critical: 95 },
        });
      }

      // Battery level metric
      if (this.systemInfo?.battery) {
        metrics.push({
          name: 'Battery Level',
          value: this.systemInfo.battery.level,
          unit: '%',
          status: this.getMetricStatus(
            this.systemInfo.battery.level,
            20,
            10,
            true,
          ), // Inverted thresholds
          timestamp: Date.now(),
          threshold: { warning: 20, critical: 10 },
        });
      }

      // Performance metrics
      const performanceStats =
        PerformanceMonitoringService.getPerformanceStats();

      metrics.push({
        name: 'Average Load Time',
        value: performanceStats.averageLoadTime,
        unit: 'ms',
        status: this.getMetricStatus(
          performanceStats.averageLoadTime,
          1000,
          2000,
        ),
        timestamp: Date.now(),
        threshold: { warning: 1000, critical: 2000 },
      });

      metrics.push({
        name: 'Error Rate',
        value: performanceStats.errorCount,
        unit: 'count',
        status: this.getMetricStatus(performanceStats.errorCount, 5, 10),
        timestamp: Date.now(),
        threshold: { warning: 5, critical: 10 },
      });

      metrics.push({
        name: 'Crash Count',
        value: performanceStats.crashCount,
        unit: 'count',
        status: this.getMetricStatus(performanceStats.crashCount, 1, 3),
        timestamp: Date.now(),
        threshold: { warning: 1, critical: 3 },
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to collect health metrics:', error);
    }

    return metrics;
  }

  private getMetricStatus(
    value: number,
    warningThreshold: number,
    criticalThreshold: number,
    inverted: boolean = false,
  ): 'healthy' | 'warning' | 'critical' {
    if (inverted) {
      if (value <= criticalThreshold) {
        return 'critical';
      }
      if (value <= warningThreshold) {
        return 'warning';
      }
      return 'healthy';
    } else {
      if (value >= criticalThreshold) {
        return 'critical';
      }
      if (value >= warningThreshold) {
        return 'warning';
      }
      return 'healthy';
    }
  }

  private determineOverallHealth(
    metrics: HealthMetric[],
  ): 'healthy' | 'warning' | 'critical' {
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;

    if (criticalCount > 0) {
      return 'critical';
    }
    if (warningCount > 0) {
      return 'warning';
    }
    return 'healthy';
  }

  private generateRecommendations(metrics: HealthMetric[]): string[] {
    const recommendations: string[] = [];

    metrics.forEach(metric => {
      switch (metric.name) {
        case 'Memory Usage':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push('Close unused apps to free up memory');
          }
          break;
        case 'Storage Usage':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push('Clear cache and delete unused files');
          }
          break;
        case 'Battery Level':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push(
              'Connect to charger or reduce screen brightness',
            );
          }
          break;
        case 'Average Load Time':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push('Restart the app to improve performance');
          }
          break;
        case 'Error Rate':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push(
              'Check network connection and restart the app',
            );
          }
          break;
        case 'Crash Count':
          if (metric.status === 'warning' || metric.status === 'critical') {
            recommendations.push('Update the app to the latest version');
          }
          break;
      }
    });

    return recommendations;
  }

  public getHealthStatus(): AppHealthStatus | null {
    return this.healthStatus;
  }

  public getSystemInfo(): SystemInfo | null {
    return this.systemInfo;
  }

  public isMonitoringActive(): boolean {
    return this.monitoringActive;
  }

  public async getHealthReport(): Promise<{
    status: AppHealthStatus;
    systemInfo: SystemInfo;
    trends: {
      memoryTrend: Array<{ timestamp: number; value: number }>;
      performanceTrend: Array<{ timestamp: number; value: number }>;
    };
  }> {
    try {
      // This would include historical data and trends
      // For now, return current data
      return {
        status: this.healthStatus!,
        systemInfo: this.systemInfo!,
        trends: {
          memoryTrend: [],
          performanceTrend: [],
        },
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to generate health report:', error);
      throw error;
    }
  }

  public async clearHealthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.healthStatus = null;
      this.systemInfo = null;
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Health data cleared');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear health data:', error);
    }
  }

  public async exportHealthData(): Promise<string> {
    try {
      const data = {
        healthStatus: this.healthStatus,
        systemInfo: this.systemInfo,
        exportedAt: Date.now(),
        version: '1.0.0',
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to export health data:', error);
      throw error;
    }
  }
}

export default AppHealthService.getInstance();
