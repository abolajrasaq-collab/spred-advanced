/**
 * Monitoring Example Component
 * Demonstrates how to use the real-time monitoring system
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRealtimeMonitoring } from '../../hooks/useRealtimeMonitoring';
import { useTheme } from '../../theme/ThemeProvider';

const MonitoringExample: React.FC = () => {
  const theme = useTheme();
  const { metrics, alerts, isLoading } = useRealtimeMonitoring();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.text, { color: theme.colors.text.primary }]}>
          Loading monitoring data...
        </Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.text, { color: theme.colors.text.primary }]}>
          No monitoring data available
        </Text>
      </View>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.status.success;
    if (score >= 60) return theme.colors.status.warning;
    return theme.colors.status.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        📊 Live Monitoring
      </Text>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Performance Score:
          </Text>
          <Text style={[styles.metricValue, { color: getScoreColor(metrics.performance.score) }]}>
            {metrics.performance.score}/100
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Memory Usage:
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {metrics.performance.memoryUsage.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Render Time:
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {metrics.performance.renderTime.toFixed(1)}ms
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Network Latency:
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {metrics.network.averageLatency.toFixed(0)}ms
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Cache Hit Rate:
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {(metrics.cache.hitRate * 100).toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
            Active Users:
          </Text>
          <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
            {metrics.user.activeUsers}
          </Text>
        </View>
      </View>
      
      {alerts && alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={[styles.alertsTitle, { color: theme.colors.text.primary }]}>
            🚨 Active Alerts ({alerts.length})
          </Text>
          {alerts.slice(0, 3).map((alert, index) => (
            <View
              key={alert.id}
              style={[
                styles.alertItem,
                {
                  backgroundColor: theme.colors.background.primary,
                  borderLeftColor: 
                    alert.severity === 'critical' ? theme.colors.status.error :
                    alert.severity === 'warning' ? theme.colors.status.warning :
                    theme.colors.status.info,
                },
              ]}
            >
              <Text style={[styles.alertText, { color: theme.colors.text.primary }]}>
                {alert.message}
              </Text>
            </View>
          ))}
          {alerts.length > 3 && (
            <Text style={[styles.moreAlerts, { color: theme.colors.text.secondary }]}>
              ... and {alerts.length - 3} more alerts
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  alertsContainer: {
    marginTop: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertItem: {
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  alertText: {
    fontSize: 12,
  },
  moreAlerts: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MonitoringExample;
