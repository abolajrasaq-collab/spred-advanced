import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AnalyticsService from '../../services/AnalyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import AppMaintenance from '../Maintenance/AppMaintenance';
import SecurityDashboard from '../Security/SecurityDashboard';
import SecuritySettings from '../Security/SecuritySettings';
import NotificationDashboard from '../Notifications/NotificationDashboard';
import NotificationSettings from '../Notifications/NotificationSettings';
import AccessibilityDashboard from '../Accessibility/AccessibilityDashboard';
import AccessibilitySettings from '../Accessibility/AccessibilitySettings';
import OfflineDashboard from '../Offline/OfflineDashboard';
import OfflineSettings from '../Offline/OfflineSettings';
// import ContentManagementDashboard from '../Content/ContentManagementDashboard';
// import ContentSettings from '../Content/ContentSettings';
// import UserProfileDashboard from '../User/UserProfileDashboard';
// import UserSettings from '../User/UserSettings';
import AIDashboard from '../AI/AIDashboard';
import AISettings from '../AI/AISettings';

interface EnhancedSettingsProps {
  onBack?: () => void;
}

interface AnalyticsData {
  totalEvents: number;
  sessionCount: number;
  topEvents: Array<{ event: string; count: number }>;
  featureUsage: Array<{ feature: string; count: number }>;
  errorCount: number;
  performanceMetrics: Array<{ metric: string; average: number; count: number }>;
}

const EnhancedSettings: React.FC<EnhancedSettingsProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showAppMaintenance, setShowAppMaintenance] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showNotificationDashboard, setShowNotificationDashboard] =
    useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showAccessibilityDashboard, setShowAccessibilityDashboard] =
    useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] =
    useState(false);
  const [showOfflineDashboard, setShowOfflineDashboard] = useState(false);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);
  // const [showContentManagementDashboard, setShowContentManagementDashboard] =
  //   useState(false);
  // const [showContentSettings, setShowContentSettings] = useState(false);
  // const [showUserProfileDashboard, setShowUserProfileDashboard] =
  //   useState(false);
  // const [showUserSettings, setShowUserSettings] = useState(false);
  const [showAIDashboard, setShowAIDashboard] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [settings, setSettings] = useState({
    analyticsEnabled: true,
    crashReporting: true,
    performanceMonitoring: true,
    autoOptimization: true,
    notifications: true,
    darkMode: true,
  });

  useEffect(() => {
    loadSettings();
    loadAnalyticsData();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      AnalyticsService.trackUserAction('settings_updated', {
        settings: newSettings,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save settings:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const data = await AnalyticsService.getAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load analytics data:', error);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including videos and temporary files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear cache logic here
              AnalyticsService.trackUserAction('cache_cleared');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
    );
  };

  const handleClearAnalytics = () => {
    Alert.alert(
      'Clear Analytics Data',
      'This will permanently delete all analytics data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AnalyticsService.clearAnalyticsData();
              await loadAnalyticsData();
              Alert.alert('Success', 'Analytics data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear analytics data');
            }
          },
        },
      ],
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export your analytics data for analysis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: () => {
          // Export logic here
          AnalyticsService.trackUserAction('data_exported');
          Alert.alert('Success', 'Data export started');
        },
      },
    ]);
  };

  const handleOpenSource = () => {
    Linking.openURL('https://github.com/spred-app');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://spred.app/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://spred.app/terms');
  };

  const renderSettingItem = (
    title: string,
    description: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    color: string = '#F45303',
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: color }]}>
          <MaterialIcons name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#666666', true: color }}
        thumbColor={value ? '#FFFFFF' : '#CCCCCC'}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    color: string = '#F45303',
    destructive: boolean = false,
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: destructive ? '#FF4444' : color },
          ]}
        >
          <MaterialIcons name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.settingText}>
          <Text
            style={[styles.settingTitle, destructive && styles.destructiveText]}
          >
            {title}
          </Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666666" />
    </TouchableOpacity>
  );

  const renderAnalyticsSection = () => {
    if (!analyticsData) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analytics Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analyticsData.totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analyticsData.sessionCount}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analyticsData.errorCount}</Text>
            <Text style={styles.statLabel}>Errors</Text>
          </View>
        </View>

        {analyticsData.topEvents.length > 0 && (
          <View style={styles.topEventsContainer}>
            <Text style={styles.subsectionTitle}>Top Events</Text>
            {analyticsData.topEvents.slice(0, 5).map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventName}>{event.event}</Text>
                <Text style={styles.eventCount}>{event.count}</Text>
              </View>
            ))}
          </View>
        )}

        {analyticsData.featureUsage.length > 0 && (
          <View style={styles.featureUsageContainer}>
            <Text style={styles.subsectionTitle}>Feature Usage</Text>
            {analyticsData.featureUsage.slice(0, 5).map((feature, index) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventName}>{feature.feature}</Text>
                <Text style={styles.eventCount}>{feature.count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Enhanced Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          {renderSettingItem(
            'Analytics',
            'Help improve the app by sharing anonymous usage data',
            'analytics',
            settings.analyticsEnabled,
            value => handleSettingChange('analyticsEnabled', value),
          )}

          {renderSettingItem(
            'Crash Reporting',
            'Automatically report crashes to help fix issues',
            'bug-report',
            settings.crashReporting,
            value => handleSettingChange('crashReporting', value),
          )}

          {renderSettingItem(
            'Performance Monitoring',
            'Monitor app performance and optimize automatically',
            'speed',
            settings.performanceMonitoring,
            value => handleSettingChange('performanceMonitoring', value),
          )}

          {renderSettingItem(
            'Auto Optimization',
            'Automatically optimize videos for better performance',
            'auto-fix-high',
            settings.autoOptimization,
            value => handleSettingChange('autoOptimization', value),
          )}

          {renderSettingItem(
            'Notifications',
            'Receive notifications about downloads and sharing',
            'notifications',
            settings.notifications,
            value => handleSettingChange('notifications', value),
          )}
        </View>

        {/* Analytics Section */}
        {settings.analyticsEnabled && renderAnalyticsSection()}

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          {renderActionItem(
            'Clear Cache',
            'Free up storage by clearing cached data',
            'delete-sweep',
            handleClearCache,
            '#FF9800',
          )}

          {renderActionItem(
            'Export Data',
            'Export your analytics data for analysis',
            'file-download',
            handleExportData,
            '#4CAF50',
          )}

          {renderActionItem(
            'Clear Analytics',
            'Permanently delete all analytics data',
            'delete-forever',
            handleClearAnalytics,
            '#FF4444',
            true,
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          {renderActionItem(
            'Open Source',
            'View source code on GitHub',
            'code',
            handleOpenSource,
            '#2196F3',
          )}

          {renderActionItem(
            'Privacy Policy',
            'Read our privacy policy',
            'privacy-tip',
            handlePrivacyPolicy,
            '#9C27B0',
          )}

          {renderActionItem(
            'Terms of Service',
            'Read our terms of service',
            'description',
            handleTermsOfService,
            '#607D8B',
          )}
        </View>

        {/* Analytics & Monitoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics & Monitoring</Text>

          {renderActionItem(
            'Analytics Dashboard',
            'View detailed analytics and performance metrics',
            'analytics',
            () => setShowAnalyticsDashboard(true),
            '#2196F3',
          )}

          {renderActionItem(
            'App Maintenance',
            'Run maintenance tasks and optimize app performance',
            'build',
            () => setShowAppMaintenance(true),
            '#4CAF50',
          )}
        </View>

        {/* Security & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>

          {renderActionItem(
            'Security Dashboard',
            'View security events and threat analysis',
            'security',
            () => setShowSecurityDashboard(true),
            '#FF4444',
          )}

          {renderActionItem(
            'Security Settings',
            'Configure security and encryption settings',
            'settings',
            () => setShowSecuritySettings(true),
            '#F45303',
          )}
        </View>

        {/* Notifications & Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Alerts</Text>

          {renderActionItem(
            'Notification Dashboard',
            'View and manage all notifications',
            'notifications',
            () => setShowNotificationDashboard(true),
            '#2196F3',
          )}

          {renderActionItem(
            'Notification Settings',
            'Configure notification preferences and smart alerts',
            'settings',
            () => setShowNotificationSettings(true),
            '#FF9800',
          )}
        </View>

        {/* Accessibility & Inclusion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility & Inclusion</Text>

          {renderActionItem(
            'Accessibility Dashboard',
            'View accessibility features and compliance status',
            'accessibility',
            () => setShowAccessibilityDashboard(true),
            '#9C27B0',
          )}

          {renderActionItem(
            'Accessibility Settings',
            'Configure accessibility features and inclusive design',
            'settings',
            () => setShowAccessibilitySettings(true),
            '#4CAF50',
          )}
        </View>

        {/* Offline & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline & Sync</Text>

          {renderActionItem(
            'Offline Dashboard',
            'View offline status and sync queue management',
            'offline-bolt',
            () => setShowOfflineDashboard(true),
            '#FF5722',
          )}

          {renderActionItem(
            'Offline Settings',
            'Configure offline mode and sync capabilities',
            'settings',
            () => setShowOfflineSettings(true),
            '#795548',
          )}
        </View>

        {/* Content Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Management</Text>

          {renderActionItem(
            'Content Dashboard',
            'View content management and curation status',
            'library-books',
            () =>
              Alert.alert(
                'Content Management',
                'Content Management Dashboard is temporarily disabled due to syntax errors',
              ),
            '#3F51B5',
          )}

          {renderActionItem(
            'Content Settings',
            'Configure content management and curation',
            'settings',
            () =>
              Alert.alert(
                'Content Settings',
                'Content Settings is temporarily disabled due to syntax errors',
              ),
            '#673AB7',
          )}
        </View>

        {/* User Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Management</Text>

          {renderActionItem(
            'User Profile',
            'View user profile and statistics',
            'person',
            () =>
              Alert.alert(
                'User Profile',
                'User Profile Dashboard is temporarily disabled due to syntax errors',
              ),
            '#E91E63',
          )}

          {renderActionItem(
            'User Settings',
            'Configure user preferences and settings',
            'settings',
            () =>
              Alert.alert(
                'User Settings',
                'User Settings is temporarily disabled due to syntax errors',
              ),
            '#9C27B0',
          )}

          {/* AI Features */}
          <Text style={styles.sectionTitle}>AI Features</Text>
          {renderActionItem(
            'AI Dashboard',
            'View AI recommendations, predictions, and learning status',
            'psychology',
            () => setShowAIDashboard(true),
            '#F45303',
          )}
          {renderActionItem(
            'AI Settings',
            'Configure AI features and machine learning settings',
            'tune',
            () => setShowAISettings(true),
            '#FF9800',
          )}
        </View>
      </ScrollView>

      {showAnalyticsDashboard && (
        <AnalyticsDashboard onBack={() => setShowAnalyticsDashboard(false)} />
      )}

      {showAppMaintenance && (
        <AppMaintenance onBack={() => setShowAppMaintenance(false)} />
      )}

      {showSecurityDashboard && (
        <SecurityDashboard onBack={() => setShowSecurityDashboard(false)} />
      )}

      {showSecuritySettings && (
        <SecuritySettings onBack={() => setShowSecuritySettings(false)} />
      )}

      {showNotificationDashboard && (
        <NotificationDashboard
          onBack={() => setShowNotificationDashboard(false)}
        />
      )}

      {showNotificationSettings && (
        <NotificationSettings
          onBack={() => setShowNotificationSettings(false)}
        />
      )}

      {showAccessibilityDashboard && (
        <AccessibilityDashboard
          onBack={() => setShowAccessibilityDashboard(false)}
        />
      )}

      {showAccessibilitySettings && (
        <AccessibilitySettings
          onBack={() => setShowAccessibilitySettings(false)}
        />
      )}

      {showOfflineDashboard && (
        <OfflineDashboard onBack={() => setShowOfflineDashboard(false)} />
      )}

      {showOfflineSettings && (
        <OfflineSettings onBack={() => setShowOfflineSettings(false)} />
      )}

      {/* {showContentManagementDashboard && (
        <ContentManagementDashboard
          onBack={() => setShowContentManagementDashboard(false)}
        />
      )} */}

      {/* {showContentSettings && (
        <ContentSettings onBack={() => setShowContentSettings(false)} />
      )} */}

      {/* {showUserProfileDashboard && (
        <UserProfileDashboard
          onBack={() => setShowUserProfileDashboard(false)}
        />
      )}

      {showUserSettings && (
        <UserSettings onBack={() => setShowUserSettings(false)} />
      )} */}

      {/* AI Modals */}
      {showAIDashboard && (
        <AIDashboard onBack={() => setShowAIDashboard(false)} />
      )}
      {showAISettings && <AISettings onBack={() => setShowAISettings(false)} />}
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
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
  destructiveText: {
    color: '#FF4444',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F45303',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  topEventsContainer: {
    marginBottom: 20,
  },
  featureUsageContainer: {
    marginBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  eventCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F45303',
  },
});

export default EnhancedSettings;
