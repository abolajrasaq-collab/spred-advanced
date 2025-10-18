/**
 * Monitoring Provider Component
 * Provides real-time monitoring context to the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { realtimeMonitoring, RealtimeMetrics, MonitoringAlert } from '../../services/RealtimeMonitoring';
import { WebSocketClient } from '../../services/WebSocketClient';
import { useRealtimeMonitoring } from '../../hooks/useRealtimeMonitoring';
import DevelopmentDashboard from '../DevelopmentDashboard/DevelopmentDashboard';
import ProductionDashboard from '../ProductionDashboard/ProductionDashboard';
import logger from '../../utils/logger';

interface MonitoringContextType {
  metrics: RealtimeMetrics | null;
  alerts: MonitoringAlert[];
  isMonitoring: boolean;
  isConnected: boolean;
  performanceScore: number;
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  startMonitoring: () => void;
  stopMonitoring: () => void;
  trackScreen: (screenName: string) => void;
  trackUserAction: (action: string, metadata?: Record<string, any>) => void;
  captureError: (error: { message: string; stack?: string; context?: Record<string, any> }) => void;
  resolveAlert: (alertId: string) => void;
  resolveAllAlerts: () => void;
  sendMetrics: () => Promise<void>;
  clearData: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

interface MonitoringProviderProps {
  children: ReactNode;
  enableWebSocket?: boolean;
  webSocketUrl?: string;
  enableDevelopmentDashboard?: boolean;
  enableProductionDashboard?: boolean;
  isAdmin?: boolean;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({
  children,
  enableWebSocket = __DEV__,
  webSocketUrl = 'ws://localhost:8080',
  enableDevelopmentDashboard = __DEV__,
  enableProductionDashboard = !__DEV__,
  isAdmin = false,
}) => {
  const [webSocketClient, setWebSocketClient] = useState<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    trackScreen,
    trackUserAction,
    captureError,
    resolveAlert,
    resolveAllAlerts,
    sendMetrics,
    clearData,
    performanceScore,
    healthStatus,
  } = useRealtimeMonitoring({
    autoStart: true,
    updateInterval: 5000,
    enableAlerts: true,
    enablePerformance: true,
    enableNetwork: true,
    enableCache: true,
    enableErrors: true,
  });

  // Initialize WebSocket client
  useEffect(() => {
    if (enableWebSocket && __DEV__) {
      const client = new WebSocketClient({
        url: webSocketUrl,
        autoConnect: true,
        reconnectOnClose: true,
        onConnect: () => {
          setIsConnected(true);
          logger.info('🌐 Connected to monitoring server');
        },
        onDisconnect: () => {
          setIsConnected(false);
          logger.warn('🌐 Disconnected from monitoring server');
        },
        onMessage: (message) => {
          logger.debug('📨 Received monitoring message:', message.type);
        },
        onError: (error) => {
          logger.error('🌐 WebSocket error:', error);
        },
      });

      setWebSocketClient(client);

      return () => {
        client.destroy();
      };
    }
  }, [enableWebSocket, webSocketUrl]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App became active - ensure monitoring is running
        if (!isMonitoring) {
          startMonitoring();
        }
      } else if (nextAppState === 'background') {
        // App went to background - stop monitoring to save battery
        if (isMonitoring) {
          stopMonitoring();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  // Auto-send metrics to WebSocket server
  useEffect(() => {
    if (webSocketClient && isConnected && metrics) {
      webSocketClient.send({
        type: 'metrics',
        data: metrics,
      });
    }
  }, [webSocketClient, isConnected, metrics]);

  // Auto-send alerts to WebSocket server
  useEffect(() => {
    if (webSocketClient && isConnected && alerts.length > 0) {
      alerts.forEach(alert => {
        webSocketClient.send({
          type: 'alert',
          data: alert,
        });
      });
    }
  }, [webSocketClient, isConnected, alerts]);

  // Enhanced error handling
  const enhancedCaptureError = (error: { message: string; stack?: string; context?: Record<string, any> }) => {
    captureError(error);
    
    // Also send to WebSocket server
    if (webSocketClient && isConnected) {
      webSocketClient.send({
        type: 'error',
        data: {
          message: error.message,
          stack: error.stack,
          context: error.context,
          timestamp: Date.now(),
          platform: Platform.OS,
          version: Platform.Version,
        },
      });
    }
  };

  // Enhanced screen tracking
  const enhancedTrackScreen = (screenName: string) => {
    trackScreen(screenName);
    
    // Also send to WebSocket server
    if (webSocketClient && isConnected) {
      webSocketClient.send({
        type: 'screen',
        data: {
          screenName,
          timestamp: Date.now(),
        },
      });
    }
  };

  // Enhanced user action tracking
  const enhancedTrackUserAction = (action: string, metadata?: Record<string, any>) => {
    trackUserAction(action, metadata);
    
    // Also send to WebSocket server
    if (webSocketClient && isConnected) {
      webSocketClient.send({
        type: 'action',
        data: {
          action,
          metadata,
          timestamp: Date.now(),
        },
      });
    }
  };

  // Enhanced alert resolution
  const enhancedResolveAlert = (alertId: string) => {
    resolveAlert(alertId);
    
    // Also send to WebSocket server
    if (webSocketClient && isConnected) {
      webSocketClient.send({
        type: 'resolve_alert',
        data: { alertId },
      });
    }
  };

  // Enhanced metrics sending
  const enhancedSendMetrics = async () => {
    await sendMetrics();
    
    // Also send to WebSocket server
    if (webSocketClient && isConnected) {
      webSocketClient.send({
        type: 'metrics',
        data: metrics,
      });
    }
  };

  const contextValue: MonitoringContextType = {
    metrics,
    alerts,
    isMonitoring,
    isConnected,
    performanceScore,
    healthStatus,
    startMonitoring,
    stopMonitoring,
    trackScreen: enhancedTrackScreen,
    trackUserAction: enhancedTrackUserAction,
    captureError: enhancedCaptureError,
    resolveAlert: enhancedResolveAlert,
    resolveAllAlerts,
    sendMetrics: enhancedSendMetrics,
    clearData,
  };

  return (
    <MonitoringContext.Provider value={contextValue}>
      {children}
      {/* Development Dashboard */}
      {enableDevelopmentDashboard && __DEV__ && (
        <DevelopmentDashboardWrapper />
      )}
      {/* Production Dashboard */}
      {enableProductionDashboard && !__DEV__ && isAdmin && (
        <ProductionDashboardWrapper />
      )}
    </MonitoringContext.Provider>
  );
};

// Development Dashboard Wrapper
const DevelopmentDashboardWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { metrics, alerts, performanceScore, healthStatus } = useMonitoring();

  // Auto-hide dashboard if performance is excellent
  useEffect(() => {
    if (performanceScore >= 90 && alerts.length === 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [performanceScore, alerts.length]);

  if (!isVisible) {
    return null;
  }

  return (
    <DevelopmentDashboard
      visible={isVisible}
      onClose={() => setIsVisible(false)}
      position="floating"
    />
  );
};

// Production Dashboard Wrapper
const ProductionDashboardWrapper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { healthStatus, alerts } = useMonitoring();

  // Auto-show dashboard if health is critical
  useEffect(() => {
    if (healthStatus === 'critical' || alerts.some(alert => alert.severity === 'critical')) {
      setIsVisible(true);
    }
  }, [healthStatus, alerts]);

  return (
    <ProductionDashboard
      visible={isVisible}
      onClose={() => setIsVisible(false)}
      isAdmin={true}
    />
  );
};

// Hook to use monitoring context
export const useMonitoring = (): MonitoringContextType => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

// Convenience hooks for specific monitoring aspects
export const usePerformanceMonitoring = () => {
  const { metrics, performanceScore, healthStatus } = useMonitoring();
  return {
    metrics: metrics?.performance,
    score: performanceScore,
    healthStatus,
  };
};

export const useAlertMonitoring = () => {
  const { alerts, resolveAlert, resolveAllAlerts } = useMonitoring();
  return {
    alerts,
    criticalAlerts: alerts.filter(alert => alert.severity === 'critical'),
    errorAlerts: alerts.filter(alert => alert.severity === 'error'),
    warningAlerts: alerts.filter(alert => alert.severity === 'warning'),
    resolveAlert,
    resolveAllAlerts,
  };
};

export const useNetworkMonitoring = () => {
  const { metrics } = useMonitoring();
  return {
    metrics: metrics?.network,
    isHealthy: (metrics?.network.errorRate || 0) < 0.1,
  };
};

export const useCacheMonitoring = () => {
  const { metrics } = useMonitoring();
  return {
    metrics: metrics?.cache,
    isHealthy: (metrics?.cache.hitRate || 0) > 0.7,
  };
};

export const useErrorMonitoring = () => {
  const { metrics, captureError } = useMonitoring();
  return {
    metrics: metrics?.errors,
    captureError,
  };
};

export default MonitoringProvider;
