import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import VideoThumbnail, { createThumbnail } from 'react-native-create-thumbnail';
import { formatBytes, cleanMovieTitle } from '../../helpers/utils';

const { width } = Dimensions.get('window');

interface DownloadedVideo {
  name: string;
  path: string;
  size: number;
  thumbnail?: string;
  duration?: string;
  folderSource?: string;
}

interface P2PVideoSelectorProps {
  visible: boolean;
  onClose: () => void;
  onVideoSelected: (video: DownloadedVideo) => void;
  deviceName?: string;
}

const P2PVideoSelector: React.FC<P2PVideoSelectorProps> = ({
  visible,
  onClose,
  onVideoSelected,
  deviceName,
}) => {
  const [videos, setVideos] = useState<DownloadedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDownloadedVideos();
    }
  }, [visible]);

  const loadDownloadedVideos = async () => {
    setLoading(true);
    try {
      // Check both possible download folders
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      const updatedVideoList: DownloadedVideo[] = [];

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          console.log(`Checking folder for P2P: ${folderPath}`);

          // Check if folder exists
          const folderExists = await RNFS.exists(folderPath);
          if (!folderExists) {
            console.log(`📁 Folder ${folderName} does not exist, skipping`);
            continue;
          }

          const files = await RNFS.readDir(folderPath);
          console.log(`Found ${files.length} files in ${folderName}`);

          // Process video files
          for (const file of files) {
            try {
              if (
                file.name.endsWith('.mp4') ||
                file.name.endsWith('.m4v') ||
                file.name.endsWith('.mov')
              ) {
                const videoName = file.name;
                const videoPath = file.path;

                // Generate thumbnail
                let thumbnail = null;
                try {
                  thumbnail = await generateThumbnail(videoPath);
                } catch (thumbnailError) {
                  console.log(`Thumbnail generation failed for ${videoName}`);
                }

                // Get file stats
                let fileSize = file.size || 0;
                try {
                  const fileStats = await RNFS.stat(videoPath);
                  fileSize = fileStats.size;
                } catch (statError) {
                  console.log(`Failed to get stats for ${videoName}`);
                }

                updatedVideoList.push({
                  name: videoName,
                  thumbnail: thumbnail?.path || '',
                  size: fileSize,
                  duration: 'videoDuration',
                  path: videoPath,
                  folderSource: folderName,
                });
              }
            } catch (fileError) {
              console.log(`Error processing file: ${fileError}`);
              continue;
            }
          }
        } catch (folderError) {
          console.log(`Error accessing folder ${folderName}: ${folderError}`);
        }
      }

      // Sort by name
      updatedVideoList.sort((a, b) => a.name.localeCompare(b.name));
      setVideos(updatedVideoList);
      console.log(
        `✅ Loaded ${updatedVideoList.length} videos for P2P sharing`,
      );
    } catch (error) {
      console.error('❌ Error loading videos for P2P:', error);
      Alert.alert('Error', 'Failed to load downloaded videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateThumbnail = async (
    videoPath: string,
  ): Promise<{ path: string } | null> => {
    try {
      if (!videoPath || typeof videoPath !== 'string') {
        return null;
      }

      const fileExists = await RNFS.exists(videoPath);
      if (!fileExists) {
        return null;
      }

      const fileStats = await RNFS.stat(videoPath);
      if (fileStats.size === 0) {
        return null;
      }

      const thumbnail = (await Promise.race([
        createThumbnail({
          url: `file://${videoPath}`,
          timeStamp: 5000,
          format: 'jpeg',
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Thumbnail generation timeout')),
            10000,
          ),
        ),
      ])) as { path: string } | null;

      return thumbnail;
    } catch (error) {
      return null;
    }
  };

  const handleVideoSelect = (video: DownloadedVideo) => {
    console.log(`🎯 Selected video for P2P sharing: ${video.name}`);

    // Show confirmation dialog
    Alert.alert(
      'Share Video via P2P',
      `Share "${cleanMovieTitle(video.name)}" with ${
        deviceName || 'the connected device'
      }?\n\n` +
        `📁 Source: ${video.folderSource || 'Downloads'}\n` +
        `📊 Size: ${formatBytes(video.size)}\n\n` +
        'The video will be securely transferred via WiFi Direct.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Video',
          onPress: () => {
            onVideoSelected(video);
            onClose();
          },
        },
      ],
    );
  };

  const renderVideoItem = ({
    item,
    index,
  }: {
    item: DownloadedVideo;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoSelect(item)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <MaterialIcons name="movie" size={32} color="#F45303" />
          </View>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {cleanMovieTitle(item.name)}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={styles.videoSize}>{formatBytes(item.size)}</Text>
          <View style={styles.sourceTag}>
            <MaterialIcons
              name={item.folderSource === 'SpredVideos' ? 'folder' : 'lock'}
              size={12}
              color="#F45303"
            />
            <Text style={styles.sourceText}>
              {item.folderSource === 'SpredVideos' ? 'Downloads' : 'Legacy'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Indicator */}
      <View style={styles.actionIndicator}>
        <MaterialIcons name="send" size={20} color="#F45303" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="video-library" size={64} color="#8B8B8B" />
      <Text style={styles.emptyTitle}>No Downloaded Videos</Text>
      <Text style={styles.emptySubtitle}>
        Download some videos first to share them via P2P
      </Text>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => {
          onClose();
          // Navigate to Downloads screen
          // You can add navigation logic here
        }}
      >
        <MaterialIcons name="download" size={20} color="#FFFFFF" />
        <Text style={styles.downloadButtonText}>Go to Downloads</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Select Video to Share{deviceName ? ` with ${deviceName}` : ''}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#8B8B8B" />
            </TouchableOpacity>
          </View>

          {/* Video Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="video-library" size={16} color="#F45303" />
              <Text style={styles.statText}>{videos.length} videos</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="wifi-tethering" size={16} color="#4CAF50" />
              <Text style={styles.statText}>WiFi Direct</Text>
            </View>
          </View>

          {/* Video List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F45303" />
              <Text style={styles.loadingText}>
                Loading downloaded videos...
              </Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              renderItem={renderVideoItem}
              keyExtractor={(item, index) => `${item.path}-${index}`}
              contentContainerStyle={styles.videoList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState()}
              refreshControl={
                <View style={styles.refreshContainer}>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => {
                      setRefreshing(true);
                      loadDownloadedVideos();
                    }}
                    disabled={refreshing}
                  >
                    <MaterialIcons
                      name={refreshing ? 'refresh' : 'refresh'}
                      size={16}
                      color="#F45303"
                    />
                    <Text style={styles.refreshText}>
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCCCCC',
  },
  videoList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  thumbnailContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoSize: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  sourceText: {
    fontSize: 10,
    color: '#F45303',
    fontWeight: '600',
  },
  actionIndicator: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshContainer: {
    padding: 16,
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  refreshText: {
    fontSize: 14,
    color: '#F45303',
    fontWeight: '600',
  },
});

export default P2PVideoSelector;
