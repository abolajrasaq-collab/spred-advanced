/**
 * Real-time Monitoring Hook
 * Provides easy access to real-time monitoring functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeMonitoring, RealtimeMetrics, MonitoringAlert } from '../services/RealtimeMonitoring';
import logger from '../utils/logger';

export interface UseRealtimeMonitoringOptions {
  autoStart?: boolean;
  updateInterval?: number;
  enableAlerts?: boolean;
  enablePerformance?: boolean;
  enableNetwork?: boolean;
  enableCache?: boolean;
  enableErrors?: boolean;
}

export interface UseRealtimeMonitoringReturn {
  metrics: RealtimeMetrics | null;
  alerts: MonitoringAlert[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  clearData: () => void;
  resolveAlert: (alertId: string) => void;
  resolveAllAlerts: () => void;
  sendMetrics: () => Promise<void>;
  trackScreen: (screenName: string) => void;
  trackUserAction: (action: string, metadata?: Record<string, any>) => void;
  captureError: (error: { message: string; stack?: string; context?: Record<string, any> }) => void;
  performanceScore: number;
  criticalAlerts: MonitoringAlert[];
  errorAlerts: MonitoringAlert[];
  warningAlerts: MonitoringAlert[];
  isHealthy: boolean;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
}

export const useRealtimeMonitoring = (
  options: UseRealtimeMonitoringOptions = {}
): UseRealtimeMonitoringReturn => {
  const {
    autoStart = true,
    updateInterval = 5000,
    enableAlerts = true,
    enablePerformance = true,
    enableNetwork = true,
    enableCache = true,
    enableErrors = true,
  } = options;

  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Update monitoring state
  const updateMonitoringState = useCallback(() => {
    setIsMonitoring(realtimeMonitoring.getCurrentMetrics() !== null);
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    realtimeMonitoring.startMonitoring();
    updateMonitoringState();

    // Set up periodic updates
    if (updateInterval > 0) {
      updateIntervalRef.current = setInterval(() => {
        const currentMetrics = realtimeMonitoring.getCurrentMetrics();
        const currentAlerts = realtimeMonitoring.getActiveAlerts();
        
        setMetrics(currentMetrics);
        setAlerts(currentAlerts);
        updateMonitoringState();
      }, updateInterval);
    }

    logger.debug('🔍 Real-time monitoring started via hook');
  }, [isMonitoring, updateInterval, updateMonitoringState]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    realtimeMonitoring.stopMonitoring();
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = undefined;
    }

    setIsMonitoring(false);
    logger.debug('🛑 Real-time monitoring stopped via hook');
  }, [isMonitoring]);

  // Clear data
  const clearData = useCallback(() => {
    realtimeMonitoring.clearData();
    setMetrics(null);
    setAlerts([]);
    logger.debug('🧹 Monitoring data cleared via hook');
  }, []);

  // Resolve alert
  const resolveAlert = useCallback((alertId: string) => {
    realtimeMonitoring.resolveAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    logger.debug(`✅ Alert resolved: ${alertId}`);
  }, []);

  // Resolve all alerts
  const resolveAllAlerts = useCallback(() => {
    const currentAlerts = realtimeMonitoring.getActiveAlerts();
    currentAlerts.forEach(alert => {
      realtimeMonitoring.resolveAlert(alert.id);
    });
    setAlerts([]);
    logger.debug('✅ All alerts resolved');
  }, []);

  // Send metrics
  const sendMetrics = useCallback(async () => {
    try {
      await realtimeMonitoring.sendMetricsToRemote();
      logger.debug('📊 Metrics sent to remote endpoint');
    } catch (error) {
      logger.error('Failed to send metrics:', error);
      throw error;
    }
  }, []);

  // Track screen
  const trackScreen = useCallback((screenName: string) => {
    realtimeMonitoring.trackScreen(screenName);
    logger.debug(`📱 Screen tracked: ${screenName}`);
  }, []);

  // Track user action
  const trackUserAction = useCallback((action: string, metadata?: Record<string, any>) => {
    realtimeMonitoring.trackUserAction(action, metadata);
    logger.debug(`👤 User action tracked: ${action}`, metadata);
  }, []);

  // Capture error
  const captureError = useCallback((error: { message: string; stack?: string; context?: Record<string, any> }) => {
    realtimeMonitoring.captureError({
      type: 'javascript',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: error.context || {},
    });
    logger.error(`❌ Error captured: ${error.message}`, error.context);
  }, []);

  // Set up subscriptions
  useEffect(() => {
    // Subscribe to metrics updates
    const unsubscribeMetrics = realtimeMonitoring.subscribe((newMetrics) => {
      if (enablePerformance || enableNetwork || enableCache || enableErrors) {
        setMetrics(newMetrics);
      }
    });

    // Subscribe to alerts
    const unsubscribeAlerts = realtimeMonitoring.subscribeToAlerts((alert) => {
      if (enableAlerts) {
        setAlerts(prev => [...prev, alert]);
      }
    });

    // Initial data load
    const initialMetrics = realtimeMonitoring.getCurrentMetrics();
    const initialAlerts = realtimeMonitoring.getActiveAlerts();
    
    setMetrics(initialMetrics);
    setAlerts(initialAlerts);
    updateMonitoringState();

    // Auto-start if enabled
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [autoStart, startMonitoring, updateMonitoringState, enableAlerts, enablePerformance, enableNetwork, enableCache, enableErrors]);

  // Computed values
  const performanceScore = metrics?.performance.score || 0;
  
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const errorAlerts = alerts.filter(alert => alert.severity === 'error');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  const isHealthy = performanceScore >= 70 && criticalAlerts.length === 0 && errorAlerts.length === 0;
  
  const healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = (() => {
    if (performanceScore >= 90 && criticalAlerts.length === 0 && errorAlerts.length === 0) {
      return 'excellent';
    }
    if (performanceScore >= 70 && criticalAlerts.length === 0) {
      return 'good';
    }
    if (performanceScore >= 50 || criticalAlerts.length > 0) {
      return 'critical';
    }
    return 'warning';
  })();

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearData,
    resolveAlert,
    resolveAllAlerts,
    sendMetrics,
    trackScreen,
    trackUserAction,
    captureError,
    performanceScore,
    criticalAlerts,
    errorAlerts,
    warningAlerts,
    isHealthy,
    healthStatus,
  };
};

// Convenience hook for performance monitoring only
export const usePerformanceMonitoring = () => {
  return useRealtimeMonitoring({
    enablePerformance: true,
    enableAlerts: true,
    enableNetwork: false,
    enableCache: false,
    enableErrors: false,
  });
};

// Convenience hook for error monitoring only
export const useErrorMonitoring = () => {
  return useRealtimeMonitoring({
    enablePerformance: false,
    enableAlerts: true,
    enableNetwork: false,
    enableCache: false,
    enableErrors: true,
  });
};

// Convenience hook for network monitoring only
export const useNetworkMonitoring = () => {
  return useRealtimeMonitoring({
    enablePerformance: false,
    enableAlerts: false,
    enableNetwork: true,
    enableCache: false,
    enableErrors: false,
  });
};

export default useRealtimeMonitoring;
