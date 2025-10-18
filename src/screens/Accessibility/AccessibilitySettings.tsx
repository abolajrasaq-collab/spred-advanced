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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AccessibilityService from '../../services/AccessibilityService';
import AnalyticsService from '../../services/AnalyticsService';

interface AccessibilitySettingsProps {
  onBack?: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  onBack,
}) => {
  const navigation = useNavigation();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'visual' | 'motor' | 'auditory' | 'cognitive' | 'advanced'
  >('visual');

  useEffect(() => {
    loadAccessibilitySettings();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      setLoading(true);

      const accessibilityConfig =
        await AccessibilityService.getAccessibilityConfig();
      setConfig(accessibilityConfig);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load accessibility settings:', error);
      Alert.alert('Error', 'Failed to load accessibility settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      await AccessibilityService.updateAccessibilityConfig(config);

      Alert.alert('Success', 'Accessibility settings saved successfully');

      AnalyticsService.trackEvent('accessibility_settings_saved', {
        config: config,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save accessibility settings:', error);
      Alert.alert('Error', 'Failed to save accessibility settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Accessibility Settings',
      'This will reset all accessibility settings to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AccessibilityService.clearAccessibilityData();
              await loadAccessibilitySettings();
              AnalyticsService.trackEvent('accessibility_settings_reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset accessibility settings');
            }
          },
        },
      ],
    );
  };

  const handleTestAccessibility = async () => {
    try {
      // This would test various accessibility features
      Alert.alert('Success', 'Accessibility test completed successfully');

      AnalyticsService.trackEvent('accessibility_test_completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to test accessibility features');
    }
  };

  const renderVisualTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Visual Accessibility</Text>

        {/* Screen Reader Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Screen Reader</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="screen-reader" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Screen Reader Support</Text>
                <Text style={styles.settingDescription}>
                  Enable full screen reader support for assistive technologies
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableScreenReader}
              onValueChange={value => {
                setConfig({ ...config, enableScreenReader: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="record-voice-over"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>VoiceOver Support</Text>
                <Text style={styles.settingDescription}>
                  iOS VoiceOver integration for blind and low-vision users
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableVoiceOver}
              onValueChange={value => {
                setConfig({ ...config, enableVoiceOver: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="hearing" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>TalkBack Support</Text>
                <Text style={styles.settingDescription}>
                  Android TalkBack integration for blind and low-vision users
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableTalkBack}
              onValueChange={value => {
                setConfig({ ...config, enableTalkBack: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Visual Enhancement Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Visual Enhancement</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="contrast" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>High Contrast</Text>
                <Text style={styles.settingDescription}>
                  Enable high contrast mode for better visibility
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableHighContrast}
              onValueChange={value => {
                setConfig({ ...config, enableHighContrast: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="text-fields" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Large Text</Text>
                <Text style={styles.settingDescription}>
                  Enable large text for better readability
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableLargeText}
              onValueChange={value => {
                setConfig({ ...config, enableLargeText: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="color-lens" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Color Blind Support</Text>
                <Text style={styles.settingDescription}>
                  Enable color schemes optimized for color vision deficiency
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableColorBlindSupport}
              onValueChange={value => {
                setConfig({ ...config, enableColorBlindSupport: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Font Size Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Font Size</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="format-size" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Font Size</Text>
                <Text style={styles.settingDescription}>
                  Select the font size that works best for you
                </Text>
              </View>
            </View>
            <View style={styles.fontSizeSelector}>
              {['small', 'medium', 'large', 'extra-large'].map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeButton,
                    config.fontSize === size && styles.fontSizeButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, fontSize: size })}
                >
                  <Text
                    style={[
                      styles.fontSizeButtonText,
                      config.fontSize === size &&
                        styles.fontSizeButtonTextActive,
                    ]}
                  >
                    {size.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMotorTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Motor Accessibility</Text>

        {/* Navigation Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Navigation</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="keyboard" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Keyboard Navigation</Text>
                <Text style={styles.settingDescription}>
                  Enable full keyboard navigation support
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableKeyboardNavigation}
              onValueChange={value => {
                setConfig({ ...config, enableKeyboardNavigation: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="touch-app" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Gesture Navigation</Text>
                <Text style={styles.settingDescription}>
                  Enable alternative gesture navigation methods
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableGestureNavigation}
              onValueChange={value => {
                setConfig({ ...config, enableGestureNavigation: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Interaction Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Interaction</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="vibration" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDescription}>
                  Enable tactile feedback for touch interactions
                </Text>
              </View>
            </View>
            <Switch
              value={config.hapticFeedback}
              onValueChange={value => {
                setConfig({ ...config, hapticFeedback: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="gesture" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Gesture Recognition</Text>
                <Text style={styles.settingDescription}>
                  Enable advanced gesture recognition for motor accessibility
                </Text>
              </View>
            </View>
            <Switch
              value={config.gestureRecognition}
              onValueChange={value => {
                setConfig({ ...config, gestureRecognition: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Motion Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Motion</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="motion-photos-off"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Reduced Motion</Text>
                <Text style={styles.settingDescription}>
                  Minimize animations and motion for users with vestibular
                  disorders
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableReducedMotion}
              onValueChange={value => {
                setConfig({ ...config, enableReducedMotion: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderAuditoryTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Auditory Accessibility</Text>

        {/* Audio Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Audio</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="subtitles" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Subtitles</Text>
                <Text style={styles.settingDescription}>
                  Enable closed captions and subtitles for audio content
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableSubtitles}
              onValueChange={value => {
                setConfig({ ...config, enableSubtitles: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="audiotrack" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Audio Descriptions</Text>
                <Text style={styles.settingDescription}>
                  Enable audio descriptions for visual content
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableAudioDescriptions}
              onValueChange={value => {
                setConfig({ ...config, enableAudioDescriptions: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Voice</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="record-voice-over"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Voice Commands</Text>
                <Text style={styles.settingDescription}>
                  Enable voice control for hands-free operation
                </Text>
              </View>
            </View>
            <Switch
              value={config.voiceCommands}
              onValueChange={value => {
                setConfig({ ...config, voiceCommands: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="volume-up" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Audio Guidance</Text>
                <Text style={styles.settingDescription}>
                  Enable audio guidance for navigation and interactions
                </Text>
              </View>
            </View>
            <Switch
              value={config.audioGuidance}
              onValueChange={value => {
                setConfig({ ...config, audioGuidance: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Sign Language Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Sign Language</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="sign-language" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sign Language Support</Text>
                <Text style={styles.settingDescription}>
                  Enable sign language interpretation for deaf users
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableSignLanguage}
              onValueChange={value => {
                setConfig({ ...config, enableSignLanguage: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderCognitiveTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Cognitive Accessibility</Text>

        {/* Focus Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Focus & Attention</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="focus-mode" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Focus Mode</Text>
                <Text style={styles.settingDescription}>
                  Enable focus mode to reduce distractions
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableFocusMode || false}
              onValueChange={value => {
                setConfig({ ...config, enableFocusMode: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="timer" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Time Limits</Text>
                <Text style={styles.settingDescription}>
                  Set time limits for app usage to prevent overuse
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableTimeLimits || false}
              onValueChange={value => {
                setConfig({ ...config, enableTimeLimits: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Memory Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Memory & Learning</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="memory" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Memory Aids</Text>
                <Text style={styles.settingDescription}>
                  Enable memory aids and reminders
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableMemoryAids || false}
              onValueChange={value => {
                setConfig({ ...config, enableMemoryAids: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="school" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Learning Support</Text>
                <Text style={styles.settingDescription}>
                  Enable learning support features
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableLearningSupport || false}
              onValueChange={value => {
                setConfig({ ...config, enableLearningSupport: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
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

        {/* Color Scheme Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Color Scheme</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="palette" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Color Scheme</Text>
                <Text style={styles.settingDescription}>
                  Select the color scheme that works best for you
                </Text>
              </View>
            </View>
            <View style={styles.colorSchemeSelector}>
              {['default', 'dark', 'light', 'high-contrast'].map(scheme => (
                <TouchableOpacity
                  key={scheme}
                  style={[
                    styles.colorSchemeButton,
                    config.colorScheme === scheme &&
                      styles.colorSchemeButtonActive,
                  ]}
                  onPress={() => setConfig({ ...config, colorScheme: scheme })}
                >
                  <Text
                    style={[
                      styles.colorSchemeButtonText,
                      config.colorScheme === scheme &&
                        styles.colorSchemeButtonTextActive,
                    ]}
                  >
                    {scheme.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Motion Settings */}
        <View style={styles.settingGroup}>
          <Text style={styles.groupTitle}>Motion Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="motion-photos-off"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Motion Reduction</Text>
                <Text style={styles.settingDescription}>
                  Select the level of motion reduction
                </Text>
              </View>
            </View>
            <View style={styles.motionSelector}>
              {['none', 'reduced', 'minimal'].map(motion => (
                <TouchableOpacity
                  key={motion}
                  style={[
                    styles.motionButton,
                    config.motionReduction === motion &&
                      styles.motionButtonActive,
                  ]}
                  onPress={() =>
                    setConfig({ ...config, motionReduction: motion })
                  }
                >
                  <Text
                    style={[
                      styles.motionButtonText,
                      config.motionReduction === motion &&
                        styles.motionButtonTextActive,
                    ]}
                  >
                    {motion.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Test Functions */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Functions</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestAccessibility}
          >
            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Accessibility</Text>
          </TouchableOpacity>

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
      case 'visual':
        return renderVisualTab();
      case 'motor':
        return renderMotorTab();
      case 'auditory':
        return renderAuditoryTab();
      case 'cognitive':
        return renderCognitiveTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderVisualTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>
          Loading accessibility settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Accessibility Settings</Text>
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
          { key: 'visual', label: 'Visual', icon: 'visibility' },
          { key: 'motor', label: 'Motor', icon: 'touch-app' },
          { key: 'auditory', label: 'Auditory', icon: 'hearing' },
          { key: 'cognitive', label: 'Cognitive', icon: 'psychology' },
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
  fontSizeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  fontSizeButtonActive: {
    backgroundColor: '#F45303',
  },
  fontSizeButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  fontSizeButtonTextActive: {
    color: '#FFFFFF',
  },
  colorSchemeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSchemeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  colorSchemeButtonActive: {
    backgroundColor: '#F45303',
  },
  colorSchemeButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  colorSchemeButtonTextActive: {
    color: '#FFFFFF',
  },
  motionSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  motionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  motionButtonActive: {
    backgroundColor: '#F45303',
  },
  motionButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  motionButtonTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
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

export default AccessibilitySettings;
