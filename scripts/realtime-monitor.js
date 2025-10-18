#!/usr/bin/env node

/**
 * Real-time Monitoring Script with WebSocket Support
 * Advanced monitoring tool for development and production environments
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  port: 8080,
  logFile: path.join(__dirname, '../monitoring-logs.json'),
  metricsFile: path.join(__dirname, '../monitoring-metrics.json'),
  alertFile: path.join(__dirname, '../monitoring-alerts.json'),
  updateInterval: 1000, // 1 second for real-time updates
  maxClients: 10,
  enableWebSocket: true,
  enableFileLogging: true,
  enableConsoleOutput: true,
  thresholds: {
    performance: {
      excellent: 90,
      good: 80,
      warning: 70,
      critical: 60,
    },
    memory: {
      warning: 80,
      critical: 90,
    },
    network: {
      warning: 1000,
      critical: 2000,
    },
    cache: {
      warning: 50,
      critical: 30,
    },
  },
};

// Global state
let metrics = {
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
    sessionId: 'monitor_session',
    screenName: 'monitor',
    deviceInfo: {
      platform: 'monitor',
      version: '1.0.0',
      model: 'Monitor Device',
      screenSize: '1920x1080',
      memory: 8192,
      isConnected: true,
    },
  },
  errors: {
    totalErrors: 0,
    recentErrors: [],
    errorRate: 0,
  },
};

let alerts = [];
let clients = new Set();
let server = null;

// Initialize monitoring
function initializeMonitoring() {
  console.log('🚀 Starting Real-time Monitoring Server...');
  console.log(`📊 Port: ${config.port}`);
  console.log(`📁 Log file: ${config.logFile}`);
  console.log(`📈 Metrics file: ${config.metricsFile}`);
  console.log(`🚨 Alerts file: ${config.alertFile}`);
  
  // Create files if they don't exist
  createFilesIfNotExist();
  
  // Start WebSocket server
  if (config.enableWebSocket) {
    startWebSocketServer();
  }
  
  // Start metrics collection
  startMetricsCollection();
  
  // Start alert monitoring
  startAlertMonitoring();
  
  console.log('✅ Real-time monitoring initialized');
}

// Create files if they don't exist
function createFilesIfNotExist() {
  const files = [
    { path: config.logFile, content: [] },
    { path: config.metricsFile, content: metrics },
    { path: config.alertFile, content: [] },
  ];
  
  files.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, JSON.stringify(file.content, null, 2));
    }
  });
}

// Start WebSocket server
function startWebSocketServer() {
  server = new WebSocket.Server({ port: config.port });
  
  server.on('connection', (ws) => {
    if (clients.size >= config.maxClients) {
      ws.close(1008, 'Maximum clients reached');
      return;
    }
    
    clients.add(ws);
    console.log(`📱 Client connected. Total clients: ${clients.size}`);
    
    // Send initial data
    ws.send(JSON.stringify({
      type: 'metrics',
      data: metrics,
    }));
    
    ws.send(JSON.stringify({
      type: 'alerts',
      data: alerts,
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(ws, data);
      } catch (error) {
        console.error('Invalid message from client:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`📱 Client disconnected. Total clients: ${clients.size}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  server.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  console.log(`🌐 WebSocket server listening on port ${config.port}`);
}

// Handle client messages
function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'get_metrics':
      ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
      break;
    case 'get_alerts':
      ws.send(JSON.stringify({ type: 'alerts', data: alerts }));
      break;
    case 'resolve_alert':
      resolveAlert(data.alertId);
      break;
    case 'clear_data':
      clearData();
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Start metrics collection
function startMetricsCollection() {
  setInterval(() => {
    collectMetrics();
    broadcastMetrics();
    logMetrics();
  }, config.updateInterval);
}

// Collect metrics (simulated for demo)
function collectMetrics() {
  const now = Date.now();
  
  // Simulate realistic performance metrics
  metrics.timestamp = now;
  
  // Performance metrics with some variation
  metrics.performance.renderTime = Math.max(5, Math.random() * 25 + 5);
  metrics.performance.memoryUsage = Math.random() * 100;
  metrics.performance.frameDrops = Math.floor(Math.random() * 10);
  metrics.performance.cpuUsage = Math.random() * 100;
  
  // Network metrics
  metrics.network.totalRequests += Math.floor(Math.random() * 5);
  metrics.network.successfulRequests += Math.floor(Math.random() * 4);
  metrics.network.failedRequests += Math.floor(Math.random() * 1);
  metrics.network.averageLatency = Math.random() * 2000 + 100;
  metrics.network.cacheHitRate = Math.random() * 100;
  
  // Cache metrics
  metrics.cache.totalItems = Math.floor(Math.random() * 1000) + 100;
  metrics.cache.totalSize = Math.random() * 100 * 1024 * 1024;
  metrics.cache.hitRate = Math.random() * 100;
  metrics.cache.missRate = Math.random() * 100;
  metrics.cache.evictions = Math.floor(Math.random() * 50);
  
  // Error metrics
  metrics.errors.totalErrors += Math.floor(Math.random() * 2);
  metrics.errors.errorRate = Math.random() * 10;
  
  // Calculate performance score
  let score = 100;
  if (metrics.performance.renderTime > 16) score -= 20;
  if (metrics.performance.memoryUsage > 80) score -= 25;
  if (metrics.performance.frameDrops > 5) score -= 15;
  if (metrics.network.averageLatency > 1000) score -= 10;
  if (metrics.cache.hitRate < 70) score -= 10;
  if (metrics.errors.errorRate > 5) score -= 20;
  
  metrics.performance.score = Math.max(0, score);
}

// Broadcast metrics to all connected clients
function broadcastMetrics() {
  if (clients.size === 0) return;
  
  const message = JSON.stringify({
    type: 'metrics',
    data: metrics,
    timestamp: Date.now(),
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Log metrics to file
function logMetrics() {
  if (!config.enableFileLogging) return;
  
  try {
    // Save current metrics
    fs.writeFileSync(config.metricsFile, JSON.stringify(metrics, null, 2));
    
    // Append to log file
    const logEntry = {
      timestamp: metrics.timestamp,
      score: metrics.performance.score,
      renderTime: metrics.performance.renderTime,
      memoryUsage: metrics.performance.memoryUsage,
      networkLatency: metrics.network.averageLatency,
      cacheHitRate: metrics.cache.hitRate,
      errors: metrics.errors.totalErrors,
    };
    
    const logs = JSON.parse(fs.readFileSync(config.logFile, 'utf8'));
    logs.push(logEntry);
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    fs.writeFileSync(config.logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to log metrics:', error);
  }
}

// Start alert monitoring
function startAlertMonitoring() {
  setInterval(() => {
    checkForAlerts();
  }, config.updateInterval * 5); // Check every 5 seconds
}

// Check for alerts
function checkForAlerts() {
  const newAlerts = [];
  
  // Performance alerts
  if (metrics.performance.score < config.thresholds.performance.critical) {
    newAlerts.push({
      id: `perf_critical_${Date.now()}`,
      type: 'performance',
      severity: 'critical',
      message: `Critical performance score: ${metrics.performance.score}`,
      timestamp: Date.now(),
      metadata: { score: metrics.performance.score },
    });
  } else if (metrics.performance.score < config.thresholds.performance.warning) {
    newAlerts.push({
      id: `perf_warning_${Date.now()}`,
      type: 'performance',
      severity: 'warning',
      message: `Low performance score: ${metrics.performance.score}`,
      timestamp: Date.now(),
      metadata: { score: metrics.performance.score },
    });
  }
  
  // Memory alerts
  if (metrics.performance.memoryUsage > config.thresholds.memory.critical) {
    newAlerts.push({
      id: `mem_critical_${Date.now()}`,
      type: 'memory',
      severity: 'critical',
      message: `Critical memory usage: ${metrics.performance.memoryUsage.toFixed(1)}%`,
      timestamp: Date.now(),
      metadata: { memoryUsage: metrics.performance.memoryUsage },
    });
  } else if (metrics.performance.memoryUsage > config.thresholds.memory.warning) {
    newAlerts.push({
      id: `mem_warning_${Date.now()}`,
      type: 'memory',
      severity: 'warning',
      message: `High memory usage: ${metrics.performance.memoryUsage.toFixed(1)}%`,
      timestamp: Date.now(),
      metadata: { memoryUsage: metrics.performance.memoryUsage },
    });
  }
  
  // Network alerts
  if (metrics.network.averageLatency > config.thresholds.network.critical) {
    newAlerts.push({
      id: `net_critical_${Date.now()}`,
      type: 'network',
      severity: 'critical',
      message: `Critical network latency: ${metrics.network.averageLatency.toFixed(0)}ms`,
      timestamp: Date.now(),
      metadata: { latency: metrics.network.averageLatency },
    });
  } else if (metrics.network.averageLatency > config.thresholds.network.warning) {
    newAlerts.push({
      id: `net_warning_${Date.now()}`,
      type: 'network',
      severity: 'warning',
      message: `High network latency: ${metrics.network.averageLatency.toFixed(0)}ms`,
      timestamp: Date.now(),
      metadata: { latency: metrics.network.averageLatency },
    });
  }
  
  // Cache alerts
  if (metrics.cache.hitRate < config.thresholds.cache.critical) {
    newAlerts.push({
      id: `cache_critical_${Date.now()}`,
      type: 'cache',
      severity: 'critical',
      message: `Critical cache hit rate: ${metrics.cache.hitRate.toFixed(1)}%`,
      timestamp: Date.now(),
      metadata: { hitRate: metrics.cache.hitRate },
    });
  } else if (metrics.cache.hitRate < config.thresholds.cache.warning) {
    newAlerts.push({
      id: `cache_warning_${Date.now()}`,
      type: 'cache',
      severity: 'warning',
      message: `Low cache hit rate: ${metrics.cache.hitRate.toFixed(1)}%`,
      timestamp: Date.now(),
      metadata: { hitRate: metrics.cache.hitRate },
    });
  }
  
  // Add new alerts
  newAlerts.forEach(alert => {
    if (!alerts.find(existing => existing.id === alert.id)) {
      alerts.push(alert);
      broadcastAlert(alert);
      logAlert(alert);
    }
  });
  
  // Clean up old alerts (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  alerts = alerts.filter(alert => alert.timestamp > oneHourAgo);
}

// Broadcast alert to all connected clients
function broadcastAlert(alert) {
  if (clients.size === 0) return;
  
  const message = JSON.stringify({
    type: 'alert',
    data: alert,
    timestamp: Date.now(),
  });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Log alert to file
function logAlert(alert) {
  if (!config.enableFileLogging) return;
  
  try {
    const alertLogs = JSON.parse(fs.readFileSync(config.alertFile, 'utf8'));
    alertLogs.push(alert);
    
    // Keep only last 500 alerts
    if (alertLogs.length > 500) {
      alertLogs.splice(0, alertLogs.length - 500);
    }
    
    fs.writeFileSync(config.alertFile, JSON.stringify(alertLogs, null, 2));
  } catch (error) {
    console.error('Failed to log alert:', error);
  }
}

// Resolve alert
function resolveAlert(alertId) {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    console.log(`✅ Alert resolved: ${alert.message}`);
    
    // Broadcast resolution
    const message = JSON.stringify({
      type: 'alert_resolved',
      data: { alertId },
      timestamp: Date.now(),
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Clear all data
function clearData() {
  metrics = {
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
      sessionId: 'monitor_session',
      screenName: 'monitor',
      deviceInfo: {
        platform: 'monitor',
        version: '1.0.0',
        model: 'Monitor Device',
        screenSize: '1920x1080',
        memory: 8192,
        isConnected: true,
      },
    },
    errors: {
      totalErrors: 0,
      recentErrors: [],
      errorRate: 0,
    },
  };
  
  alerts = [];
  
  console.log('🧹 All monitoring data cleared');
}

// Console output
function startConsoleOutput() {
  if (!config.enableConsoleOutput) return;
  
  setInterval(() => {
    const score = metrics.performance.score;
    const memory = metrics.performance.memoryUsage;
    const latency = metrics.network.averageLatency;
    const cacheHit = metrics.cache.hitRate;
    const errors = metrics.errors.totalErrors;
    const activeAlerts = alerts.filter(a => !a.resolved).length;
    
    console.clear();
    console.log('📊 Real-time Monitoring Dashboard');
    console.log('═'.repeat(50));
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log(`🎯 Score: ${score}/100 ${getScoreEmoji(score)}`);
    console.log(`🧠 Memory: ${memory.toFixed(1)}% ${getMemoryStatus(memory)}`);
    console.log(`🌐 Latency: ${latency.toFixed(0)}ms ${getLatencyStatus(latency)}`);
    console.log(`💾 Cache: ${cacheHit.toFixed(1)}% ${getCacheStatus(cacheHit)}`);
    console.log(`❌ Errors: ${errors} ${getErrorStatus(errors)}`);
    console.log(`🚨 Alerts: ${activeAlerts} ${activeAlerts > 0 ? '⚠️' : '✅'}`);
    console.log(`📱 Clients: ${clients.size}`);
    console.log('');
    
    if (activeAlerts > 0) {
      console.log('🚨 Active Alerts:');
      alerts.filter(a => !a.resolved).slice(0, 3).forEach(alert => {
        console.log(`  - [${alert.severity.toUpperCase()}] ${alert.message}`);
      });
      if (activeAlerts > 3) {
        console.log(`  ... and ${activeAlerts - 3} more`);
      }
      console.log('');
    }
    
    console.log('Press Ctrl+C to stop monitoring');
  }, 2000);
}

// Helper functions
function getScoreEmoji(score) {
  if (score >= 90) return '🎉';
  if (score >= 80) return '✅';
  if (score >= 70) return '⚠️';
  if (score >= 60) return '🔶';
  return '❌';
}

function getMemoryStatus(memory) {
  if (memory > 90) return '🔴';
  if (memory > 80) return '🟡';
  return '🟢';
}

function getLatencyStatus(latency) {
  if (latency > 2000) return '🔴';
  if (latency > 1000) return '🟡';
  return '🟢';
}

function getCacheStatus(hitRate) {
  if (hitRate < 30) return '🔴';
  if (hitRate < 50) return '🟡';
  return '🟢';
}

function getErrorStatus(errors) {
  if (errors > 10) return '🔴';
  if (errors > 5) return '🟡';
  return '🟢';
}

// Handle shutdown
function handleShutdown() {
  console.log('\n🛑 Shutting down real-time monitoring...');
  
  // Close all client connections
  clients.forEach(client => {
    client.close();
  });
  
  // Close WebSocket server
  if (server) {
    server.close();
  }
  
  console.log('✅ Real-time monitoring stopped');
  process.exit(0);
}

// Start monitoring
function startMonitoring() {
  initializeMonitoring();
  startConsoleOutput();
  
  // Handle shutdown
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  
  console.log('🎉 Real-time monitoring is now running!');
  console.log(`🌐 WebSocket server: ws://localhost:${config.port}`);
  console.log('📱 Connect your app to start receiving real-time updates');
}

// Start if run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  startMonitoring,
  config,
  metrics,
  alerts,
  resolveAlert,
  clearData,
};
