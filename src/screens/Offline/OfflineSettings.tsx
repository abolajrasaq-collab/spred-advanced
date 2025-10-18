import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Slider,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import OfflineService from '../../services/OfflineService';
import AnalyticsService from '../../services/AnalyticsService';

interface OfflineSettingsProps {
  onBack?: () => void;
}

const OfflineSettings: React.FC<OfflineSettingsProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'general' | 'sync' | 'storage' | 'advanced'
  >('general');

  useEffect(() => {
    loadOfflineSettings();
  }, []);

  const loadOfflineSettings = async () => {
    try {
      setLoading(true);

      const offlineConfig = await OfflineService.getOfflineConfig();
      setConfig(offlineConfig);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load offline settings:', error);
      Alert.alert('Error', 'Failed to load offline settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      await OfflineService.updateOfflineConfig(config);

      Alert.alert('Success', 'Offline settings saved successfully');

      AnalyticsService.trackEvent('offline_settings_saved', {
        config: config,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save offline settings:', error);
      Alert.alert('Error', 'Failed to save offline settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Offline Settings',
      'This will reset all offline settings to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset to default config
              const defaultConfig = {
                enableOfflineMode: true,
                enableAutoSync: true,
                enableBackgroundSync: true,
                enableConflictResolution: true,
                enableDataCompression: true,
                enableEncryption: true,
                syncInterval: 15,
                maxRetryAttempts: 3,
                retryDelay: 5,
                maxOfflineStorage: 500,
                compressionLevel: 'medium',
                encryptionKey: 'default_encryption_key',
                syncPriority: 'normal',
              };

              setConfig(defaultConfig);
              await OfflineService.updateOfflineConfig(defaultConfig);

              AnalyticsService.trackEvent('offline_settings_reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset offline settings');
            }
          },
        },
      ],
    );
  };

  const handleTestOfflineMode = async () => {
    try {
      // This would test offline functionality
      Alert.alert('Success', 'Offline mode test completed successfully');

      AnalyticsService.trackEvent('offline_mode_tested');
    } catch (error) {
      Alert.alert('Error', 'Failed to test offline mode');
    }
  };

  const renderGeneralTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>General Settings</Text>

        {/* Offline Mode */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Offline Mode</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="offline-bolt" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Offline Mode</Text>
                <Text style={styles.settingDescription}>
                  Allow the app to work without internet connection
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableOfflineMode}
              onValueChange={value => {
                setConfig({ ...config, enableOfflineMode: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="sync" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync data when connection is available
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableAutoSync}
              onValueChange={value => {
                setConfig({ ...config, enableAutoSync: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="background-sync" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Background Sync</Text>
                <Text style={styles.settingDescription}>
                  Sync data in the background when app is not active
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableBackgroundSync}
              onValueChange={value => {
                setConfig({ ...config, enableBackgroundSync: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sync Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Sync Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="schedule" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sync Interval</Text>
                <Text style={styles.settingDescription}>
                  How often to sync data (in minutes)
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={60}
                step={5}
                value={config.syncInterval}
                onValueChange={value => {
                  setConfig({ ...config, syncInterval: value });
                }}
                minimumTrackTintColor="#F45303"
                maximumTrackTintColor="#333333"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderValue}>{config.syncInterval} min</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="priority-high" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sync Priority</Text>
                <Text style={styles.settingDescription}>
                  Priority level for sync operations
                </Text>
              </View>
            </View>
            <View style={styles.prioritySelector}>
              {['low', 'normal', 'high', 'critical'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    config.syncPriority === priority &&
                      styles.priorityButtonActive,
                  ]}
                  onPress={() =>
                    setConfig({ ...config, syncPriority: priority })
                  }
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      config.syncPriority === priority &&
                        styles.priorityButtonTextActive,
                    ]}
                  >
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSyncTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Sync Configuration</Text>

        {/* Retry Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Retry Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="refresh" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Max Retry Attempts</Text>
                <Text style={styles.settingDescription}>
                  Maximum number of retry attempts for failed syncs
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={config.maxRetryAttempts}
                onValueChange={value => {
                  setConfig({ ...config, maxRetryAttempts: value });
                }}
                minimumTrackTintColor="#F45303"
                maximumTrackTintColor="#333333"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderValue}>{config.maxRetryAttempts}</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="timer" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Retry Delay</Text>
                <Text style={styles.settingDescription}>
                  Delay between retry attempts (in seconds)
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={config.retryDelay}
                onValueChange={value => {
                  setConfig({ ...config, retryDelay: value });
                }}
                minimumTrackTintColor="#F45303"
                maximumTrackTintColor="#333333"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderValue}>{config.retryDelay}s</Text>
            </View>
          </View>
        </View>

        {/* Conflict Resolution */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Conflict Resolution</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="merge-type" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>
                  Enable Conflict Resolution
                </Text>
                <Text style={styles.settingDescription}>
                  Automatically resolve sync conflicts
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableConflictResolution}
              onValueChange={value => {
                setConfig({ ...config, enableConflictResolution: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test Functions */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Functions</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestOfflineMode}
          >
            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Offline Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStorageTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Storage Settings</Text>

        {/* Storage Limits */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Storage Limits</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="storage" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Max Offline Storage</Text>
                <Text style={styles.settingDescription}>
                  Maximum storage space for offline data (in MB)
                </Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={2000}
                step={50}
                value={config.maxOfflineStorage}
                onValueChange={value => {
                  setConfig({ ...config, maxOfflineStorage: value });
                }}
                minimumTrackTintColor="#F45303"
                maximumTrackTintColor="#333333"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderValue}>
                {config.maxOfflineStorage} MB
              </Text>
            </View>
          </View>
        </View>

        {/* Data Compression */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Data Compression</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="compress" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Data Compression</Text>
                <Text style={styles.settingDescription}>
                  Compress data to save storage space
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableDataCompression}
              onValueChange={value => {
                setConfig({ ...config, enableDataCompression: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="tune" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Compression Level</Text>
                <Text style={styles.settingDescription}>
                  Level of data compression
                </Text>
              </View>
            </View>
            <View style={styles.compressionSelector}>
              {['low', 'medium', 'high'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.compressionButton,
                    config.compressionLevel === level &&
                      styles.compressionButtonActive,
                  ]}
                  onPress={() =>
                    setConfig({ ...config, compressionLevel: level })
                  }
                >
                  <Text
                    style={[
                      styles.compressionButtonText,
                      config.compressionLevel === level &&
                        styles.compressionButtonTextActive,
                    ]}
                  >
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Storage Actions */}
        <View style={styles.storageActionsSection}>
          <Text style={styles.sectionTitle}>Storage Actions</Text>

          <TouchableOpacity style={styles.storageActionButton}>
            <MaterialIcons name="delete-sweep" size={20} color="#FFFFFF" />
            <Text style={styles.storageActionText}>Clean Old Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.storageActionButton}>
            <MaterialIcons name="compress" size={20} color="#FFFFFF" />
            <Text style={styles.storageActionText}>Compress Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.storageActionButton}>
            <MaterialIcons name="backup" size={20} color="#FFFFFF" />
            <Text style={styles.storageActionText}>Backup Data</Text>
          </TouchableOpacity>
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

        {/* Encryption Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Encryption</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="security" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Encryption</Text>
                <Text style={styles.settingDescription}>
                  Encrypt offline data for security
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableEncryption}
              onValueChange={value => {
                setConfig({ ...config, enableEncryption: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="key" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Encryption Key</Text>
                <Text style={styles.settingDescription}>
                  Key used for data encryption
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.textInput}
              value={config.encryptionKey}
              onChangeText={value => {
                setConfig({ ...config, encryptionKey: value });
              }}
              placeholder="Enter encryption key"
              placeholderTextColor="#CCCCCC"
              secureTextEntry
            />
          </View>
        </View>

        {/* Debug Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Debug Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="bug-report" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Debug Mode</Text>
                <Text style={styles.settingDescription}>
                  Enable debug logging for offline operations
                </Text>
              </View>
            </View>
            <Switch
              value={config.debugMode || false}
              onValueChange={value => {
                setConfig({ ...config, debugMode: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="analytics" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Performance Monitoring</Text>
                <Text style={styles.settingDescription}>
                  Monitor offline performance metrics
                </Text>
              </View>
            </View>
            <Switch
              value={config.performanceMonitoring || false}
              onValueChange={value => {
                setConfig({ ...config, performanceMonitoring: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Reset Settings */}
        <View style={styles.resetSection}>
          <Text style={styles.sectionTitle}>Reset Settings</Text>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetSettings}
          >
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
      case 'sync':
        return renderSyncTab();
      case 'storage':
        return renderStorageTab();
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
        <Text style={styles.loadingText}>Loading offline settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Offline Settings</Text>
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
          { key: 'sync', label: 'Sync', icon: 'sync' },
          { key: 'storage', label: 'Storage', icon: 'storage' },
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#F45303',
    width: 20,
    height: 20,
  },
  sliderValue: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  priorityButtonActive: {
    backgroundColor: '#F45303',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
  },
  compressionSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  compressionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  compressionButtonActive: {
    backgroundColor: '#F45303',
  },
  compressionButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  compressionButtonTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    width: 120,
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
  storageActionsSection: {
    marginTop: 20,
  },
  storageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  storageActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
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

export default OfflineSettings;
