import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import SecurityService from '../../services/SecurityService';
import AnalyticsService from '../../services/AnalyticsService';

interface SecurityDashboardProps {
  onBack?: () => void;
}

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: number;
  userId?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

interface SecurityReport {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: SecurityEvent[];
  securityScore: number;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const [securityReport, setSecurityReport] = useState<SecurityReport | null>(
    null,
  );
  const [securityConfig, setSecurityConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'events' | 'settings' | 'threats'
  >('overview');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      const [report, config] = await Promise.all([
        SecurityService.getSecurityReport(),
        SecurityService.getSecurityConfig(),
      ]);

      setSecurityReport(report);
      setSecurityConfig(config);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load security data:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSecurityData();
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await SecurityService.authenticateWithBiometric();

      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful');
      } else {
        Alert.alert('Error', result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handlePinAuth = async () => {
    Alert.prompt(
      'PIN Authentication',
      'Enter your PIN:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Authenticate',
          onPress: async pin => {
            if (pin) {
              const result = await SecurityService.authenticateWithPin(pin);

              if (result.success) {
                Alert.alert('Success', 'PIN authentication successful');
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'PIN authentication failed',
                );
              }
            }
          },
        },
      ],
      'secure-text',
    );
  };

  const handleEncryptData = async () => {
    try {
      const testData = 'This is sensitive data that needs encryption';
      const encrypted = await SecurityService.encryptData(testData);
      const decrypted = await SecurityService.decryptData(encrypted);

      Alert.alert(
        'Encryption Test',
        `Original: ${testData}\n\nEncrypted: ${encrypted.substring(
          0,
          50,
        )}...\n\nDecrypted: ${decrypted}`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert('Error', 'Encryption test failed');
    }
  };

  const handleClearSecurityData = () => {
    Alert.alert(
      'Clear Security Data',
      'This will clear all security data including events and configuration. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecurityService.clearSecurityData();
              await loadSecurityData();
              Alert.alert('Success', 'Security data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear security data');
            }
          },
        },
      ],
    );
  };

  const handleExportSecurityData = async () => {
    try {
      const data = await SecurityService.exportSecurityData();
      Alert.alert(
        'Security Data Export',
        `Exported ${data.length} characters of security data`,
        [{ text: 'OK' }],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export security data');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#FF4444';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#2196F3';
      case 'low':
        return '#4CAF50';
      default:
        return '#CCCCCC';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  const renderOverviewTab = () => {
    if (!securityReport) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        {/* Security Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Security Score</Text>
          <Text
            style={[
              styles.scoreValue,
              {
                color: getSeverityColor(
                  securityReport.securityScore > 80
                    ? 'low'
                    : securityReport.securityScore > 60
                    ? 'medium'
                    : 'high',
                ),
              },
            ]}
          >
            {securityReport.securityScore}/100
          </Text>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreBarFill,
                {
                  width: `${securityReport.securityScore}%`,
                  backgroundColor: getSeverityColor(
                    securityReport.securityScore > 80
                      ? 'low'
                      : securityReport.securityScore > 60
                      ? 'medium'
                      : 'high',
                  ),
                },
              ]}
            />
          </View>
        </View>

        {/* Security Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <MaterialIcons name="security" size={24} color="#F45303" />
            <Text style={styles.metricValue}>{securityReport.totalEvents}</Text>
            <Text style={styles.metricLabel}>Total Events</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="error" size={24} color="#FF4444" />
            <Text style={styles.metricValue}>
              {securityReport.eventsBySeverity.critical || 0}
            </Text>
            <Text style={styles.metricLabel}>Critical</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="warning" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>
              {securityReport.eventsBySeverity.high || 0}
            </Text>
            <Text style={styles.metricLabel}>High</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="info" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>
              {securityReport.eventsBySeverity.medium || 0}
            </Text>
            <Text style={styles.metricLabel}>Medium</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBiometricAuth}
          >
            <MaterialIcons name="fingerprint" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test Biometric Auth</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handlePinAuth}>
            <MaterialIcons name="lock" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test PIN Auth</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEncryptData}
          >
            <MaterialIcons
              name="enhanced-encryption"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>Test Encryption</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEventsTab = () => {
    if (!securityReport) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        {/* Event Statistics */}
        <View style={styles.eventsStats}>
          <Text style={styles.sectionTitle}>Event Statistics</Text>

          {Object.entries(securityReport.eventsByType).map(([type, count]) => (
            <View key={type} style={styles.eventStatItem}>
              <Text style={styles.eventStatType}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={styles.eventStatCount}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Recent Events */}
        <View style={styles.recentEvents}>
          <Text style={styles.sectionTitle}>Recent Events</Text>

          {securityReport.recentEvents.map(event => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventHeader}>
                <MaterialIcons
                  name={getSeverityIcon(event.severity)}
                  size={20}
                  color={getSeverityColor(event.severity)}
                />
                <Text style={styles.eventType}>
                  {event.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.eventDetails}>{event.details}</Text>
              <View style={styles.eventFooter}>
                <Text
                  style={[
                    styles.eventSeverity,
                    { color: getSeverityColor(event.severity) },
                  ]}
                >
                  {event.severity.toUpperCase()}
                </Text>
                {event.userId && (
                  <Text style={styles.eventUser}>User: {event.userId}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSettingsTab = () => {
    if (!securityConfig) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Security Settings</Text>

        {/* Authentication Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Authentication</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="fingerprint" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
            </View>
            <Switch
              value={securityConfig.enableBiometricAuth}
              onValueChange={value => {
                // This would update the setting
                // DISABLED FOR PERFORMANCE
                // console.log('Biometric auth:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="lock" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>PIN Authentication</Text>
            </View>
            <Switch
              value={securityConfig.enablePinAuth}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('PIN auth:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data Protection Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Data Protection</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="enhanced-encryption"
                size={24}
                color="#F45303"
              />
              <Text style={styles.settingLabel}>Data Encryption</Text>
            </View>
            <Switch
              value={securityConfig.enableDataEncryption}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Data encryption:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="storage" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>Secure Storage</Text>
            </View>
            <Switch
              value={securityConfig.enableSecureStorage}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Secure storage:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Audit Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Audit & Logging</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="history" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>Audit Logging</Text>
            </View>
            <Switch
              value={securityConfig.enableAuditLogging}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Audit logging:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Session Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Session Management</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="timer" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>Session Timeout</Text>
            </View>
            <Text style={styles.settingValue}>
              {Math.round(securityConfig.sessionTimeout / 60000)} minutes
            </Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="block" size={24} color="#F45303" />
              <Text style={styles.settingLabel}>Max Login Attempts</Text>
            </View>
            <Text style={styles.settingValue}>
              {securityConfig.maxLoginAttempts}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderThreatsTab = () => {
    if (!securityReport) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Threat Analysis</Text>

        {/* Threat Level */}
        <View style={styles.threatLevelCard}>
          <Text style={styles.threatLevelTitle}>Current Threat Level</Text>
          <Text
            style={[
              styles.threatLevelValue,
              {
                color: getSeverityColor(
                  securityReport.securityScore > 80
                    ? 'low'
                    : securityReport.securityScore > 60
                    ? 'medium'
                    : 'high',
                ),
              },
            ]}
          >
            {securityReport.securityScore > 80
              ? 'LOW'
              : securityReport.securityScore > 60
              ? 'MEDIUM'
              : 'HIGH'}
          </Text>
        </View>

        {/* Threat Indicators */}
        <View style={styles.threatIndicators}>
          <Text style={styles.sectionTitle}>Threat Indicators</Text>

          <View style={styles.threatIndicator}>
            <MaterialIcons name="error" size={20} color="#FF4444" />
            <Text style={styles.threatIndicatorText}>
              Critical Events: {securityReport.eventsBySeverity.critical || 0}
            </Text>
          </View>

          <View style={styles.threatIndicator}>
            <MaterialIcons name="warning" size={20} color="#FF9800" />
            <Text style={styles.threatIndicatorText}>
              High Severity Events: {securityReport.eventsBySeverity.high || 0}
            </Text>
          </View>

          <View style={styles.threatIndicator}>
            <MaterialIcons name="info" size={20} color="#2196F3" />
            <Text style={styles.threatIndicatorText}>
              Medium Severity Events:{' '}
              {securityReport.eventsBySeverity.medium || 0}
            </Text>
          </View>
        </View>

        {/* Security Recommendations */}
        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Security Recommendations</Text>

          {securityReport.securityScore < 80 && (
            <View style={styles.recommendationItem}>
              <MaterialIcons name="lightbulb" size={20} color="#FF9800" />
              <Text style={styles.recommendationText}>
                Enable additional security measures to improve your security
                score
              </Text>
            </View>
          )}

          {securityReport.eventsBySeverity.critical > 0 && (
            <View style={styles.recommendationItem}>
              <MaterialIcons name="error" size={20} color="#FF4444" />
              <Text style={styles.recommendationText}>
                Address critical security events immediately
              </Text>
            </View>
          )}

          <View style={styles.recommendationItem}>
            <MaterialIcons name="security" size={20} color="#4CAF50" />
            <Text style={styles.recommendationText}>
              Regularly review security events and update security settings
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'events':
        return renderEventsTab();
      case 'settings':
        return renderSettingsTab();
      case 'threats':
        return renderThreatsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>Loading security data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Security Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'events', label: 'Events', icon: 'history' },
          { key: 'settings', label: 'Settings', icon: 'settings' },
          { key: 'threats', label: 'Threats', icon: 'security' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#F45303' : '#CCCCCC'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportSecurityData}
        >
          <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearSecurityData}
        >
          <MaterialIcons name="delete" size={20} color="#FFFFFF" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  tabButtonActive: {
    backgroundColor: '#F45303',
  },
  tabText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  eventsStats: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  eventStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  eventStatType: {
    fontSize: 14,
    color: '#CCCCCC',
    flex: 1,
  },
  eventStatCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recentEvents: {
    marginBottom: 20,
  },
  eventItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  eventDetails: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventSeverity: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventUser: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  settingsGroup: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  threatLevelCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  threatLevelTitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  threatLevelValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  threatIndicators: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  threatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  threatIndicatorText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  recommendations: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
});

export default SecurityDashboard;
