import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProgressBar from 'react-native-progress/Bar';
import DownloadService from '../../services/DownloadService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedDownloadManagerProps {
  visible: boolean;
  onClose: () => void;
}

const EnhancedDownloadManager: React.FC<EnhancedDownloadManagerProps> = ({
  visible,
  onClose,
}) => {
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'active' | 'completed' | 'all'
  >('active');

  const downloadService = DownloadService.getInstance();

  useEffect(() => {
    if (visible) {
      loadDownloads();
      const interval = setInterval(loadDownloads, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [visible, selectedTab]);

  const loadDownloads = async () => {
    try {
      const enhancedDownloads = await downloadService.getAllEnhancedDownloads();
      const enhancedStats = await downloadService.getEnhancedStats();

      let filteredDownloads;
      switch (selectedTab) {
        case 'active':
          filteredDownloads = enhancedDownloads.filter(d =>
            ['queued', 'downloading', 'paused'].includes(d.status),
          );
          break;
        case 'completed':
          filteredDownloads = enhancedDownloads.filter(
            d => d.status === 'completed',
          );
          break;
        default:
          filteredDownloads = enhancedDownloads;
      }

      setDownloads(filteredDownloads);
      setStats(enhancedStats);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load enhanced downloads:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  };

  const handleDownloadAction = async (
    downloadId: string,
    action: 'pause' | 'resume' | 'cancel',
  ) => {
    try {
      switch (action) {
        case 'pause':
          await downloadService.pauseEnhancedDownload(downloadId);
          break;
        case 'resume':
          await downloadService.resumeEnhancedDownload(downloadId);
          break;
        case 'cancel':
          Alert.alert(
            '🟠 Cancel Spred Download',
            'Are you sure you want to cancel this download? All progress will be lost and you\'ll need to restart from the beginning.',
            [
              { text: 'Keep Downloading', style: 'cancel' },
              {
                text: '❌ Yes, Cancel',
                style: 'destructive',
                onPress: async () =>
                  await downloadService.cancelEnhancedDownload(downloadId),
              },
            ],
          );
          break;
      }
      // Refresh the downloads list after action
      await loadDownloads();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to perform download action:', error);
      Alert.alert(
        'Error',
        'Failed to perform download action. Please try again.',
      );
    }
  };

  const showSettings = () => {
    Alert.alert(
      '⚙️ Spred Download Settings',
      'Configure your enhanced download options with Spred\'s intelligent download system',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '📶 WiFi Only Mode',
          onPress: async () => {
            await downloadService.updateEnhancedSettings({
              wifiOnlyMode: true,
            });
            Alert.alert(
              '🟠 Spred Settings Updated',
              '📶 Downloads will only use WiFi connections for optimal performance and data savings.',
              [{ text: 'Got it!', style: 'default' }],
            );
          },
        },
        {
          text: '🌐 Allow Cellular',
          onPress: async () => {
            await downloadService.updateEnhancedSettings({
              wifiOnlyMode: false,
            });
            Alert.alert(
              '🟠 Spred Settings Updated',
              '🌐 Downloads can now use cellular data. Data charges may apply.',
              [{ text: 'Understood', style: 'default' }],
            );
          },
        },
        {
          text: '⚡ Max 3 Concurrent',
          onPress: async () => {
            await downloadService.updateEnhancedSettings({
              maxConcurrentDownloads: 3,
            });
            Alert.alert(
              '🟠 Spred Settings Updated',
              '⚡ Maximum concurrent downloads set to 3 for optimal performance.',
              [{ text: 'Perfect!', style: 'default' }],
            );
          },
        },
      ],
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) {
      return '';
    }
    const mbps = bytesPerSecond / 1024 / 1024;
    return `${mbps.toFixed(1)} MB/s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'downloading':
        return '#F45303';
      case 'completed':
        return '#4CAF50';
      case 'paused':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      case 'queued':
        return '#2196F3';
      default:
        return '#8B8B8B';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'downloading':
        return 'download';
      case 'completed':
        return 'check-circle';
      case 'paused':
        return 'pause-circle-outline';
      case 'failed':
        return 'error';
      case 'queued':
        return 'schedule';
      default:
        return 'help';
    }
  };

  const renderDownloadItem = download => (
    <View key={download.id} style={styles.downloadItem}>
      <View style={styles.downloadHeader}>
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadTitle} numberOfLines={2}>
            {download.title}
          </Text>
          <View style={styles.downloadMeta}>
            <MaterialIcons
              name={getStatusIcon(download.status)}
              size={14}
              color={getStatusColor(download.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(download.status) },
              ]}
            >
              {download.status.toUpperCase()}
            </Text>
            {download.status === 'downloading' && download.speed > 0 && (
              <Text style={styles.speedText}>
                • {formatSpeed(download.speed)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.downloadActions}>
          {download.status === 'downloading' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadAction(download.id, 'pause')}
            >
              <MaterialIcons name="pause" size={20} color="#FF9800" />
            </TouchableOpacity>
          )}
          {download.status === 'paused' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadAction(download.id, 'resume')}
            >
              <MaterialIcons name="play-arrow" size={20} color="#4CAF50" />
            </TouchableOpacity>
          )}
          {['downloading', 'paused', 'queued'].includes(download.status) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadAction(download.id, 'cancel')}
            >
              <MaterialIcons name="close" size={20} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {download.status !== 'completed' && download.status !== 'failed' && (
        <View style={styles.progressSection}>
          <ProgressBar
            progress={download.progress / 100}
            width={SCREEN_WIDTH - 80}
            height={6}
            color="#F45303"
            unfilledColor="#2A2A2A"
            borderWidth={0}
            borderRadius={3}
          />
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {Math.round(download.progress)}% •{' '}
              {formatFileSize(download.downloadedSize)} /{' '}
              {formatFileSize(download.size)}
            </Text>
            {download.estimatedTimeRemaining > 0 &&
              download.status === 'downloading' && (
                <Text style={styles.timeRemaining}>
                  {Math.round(download.estimatedTimeRemaining / 60)} min
                  remaining
                </Text>
              )}
          </View>
        </View>
      )}

      {download.status === 'completed' && (
        <View style={styles.completedInfo}>
          <Text style={styles.completedText}>
            ✅ {formatFileSize(download.size)} • Completed{' '}
            {new Date(download.completedAt).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {download.status === 'failed' && download.error && (
        <View style={styles.errorInfo}>
          <Text style={styles.errorText}>❌ {download.error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleDownloadAction(download.id, 'resume')}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.brandIcon}>
              <MaterialIcons
                name="download-for-offline"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Spred Downloads</Text>
              <Text style={styles.subtitle}>Enhanced Download Manager</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeDownloads}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedDownloads}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatFileSize(stats.downloadedSize)}
              </Text>
              <Text style={styles.statLabel}>Downloaded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatSpeed(stats.averageSpeed)}
              </Text>
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['active', 'completed', 'all'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Downloads List */}
        <ScrollView
          style={styles.downloadsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F45303"
            />
          }
        >
          {downloads.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons
                  name="download-for-offline"
                  size={48}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.emptyTitle}>
                No {selectedTab} downloads yet
              </Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'active'
                  ? '🎬 Start downloading Spred videos to see them here with enhanced resume and background support!'
                  : selectedTab === 'completed'
                  ? '✅ Your completed Spred downloads will appear here'
                  : '📥 All your Spred downloads will be managed here'}
              </Text>
            </View>
          ) : (
            downloads.map(renderDownloadItem)
          )}
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F45303',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#F45303',
    marginTop: 2,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F45303',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#F45303',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8B8B',
  },
  activeTabText: {
    color: '#F45303',
  },
  settingsButton: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  downloadItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  downloadInfo: {
    flex: 1,
    marginRight: 12,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  speedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  downloadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginTop: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#4CAF50',
  },
  completedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  errorInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F45303',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default EnhancedDownloadManager;
