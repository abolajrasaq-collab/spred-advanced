import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Switch,
  RefreshControl,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import NotificationService from '../../services/NotificationService';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/auth';

const Settings = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [userInfo, setUserInfo] = useState(null);
  const [settings, setSettings] = useState({
    // Playback Settings
    videoQuality: 'HD', // Auto, SD, HD, 4K
    autoPlay: true,
    subtitles: true,
    subtitleLanguage: 'English',
    playbackSpeed: '1.0x',

    // Download Settings
    autoDownload: false,
    wifiOnly: true,
    downloadQuality: 'HD',
    storageLocation: 'Internal',
    maxDownloads: '10',

    // Notifications
    notifications: true,
    liveDataNotifications: false,
    newContentAlerts: true,
    downloadCompleteAlerts: true,
    socialNotifications: false,

    // Privacy & Security
    parentalControls: false,
    watchHistory: true,
    dataCollection: false,
    locationServices: false,

    // Appearance
    theme: 'Dark', // Dark, Light, Auto
    language: 'English',
    textSize: 'Medium',
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await getDataJson('User');
      if (userData) {
        setUserInfo(userData);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading user info:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await getDataJson('AppSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...savedSettings });
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Handle live data notifications toggle
    if (key === 'liveDataNotifications') {
      const notificationService = NotificationService.getInstance();
      if (value) {
        notificationService.enableLiveData();
        Alert.alert(
          'Live Data Activated',
          'You will now receive real-time notifications for new content and updates.',
          [{ text: 'OK' }],
        );
      } else {
        notificationService.disableLiveData();
      }
    }

    try {
      await storeDataJson('AppSettings', newSettings);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserInfo();
      await loadSettings();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const showQualityPicker = () => {
    Alert.alert('Video Quality', 'Choose your preferred video quality', [
      { text: 'Auto', onPress: () => updateSetting('videoQuality', 'Auto') },
      { text: 'SD (480p)', onPress: () => updateSetting('videoQuality', 'SD') },
      { text: 'HD (720p)', onPress: () => updateSetting('videoQuality', 'HD') },
      {
        text: '4K (2160p)',
        onPress: () => updateSetting('videoQuality', '4K'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showDownloadQualityPicker = () => {
    Alert.alert('Download Quality', 'Choose quality for downloads', [
      {
        text: 'SD (480p)',
        onPress: () => updateSetting('downloadQuality', 'SD'),
      },
      {
        text: 'HD (720p)',
        onPress: () => updateSetting('downloadQuality', 'HD'),
      },
      {
        text: '4K (2160p)',
        onPress: () => updateSetting('downloadQuality', '4K'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showThemePicker = () => {
    Alert.alert('Theme', 'Choose your preferred theme', [
      { text: 'Dark', onPress: () => updateSetting('theme', 'Dark') },
      { text: 'Light', onPress: () => updateSetting('theme', 'Light') },
      { text: 'Auto', onPress: () => updateSetting('theme', 'Auto') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showTextSizePicker = () => {
    Alert.alert('Text Size', 'Choose your preferred text size', [
      { text: 'Small', onPress: () => updateSetting('textSize', 'Small') },
      { text: 'Medium', onPress: () => updateSetting('textSize', 'Medium') },
      { text: 'Large', onPress: () => updateSetting('textSize', 'Large') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showLanguagePicker = () => {
    Alert.alert('Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => updateSetting('language', 'English') },
      { text: 'Spanish', onPress: () => updateSetting('language', 'Spanish') },
      { text: 'French', onPress: () => updateSetting('language', 'French') },
      { text: 'German', onPress: () => updateSetting('language', 'German') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const showStoragePicker = () => {
    Alert.alert('Storage Location', 'Choose where to store downloads', [
      {
        text: 'Internal Storage',
        onPress: () => updateSetting('storageLocation', 'Internal'),
      },
      {
        text: 'SD Card',
        onPress: () => updateSetting('storageLocation', 'SD Card'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
    showArrow = false,
    onPress,
  }) => {
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <MaterialIcons name={icon} size={20} color="#F45303" />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {onToggle ? (
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{ false: '#444444', true: '#F45303' }}
              thumbColor={value ? '#FFFFFF' : '#8B8B8B'}
            />
          ) : showArrow ? (
            <MaterialIcons name="arrow-forward" size={16} color="#8B8B8B" />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F45303"
          />
        }
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle={
              userInfo
                ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`
                : 'Manage your account information'
            }
            showArrow
            onPress={() => navigation.navigate('Account')}
          />
          <SettingItem
            icon="credit-card"
            title="Subscription"
            subtitle="Manage your subscription plan"
            showArrow
            onPress={() => Alert.alert('Subscription', 'Coming soon!')}
          />
        </View>

        {/* Video Quality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIDEO QUALITY</Text>
          <SettingItem
            icon="settings"
            title="Video Quality"
            subtitle={`Current: ${settings.videoQuality}`}
            showArrow
            onPress={() => showQualityPicker()}
          />
          <SettingItem
            icon="wifi"
            title="Auto Quality"
            subtitle="Adjust quality based on connection"
            value={settings.videoQuality === 'Auto'}
            onToggle={value =>
              updateSetting('videoQuality', value ? 'Auto' : 'HD')
            }
          />
        </View>

        {/* Playback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PLAYBACK</Text>
          <SettingItem
            icon="play-circle-outline"
            title="Auto-play"
            subtitle="Automatically play next video"
            value={settings.autoPlay}
            onToggle={value => updateSetting('autoPlay', value)}
          />
          <SettingItem
            icon="infocirlce"
            title="Subtitles"
            subtitle="Show subtitles by default"
            value={settings.subtitles}
            onToggle={value => updateSetting('subtitles', value)}
          />
          <SettingItem
            icon="language"
            title="Subtitle Language"
            subtitle={settings.subtitleLanguage}
            showArrow
            onPress={() => showLanguagePicker()}
          />
        </View>

        {/* Download Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOWNLOADS</Text>
          <SettingItem
            icon="download"
            title="Auto-download"
            subtitle="Automatically download new episodes"
            value={settings.autoDownload}
            onToggle={value => updateSetting('autoDownload', value)}
          />
          <SettingItem
            icon="wifi"
            title="Wi-Fi Only"
            subtitle="Download only when connected to Wi-Fi"
            value={settings.wifiOnly}
            onToggle={value => updateSetting('wifiOnly', value)}
          />
          <SettingItem
            icon="settings"
            title="Download Quality"
            subtitle={settings.downloadQuality}
            showArrow
            onPress={() => showDownloadQualityPicker()}
          />
          <SettingItem
            icon="folderopen"
            title="Storage Location"
            subtitle={settings.storageLocation + ' Storage'}
            showArrow
            onPress={() => showStoragePicker()}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Receive app notifications"
            value={settings.notifications}
            onToggle={value => updateSetting('notifications', value)}
          />
          <SettingItem
            icon="wifi"
            title="Live Data Notifications"
            subtitle="Real-time updates for new content"
            value={settings.liveDataNotifications}
            onToggle={value => updateSetting('liveDataNotifications', value)}
          />
          <SettingItem
            icon="star-border"
            title="New Content Alerts"
            subtitle="Notify about new releases"
            value={settings.newContentAlerts}
            onToggle={value => updateSetting('newContentAlerts', value)}
          />
          <SettingItem
            icon="download"
            title="Download Complete"
            subtitle="Notify when downloads finish"
            value={settings.downloadCompleteAlerts}
            onToggle={value => updateSetting('downloadCompleteAlerts', value)}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
          <SettingItem
            icon="security"
            title="Parental Controls"
            subtitle="Restrict content access"
            value={settings.parentalControls}
            onToggle={value => updateSetting('parentalControls', value)}
          />
          <SettingItem
            icon="visibility-off"
            title="Watch History"
            subtitle="Save viewing history"
            value={settings.watchHistory}
            onToggle={value => updateSetting('watchHistory', value)}
          />
          <SettingItem
            icon="storage"
            title="Data Collection"
            subtitle="Allow usage analytics"
            value={settings.dataCollection}
            onToggle={value => updateSetting('dataCollection', value)}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <SettingItem
            icon="dark-mode"
            title="Theme"
            subtitle={settings.theme + ' Mode'}
            showArrow
            onPress={() => showThemePicker()}
          />
          <SettingItem
            icon="format-size"
            title="Text Size"
            subtitle={settings.textSize}
            showArrow
            onPress={() => showTextSizePicker()}
          />
          <SettingItem
            icon="language"
            title="Language"
            subtitle={settings.language}
            showArrow
            onPress={() => showLanguagePicker()}
          />
        </View>

        {/* Developer Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Developer Preview</Text>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => navigation.navigate('VideoPlayerTest')}
          >
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <MaterialIcons name="videocam" size={20} color="#2196F3" />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>Video Player Test</Text>
                  <Text style={styles.menuSubtitle}>
                    Test fullscreen video player functionality
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#8B8B8B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    // Clear all stored data
                    storeDataJson('User', null);
                    storeDataJson('UserInfo', null);
                    storeDataJson('Profile', null);
                    
                    // Dispatch Redux logout action
                    dispatch(logout());
                    
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'SignIn' }],
                    });
                  },
                },
              ]);
            }}
            style={styles.logoutButton}
          >
            <MaterialIcons name="logout" size={20} color="#FF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F45303',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
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
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 16,
  },
  logoutSection: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  bottomSpacing: {
    height: 100,
  },
  previewButton: {
    marginBottom: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuInfo: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#8B8B8B',
    lineHeight: 16,
  },
});

export default Settings;
