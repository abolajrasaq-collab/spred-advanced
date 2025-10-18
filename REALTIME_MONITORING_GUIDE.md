# Real-Time Monitoring System Guide

## Overview

The Spred app now includes a comprehensive real-time monitoring system that provides live performance metrics, alerts, and optimization tools for both development and production environments.

## Features

### 🚀 **Real-Time Metrics Collection**
- Performance monitoring (FPS, render time, memory usage, CPU usage)
- Network monitoring (latency, bandwidth, request success rates)
- Cache monitoring (hit rates, memory usage, eviction rates)
- User activity tracking (active users, screen views, interactions)
- Error tracking (error rates, crash detection, stack traces)

### 📊 **Smart Alerting System**
- Automatic issue detection with severity levels
- Customizable thresholds for different environments
- Real-time notifications for critical issues
- Alert resolution tracking

### 🎯 **Environment-Specific Dashboards**
- **Development Dashboard**: Detailed metrics with optimization tools
- **Production Dashboard**: Critical alerts and system health overview

### ⚡ **Performance Optimization**
- Automatic performance mode switching
- Memory cleanup and garbage collection
- Cache optimization and eviction
- Network request optimization

## Quick Start

### 1. Start the Monitoring Server

```bash
# Development environment
npm run monitor:dev

# Production environment
npm run monitor:prod

# Test the monitoring system
npm run monitor:test

# Check server status
npm run monitor:status
```

### 2. Enable Monitoring in Your App

Add the monitoring provider to your app root:

```typescript
import React from 'react';
import { MonitoringProvider } from './src/components/MonitoringProvider/MonitoringProvider';
import { DevelopmentDashboard } from './src/components/DevelopmentDashboard/DevelopmentDashboard';
import { ProductionDashboard } from './src/components/ProductionDashboard/ProductionDashboard';

const App = () => {
  const isDevelopment = __DEV__;
  
  return (
    <MonitoringProvider>
      {/* Your app components */}
      
      {/* Add dashboard based on environment */}
      {isDevelopment ? (
        <DevelopmentDashboard position="floating" />
      ) : (
        <ProductionDashboard position="floating" />
      )}
    </MonitoringProvider>
  );
};
```

### 3. Use the Monitoring Hook

```typescript
import React from 'react';
import { useRealtimeMonitoring } from './src/hooks/useRealtimeMonitoring';

const MyComponent = () => {
  const { metrics, alerts, isLoading } = useRealtimeMonitoring();
  
  if (isLoading) return <Text>Loading metrics...</Text>;
  
  return (
    <View>
      <Text>Performance Score: {metrics?.performance.score}</Text>
      <Text>Active Alerts: {alerts?.length || 0}</Text>
    </View>
  );
};
```

## Dashboard Components

### Development Dashboard

**Features:**
- 📊 Real-time performance metrics
- 🚨 Active alerts with resolution options
- 🚀 Performance optimization tools
- 🧹 Data cleanup utilities
- 📈 Detailed performance breakdown

**Usage:**
```typescript
<DevelopmentDashboard
  visible={true}
  position="floating" // 'top', 'bottom', or 'floating'
  onClose={() => setDashboardVisible(false)}
/>
```

### Production Dashboard

**Features:**
- 📊 System health overview
- 🚨 Critical alerts only
- 👥 User activity metrics
- 📈 Error rate monitoring
- 🔒 Production-safe operations

**Usage:**
```typescript
<ProductionDashboard
  visible={true}
  position="bottom"
  onClose={() => setDashboardVisible(false)}
/>
```

## Monitoring Services

### RealtimeMonitoring Service

Core monitoring service that collects and manages metrics:

```typescript
import { realtimeMonitoring } from './src/services/RealtimeMonitoring';

// Subscribe to metrics updates
const unsubscribe = realtimeMonitoring.subscribe((metrics) => {
  console.log('New metrics:', metrics);
});

// Subscribe to alerts
const unsubscribeAlerts = realtimeMonitoring.subscribeToAlerts((alert) => {
  console.log('New alert:', alert);
});

// Get current metrics
const currentMetrics = realtimeMonitoring.getMetrics();

// Get active alerts
const activeAlerts = realtimeMonitoring.getActiveAlerts();

// Resolve an alert
realtimeMonitoring.resolveAlert(alertId);
```

### WebSocket Client

Real-time communication with the monitoring server:

```typescript
import { WebSocketClient } from './src/services/WebSocketClient';

const wsClient = new WebSocketClient();

// Connect to monitoring server
wsClient.connect('ws://localhost:8080');

// Subscribe to updates
wsClient.subscribe('metrics', (data) => {
  console.log('Metrics update:', data);
});

// Send custom metrics
wsClient.send('custom-metric', { value: 123 });
```

## Performance Optimization

### Automatic Optimization

The system automatically optimizes performance based on metrics:

```typescript
import { performanceMonitor } from './src/services/AdvancedPerformanceMonitor';

// Force cleanup (development only)
performanceMonitor.forceCleanup();

// Get performance score
const score = performanceMonitor.getPerformanceScore();

// Check if optimization is needed
const needsOptimization = performanceMonitor.needsOptimization();
```

### Cache Management

```typescript
import { cacheManager } from './src/services/AdvancedCacheManager';

// Clear cache
cacheManager.clear();

// Get cache statistics
const stats = cacheManager.getStats();

// Optimize cache
cacheManager.optimize();
```

### Network Optimization

```typescript
import { networkOptimizer } from './src/services/NetworkOptimizer';

// Reset network statistics
networkOptimizer.resetStats();

// Get network performance
const performance = networkOptimizer.getPerformance();
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_SERVER_URL=ws://localhost:8080
MONITORING_UPDATE_INTERVAL=1000
MONITORING_ALERT_THRESHOLDS={"fps": 30, "memory": 200, "latency": 500}

# Performance Thresholds
PERFORMANCE_THRESHOLD_LOW=60
PERFORMANCE_THRESHOLD_HIGH=80
PERFORMANCE_CLEANUP_INTERVAL=30000

# Cache Configuration
CACHE_MAX_SIZE=50
CACHE_TTL=300000
CACHE_CLEANUP_INTERVAL=60000
```

### Custom Alert Thresholds

```typescript
import { realtimeMonitoring } from './src/services/RealtimeMonitoring';

// Set custom thresholds
realtimeMonitoring.setThresholds({
  fps: { warning: 30, critical: 20 },
  memory: { warning: 200, critical: 300 },
  latency: { warning: 500, critical: 1000 },
  errorRate: { warning: 5, critical: 10 }
});
```

## Troubleshooting

### Common Issues

**1. Monitoring Server Not Starting**
```bash
# Check if port 8080 is available
netstat -an | grep 8080

# Try a different port
MONITORING_PORT=8081 npm run monitor:dev
```

**2. WebSocket Connection Failed**
```bash
# Check server status
npm run monitor:status

# Restart the server
npm run monitor:dev
```

**3. High Memory Usage**
```bash
# Clear monitoring data
# Use the "Clear Data" button in the dashboard
# Or programmatically:
realtimeMonitoring.clearData();
```

**4. Performance Impact**
```typescript
// Reduce monitoring frequency
realtimeMonitoring.setUpdateInterval(5000); // 5 seconds instead of 1 second

// Disable certain metrics
realtimeMonitoring.disableMetric('cpu');
realtimeMonitoring.disableMetric('battery');
```

### Debug Mode

Enable debug logging:

```typescript
import logger from './src/utils/logger';

// Enable debug mode
logger.setLevel('debug');

// Monitor specific events
logger.debug('Monitoring metrics updated', metrics);
logger.debug('Alert triggered', alert);
```

## Best Practices

### Development Environment
1. **Always use DevelopmentDashboard** for detailed insights
2. **Enable all metrics** to identify performance bottlenecks
3. **Use optimization tools** to test performance improvements
4. **Monitor memory usage** to prevent memory leaks
5. **Set up alerts** for performance regressions

### Production Environment
1. **Use ProductionDashboard** for critical monitoring only
2. **Focus on critical alerts** (errors, crashes, high latency)
3. **Monitor user experience** metrics (render time, FPS)
4. **Set up automated alerts** for system administrators
5. **Regular performance reviews** using collected data

### Performance Optimization
1. **Monitor trends** over time, not just current values
2. **Use automatic optimization** as a baseline
3. **Test optimizations** in development first
4. **Document performance changes** and their impact
5. **Regular cleanup** of monitoring data

## API Reference

### RealtimeMonitoring Service

```typescript
class RealtimeMonitoring {
  // Core methods
  subscribe(callback: (metrics: RealtimeMetrics) => void): () => void
  subscribeToAlerts(callback: (alert: MonitoringAlert) => void): () => void
  getMetrics(): RealtimeMetrics | null
  getActiveAlerts(): MonitoringAlert[]
  resolveAlert(alertId: string): void
  clearData(): void
  
  // Configuration
  setThresholds(thresholds: AlertThresholds): void
  setUpdateInterval(interval: number): void
  enableMetric(metric: string): void
  disableMetric(metric: string): void
}
```

### Monitoring Types

```typescript
interface RealtimeMetrics {
  performance: {
    score: number;
    renderTime: number;
    memoryUsage: number;
    cpuUsage: number;
    frameDrops: number;
  };
  network: {
    averageLatency: number;
    successRate: number;
    bandwidth: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictionRate: number;
  };
  user: {
    activeUsers: number;
    screenName: string;
    deviceInfo: DeviceInfo;
  };
  errors: {
    errorRate: number;
    crashCount: number;
  };
}

interface MonitoringAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}
```

## Support

For issues or questions about the real-time monitoring system:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Test with the monitoring server status command
4. Verify WebSocket connectivity
5. Check environment configuration

The monitoring system is designed to be lightweight and non-intrusive while providing valuable insights into your app's performance and user experience.