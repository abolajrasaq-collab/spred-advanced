import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
  useColorScheme,
  StatusBar,
  TextInput,
  Dimensions,
  FlatList,
  Animated,
  RefreshControl,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import React, { useState, useEffect } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import VideoThumbnail, { createThumbnail } from 'react-native-create-thumbnail';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Declare __DEV__ global for TypeScript
declare const __DEV__: boolean;

// Type assertion for MaterialIcons component
const MaterialIconsComponent = MaterialIcons as any;
import ThemeStyles from '../../theme/Fonts';
import CustomText from '../../components/CustomText/CustomText';
import {
  truncateText,
  formatBytes,
  cleanMovieTitle,
} from '../../helpers/utils';
import { useIsFocused } from '@react-navigation/native';
import Video from 'react-native-video';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';


const LeftIcon = () => (
  <MaterialIcons name="arrow-back" size={20} color="#F45305" />
);
const SearchIcon = () => (
  <MaterialIcons name="search" size={20} color="#FFFFFF" />
);
const BinIcon = () => <MaterialIcons name="delete" size={20} color="#FFFFFF" />;

const DownloadIcon = () => (
  <MaterialIcons name="download" size={15} color="#F45305" />
);

// New component for list-style video items matching the screenshot
const DownloadedVideoItem = ({ item, index, onPress, onShare, onDelete }) => {
  return (
    <View style={styles.downloadedVideoItem}>
      <TouchableOpacity style={styles.videoItemContent} onPress={onPress}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <MaterialIcons
                name="play-circle-outline"
                size={24}
                color="#F45303"
              />
            </View>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {cleanMovieTitle(
              item.title ||
                item.name?.replace(/\.[^/.]+$/, '') ||
                'Unknown Video',
            )}
          </Text>
          <Text style={styles.videoSize}>
            {item.size ? formatBytes(item.size) : 'Size unavailable'}
          </Text>
          <Text style={styles.videoStatus}>
            {item.folderSource === 'Received'
              ? (item.receivedMethod === 'P2P' ? '🔄 Received via P2P' : '📥 Received')
              : '📥 Downloaded'
            }
          </Text>
          {item.receivedDate && (
            <Text style={styles.receivedDate}>
              {new Date(item.receivedDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.videoActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <View style={styles.shareIcon}>
            <Image
              source={require('../../../assets/spred-white.png')}
              style={{
                width: 18,
                height: 18,
                tintColor: '#F45303',
                resizeMode: 'contain',
              }}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <View style={styles.deleteIcon}>
            <MaterialIcons name="delete" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

const Download = () => {
  const navigation = useNavigation() as any;
  const route = useRoute() as any;
  const isFocused = useIsFocused();

  
  const [videoList, setVideoList] = useState([]);
  const [receivedList, setReceivedList] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    free: 0,
  });
  const [activeTab, setActiveTab] = useState('downloads');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // SPRED selection mode
  const [spredSelectionMode, setSpredSelectionMode] = useState(
    route.params?.spredSelectionMode || false,
  );
  const [returnToSpred, setReturnToSpred] = useState(
    route.params?.returnToSpred || false,
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sharedFiles, setSharedFiles] = useState(new Set());
  const [showSpred, setShowSpred] = useState(false);
  const [selectedVideoForShare, setSelectedVideoForShare] = useState(null);

  // Combined list of favorites and watch later items with deduplication
  const itemMap = new Map();

  // Add favorites first (priority)
  favorites?.forEach(item => {
    const key = item._ID || item._id || item.key || item.path;
    if (key && !itemMap.has(key)) {
      itemMap.set(key, { ...item, type: 'favorite' });
    }
  });

  // Add watch later items (only if not already in favorites)
  watchLater?.forEach(item => {
    const key = item._ID || item._id || item.key || item.path;
    if (key && !itemMap.has(key)) {
      itemMap.set(key, { ...item, type: 'watchLater' });
    }
  });

  const myListItems = Array.from(itemMap.values());

  // Debug logging for tab changes
  useEffect(() => {
    // DISABLED FOR PERFORMANCE
    // console.log('📱 Active tab changed to:', activeTab);
    // DISABLED FOR PERFORMANCE
    // console.log('📊 Current data:', {
    //   downloads: videoList?.length || 0,
    //   favorites: myListItems?.length || 0,
    // });
  }, [activeTab, videoList, myListItems]);

  // Handle SPRED selection mode
  useEffect(() => {
    if (spredSelectionMode) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
      setIsSelectionMode(true);
    }
  }, [spredSelectionMode]);

  useEffect(() => {
    if (isFocused) {
      // OPTIMIZED: Load cached data first, then fetch fresh data with delays
      loadCachedDataFirst();

      // Delay heavy operations to allow UI to render first
      // OPTIMIZED: Remove artificial delays for better performance
      fetchVideoList();
      fetchReceivedList(); // Add this to fetch received files
      fetchFavorites();
      fetchWatchLater();
      fetchRecommended();
      getStorageInfo();
      loadSharedFiles();
    }
  }, [isFocused]);

  const loadCachedDataFirst = async () => {
    try {
      // Load cached data for instant display
      const cachedVideos = await getDataJson('downloaded_videos');
      const cachedFavorites = await getDataJson('favorites');
      const cachedWatchLater = await getDataJson('watch_later');
      if (cachedVideos && cachedVideos.length > 0) {
        setVideoList(cachedVideos);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Loaded cached videos for instant display');
      }

      if (cachedFavorites && cachedFavorites.length > 0) {
        setFavorites(cachedFavorites);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Loaded cached favorites for instant display');
      }

      if (cachedWatchLater && cachedWatchLater.length > 0) {
        setWatchLater(cachedWatchLater);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Loaded cached watch later for instant display');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading cached data:', error);
    }
  };

  const getStorageInfo = async () => {
    try {
      const free = await RNFS.getFSInfo();

      // Check both download folders
      const foldersToCheck = ['SpredVideos', '.spredHiddenFolder'];

      let used = 0;

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          const files = await RNFS.readDir(folderPath);
          used += files.reduce((total, file) => total + file.size, 0);
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log(`${folderName} folder not found or inaccessible`);
        }
      }

      setStorageInfo({
        used,
        total: free.freeSpace + used,
        free: free.freeSpace,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting storage info:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const user = await getDataJson<any>('User');
      const config = {
        headers: {
          mobileAppByPassIVAndKey:
            'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
          username: 'SpredMediaAdmin',
          password: 'SpredMediaLoveSpreding@2023',
          Authorization: `Bearer ${user?.token}`,
        },
      };
      let response = await axios.get(`${api.getFavorites}/${user?.id}`, config);
      setFavorites(response?.data?.data || []);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error fetching favorites:', error);
    }
  };

  const fetchWatchLater = async () => {
    try {
      const data = await getDataJson<any[]>('WatchLater');
      setWatchLater(data || []);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error fetching watch later:', error);
    }
  };

  const fetchRecommended = async () => {
    try {
      const user = await getDataJson<any>('User');
      const config = {
        headers: {
          mobileAppByPassIVAndKey:
            'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
          username: 'SpredMediaAdmin',
          password: 'SpredMediaLoveSpreding@2023',
          Authorization: `Bearer ${user?.token}`,
        },
      };
      let response = await axios.get(api.getAllMovies, config);
      setRecommended(response?.data?.data?.slice(0, 10) || []);
    } catch (error) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchVideoList();
      await fetchReceivedList(); // Make sure this is called
      await fetchFavorites();
      await getStorageInfo();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFromList = async item => {
    try {
      if (item.type === 'watchLater') {
        // Remove from watch later
        const currentWatchLater =
          (await getDataJson<any[]>('WatchLater')) || [];
        const updated = currentWatchLater.filter(
          watchItem =>
            (watchItem._ID || watchItem._id || watchItem.key) !==
            (item._ID || item._id || item.key),
        );
        await storeDataJson('WatchLater', updated);
        setWatchLater(updated);
        // DISABLED FOR PERFORMANCE
        // console.log('🗑️ Removed from Watch Later:', item.title || item.name);
      } else if (item.type === 'favorite') {
        // Note: For favorites, you might need to call an API to remove
        // DISABLED FOR PERFORMANCE
        // console.log('🗑️ Favorite removal would require API call');
        // For now, just show a message
        Alert.alert(
          'Remove Favorite',
          'This feature requires API implementation to remove server-side favorites.',
        );
        return;
      }

      Alert.alert(
        'Removed',
        `"${item.title || item.name}" has been removed from your list.`,
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item from list.');
    }
  };

  const handleShare = item => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );

      // Validate required data exists
      if (!item) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ No video item data available');
        Alert.alert('Error', 'Video data not available. Please try again.');
        return;
      }

      const videoTitle = cleanMovieTitle(
        item.title || item.name?.replace(/\.[^/.]+$/, '') || 'Unknown Video',
      );
      const videoPath = item.path || `downloaded_${item.name}`;

      // DISABLED FOR PERFORMANCE
      // console.log('📋 Video data validation:');
      // DISABLED FOR PERFORMANCE
      // console.log('  - name:', item.name);
      // DISABLED FOR PERFORMANCE
      // console.log('  - path:', item.path);
      // DISABLED FOR PERFORMANCE
      // console.log('  - size:', item.size);
      // DISABLED FOR PERFORMANCE
      // console.log('  - title:', videoTitle);

      // Create video info with proper validation
      const videoInfo = {
        title: videoTitle,
        thumbnail: item.thumbnail || '',
        duration: item.duration || '',
        size: item.size || 0,
      };

      // DISABLED FOR PERFORMANCE
      // console.log('🎯 Sharing video from Downloads');
      // DISABLED FOR PERFORMANCE
      // console.log('🎯 Video name:', videoTitle);
      // DISABLED FOR PERFORMANCE
      // console.log('🎯 Video path:', videoPath);
      // DISABLED FOR PERFORMANCE
      // console.log('🎯 Video size:', item.size);

      // Validate all required parameters before navigation
      if (!videoInfo.title || videoInfo.title.trim() === '') {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Invalid video title for sharing');
        Alert.alert(
          'Sharing Error',
          'Invalid video information. Please refresh and try again.',
        );
        return;
      }

      // Additional validation for navigation
      if (!navigation) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Navigation object not available');
        Alert.alert(
          'Error',
          'Navigation not available. Please restart the app.',
        );
        return;
      }

      // DISABLED FOR PERFORMANCE
      // console.log('✅ All validations passed, showing SPRED Share options');

      // Simple sharing options
      Alert.alert('SPRED Share', `Share "${videoTitle}" with others:`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share via Apps',
          onPress: () => {
            // Use standard social sharing
            Alert.alert(
              'Coming Soon',
              'Social sharing functionality will be available in future updates.',
            );
          },
        },
      ]);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error in handleShare:', error);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error stack:', error.stack);
      Alert.alert(
        'Sharing Error',
        `Failed to prepare video for sharing: ${
          error.message || 'Unknown error'
        }`,
      );
    }
  };

  const handleDeleteSingleItem = item => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteSingleItem = async () => {
    if (itemToDelete) {
      setLoading(true);
      try {
        console.log('🗑️ Deleting single file:', itemToDelete.path);
        await RNFS.unlink(itemToDelete.path);
        console.log('✅ File deleted successfully:', itemToDelete.path);
        fetchVideoList(); // Refresh the downloads list
        fetchReceivedList(); // Refresh the received list
        setShowDeleteModal(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('❌ Error deleting file:', error);
        console.error('❌ File path that failed:', itemToDelete.path);
        // Show error to user
        Alert.alert('Delete Failed', 'Unable to delete the file. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelectionMode = () => {
    // Handle SPRED selection mode - go back to SPRED interface
    if (spredSelectionMode) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );

      // Reset SPRED selection mode
      setSpredSelectionMode(false);
      setIsSelectionMode(false);
      setSelectedItems(new Set());

      // Go back to previous screen (SPRED interface)
      navigation.goBack();
      return;
    }

    // Normal selection mode toggle
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = itemId => {
    // Handle SPRED selection mode - return immediately to SPRED with selected video
    if (spredSelectionMode) {
      // DISABLED FOR PERFORMANCE
      // console.log('🎯 SPRED video selected:', itemId);

      // Find the video data from our lists (check videoList first, then receivedList)
      let selectedVideo = videoList.find(video => video.path === itemId);
      if (!selectedVideo) {
        selectedVideo = receivedList.find(video => video.path === itemId);
      }

      if (selectedVideo) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '🎯 Found selected video:',
        //   selectedVideo.name || selectedVideo.title,
        // );
        // DISABLED FOR PERFORMANCE
        // console.log('🎯 Video path:', selectedVideo.path);
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '🎯 Full selected video object:',
        //   JSON.stringify(selectedVideo, null, 2),
        // );

        // Navigate to standard playback for selected video
        navigation.navigate('PlayDownloadedVideos', { movie: selectedVideo });

        // Reset SPRED selection mode
        setSpredSelectionMode(false);
        setIsSelectionMode(false);
        setSelectedItems(new Set());
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Could not find video data for:', itemId);
      }
      return;
    }

    // Normal selection mode for deletion
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const deleteSelectedItems = async () => {
    setLoading(true);
    try {
      console.log('🗑️ Starting multi-delete of', selectedItems.size, 'items');

      for (const itemId of selectedItems) {
        // Check in both videoList and receivedList
        let item = videoList.find(v => v.path === itemId);
        if (!item) {
          item = receivedList.find(v => v.path === itemId);
        }

        if (item) {
          console.log('🗑️ Deleting item:', item.path);
          await RNFS.unlink(item.path);
          console.log('✅ Item deleted successfully:', item.path);
        } else {
          console.warn('⚠️ Item not found for deletion:', itemId);
        }
      }

      console.log('🔄 Refreshing lists after deletion');
      await fetchVideoList();
      await fetchReceivedList(); // Also refresh received list
      await getStorageInfo();
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      console.log('✅ Multi-delete completed successfully');
    } catch (error) {
      console.error('❌ Error deleting items:', error);
      Alert.alert('Delete Failed', 'Unable to delete some files. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const generateThumbnail = async (videoPath: string) => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🎬 Generating thumbnail for:', videoPath);

      // Validate video path before processing
      if (!videoPath || typeof videoPath !== 'string') {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Invalid video path provided to generateThumbnail');
        return null;
      }

      // Check if file exists before attempting thumbnail generation
      const fileExists = await RNFS.exists(videoPath);
      if (!fileExists) {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Video file does not exist:', videoPath);
        return null;
      }

      // Get file stats to ensure it's a valid video file
      const fileStats = await RNFS.stat(videoPath);
      if (fileStats.size === 0) {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Video file is empty:', videoPath);
        return null;
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📊 Video file stats:', {
      //   size: fileStats.size,
      //   path: videoPath,
      //   isFile: fileStats.isFile(),
      // });

      // Generate thumbnail with timeout and error handling
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

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Thumbnail generated successfully for:', videoPath);
      return thumbnail;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '⚠️ Thumbnail generation failed for:',
      //   videoPath,
      //   'Error:',
      //   error.message,
      // );
      return null;
    }
  };

  const loadSharedFiles = async () => {
    try {
      // Mock shared files for now
      const sharedFileIds = new Set();
      setSharedFiles(sharedFileIds);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading shared files:', error);
    }
  };

  const fetchVideoList = async () => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📁 Starting video list fetch...');
      // Check only download folders (excluding P2P received folders)
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads) - will be filtered for non-P2P files
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      const updatedVideoList = [];

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          // DISABLED FOR PERFORMANCE
          // console.log(`Checking folder: ${folderPath}`);

          // Check if folder exists before trying to read it
          const folderExists = await RNFS.exists(folderPath);
          if (!folderExists) {
            // DISABLED FOR PERFORMANCE
            // console.log(`📁 Folder ${folderName} does not exist, skipping`);
            continue;
          }

          const files = await RNFS.readDir(folderPath);
          // DISABLED FOR PERFORMANCE
          // console.log(`Found ${files.length} files in ${folderName}`);

          // Process files in smaller batches to prevent memory issues
          const batchSize = 5;
          for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);

            for (const file of batch) {
              try {
                // Only process video files that are NOT P2P received files
                // P2P files typically have no file extension or are from P2P transfer
                const isP2PFile = !file.name.includes('.') || // Files without extension are P2P files
                                 file.name.startsWith('p2p_') || // P2P prefix files
                                 file.path.includes('SpredP2PReceived'); // Files in P2P folder

                if (
                  !isP2PFile && (
                    file.name.endsWith('.mp4') ||
                    file.name.endsWith('.m4v') ||
                    file.name.endsWith('.mov')
                  )
                ) {
                  const videoName = file.name;
                  const videoPath = file.path;

                  // DISABLED FOR PERFORMANCE
                  // console.log(`🎬 Processing video: ${videoName}`);

                  // Generate thumbnail with error handling
                  let thumbnail = null;
                  try {
                    thumbnail = await generateThumbnail(videoPath);
                  } catch (thumbnailError) {
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   `...`,
                    //   ...
                    // );
                  }

                  // Get file stats to ensure we have the correct file size
                  let fileSize = file.size || 0;
                  try {
                    const fileStats = await RNFS.stat(videoPath);
                    fileSize = fileStats.size;
                    // DISABLED FOR PERFORMANCE
                    // console.log(`File stats for ${videoName}:`, {
                    //   size: fileStats.size,
                    //   isFile: fileStats.isFile(),
                    //   path: videoPath,
                    // });
                  } catch (statError) {
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   `...`,
                    //   ...
                    // );
                  }

                  // DISABLED FOR PERFORMANCE
                  // console.log(
                  //   '...',
                  // );

                  updatedVideoList.push({
                    name: videoName,
                    thumbnail:
                      (thumbnail as { path?: string } | null)?.path ?? '',
                    size: fileSize,
                    duration: 'videoDuration',
                    path: videoPath,
                    folderSource: folderName, // Track which folder this came from
                    // Extract contentId from filename if available (format: contentId_filename.mp4)
                    contentId: videoName.includes('_')
                      ? videoName.split('_')[0]
                      : null,
                  });
                }
              } catch (fileError) {
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   `...`,
                //   ...
                // );
                // Continue with next file instead of crashing
                continue;
              }
            }

            // Small delay between batches to prevent overwhelming the system
            if (i + batchSize < files.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (folderError) {
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   `...`,
          //   ...
          // );
        }
      }

      // Sort by name for consistent ordering
      updatedVideoList.sort((a, b) => a.name.localeCompare(b.name));
      setVideoList(updatedVideoList);
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error fetching video list:', error);
      setVideoList([]);
    }
  };

  // Function to fetch received files
  const fetchReceivedList = async () => {
    try {
      const processedReceivedFiles = [];

      // Simple file scanning (P2P functionality removed)
      const spredVideosPath = `${RNFS.ExternalDirectoryPath}/SpredVideos/`;
      const spredVideosExists = await RNFS.exists(spredVideosPath);

      if (spredVideosExists) {
        try {
          const spredVideosFiles = await RNFS.readDir(spredVideosPath);

          // Process video files only
          for (const file of spredVideosFiles) {
            if (file.isFile() && (file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi'))) {
              let thumbnail = null;
              try {
                thumbnail = await generateThumbnail(file.path);
              } catch (thumbnailError) {
                // Continue without thumbnail
              }

              processedReceivedFiles.push({
                name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                thumbnail: thumbnail?.path || '',
                size: file.size || 0,
                duration: 'videoDuration',
                path: file.path,
                folderSource: 'Downloads',
                contentId: `download_${Date.now()}_${Math.random()}`,
              });
            }
          }
        } catch (error) {
          // Continue silently
        }
      }

      // Sort by name and set received list
      processedReceivedFiles.sort((a, b) => a.name.localeCompare(b.name));
      setReceivedList(processedReceivedFiles);
    } catch (error) {
      setReceivedList([]);
    }
  };

  const AnimatedCard = ({
    item,
    index,
    onPress,
    onLongPress,
    isSelected,
    showTypeBadge = false,
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={[styles.card, isSelected && styles.cardSelected]}>
            {item.thumbnail || item.thumbnailUrl || item.src || item.image ? (
              <Image
                source={{
                  uri:
                    item.thumbnail ||
                    item.thumbnailUrl ||
                    item.src ||
                    item.image,
                }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <MaterialIcons name="movie" size={24} color="#F45303" />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {truncateText(cleanMovieTitle(item.name || item.title), 30)}
                </Text>
                {/* Type Badge */}
                {showTypeBadge && (
                  <View
                    style={[
                      styles.typeBadge,
                      item.type === 'favorite'
                        ? styles.favoriteBadge
                        : styles.watchLaterBadge,
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>
                      {item.type === 'favorite' ? '♥' : '⏰'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>
                {item.size
                  ? `${(item.size / 1048576).toFixed(1)}MB`
                  : item.duration || 'Size unavailable'}
              </Text>

              {/* Available Quality */}
              <View style={styles.qualityContainer}>
                <View style={styles.qualityTag}>
                  <Text style={styles.qualityText}>360p</Text>
                </View>
                <View style={styles.qualityTag}>
                  <Text style={styles.qualityText}>480p</Text>
                </View>
                <View style={styles.qualityTag}>
                  <Text style={styles.qualityText}>720p</Text>
                </View>
              </View>
            </View>
            {isSelected && (
              <View style={styles.selectedOverlay}>
                <MaterialIcons name="check" size={24} color="#F45303" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Create header component for FlatLists
  const renderListHeader = () => (
    <View>
      {/* Storage Info Card */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageTitle}>Storage</Text>
          <View style={styles.storageActions}>
            <TouchableOpacity onPress={getStorageInfo}>
              <MaterialIcons name="refresh" size={16} color="#F45303" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(storageInfo.used / storageInfo.total) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.storageText}>
          {formatBytes(storageInfo.used)} of {formatBytes(storageInfo.total)}{' '}
          used
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'downloads' && styles.activeTab]}
          onPress={() => setActiveTab('downloads')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'downloads' && styles.activeTabText,
            ]}
          >
            Downloads
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'received' && styles.activeTabText,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'favorites' && styles.activeTabText,
            ]}
          >
            My List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection Mode Bar */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={toggleSelectionMode}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedItems.size} selected
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            disabled={selectedItems.size === 0}
          >
            <MaterialIcons
              name="delete"
              size={24}
              color={selectedItems.size > 0 ? '#F45303' : '#666'}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Create separate content functions for each tab
  const renderDownloadsContent = () => (
    <View style={styles.downloadsContainer}>
      {/* Header with video count and clear all */}
      <View style={styles.downloadsHeader}>
        <Text style={styles.videoCount}>{videoList.length} videos</Text>
        {videoList.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialIcons name="delete" size={16} color="#FFFFFF" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {videoList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="download"
            size={64}
            color="#666"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Downloads Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your downloaded videos will appear here
          </Text>
        </View>
      ) : (
        videoList.map((item, index) => (
          <DownloadedVideoItem
            key={item.path || index}
            item={item}
            index={index}
            onPress={() => {
              if (isSelectionMode) {
                toggleItemSelection(item.path);
              } else {
                navigation.navigate('PlayDownloadedVideos', {
                  movie: item,
                });
              }
            }}
            onShare={() => handleShare(item)}
            onDelete={() => handleDeleteSingleItem(item)}
          />
        ))
      )}
    </View>
  );

  const renderFavoritesContent = () => (
    <View style={styles.favoritesContainer}>
      <View style={styles.downloadsHeader}>
        <Text style={styles.videoCount}>{myListItems.length} items</Text>
        {myListItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialIcons name="delete" size={16} color="#FFFFFF" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {myListItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="favorite-border"
            size={64}
            color="#666"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>My List is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Your favorites, watch later items, and videos you've added to your
            list will appear here
          </Text>
        </View>
      ) : (
        myListItems.map((item, index) => (
          <AnimatedCard
            key={`${item._ID || item._id || item.path || item.key}-${
              item.type
            }-${index}`}
            item={item}
            index={index}
            onPress={() => {
              // Check if this is a downloaded video (has path property) or streaming video
              if (item.path) {
                // This is a downloaded video, navigate to PlayDownloadedVideos
                navigation.navigate('PlayDownloadedVideos', {
                  movie: item,
                });
              } else {
                // This is a streaming video, navigate to PlayVideos
                navigation.navigate('PlayVideos', { item });
              }
            }}
            onLongPress={() => handleRemoveFromList(item)}
            isSelected={false}
            showTypeBadge={true}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'downloads' && (
        <FlatList
          data={videoList}
          renderItem={({ item, index }) => (
            <DownloadedVideoItem
              item={item}
              index={index}
              onPress={() => {
                if (isSelectionMode) {
                  toggleItemSelection(item.path);
                } else {
                  navigation.navigate('PlayDownloadedVideos', {
                    movie: item,
                  });
                }
              }}
              onShare={() => handleShare(item)}
              onDelete={() => handleDeleteSingleItem(item)}
            />
          )}
          keyExtractor={(item, index) => item.path || index.toString()}
          ListHeaderComponent={renderListHeader()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="download"
                size={64}
                color="#666"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Downloads Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your downloaded videos will appear here
              </Text>
            </View>
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 80, // More padding on Android for smaller screens
            paddingHorizontal: 0 // Remove horizontal padding to use full width
          }}
          maxToRenderPerBatch={10} // Optimize for smaller screens
          windowSize={10} // Reduce window size for better performance
          initialNumToRender={5} // Render fewer items initially
          removeClippedSubviews={false} // Disable for better scrolling on small screens
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F45303"
            />
          }
        />
      )}

      {activeTab === 'received' && (
        <FlatList
          data={receivedList}
          renderItem={({ item, index }) => (
            <DownloadedVideoItem
              item={item}
              index={index}
              onPress={() => {
                if (isSelectionMode) {
                  toggleItemSelection(item.path);
                } else {
                  navigation.navigate('PlayDownloadedVideos', {
                    movie: item,
                  });
                }
              }}
              onShare={() => handleShare(item)}
              onDelete={() => handleDeleteSingleItem(item)}
            />
          )}
          keyExtractor={(item, index) => item.path || index.toString()}
          ListHeaderComponent={
            <View>
              {renderListHeader()}
              <View style={styles.downloadsHeader}>
                <Text style={styles.videoCount}>
                  {receivedList.length} received videos
                </Text>
                {receivedList.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={() => setShowDeleteModal(true)}
                  >
                    <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* P2P functionality removed - button disabled */}
                  </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="wifi-tethering"
                size={64}
                color="#666"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Received Files</Text>
              <Text style={styles.emptySubtitle}>
                Any received videos will appear here for offline viewing
              </Text>
              {/* P2P functionality removed - button disabled */}
                  </View>
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 80, // More padding on Android for smaller screens
            paddingHorizontal: 0 // Remove horizontal padding to use full width
          }}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          removeClippedSubviews={false} // Disable for better scrolling on small screens
          bounces={true}
          maxToRenderPerBatch={10} // Optimize for smaller screens
          windowSize={10} // Reduce window size for better performance
          initialNumToRender={5} // Render fewer items initially
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F45303"
              title="Pull to refresh"
              titleColor="#CCCCCC"
            />
          }
        />
      )}

      {activeTab === 'favorites' && (
        <FlatList
          data={myListItems}
          numColumns={1}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={{
                marginHorizontal: 16,
                marginVertical: 8,
                backgroundColor: '#2A2A2A',
                borderRadius: 12,
                padding: 16,
              }}
              onPress={() => {
                // Check if this is a downloaded video (has path property) or streaming video
                if (item.path) {
                  // This is a downloaded video, navigate to PlayDownloadedVideos
                  navigation.navigate('PlayDownloadedVideos', {
                    movie: item,
                  });
                } else {
                  // This is a streaming video, navigate to PlayVideos
                  navigation.navigate('PlayVideos', { item });
                }
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Thumbnail */}
                <View style={{ marginRight: 16 }}>
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={{
                      width: 80,
                      height: 120,
                      borderRadius: 8,
                      backgroundColor: '#1A1A1A',
                    }}
                    resizeMode="cover"
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor:
                        item.type === 'favorite'
                          ? 'rgba(244, 67, 54, 0.2)'
                          : 'rgba(255, 152, 0, 0.2)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <MaterialIcons
                      name={item.type === 'favorite' ? 'favorite' : 'schedule'}
                      size={12}
                      color={item.type === 'favorite' ? '#F44336' : '#FF9800'}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: item.type === 'favorite' ? '#F44336' : '#FF9800',
                        marginLeft: 4,
                      }}
                    >
                      {item.type === 'favorite' ? 'Favorite' : 'Watch Later'}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#8B8B8B',
                    }}
                  >
                    ⭐ {item.ratings} • {Math.round(item.duration * 60)}min
                  </Text>
                </View>

                <MaterialIcons name="chevron-right" size={24} color="#8B8B8B" />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) =>
            `${item._ID || item._id || item.path || item.key}-${
              item.type
            }-${index}`
          }
          ListHeaderComponent={
            <View>
              {renderListHeader()}
              <View style={styles.myListHeader}>
                <View style={styles.myListTitleContainer}>
                  <Text style={styles.myListTitle}>My List</Text>
                  <Text style={styles.myListCount}>
                    {myListItems.length} items
                  </Text>
                </View>
                {myListItems.length > 0 && (
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => {
                      // Toggle between recently added and alphabetical
                      const sorted = [...myListItems].sort((a, b) =>
                        (a.title || a.name || '').localeCompare(
                          b.title || b.name || '',
                        ),
                      );
                      // DISABLED FOR PERFORMANCE
                      // console.log(
                      //   'Sorted items:',
                      //   sorted.map(item => item.title || item.name),
                      // );
                    }}
                  >
                    <MaterialIcons name="sort" size={20} color="#F45303" />
                    <Text style={styles.sortButtonText}>Sort A-Z</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="favorite-border"
                size={64}
                color="#666"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>My List is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Your favorites, watch later items, and videos you've added to
                your list will appear here
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('HOME')}
              >
                <MaterialIcons name="explore" size={20} color="#FFFFFF" />
                <Text style={styles.exploreButtonText}>Explore Movies</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{
            ...styles.listContainer,
            paddingBottom: Platform.OS === 'ios' ? 20 : 80, // More padding on Android for smaller screens
          }}
          maxToRenderPerBatch={10} // Optimize for smaller screens
          windowSize={10} // Reduce window size for better performance
          initialNumToRender={5} // Render fewer items initially
          removeClippedSubviews={false} // Disable for better scrolling on small screens
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F45303"
              title="Pull to refresh"
              titleColor="#CCCCCC"
            />
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Downloads</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete {selectedItems.size} item
              {selectedItems.size > 1 ? 's' : ''}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={deleteSelectedItems}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Single Item Delete Modal */}
      <Modal
        visible={itemToDelete !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Video</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{itemToDelete?.title || 'this video'}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeleteSingleItem}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 24,
    height: 24,
    alignItems: 'flex-end',
  },
  storageCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spredButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spredButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  enhancedManagerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F45303',
    gap: 4,
  },
  enhancedManagerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F45303',
  },
  wifiDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 4,
  },
  wifiDirectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 3,
  },
  storageText: {
    fontSize: 14,
    color: '#999999',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#F45303',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2A2A',
  },
  cancelText: {
    fontSize: 16,
    color: '#F45303',
  },
  selectionCount: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  videoGrid: {
    paddingTop: 8,
  },
  animatedCard: {
    flex: 1,
    margin: 4,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#F45303',
  },
  thumbnail: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
  },
  cardContent: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    flex: 1,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  favoriteBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  watchLaterBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  shareButtonEmpty: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1A1A1A',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#F45303',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qualityContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  qualityTag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 10,
    color: '#888888',
    fontWeight: '500',
  },

  // New styles for list layout matching screenshot
  downloadsContainer: {
    flex: 1,
  },
  favoritesContainer: {
    flex: 1,
  },
  downloadsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  videoCount: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  clearAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  videoList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  downloadedVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  videoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnailContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
    paddingRight: 8,
  },
  videoTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  videoSize: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  videoStatus: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  receivedDate: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 2,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  shareIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F45303',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // My List Header Styles
  myListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  myListTitleContainer: {
    flex: 1,
  },
  myListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  myListCount: {
    fontSize: 14,
    color: '#8B8B8B',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F45303',
    marginLeft: 4,
  },
  listContainer: {
    paddingBottom: 100,
  },

  // List Layout Styles
  listItemWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  deleteActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  listItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    zIndex: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  listThumbnailContainer: {
    marginRight: 12,
  },
  listThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  listThumbnailPlaceholder: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  listTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  listTypeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#CCCCCC',
    marginLeft: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemMetaText: {
    fontSize: 12,
    color: '#8B8B8B',
    marginRight: 8,
  },
  receiveButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  receiveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Download;
