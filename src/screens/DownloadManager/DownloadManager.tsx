import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import { CustomText, Icon, CustomButton } from '../../components';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import RNFS from 'react-native-fs';
import {
  getDataJson,
  storeDataJson,
} from '../../../src/helpers/api/Asyncstorage';
import DownloadManagerService, {
  DownloadItem,
  StorageInfo,
} from '../../services/DownloadManagerService';

const DownloadManager = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  // Responsive design helpers
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 600;

  // Initialize download manager service
  const downloadManager = DownloadManagerService.getInstance();

  // State management
  const [activeTab, setActiveTab] = useState<
    'queue' | 'completed' | 'failed' | 'storage'
  >('queue');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSpace: 0,
    usedSpace: 0,
    freeSpace: 0,
    downloadsSize: 0,
    availableForDownloads: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [storageLimit, setStorageLimit] = useState<number>(5000); // MB

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (!bytes) {
      return '0 B';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1048576) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1073741824) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (!bytesPerSecond) {
      return '0 B/s';
    }
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond} B/s`;
    }
    if (bytesPerSecond < 1048576) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    }
    return `${(bytesPerSecond / 1048576).toFixed(1)} MB/s`;
  };

  const formatTime = (seconds: number): string => {
    if (!seconds) {
      return '0s';
    }
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    }
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStoragePercentage = (used: number, total: number): number => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  // Load downloads from storage
  const loadDownloads = async () => {
    try {
      const savedDownloads = await getDataJson<DownloadItem[]>('DownloadQueue');
      if (savedDownloads) {
        setDownloads(savedDownloads);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading downloads:', error);
    }
  };

  // Save downloads to storage
  const saveDownloads = async (downloadsToSave: DownloadItem[]) => {
    try {
      await storeDataJson('DownloadQueue', downloadsToSave);
      setDownloads(downloadsToSave);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving downloads:', error);
    }
  };

  // Calculate storage information
  const calculateStorageInfo = async () => {
    try {
      const foldersToCheck = [
        `${RNFS.ExternalDirectoryPath}/SpredVideos`,
        `${RNFS.ExternalDirectoryPath}/.spredHiddenFolder`,
      ];

      let totalSize = 0;
      for (const folder of foldersToCheck) {
        try {
          const folderExists = await RNFS.exists(folder);
          if (folderExists) {
            const files = await RNFS.readDir(folder);
            for (const file of files) {
              if (
                file.isFile() &&
                (file.name.endsWith('.mp4') || file.name.endsWith('.meta.json'))
              ) {
                totalSize += file.size || 0;
              }
            }
          }
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log(`Error checking folder ${folder}:`, error);
        }
      }

      // Get device storage info (approximate)
      const deviceStorage = await RNFS.getFSInfo();
      const totalSpace = deviceStorage.totalSpace || 0;
      const freeSpace = deviceStorage.freeSpace || 0;
      const usedSpace = totalSpace - freeSpace;

      setStorageInfo({
        totalSpace,
        usedSpace,
        freeSpace,
        downloadsSize: totalSize,
        availableForDownloads: freeSpace,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error calculating storage info:', error);
    }
  };

  // Load settings
  const loadSettings = async () => {
    try {
      const settings = await getDataJson<{
        autoDownload?: boolean;
        defaultQuality?: 'low' | 'medium' | 'high';
        storageLimit?: number;
      }>('DownloadSettings');
      if (settings) {
        setAutoDownload(settings.autoDownload || false);
        setDefaultQuality(settings.defaultQuality || 'medium');
        setStorageLimit(settings.storageLimit || 5000);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading settings:', error);
    }
  };

  // Save settings
  const saveSettings = async () => {
    try {
      const settings = {
        autoDownload,
        defaultQuality,
        storageLimit,
      };
      await storeDataJson('DownloadSettings', settings);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving settings:', error);
    }
  };

  // Update download progress
  const updateDownloadProgress = (
    id: string,
    progress: number,
    downloadedSize: number,
    speed: number,
  ) => {
    setDownloads(prev =>
      prev.map(download => {
        if (download.id === id) {
          return {
            ...download,
            progress,
            downloadedSize,
            downloadSpeed: speed,
            estimatedTime:
              speed > 0 ? (download.size - downloadedSize) / speed : 0,
          };
        }
        return download;
      }),
    );
  };

  // Pause download
  const pauseDownload = (id: string) => {
    setDownloads(prev =>
      prev.map(download =>
        download.id === id
          ? { ...download, status: 'paused' as const }
          : download,
      ),
    );
  };

  // Resume download
  const resumeDownload = (id: string) => {
    setDownloads(prev =>
      prev.map(download =>
        download.id === id
          ? { ...download, status: 'downloading' as const }
          : download,
      ),
    );
  };

  // Cancel download
  const cancelDownload = (id: string) => {
    Alert.alert(
      'Cancel Download',
      'Are you sure you want to cancel this download?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setDownloads(prev =>
              prev.map(download =>
                download.id === id
                  ? { ...download, status: 'cancelled' as const }
                  : download,
              ),
            );
          },
        },
      ],
    );
  };

  // Delete download
  const deleteDownload = (id: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this download?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const download = downloads.find(d => d.id === id);
            if (download) {
              try {
                // Delete file if it exists
                if (
                  download.localPath &&
                  (await RNFS.exists(download.localPath))
                ) {
                  await RNFS.unlink(download.localPath);
                }
                // Delete metadata file
                const metaPath = download.localPath
                  ? `${download.localPath}.meta.json`
                  : '';
                if (await RNFS.exists(metaPath)) {
                  await RNFS.unlink(metaPath);
                }

                // Remove from downloads list
                setDownloads(prev => prev.filter(d => d.id !== id));
              } catch (error) {
                // DISABLED FOR PERFORMANCE
                // console.log('Error deleting download:', error);
                Alert.alert('Error', 'Failed to delete download');
              }
            }
          },
        },
      ],
    );
  };

  // Clear all completed downloads
  const clearCompleted = () => {
    Alert.alert(
      'Clear Completed',
      'Are you sure you want to clear all completed downloads?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setDownloads(prev => prev.filter(d => d.status !== 'completed'));
          },
        },
      ],
    );
  };

  // Clear all failed downloads
  const clearFailed = () => {
    Alert.alert(
      'Clear Failed',
      'Are you sure you want to clear all failed downloads?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setDownloads(prev => prev.filter(d => d.status !== 'failed'));
          },
        },
      ],
    );
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDownloads(), calculateStorageInfo()]);
    setRefreshing(false);
  };

  // Initialize component
  useEffect(() => {
    loadDownloads();
    calculateStorageInfo();
    loadSettings();
  }, []);

  // Auto-save downloads when they change
  useEffect(() => {
    if (downloads.length > 0) {
      saveDownloads(downloads);
    }
  }, [downloads]);

  // Auto-save settings when they change
  useEffect(() => {
    saveSettings();
  }, [autoDownload, defaultQuality, storageLimit]);

  // Filter downloads by status
  const queueDownloads = downloads.filter(d =>
    ['pending', 'downloading', 'paused'].includes(d.status),
  );
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const failedDownloads = downloads.filter(d => d.status === 'failed');

  // Render download item
  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <View
      style={{
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            backgroundColor: '#F45303',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
          }}
        >
          <Icon name="download" size={20} color="#FFFFFF" />
        </View>

        <View style={{ flex: 1 }}>
          <CustomText
            fontSize={14}
            fontWeight="600"
            color="#FFFFFF"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </CustomText>
          <CustomText fontSize={12} color="#CCCCCC">
            {formatFileSize(item.size)} • {item.quality || 'Standard'}
          </CustomText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          {item.status === 'downloading' && (
            <TouchableOpacity
              onPress={() => pauseDownload(item.id)}
              style={{
                padding: spacing.xs,
                backgroundColor: '#FF9800',
                borderRadius: 4,
              }}
            >
              <Icon name="pause" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {item.status === 'paused' && (
            <TouchableOpacity
              onPress={() => resumeDownload(item.id)}
              style={{
                padding: spacing.xs,
                backgroundColor: '#4CAF50',
                borderRadius: 4,
              }}
            >
              <Icon name="play" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => cancelDownload(item.id)}
            style={{
              padding: spacing.xs,
              backgroundColor: '#F44336',
              borderRadius: 4,
            }}
          >
            <Icon name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={{
          height: 4,
          backgroundColor: '#333333',
          borderRadius: 2,
          marginBottom: spacing.sm,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            backgroundColor: '#F45303',
            width: `${item.progress}%`,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Download Info */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <CustomText fontSize={11} color="#999999">
            {formatSpeed(item.speed)}
          </CustomText>
          <CustomText fontSize={11} color="#999999">
            {formatTime(item.estimatedTime)}
          </CustomText>
        </View>

        <TouchableOpacity
          onPress={() => deleteDownload(item.id)}
          style={{ padding: spacing.xs }}
        >
          <Icon name="delete" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render storage info
  const renderStorageInfo = () => (
    <View
      style={{
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        padding: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <CustomText
        fontSize={16}
        fontWeight="600"
        color="#FFFFFF"
        style={{ marginBottom: spacing.md }}
      >
        {TEXT_CONSTANTS.STORAGE}
      </CustomText>

      {/* Storage Usage Circle */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#333333',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
          marginBottom: spacing.md,
        }}
      >
        <CustomText fontSize={18} fontWeight="700" color="#F45303">
          {Math.round(
            getStoragePercentage(storageInfo.usedSpace, storageInfo.totalSpace),
          )}
          %
        </CustomText>
        <CustomText fontSize={10} color="#CCCCCC">
          Used
        </CustomText>
      </View>

      {/* Storage Details */}
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <CustomText fontSize={12} color="#CCCCCC">
            {TEXT_CONSTANTS.TOTAL_STORAGE}:
          </CustomText>
          <CustomText fontSize={12} color="#FFFFFF">
            {formatFileSize(storageInfo.totalSpace)}
          </CustomText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <CustomText fontSize={12} color="#CCCCCC">
            {TEXT_CONSTANTS.USED_STORAGE}:
          </CustomText>
          <CustomText fontSize={12} color="#FFFFFF">
            {formatFileSize(storageInfo.usedSpace)}
          </CustomText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <CustomText fontSize={12} color="#CCCCCC">
            {TEXT_CONSTANTS.FREE_STORAGE}:
          </CustomText>
          <CustomText fontSize={12} color="#FFFFFF">
            {formatFileSize(storageInfo.freeSpace)}
          </CustomText>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <CustomText fontSize={12} color="#CCCCCC">
            {TEXT_CONSTANTS.DOWNLOADS_SIZE}:
          </CustomText>
          <CustomText fontSize={12} color="#F45303">
            {formatFileSize(storageInfo.downloadsSize)}
          </CustomText>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: '#2A2A2A',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: spacing.sm }}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <CustomText fontSize={18} fontWeight="600" color="#FFFFFF">
          {TEXT_CONSTANTS.DOWNLOADS}
        </CustomText>

        <TouchableOpacity
          onPress={() => setShowSettings(true)}
          style={{ padding: spacing.sm }}
        >
          <Icon name="settings" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Storage Info */}
      {renderStorageInfo()}

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}
      >
        {[
          {
            key: 'queue',
            label: TEXT_CONSTANTS.QUEUE,
            count: queueDownloads.length,
          },
          {
            key: 'completed',
            label: TEXT_CONSTANTS.COMPLETED,
            count: completedDownloads.length,
          },
          {
            key: 'failed',
            label: TEXT_CONSTANTS.FAILED,
            count: failedDownloads.length,
          },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.sm,
              backgroundColor: activeTab === tab.key ? '#F45303' : '#2A2A2A',
              borderRadius: 8,
              marginHorizontal: spacing.xs,
            }}
          >
            <CustomText
              fontSize={12}
              fontWeight={activeTab === tab.key ? '600' : '400'}
              color={activeTab === tab.key ? '#FFFFFF' : '#CCCCCC'}
            >
              {tab.label} ({tab.count})
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {activeTab === 'queue' && (
          <FlatList
            data={queueDownloads}
            renderItem={renderDownloadItem}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#F45303']}
                tintColor="#F45303"
              />
            }
            ListEmptyComponent={() => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.xxl,
                }}
              >
                <Icon name="download" size={48} color="#666666" />
                <CustomText
                  fontSize={16}
                  color="#666666"
                  style={{ marginTop: spacing.md, textAlign: 'center' }}
                >
                  {TEXT_CONSTANTS.NO_DOWNLOADS}
                </CustomText>
              </View>
            )}
          />
        )}

        {activeTab === 'completed' && (
          <FlatList
            data={completedDownloads}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: '#2A2A2A',
                  borderRadius: 8,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <CustomText
                    fontSize={14}
                    fontWeight="600"
                    color="#FFFFFF"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </CustomText>
                  <CustomText fontSize={12} color="#CCCCCC">
                    {formatFileSize(item.size)} • Completed
                  </CustomText>
                </View>
                <TouchableOpacity
                  onPress={() => deleteDownload(item.id)}
                  style={{ padding: spacing.sm }}
                >
                  <Icon name="delete" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.xxl,
                }}
              >
                <Icon name="check-circle" size={48} color="#666666" />
                <CustomText
                  fontSize={16}
                  color="#666666"
                  style={{ marginTop: spacing.md, textAlign: 'center' }}
                >
                  {TEXT_CONSTANTS.NO_COMPLETED}
                </CustomText>
              </View>
            )}
          />
        )}

        {activeTab === 'failed' && (
          <FlatList
            data={failedDownloads}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: '#2A2A2A',
                  borderRadius: 8,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <CustomText
                    fontSize={14}
                    fontWeight="600"
                    color="#FFFFFF"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </CustomText>
                  <CustomText fontSize={12} color="#F44336">
                    {item.error || 'Download failed'}
                  </CustomText>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.xs,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      // Retry download
                      setDownloads(prev =>
                        prev.map(d =>
                          d.id === item.id
                            ? {
                                ...d,
                                status: 'pending' as const,
                                error: undefined,
                              }
                            : d,
                        ),
                      );
                    }}
                    style={{
                      padding: spacing.xs,
                      backgroundColor: '#4CAF50',
                      borderRadius: 4,
                    }}
                  >
                    <Icon name="refresh" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteDownload(item.id)}
                    style={{
                      padding: spacing.xs,
                      backgroundColor: '#F44336',
                      borderRadius: 4,
                    }}
                  >
                    <Icon name="delete" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.xxl,
                }}
              >
                <Icon name="error" size={48} color="#666666" />
                <CustomText
                  fontSize={16}
                  color="#666666"
                  style={{ marginTop: spacing.md, textAlign: 'center' }}
                >
                  {TEXT_CONSTANTS.NO_FAILED}
                </CustomText>
              </View>
            )}
          />
        )}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#2A2A2A',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingHorizontal: spacing.lg,
              paddingBottom: 40,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <CustomText fontSize={18} fontWeight="600" color="#FFFFFF">
                {TEXT_CONSTANTS.SETTINGS}
              </CustomText>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={{ padding: spacing.sm }}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Auto Download */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: '#333333',
                }}
              >
                <CustomText fontSize={14} color="#FFFFFF">
                  {TEXT_CONSTANTS.AUTO_DOWNLOAD}
                </CustomText>
                <TouchableOpacity
                  onPress={() => setAutoDownload(!autoDownload)}
                  style={{
                    width: 50,
                    height: 30,
                    backgroundColor: autoDownload ? '#F45303' : '#333333',
                    borderRadius: 15,
                    justifyContent: 'center',
                    alignItems: autoDownload ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 13,
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Default Quality */}
              <View
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: '#333333',
                }}
              >
                <CustomText
                  fontSize={14}
                  color="#FFFFFF"
                  style={{ marginBottom: spacing.sm }}
                >
                  {TEXT_CONSTANTS.DOWNLOAD_QUALITY}
                </CustomText>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.sm,
                  }}
                >
                  {(['low', 'medium', 'high'] as const).map(quality => (
                    <TouchableOpacity
                      key={quality}
                      onPress={() => setDefaultQuality(quality)}
                      style={{
                        backgroundColor:
                          defaultQuality === quality ? '#F45303' : '#333333',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: 6,
                      }}
                    >
                      <CustomText
                        fontSize={12}
                        color={
                          defaultQuality === quality ? '#FFFFFF' : '#CCCCCC'
                        }
                        style={{ textTransform: 'capitalize' }}
                      >
                        {quality}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Storage Limit */}
              <View
                style={{
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: '#333333',
                }}
              >
                <CustomText
                  fontSize={14}
                  color="#FFFFFF"
                  style={{ marginBottom: spacing.sm }}
                >
                  {TEXT_CONSTANTS.STORAGE_LIMIT} ({storageLimit} MB)
                </CustomText>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.sm,
                  }}
                >
                  {[1000, 2500, 5000, 10000].map(limit => (
                    <TouchableOpacity
                      key={limit}
                      onPress={() => setStorageLimit(limit)}
                      style={{
                        backgroundColor:
                          storageLimit === limit ? '#F45303' : '#333333',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: 4,
                      }}
                    >
                      <CustomText
                        fontSize={10}
                        color={storageLimit === limit ? '#FFFFFF' : '#CCCCCC'}
                      >
                        {limit / 1000}GB
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Actions */}
              <View
                style={{
                  paddingVertical: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <TouchableOpacity
                  onPress={clearCompleted}
                  style={{
                    backgroundColor: '#FF9800',
                    padding: spacing.md,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name="clear"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: spacing.xs }}
                  />
                  <CustomText fontSize={14} fontWeight="600" color="#FFFFFF">
                    {TEXT_CONSTANTS.CLEAR_COMPLETED}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={clearFailed}
                  style={{
                    backgroundColor: '#F44336',
                    padding: spacing.md,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name="clear"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: spacing.xs }}
                  />
                  <CustomText fontSize={14} fontWeight="600" color="#FFFFFF">
                    Clear Failed
                  </CustomText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DownloadManager;

// Text constants
const TEXT_CONSTANTS = {
  DOWNLOADS: 'Downloads',
  QUEUE: 'Queue',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  STORAGE: 'Storage',
  CLEAR_ALL: 'Clear All',
  PAUSE: 'Pause',
  RESUME: 'Resume',
  CANCEL: 'Cancel',
  RETRY: 'Retry',
  DELETE: 'Delete',
  PAUSE_ALL: 'Pause All',
  RESUME_ALL: 'Resume All',
  CLEAR_QUEUE: 'Clear Queue',
  CLEAR_COMPLETED: 'Clear Completed',
  CLEAR_FAILED: 'Clear Failed',
  TOTAL_STORAGE: 'Total Storage',
  USED_STORAGE: 'Used Storage',
  FREE_STORAGE: 'Free Storage',
  DOWNLOADS_SIZE: 'Downloads Size',
  NO_DOWNLOADS: 'No downloads yet',
  NO_COMPLETED: 'No completed downloads',
  NO_FAILED: 'No failed downloads',
  DOWNLOADING: 'Downloading...',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  QUALITY: 'Quality',
  SPEED: 'Speed',
  ETA: 'ETA',
  SIZE: 'Size',
  SETTINGS: 'Settings',
  AUTO_DOWNLOAD: 'Auto Download',
  DOWNLOAD_QUALITY: 'Download Quality',
  STORAGE_LIMIT: 'Storage Limit',
  CLEAR_CACHE: 'Clear Cache',
} as const;
