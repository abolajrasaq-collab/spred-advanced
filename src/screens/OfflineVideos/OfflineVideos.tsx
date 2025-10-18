// Offline Videos Screen - Phase 3 Optimization
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import OfflineVideoCacheService, {
  CachedVideo,
} from '../../services/OfflineVideoCacheService';
import CustomText from '../../components/CustomText/CustomText';
import CustomButton from '../../components/CustomButton/CustomButton';
import { useTheme } from '../../hooks';
import { formatCount } from '../../utils/performance';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const OfflineVideos: React.FC = () => {
  const navigation = useNavigation();
  const { Common, Fonts } = useTheme();
  const [cachedVideos, setCachedVideos] = useState<CachedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheAnalytics, setCacheAnalytics] = useState<any>(null);

  // Initialize cache service
  const cacheService = OfflineVideoCacheService.getInstance();

  // Load cached videos and analytics
  const loadCachedVideos = useCallback(async () => {
    try {
      const videos = await cacheService.getCachedVideos();
      const analytics = cacheService.getCacheAnalytics();
      setCachedVideos(videos);
      setCacheAnalytics(analytics);
    } catch (error) {
      console.warn('Failed to load cached videos:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadCachedVideos();
      setIsLoading(false);
    };
    init();
  }, [loadCachedVideos]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCachedVideos();
    setRefreshing(false);
  }, [loadCachedVideos]);

  // Remove video from cache
  const removeVideoFromCache = useCallback(
    async (videoId: string, title: string) => {
      Alert.alert(
        'Remove from Cache',
        `Remove "${title}" from offline storage?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await cacheService.removeFromCache(videoId);
                await loadCachedVideos(); // Refresh list
              } catch (error) {
                Alert.alert('Error', 'Failed to remove video from cache');
              }
            },
          },
        ],
      );
    },
    [cacheService, loadCachedVideos],
  );

  // Clear entire cache
  const clearAllCache = useCallback(async () => {
    Alert.alert(
      'Clear All Offline Videos',
      'This will remove all cached videos. Downloaded videos will remain but you won\'t be able to watch them offline. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await cacheService.clearCache();
              await loadCachedVideos(); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
    );
  }, [cacheService, loadCachedVideos]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 B';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${size} ${sizes[i]}`;
  }, []);

  // Format last accessed time
  const formatLastAccessed = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${days}d ago`;
  }, []);

  // Render individual video item
  const renderVideoItem = useCallback(
    ({ item }: { item: CachedVideo }) => (
      <View
        style={[
          styles.videoItem,
          { backgroundColor: Common?.card?.backgroundColor || '#2A2A2A' },
        ]}
      >
        {/* Video thumbnail/representation */}
        <View
          style={[
            styles.videoThumbnail,
            { backgroundColor: Common?.primary || '#F45303' },
          ]}
        >
          <MaterialIcons name="movie" size={48} color="#FFFFFF" />
        </View>

        {/* Video info */}
        <View style={styles.videoInfo}>
          <CustomText
            style={[
              styles.videoTitle,
              { color: Fonts?.title?.color || '#FFFFFF' },
            ]}
          >
            {item.title}
          </CustomText>

          <View style={styles.videoMeta}>
            <Text
              style={[
                styles.videoSize,
                { color: Common?.textSecondary?.color || '#CCCCCC' },
              ]}
            >
              {formatFileSize(item.fileSize)}
            </Text>

            <Text
              style={[
                styles.videoLastAccessed,
                { color: Common?.textSecondary?.color || '#CCCCCC' },
              ]}
            >
              {formatLastAccessed(item.lastAccessedAt)}
            </Text>
          </View>

          {/* Cache status indicator */}
          <View style={styles.statusIndicator}>
            {item.status === 'downloading' && (
              <View
                style={[styles.statusBadge, { backgroundColor: '#FFC107' }]}
              >
                <Text style={styles.statusText}>
                  Downloading {item.downloadProgress || 0}%
                </Text>
              </View>
            )}

            {item.status === 'completed' && (
              <View
                style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}
              >
                <Text style={styles.statusText}>Available Offline</Text>
              </View>
            )}

            {item.status === 'failed' && (
              <View
                style={[styles.statusBadge, { backgroundColor: '#F44336' }]}
              >
                <Text style={styles.statusText}>Failed to Cache</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: Common?.primary || '#F45303' },
            ]}
            onPress={() => {
              // In a real app, navigate to video player with offline file
              // navigation.navigate('VideoPlayer', { source: item.filePath, title: item.title });
              Alert.alert(
                'Play Video',
                `Playing "${item.title}" from offline storage`,
              );
            }}
            disabled={item.status !== 'completed'}
          >
            <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
            <Text style={[styles.playButtonText, { color: '#FFFFFF' }]}>
              Play
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.removeButton,
              { backgroundColor: Common?.error?.color || '#F44336' },
            ]}
            onPress={() => removeVideoFromCache(item.id, item.title)}
          >
            <MaterialIcons name="delete" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [Common, Fonts, formatFileSize, formatLastAccessed, removeVideoFromCache],
  );

  // Render header with cache analytics
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.headerCard}>
          <CustomText
            style={[
              styles.headerTitle,
              { color: Fonts?.title?.color || '#FFFFFF' },
            ]}
          >
            Offline Videos
          </CustomText>
          <CustomText
            style={[
              styles.headerSubtitle,
              { color: Common?.textSecondary?.color || '#CCCCCC' },
            ]}
          >
            Watch your downloaded and P2P received videos anywhere, even without
            internet!
          </CustomText>

          {cacheAnalytics && (
            <View style={styles.cacheStats}>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: Common?.primary || '#F45303' },
                  ]}
                >
                  {cacheAnalytics.fileCount}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: Common?.textSecondary?.color || '#CCCCCC' },
                  ]}
                >
                  Videos Cached
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: Common?.primary || '#F45303' },
                  ]}
                >
                  {formatFileSize(cacheAnalytics.totalSize)}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: Common?.textSecondary?.color || '#CCCCCC' },
                  ]}
                >
                  Space Used
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: Common?.primary || '#F45303' },
                  ]}
                >
                  {formatFileSize(cacheAnalytics.maxCacheSize)}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: Common?.textSecondary?.color || '#CCCCCC' },
                  ]}
                >
                  Total Space
                </Text>
              </View>
            </View>
          )}

          <CustomButton
            title="Manage Cache Settings"
            onPress={() => {
              // Navigate to cache settings screen
              navigation.navigate('Settings' as never);
            }}
            size="small"
            variant="outline"
            style={styles.settingsButton}
          />
        </View>

        <CustomButton
          title="Clear All Cache"
          onPress={clearAllCache}
          variant="outline"
          style={styles.clearButton}
          disabled={cachedVideos.length === 0}
        />
      </View>
    ),
    [
      cacheAnalytics,
      Common,
      Fonts,
      formatFileSize,
      clearAllCache,
      cachedVideos.length,
      navigation,
    ],
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Common?.backgroundColor || '#1A1A1A' },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={Common?.primary || '#F45303'}
          />
          <CustomText
            style={[
              styles.loadingText,
              { color: Common?.textSecondary?.color || '#CCCCCC' },
            ]}
          >
            Loading offline videos...
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Common?.backgroundColor || '#1A1A1A' },
      ]}
    >
      <FlatList
        data={cachedVideos}
        renderItem={renderVideoItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Common?.primary || '#F45303'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="offline-pin" size={80} color="#666" />
            <CustomText
              style={[
                styles.emptyTitle,
                { color: Common?.textSecondary?.color || '#CCCCCC' },
              ]}
            >
              No Offline Videos Yet
            </CustomText>
            <CustomText
              style={[
                styles.emptySubtitle,
                { color: Common?.textSecondary?.color || '#CCCCCC' },
              ]}
            >
              Videos you receive via P2P transfer will be automatically cached
              here for offline viewing.
            </CustomText>
            <CustomButton
              title="Go to Downloads"
              onPress={() => navigation.navigate('Download' as never)}
              style={styles.downloadsButton}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  cacheStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  settingsButton: {
    marginTop: 0,
  },
  clearButton: {
    marginHorizontal: 0,
  },
  videoItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  videoSize: {
    fontSize: 12,
    marginRight: 12,
  },
  videoLastAccessed: {
    fontSize: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  playButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  downloadsButton: {
    marginHorizontal: 40,
  },
});

export default OfflineVideos;
