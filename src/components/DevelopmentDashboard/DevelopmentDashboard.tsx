/**
 * Development Dashboard Component
 * Real-time monitoring dashboard for development environment
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { realtimeMonitoring, RealtimeMetrics, MonitoringAlert } from '../../services/RealtimeMonitoring';
import { performanceMonitor } from '../../services/AdvancedPerformanceMonitor';
import { cacheManager } from '../../services/AdvancedCacheManager';
import { networkOptimizer } from '../../services/NetworkOptimizer';
import { useTheme } from '../../theme/ThemeProvider';
import logger from '../../utils/logger';

interface DevelopmentDashboardProps {
  visible?: boolean;
  onClose?: () => void;
  position?: 'top' | 'bottom' | 'floating';
}

const DevelopmentDashboard: React.FC<DevelopmentDashboardProps> = ({
  visible = true,
  onClose,
  position = 'floating',
}) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(visible ? 1 : 0));

  // Subscribe to real-time metrics
  useEffect(() => {
    const unsubscribe = realtimeMonitoring.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    const unsubscribeAlerts = realtimeMonitoring.subscribeToAlerts((alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    return () => {
      unsubscribe();
      unsubscribeAlerts();
    };
  }, []);

  // Update alerts list
  useEffect(() => {
    setAlerts(realtimeMonitoring.getActiveAlerts());
  }, []);

  // Animate visibility
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear Monitoring Data',
      'Are you sure you want to clear all monitoring data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            realtimeMonitoring.clearData();
            setAlerts([]);
          },
        },
      ]
    );
  }, []);

  const handleResolveAlert = useCallback((alertId: string) => {
    realtimeMonitoring.resolveAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const handleForceOptimization = useCallback(() => {
    performanceMonitor.forceCleanup();
    cacheManager.clear();
    networkOptimizer.resetStats();
    Alert.alert('Optimization', 'Performance optimization completed');
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#8BC34A';
    if (score >= 70) return '#FFC107';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🎉';
    if (score >= 80) return '✅';
    if (score >= 70) return '⚠️';
    if (score >= 60) return '🔶';
    return '❌';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'error': return '#FF5722';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  if (!visible || !metrics) {
    return null;
  }

  const { performance, network, cache, user, errors } = metrics;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.interactive.border,
          opacity: fadeAnim,
        },
        position === 'top' && styles.topPosition,
        position === 'bottom' && styles.bottomPosition,
        position === 'floating' && styles.floatingPosition,
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              📊 Dev Dashboard
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {user.screenName} • {user.deviceInfo.platform}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.expandButton, { backgroundColor: theme.colors.interactive.primary }]}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {onClose && (
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.status.error }]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Performance Score */}
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.background.secondary }]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: theme.colors.text.primary }]}>
              Performance Score
            </Text>
            <Text style={[styles.scoreEmoji, { color: getScoreColor(performance.score) }]}>
              {getScoreEmoji(performance.score)}
            </Text>
          </View>
          <View style={styles.scoreValue}>
            <Text style={[styles.scoreNumber, { color: getScoreColor(performance.score) }]}>
              {performance.score}
            </Text>
            <Text style={[styles.scoreLabel, { color: theme.colors.text.secondary }]}>
              / 100
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {performance.renderTime.toFixed(1)}ms
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Render
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {performance.memoryUsage.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Memory
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {network.averageLatency.toFixed(0)}ms
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Network
            </Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {(cache.hitRate * 100).toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Cache
            </Text>
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              🚨 Active Alerts ({alerts.length})
            </Text>
            {alerts.slice(0, isExpanded ? alerts.length : 2).map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderLeftColor: getSeverityColor(alert.severity),
                  },
                ]}
              >
                <View style={styles.alertContent}>
                  <Text style={[styles.alertMessage, { color: theme.colors.text.primary }]}>
                    {alert.message}
                  </Text>
                  <Text style={[styles.alertTime, { color: theme.colors.text.secondary }]}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.resolveButton, { backgroundColor: theme.colors.status.success }]}
                  onPress={() => handleResolveAlert(alert.id)}
                >
                  <Text style={styles.resolveButtonText}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Performance Details */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                ⚡ Performance
              </Text>
              <View style={styles.detailGrid}>
                <View style={[styles.detailItem, { backgroundColor: theme.colors.background.secondary }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    Frame Drops
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {performance.frameDrops}
                  </Text>
                </View>
                <View style={[styles.detailItem, { backgroundColor: theme.colors.background.secondary }]}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.secondary }]}>
                    CPU Usage
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {performance.cpuUsage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.interactive.primary }]}
                onPress={handleForceOptimization}
              >
                <Text style={styles.actionButtonText}>🚀 Optimize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.status.warning }]}
                onPress={handleClearData}
              >
                <Text style={styles.actionButtonText}>🧹 Clear Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  topPosition: {
    top: 50,
    left: 16,
    right: 16,
  },
  bottomPosition: {
    bottom: 100,
    left: 16,
    right: 16,
  },
  floatingPosition: {
    top: 100,
    right: 16,
    width: Math.min(Dimensions.get('window').width * 0.9, 400),
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  expandButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreEmoji: {
    fontSize: 24,
  },
  scoreValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  alertsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 10,
    marginTop: 2,
  },
  resolveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedSection: {
    marginTop: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  detailLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DevelopmentDashboard;