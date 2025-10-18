#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors app performance in real-time during development
 */

const fs = require('fs');
const path = require('path');

// Performance monitoring configuration
const config = {
  logFile: path.join(__dirname, '../performance-logs.json'),
  metricsFile: path.join(__dirname, '../performance-metrics.json'),
  reportInterval: 5000, // 5 seconds
  maxLogEntries: 1000,
  thresholds: {
    renderTime: 16, // ms
    memoryUsage: 80, // percentage
    networkLatency: 1000, // ms
    cacheHitRate: 70, // percentage
  },
};

// Performance metrics storage
let metrics = {
  timestamp: Date.now(),
  renderTime: 0,
  memoryUsage: 0,
  networkLatency: 0,
  cacheHitRate: 0,
  frameDrops: 0,
  cpuUsage: 0,
  score: 100,
  issues: [],
  recommendations: [],
};

// Performance logs storage
let logs = [];

// Initialize performance monitoring
function initializeMonitoring() {
  console.log('🚀 Starting performance monitoring...');
  console.log(`📊 Monitoring interval: ${config.reportInterval}ms`);
  console.log(`📁 Log file: ${config.logFile}`);
  console.log(`📈 Metrics file: ${config.metricsFile}`);
  
  // Create log file if it doesn't exist
  if (!fs.existsSync(config.logFile)) {
    fs.writeFileSync(config.logFile, JSON.stringify([], null, 2));
  }
  
  // Create metrics file if it doesn't exist
  if (!fs.existsSync(config.metricsFile)) {
    fs.writeFileSync(config.metricsFile, JSON.stringify(metrics, null, 2));
  }
  
  // Load existing logs
  try {
    const existingLogs = fs.readFileSync(config.logFile, 'utf8');
    logs = JSON.parse(existingLogs);
  } catch (error) {
    console.warn('⚠️ Could not load existing logs:', error.message);
    logs = [];
  }
}

// Generate mock performance metrics (in real app, this would come from actual monitoring)
function generateMockMetrics() {
  const now = Date.now();
  
  // Simulate realistic performance metrics
  metrics = {
    timestamp: now,
    renderTime: Math.random() * 20 + 5, // 5-25ms
    memoryUsage: Math.random() * 100, // 0-100%
    networkLatency: Math.random() * 2000 + 100, // 100-2100ms
    cacheHitRate: Math.random() * 100, // 0-100%
    frameDrops: Math.floor(Math.random() * 10), // 0-9
    cpuUsage: Math.random() * 100, // 0-100%
    score: 100,
    issues: [],
    recommendations: [],
  };
  
  // Calculate performance score
  let score = 100;
  
  if (metrics.renderTime > config.thresholds.renderTime) {
    score -= 20;
    metrics.issues.push({
      type: 'render',
      severity: 'medium',
      description: `Slow render time: ${metrics.renderTime.toFixed(2)}ms`,
    });
  }
  
  if (metrics.memoryUsage > config.thresholds.memoryUsage) {
    score -= 25;
    metrics.issues.push({
      type: 'memory',
      severity: 'high',
      description: `High memory usage: ${metrics.memoryUsage.toFixed(1)}%`,
    });
  }
  
  if (metrics.networkLatency > config.thresholds.networkLatency) {
    score -= 15;
    metrics.issues.push({
      type: 'network',
      severity: 'medium',
      description: `High network latency: ${metrics.networkLatency.toFixed(0)}ms`,
    });
  }
  
  if (metrics.cacheHitRate < config.thresholds.cacheHitRate) {
    score -= 10;
    metrics.issues.push({
      type: 'cache',
      severity: 'low',
      description: `Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`,
    });
  }
  
  if (metrics.frameDrops > 5) {
    score -= 15;
    metrics.issues.push({
      type: 'render',
      severity: 'medium',
      description: `Frame drops detected: ${metrics.frameDrops}`,
    });
  }
  
  if (metrics.cpuUsage > 80) {
    score -= 20;
    metrics.issues.push({
      type: 'cpu',
      severity: 'high',
      description: `High CPU usage: ${metrics.cpuUsage.toFixed(1)}%`,
    });
  }
  
  metrics.score = Math.max(0, score);
  
  // Generate recommendations based on issues
  if (metrics.issues.length > 0) {
    metrics.recommendations = generateRecommendations(metrics.issues);
  }
}

// Generate performance recommendations
function generateRecommendations(issues) {
  const recommendations = [];
  
  issues.forEach(issue => {
    switch (issue.type) {
      case 'render':
        recommendations.push('Consider using React.memo for expensive components');
        recommendations.push('Optimize FlatList performance with getItemLayout');
        break;
      case 'memory':
        recommendations.push('Implement memory cleanup strategies');
        recommendations.push('Optimize image loading and caching');
        break;
      case 'network':
        recommendations.push('Implement request caching and deduplication');
        recommendations.push('Use CDN for static assets');
        break;
      case 'cache':
        recommendations.push('Review cache configuration and TTL settings');
        recommendations.push('Implement cache warming strategies');
        break;
      case 'cpu':
        recommendations.push('Optimize heavy computations');
        recommendations.push('Use background processing for intensive tasks');
        break;
    }
  });
  
  return [...new Set(recommendations)]; // Remove duplicates
}

// Log performance metrics
function logMetrics() {
  const logEntry = {
    timestamp: metrics.timestamp,
    score: metrics.score,
    metrics: { ...metrics },
    issues: metrics.issues.length,
    recommendations: metrics.recommendations.length,
  };
  
  logs.push(logEntry);
  
  // Keep only recent logs
  if (logs.length > config.maxLogEntries) {
    logs = logs.slice(-config.maxLogEntries);
  }
  
  // Save logs to file
  try {
    fs.writeFileSync(config.logFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('❌ Failed to save logs:', error.message);
  }
  
  // Save current metrics to file
  try {
    fs.writeFileSync(config.metricsFile, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('❌ Failed to save metrics:', error.message);
  }
}

// Display performance status
function displayStatus() {
  const timestamp = new Date(metrics.timestamp).toLocaleTimeString();
  const score = metrics.score;
  const issues = metrics.issues.length;
  
  // Clear console and display status
  console.clear();
  console.log('📊 Performance Monitor - Spred React Native App');
  console.log('═'.repeat(50));
  console.log(`⏰ Time: ${timestamp}`);
  console.log(`🎯 Score: ${score}/100 ${getScoreEmoji(score)}`);
  console.log(`🚨 Issues: ${issues} ${issues > 0 ? '⚠️' : '✅'}`);
  console.log('');
  
  // Display metrics
  console.log('📈 Current Metrics:');
  console.log(`  Render Time: ${metrics.renderTime.toFixed(2)}ms ${getMetricStatus(metrics.renderTime, config.thresholds.renderTime, false)}`);
  console.log(`  Memory Usage: ${metrics.memoryUsage.toFixed(1)}% ${getMetricStatus(metrics.memoryUsage, config.thresholds.memoryUsage, true)}`);
  console.log(`  Network Latency: ${metrics.networkLatency.toFixed(0)}ms ${getMetricStatus(metrics.networkLatency, config.thresholds.networkLatency, true)}`);
  console.log(`  Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}% ${getMetricStatus(metrics.cacheHitRate, config.thresholds.cacheHitRate, false)}`);
  console.log(`  Frame Drops: ${metrics.frameDrops} ${getMetricStatus(metrics.frameDrops, 5, true)}`);
  console.log(`  CPU Usage: ${metrics.cpuUsage.toFixed(1)}% ${getMetricStatus(metrics.cpuUsage, 80, true)}`);
  console.log('');
  
  // Display issues
  if (issues > 0) {
    console.log('🚨 Performance Issues:');
    metrics.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    console.log('');
  }
  
  // Display recommendations
  if (metrics.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    metrics.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    if (metrics.recommendations.length > 3) {
      console.log(`  ... and ${metrics.recommendations.length - 3} more`);
    }
    console.log('');
  }
  
  // Display recent trend
  if (logs.length > 1) {
    const recent = logs.slice(-5);
    const avgScore = recent.reduce((sum, log) => sum + log.score, 0) / recent.length;
    const trend = avgScore > metrics.score ? '📉' : '📈';
    console.log(`📊 Recent Trend: ${trend} Average score: ${avgScore.toFixed(1)}`);
  }
  
  console.log('');
  console.log('Press Ctrl+C to stop monitoring');
}

// Get score emoji
function getScoreEmoji(score) {
  if (score >= 90) return '🎉';
  if (score >= 80) return '✅';
  if (score >= 70) return '⚠️';
  if (score >= 60) return '🔶';
  return '❌';
}

// Get metric status emoji
function getMetricStatus(value, threshold, lowerIsBetter) {
  if (lowerIsBetter) {
    return value <= threshold ? '✅' : '❌';
  } else {
    return value >= threshold ? '✅' : '❌';
  }
}

// Generate performance report
function generateReport() {
  if (logs.length === 0) {
    console.log('📊 No performance data available');
    return;
  }
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSamples: logs.length,
      averageScore: logs.reduce((sum, log) => sum + log.score, 0) / logs.length,
      minScore: Math.min(...logs.map(log => log.score)),
      maxScore: Math.max(...logs.map(log => log.score)),
      totalIssues: logs.reduce((sum, log) => sum + log.issues, 0),
    },
    trends: {
      last10Samples: logs.slice(-10),
      last50Samples: logs.slice(-50),
    },
    recommendations: generateOverallRecommendations(logs),
  };
  
  const reportFile = path.join(__dirname, '../performance-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log('📊 Performance report generated:', reportFile);
  console.log(`📈 Average score: ${report.summary.averageScore.toFixed(1)}`);
  console.log(`🚨 Total issues: ${report.summary.totalIssues}`);
}

// Generate overall recommendations
function generateOverallRecommendations(logs) {
  const recommendations = [];
  
  // Analyze trends
  const recent = logs.slice(-10);
  const avgScore = recent.reduce((sum, log) => sum + log.score, 0) / recent.length;
  
  if (avgScore < 70) {
    recommendations.push('Critical: Overall performance is poor. Immediate optimization required.');
  } else if (avgScore < 80) {
    recommendations.push('Warning: Performance is below optimal. Consider optimization.');
  }
  
  // Check for declining trends
  if (logs.length >= 20) {
    const firstHalf = logs.slice(0, Math.floor(logs.length / 2));
    const secondHalf = logs.slice(Math.floor(logs.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, log) => sum + log.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.score, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 10) {
      recommendations.push('Trend: Performance is declining over time. Investigate recent changes.');
    }
  }
  
  return recommendations;
}

// Handle graceful shutdown
function handleShutdown() {
  console.log('\n🛑 Stopping performance monitoring...');
  
  // Generate final report
  generateReport();
  
  console.log('📊 Performance monitoring stopped');
  console.log('📁 Logs saved to:', config.logFile);
  console.log('📈 Metrics saved to:', config.metricsFile);
  
  process.exit(0);
}

// Main monitoring loop
function startMonitoring() {
  initializeMonitoring();
  
  // Set up monitoring interval
  const interval = setInterval(() => {
    generateMockMetrics();
    logMetrics();
    displayStatus();
  }, config.reportInterval);
  
  // Handle shutdown
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  
  // Initial display
  generateMockMetrics();
  logMetrics();
  displayStatus();
}

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = {
  startMonitoring,
  generateReport,
  config,
};
