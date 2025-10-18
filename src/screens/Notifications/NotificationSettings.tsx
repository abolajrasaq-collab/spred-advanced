import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AdvancedNotificationService from '../../services/AdvancedNotificationService';
import AnalyticsService from '../../services/AnalyticsService';

interface NotificationSettingsProps {
  onBack?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onBack,
}) => {
  const navigation = useNavigation();
  const [config, setConfig] = useState<any>(null);
  const [smartRules, setSmartRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'general' | 'alerts' | 'quiet' | 'advanced'
  >('general');

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);

      const [notificationConfig, alertRules] = await Promise.all([
        AdvancedNotificationService.getNotificationConfig(),
        AdvancedNotificationService.getSmartAlertRules(),
      ]);

      setConfig(notificationConfig);
      setSmartRules(alertRules);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      await AdvancedNotificationService.updateNotificationConfig(config);

      Alert.alert('Success', 'Notification settings saved successfully');

      AnalyticsService.trackEvent('notification_settings_saved', {
        config: config,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Test notification function removed

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await AdvancedNotificationService.updateSmartAlertRule(ruleId, {
        enabled,
      });
      await loadNotificationSettings();

      AnalyticsService.trackEvent('smart_alert_rule_toggled', {
        ruleId,
        enabled,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update smart alert rule');
    }
  };

  const renderGeneralTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>General Settings</Text>

        {/* Push Notifications */}
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="notifications" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications from the app
                </Text>
              </View>
            </View>
            <Switch
              value={config.enablePushNotifications}
              onValueChange={value => {
                setConfig({ ...config, enablePushNotifications: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="notifications-active"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Local Notifications</Text>
                <Text style={styles.settingDescription}>
                  Show local notifications within the app
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableLocalNotifications}
              onValueChange={value => {
                setConfig({ ...config, enableLocalNotifications: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notification Behavior */}
        <Text style={styles.sectionTitle}>Notification Behavior</Text>

        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="vibration" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <Text style={styles.settingDescription}>
                  Vibrate when notifications arrive
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableVibration}
              onValueChange={value => {
                setConfig({ ...config, enableVibration: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="volume-up" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound when notifications arrive
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableSound}
              onValueChange={value => {
                setConfig({ ...config, enableSound: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="badge" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Badge</Text>
                <Text style={styles.settingDescription}>
                  Show notification badge on app icon
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableBadge}
              onValueChange={value => {
                setConfig({ ...config, enableBadge: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="preview" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Preview</Text>
                <Text style={styles.settingDescription}>
                  Show notification preview in status bar
                </Text>
              </View>
            </View>
            <Switch
              value={config.enablePreview}
              onValueChange={value => {
                setConfig({ ...config, enablePreview: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test Notifications */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAlertsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Smart Alerts</Text>

        {/* Smart Alerts Toggle */}
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="smart-toy" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Smart Alerts</Text>
                <Text style={styles.settingDescription}>
                  Use AI to send intelligent notifications
                </Text>
              </View>
            </View>
            <Switch
              value={config?.enableSmartAlerts || false}
              onValueChange={value => {
                setConfig({ ...config, enableSmartAlerts: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Smart Alert Rules */}
        <Text style={styles.sectionTitle}>Alert Rules</Text>

        <View style={styles.settingGroup}>
          {smartRules.map(rule => (
            <View key={rule.id} style={styles.ruleItem}>
              <View style={styles.ruleHeader}>
                <View style={styles.ruleLeft}>
                  <MaterialIcons
                    name={rule.enabled ? 'rule' : 'rule-folder'}
                    size={20}
                    color={rule.enabled ? '#4CAF50' : '#CCCCCC'}
                  />
                  <View style={styles.ruleText}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleDescription}>{rule.condition}</Text>
                  </View>
                </View>
                <Switch
                  value={rule.enabled}
                  onValueChange={value => handleToggleRule(rule.id, value)}
                  trackColor={{ false: '#666666', true: '#F45303' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.ruleFooter}>
                <View style={styles.ruleMeta}>
                  <Text style={styles.rulePriority}>
                    Priority: {rule.priority}
                  </Text>
                  <Text style={styles.ruleCooldown}>
                    Cooldown: {rule.cooldown}m
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add New Rule */}
        <TouchableOpacity style={styles.addRuleButton}>
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addRuleButtonText}>Add New Alert Rule</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuietTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>

        {/* Quiet Hours Toggle */}
        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="schedule" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Suppress notifications during specified hours
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableQuietHours}
              onValueChange={value => {
                setConfig({ ...config, enableQuietHours: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Quiet Hours Settings */}
        {config.enableQuietHours && (
          <View style={styles.settingGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="schedule" size={24} color="#F45303" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Start Time</Text>
                  <Text style={styles.settingDescription}>
                    When to start suppressing notifications
                  </Text>
                </View>
              </View>
              <Text style={styles.settingValue}>{config.quietHoursStart}</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="schedule" size={24} color="#F45303" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>End Time</Text>
                  <Text style={styles.settingDescription}>
                    When to stop suppressing notifications
                  </Text>
                </View>
              </View>
              <Text style={styles.settingValue}>{config.quietHoursEnd}</Text>
            </View>
          </View>
        )}

        {/* Quiet Hours Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            During quiet hours, only urgent notifications will be shown. other
            notifications will be delayed until quiet hours end.
          </Text>
        </View>
      </View>
    );
  };

  const renderAdvancedTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Advanced Settings</Text>

        {/* Notification Limits */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Notification Limits</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="storage" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Max Notifications</Text>
                <Text style={styles.settingDescription}>
                  Maximum number of notifications to store
                </Text>
              </View>
            </View>
            <Text style={styles.settingValue}>{config.maxNotifications}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="timer" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notification Timeout</Text>
                <Text style={styles.settingDescription}>
                  How long to show notifications (ms)
                </Text>
              </View>
            </View>
            <Text style={styles.settingValue}>
              {config.notificationTimeout}ms
            </Text>
          </View>
        </View>

        {/* Notification Categories */}
        <Text style={styles.sectionTitle}>Notification Categories</Text>

        <View style={styles.settingGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="download" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Download Notifications</Text>
                <Text style={styles.settingDescription}>
                  Notifications for download progress and completion
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Download notifications:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="share" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Share Notifications</Text>
                <Text style={styles.settingDescription}>
                  Notifications for sharing progress and completion
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Share notifications:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="security" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Security Notifications</Text>
                <Text style={styles.settingDescription}>
                  Notifications for security events and alerts
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Security notifications:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="speed" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>
                  Performance Notifications
                </Text>
                <Text style={styles.settingDescription}>
                  Notifications for performance warnings and optimizations
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={value => {
                // DISABLED FOR PERFORMANCE
                // console.log('Performance notifications:', value);
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Reset Settings */}
        <View style={styles.resetSection}>
          <Text style={styles.sectionTitle}>Reset Settings</Text>

          <TouchableOpacity style={styles.resetButton}>
            <MaterialIcons name="restore" size={20} color="#FFFFFF" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'alerts':
        return renderAlertsTab();
      case 'quiet':
        return renderQuietTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderGeneralTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <TouchableOpacity
          onPress={handleSaveSettings}
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="save" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'general', label: 'General', icon: 'settings' },
          { key: 'alerts', label: 'Alerts', icon: 'smart-toy' },
          { key: 'quiet', label: 'Quiet', icon: 'schedule' },
          { key: 'advanced', label: 'Advanced', icon: 'tune' },
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
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
  saveButton: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 20,
  },
  settingGroup: {
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
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  settingValue: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  testSection: {
    marginTop: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  ruleItem: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ruleText: {
    marginLeft: 8,
    flex: 1,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ruleDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  ruleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  rulePriority: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  ruleCooldown: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  addRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  addRuleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  resetSection: {
    marginTop: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 8,
    padding: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
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

export default NotificationSettings;
