import React, { useEffect, useState, useCallback, useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
// import Share from 'react-native-share';
// import Clipboard from '@react-native-clipboard/clipboard';
import { Share as RNShare } from 'react-native';
import RNFS from 'react-native-fs';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  CustomText,
  SimpleVideoPlayer,
  Icon,
  VideoCard,
} from '../../components';
import UniversalSharingModal from '../../components/UniversalSharingModal';
import TEXT_CONSTANTS, { TAB_KEYS, TabKey } from './constants';
import P2PReceiveScreen from '../../components/WiFiDirect/P2PReceiveScreen';
import ReceiverModeManager from '../../services/ReceiverModeManager';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import DownloadItems from '../DownloadItems/DownloadItems';
import SpredFileService from '../../services/SpredFileService';
import {
  getDataJson,
  storeDataJson,
} from '../../../src/helpers/api/Asyncstorage';
import axios from 'axios';
import { api } from '../../../src/helpers/api/api';
import { cleanMovieTitle } from '../../../src/helpers/utils';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import { FollowingService } from '../../services/FollowingService';
import logger from '../../utils/logger';

// Define User interface for type safety
interface User {
  token?: string;
  [key: string]: any;
}

// constants moved to ./constants.ts

const PlayVideos = (props: any) => {
  const { item } = props.route.params;
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const {
    title,
    description,
    genreId,
    releaseDate,
    trailerKey,
    thumbnailUrl,
    videoKey,
    src,
    year,
    duration,
    language,
    cast,
    director,
    // Possible uploader/creator fields
    uploader,
    creator,
    creatorName,
    channel,
    channelName,
    author,
    authorName,
    publisher,
    publisherName,
    studio,
    studioName,
    owner,
    ownerName,
    // Possible avatar/profile picture fields
    avatar,
    profilePicture,
    uploaderAvatar,
    creatorAvatar,
    channelAvatar,
    authorAvatar,
  } = item;

  // Responsive design helpers
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 600;

  // Responsive video player height - increased for better viewing experience
  const getVideoPlayerHeight = useCallback(() => {
    if (isSmallScreen) {
      return 200;
    }
    if (isMediumScreen) {
      return 240;
    }
    return 280;
  }, [isSmallScreen, isMediumScreen]);

  // Responsive spacing adjustments
  const getResponsiveSpacing = useCallback(
    (baseSpacing: number) => {
      if (isSmallScreen) {
        return baseSpacing * 0.8;
      }
      if (isMediumScreen) {
        return baseSpacing * 0.9;
      }
      return baseSpacing;
    },
    [isSmallScreen, isMediumScreen],
  );

  // Responsive text sizes
  const getResponsiveFontSize = useCallback(
    (baseSize: number) => {
      if (isSmallScreen) {
        return baseSize * 0.85;
      }
      if (isMediumScreen) {
        return baseSize * 0.9;
      }
      return baseSize;
    },
    [isSmallScreen, isMediumScreen],
  );

  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [showDownload, setShowDownload] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(TAB_KEYS.ABOUT);
  const [showShareModal, setShowShareModal] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [isVideoDownloaded, setIsVideoDownloaded] = useState(false);
  const [showDownloadRequiredModal, setShowDownloadRequiredModal] =
    useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showUniversalSharingModal, setShowUniversalSharingModal] = useState(false);
  const [suggestedFilms, setSuggestedFilms] = useState([]);
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReceiverModeActive, setIsReceiverModeActive] = useState(false);
  const [resolvedVideoPath, setResolvedVideoPath] = useState<string>('');
  // Track fullscreen state for the video player so UI (like floating back button) can hide/show

  // Unified alert modal state
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
    onConfirm: null as (() => void) | null,
    onCancel: null as (() => void) | null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();
  const { spacing } = useSpacing();

  // Unified alert function
  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: 'info' | 'success' | 'error' | 'warning' = 'info',
      options?: {
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
        showCancel?: boolean;
      },
    ) => {
      setAlertModal({
        visible: true,
        title,
        message,
        type,
        onConfirm: options?.onConfirm || null,
        onCancel: options?.onCancel || null,
        confirmText: options?.confirmText || 'OK',
        cancelText: options?.cancelText || 'Cancel',
        showCancel: options?.showCancel || false,
      });
    },
    [],
  );

  // Function to get video path for sharing
  const getVideoPath = useCallback(async () => {
    try {
      // First try to get the actual downloaded video file path
      const { P2PService } = await import('../../services/P2PService');
      const p2pService = P2PService.getInstance();
      const localPath = await p2pService.getLocalVideoPath(item);
      
      if (localPath) {
        logger.info('✅ Found local video path:', localPath);
        return localPath;
      }
      
      // If no local file found, return empty string to trigger proper error handling
      logger.warn('⚠️ No local video file found - video must be downloaded first');
      return '';
    } catch (error) {
      logger.error('❌ Error getting video path:', error);
      return '';
    }
  }, [item]);

  // Function to handle share completion
  const handleShareComplete = useCallback((result: any) => {
    logger.info('📤 Share completed:', result);
    
    if (result.success) {
      let method: string;
      let message: string;
      
      switch (result.method) {
        case 'nearby':
          if (result.deviceName && !result.deviceName.includes('Demo')) {
            method = 'direct device sharing';
            message = `Video shared successfully via ${method} to ${result.deviceName}.`;
          } else if (result.deviceName && result.deviceName.includes('Demo')) {
            method = 'demo mode';
            message = `Demo sharing test completed successfully! (No actual file transfer occurred)`;
          } else {
            method = 'nearby sharing';
            message = `Nearby sharing process completed.`;
          }
          break;
        case 'qr_local':
        case 'qr_cloud':
          method = 'QR code sharing';
          message = `QR code generated successfully for video sharing.`;
          break;
        default:
          method = 'sharing test';
          message = `Video sharing test completed successfully!`;
          break;
      }
      
      showAlert(
        'Share Successful!',
        message,
        'success'
      );
    } else {
      showAlert(
        'Share Failed',
        result.error || 'Failed to share video. Please try again.',
        'error'
      );
    }
    
    // Close the modal
    setShowUniversalSharingModal(false);
  }, [showAlert]);

  // Function to handle SPRED sharing with Universal Sharing Modal
  const handleSpredShare = useCallback(async () => {
    try {
      // Check if video is downloaded before allowing SPRED sharing
      if (!isVideoDownloaded) {
        setShowDownloadRequiredModal(true);
        return;
      }

      logger.info('🎯 SPRED button pressed - opening Universal Sharing Modal');

      // Validate required data exists
      if (!item) {
        showAlert(
          'Error',
          'Video data not available. Please try again.',
          'error',
        );
        return;
      }

      const videoTitle = cleanMovieTitle(title) || 'Unknown Video';

      // Validate all required parameters
      if (!videoTitle || videoTitle.trim() === '') {
        showAlert(
          'Sharing Error',
          'Invalid video information. Please refresh and try again.',
          'error',
        );
        return;
      }

      logger.info('✅ All validations passed, resolving video path...');

      // Resolve video path before opening modal
      const videoPath = await getVideoPath();
      
      if (!videoPath) {
        showAlert(
          'Video Not Downloaded',
          'This video must be downloaded before it can be shared to nearby devices. Please download the video first.',
          'error'
        );
        return;
      }
      
      setResolvedVideoPath(videoPath);
      logger.info('✅ Video path resolved, opening Universal Sharing Modal');

      // Open Universal Sharing Modal for one-tap sharing
      setShowUniversalSharingModal(true);
    } catch (error) {
      showAlert(
        'Sharing Error',
        `Failed to prepare sharing: ${error.message || 'Unknown error'}`,
        'error',
      );
    }
  }, [
    isVideoDownloaded,
    item,
    title,
    showAlert,
  ]);

  // Function to handle Receiver Mode toggle
  const handleReceiverMode = useCallback(async () => {
    try {
      logger.info('📥 Receiver mode button pressed');

      if (isReceiverModeActive) {
        // Stop receiver mode
        const receiverManager = ReceiverModeManager.getInstance();
        await receiverManager.cleanup();
        setIsReceiverModeActive(false);
        
        showAlert(
          'Receiver Mode Stopped',
          'Device is no longer discoverable for receiving files',
          'info'
        );
        logger.info('🛑 Receiver mode stopped');
      } else {
        // Start receiver mode
        const receiverManager = ReceiverModeManager.getInstance();
        const initialized = await receiverManager.initialize();
        
        if (initialized) {
          setIsReceiverModeActive(true);
          showAlert(
            'Receiver Mode Started',
            'Device is now discoverable and ready to receive files from nearby devices',
            'success'
          );
          logger.info('✅ Receiver mode started successfully');
        } else {
          showAlert(
            'Receiver Mode Failed',
            'Could not initialize receiver mode. Check permissions and WiFi.',
            'error'
          );
          logger.error('❌ Receiver mode failed to start');
        }
      }
    } catch (error) {
      logger.error('❌ Receiver mode error:', error);
      showAlert(
        'Receiver Mode Error',
        `Failed to toggle receiver mode: ${error.message || 'Unknown error'}`,
        'error'
      );
    }
  }, [isReceiverModeActive, showAlert]);

  // Function to handle SEND VIDEO (Group Creator)
  const handleSendVideo = useCallback(() => {
    try {
      if (!item) {
        showAlert('Error', 'Video data not available. Please try again.', 'error');
        return;
      }

      logger.info('🚀 Creating WiFi Direct group as SENDER');

      const videoUrl = item.videoKey || item.trailerKey || item.src || '';
      const videoTitle = cleanMovieTitle(item.title) || 'Unknown Video';

      // Prepare video data for P2P transfer
      const videoInfo = {
        title: videoTitle,
        thumbnail: item.thumbnailUrl || '',
        duration: item.duration || '0:00',
        size: item.size || 0,
        videoKey: item.videoKey || item.trailerKey || '',
        src: item.src || '',
      };

      logger.info(
        '📤 Sending video info: ' +
          JSON.stringify({
            title: videoInfo.title,
            size: videoInfo.size,
            duration: videoInfo.duration,
          }),
      );

      // Navigate to WiFi Direct screen as SENDER with auto-start
      (navigation as any).navigate('WiFiDirect', {
        mode: 'send',
        selectedFile: videoInfo,
        autoStart: true, // Auto-start P2P group creation
      });

      logger.info('✅ Navigated to WiFi Direct as SENDER with auto-start');
    } catch (error) {
      logger.error('❌ Error in handleSendVideo:', error);
      showAlert(
        'P2P Send Error',
        `Failed to start P2P sending: ${error.message || 'Unknown error'}`,
        'error',
      );
    }
  }, [item, navigation, showAlert]);



  // Function to open the P2P receive modal
  const openReceiveModal = useCallback(() => {
    setShowReceiveModal(true);
  }, []);

  // Helper function to format subscriber count
  const formatSubscriberCount = useCallback(
    (count: number | undefined): string => {
      if (!count || count === 0) {
        return '0 Subscribers';
      }
      if (count < 1000) {
        return `${count} Subscribers`;
      }
      if (count < 1000000) {
        return `${(count / 1000).toFixed(0)}K Subscribers`;
      }
      if (count < 1000000000) {
        return `${(count / 1000000).toFixed(1)}M Subscribers`;
      }
      return `${(count / 1000000000).toFixed(1)}B Subscribers`;
    },
    [],
  );

  // Helper function to get initials from name
  const getInitials = useCallback((name: string | undefined): string => {
    if (!name) {
      return '?';
    }
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  }, []);

  // Helper function to generate consistent avatar color based on name
  const getAvatarColor = useCallback((name: string | undefined): string => {
    if (!name) {
      return '#666666';
    }

    const colors = [
      '#F45303', // Spred orange
      '#D69E2E', // Deep amber (secondary)
      '#8B8B8B', // Accent grey
      '#FF9800', // Orange
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#795548', // Brown
      '#FF5722', // Deep Orange
      '#009688', // Teal
      '#333333', // Dark grey
    ];

    // Generate consistent color based on first letter and name length
    const firstLetter = name.charAt(0).toLowerCase();
    const nameLength = name.length;

    // Combine first letter code and name length for consistent selection
    const colorIndex = (firstLetter.charCodeAt(0) + nameLength) % colors.length;

    return colors[colorIndex];
  }, []);

  // Helper function to get readable genre name from genreId
  const getGenreName = useCallback((genreId: string | undefined): string => {
    if (!genreId) {
      return '';
    }

    // Common genre ID to name mappings
    const genreMap = {
      // Add common genre mappings - these would typically come from your API
      action: 'Action',
      drama: 'Drama',
      comedy: 'Comedy',
      thriller: 'Thriller',
      horror: 'Horror',
      romance: 'Romance',
      documentary: 'Documentary',
      animation: 'Animation',
      short: 'Short Film',
      'sci-fi': 'Sci-Fi',
      fantasy: 'Fantasy',
      mystery: 'Mystery',
      crime: 'Crime',
      adventure: 'Adventure',
      family: 'Family',
    };

    // If genreId looks like a hash (long string with numbers/letters), hide it
    if (genreId.length > 15 && /^[a-f0-9]+$/i.test(genreId)) {
      return ''; // Don't show hash IDs
    }

    // Try to find mapping, otherwise return cleaned genreId
    const lowerGenre = genreId.toLowerCase();
    return genreMap[lowerGenre] || genreId;
  }, []);

  // Helper function to get uploader name from available data
  const getUploaderInfo = useCallback(() => {
    // First, check all the specific fields we expect
    let uploaderName =
      uploader?.name ||
      creator?.name ||
      creatorName ||
      channel?.name ||
      channelName ||
      author?.name ||
      authorName ||
      publisher?.name ||
      publisherName ||
      studio?.name ||
      studioName ||
      owner?.name ||
      ownerName ||
      item?.uploaderInfo?.name ||
      item?.creatorInfo?.name ||
      item?.channelInfo?.name;

    // If no specific uploader field found, try to find any field that might contain uploader info
    if (!uploaderName) {
      // Check if director exists and use it as uploader
      if (director) {
        uploaderName = director;
      }
      // Check if title contains "by" or similar patterns
      else if (title && title.includes(' by ')) {
        const parts = title.split(' by ');
        if (parts.length > 1) {
          uploaderName = cleanMovieTitle(parts[1].trim());
        }
      }
      // Use a more dynamic fallback based on the video
      else {
        uploaderName = 'Media Network';
      }
    }

    let subscriberCount =
      uploader?.subscribers ||
      creator?.subscribers ||
      channel?.subscribers ||
      author?.subscribers ||
      publisher?.subscribers ||
      studio?.subscribers ||
      owner?.subscribers ||
      item?.uploaderInfo?.subscribers ||
      item?.creatorInfo?.subscribers ||
      item?.channelInfo?.subscribers;

    // Generate a more realistic subscriber count based on video data
    if (!subscriberCount) {
      // Create a pseudo-random but consistent subscriber count based on video key/title
      subscriberCount = 0; // Or undefined to hide the count
    }

    let avatarUrl =
      profilePicture ||
      avatar ||
      uploaderAvatar ||
      creatorAvatar ||
      channelAvatar ||
      authorAvatar ||
      uploader?.avatar ||
      creator?.avatar ||
      channel?.avatar ||
      item?.uploaderInfo?.avatar ||
      item?.creatorInfo?.avatar ||
      item?.channelInfo?.avatar;

    return {
      name: uploaderName,
      subscribers: subscriberCount,
      avatar: avatarUrl,
    };
  }, [
    item,
    uploader,
    creator,
    creatorName,
    channel,
    channelName,
    author,
    authorName,
    publisher,
    publisherName,
    studio,
    studioName,
    owner,
    ownerName,
    director,
    title,
    profilePicture,
    avatar,
    uploaderAvatar,
    creatorAvatar,
    channelAvatar,
    authorAvatar,
  ]);

  const uploaderInfo = useMemo(() => getUploaderInfo(), [getUploaderInfo]);

  const checkFollowingStatus = useCallback(async () => {
    try {
      if (!uploaderInfo.name) {
        return;
      }

      // Generate a consistent creator ID from the creator name
      const creatorId = `creator_${uploaderInfo.name
        .toLowerCase()
        .replace(/\s+/g, '_')}`;

      const isFollowingCreator = await FollowingService.isFollowingCreator(
        creatorId,
      );
      setIsFollowing(isFollowingCreator);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error checking following status:', error);
    }
  }, [uploaderInfo.name]);

  const handleFollowToggle = useCallback(async () => {
    if (followingLoading) {
      return;
    }

    try {
      setFollowingLoading(true);

      // Generate a consistent creator ID from the creator name
      const creatorId = `creator_${uploaderInfo.name
        .toLowerCase()
        .replace(/\s+/g, '_')}`;

      if (isFollowing) {
        // Unfollow
        const success = await FollowingService.unfollowCreator(creatorId);
        if (success) {
          setIsFollowing(false);
          showAlert('Success', `Unfollowed ${uploaderInfo.name}`, 'success');
        } else {
          showAlert('Error', 'Failed to unfollow. Please try again.', 'error');
        }
      } else {
        // Follow
        const success = await FollowingService.followCreator(
          creatorId,
          uploaderInfo.name,
          uploaderInfo.avatar,
        );
        if (success) {
          setIsFollowing(true);
          showAlert('Success', `Following ${uploaderInfo.name}`, 'success');
        } else {
          showAlert('Error', 'Failed to follow. Please try again.', 'error');
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error toggling follow:', error);
      showAlert(
        'Error',
        'Failed to update follow status. Please try again.',
        'error',
      );
    } finally {
      setFollowingLoading(false);
    }
  }, [
    followingLoading,
    isFollowing,
    uploaderInfo.name,
    uploaderInfo.avatar,
    showAlert,
  ]);

  const fetchVideoUrl = useCallback(async () => {
    setVideoLoading(true);
    setVideoError(false); // Reset error state
    try {
      const user = await getDataJson<User | null>('User');
      const trailerUrl = `https://www.spred.cc/Api/ContentManager/Content/play-trailer/${trailerKey}`;

      // Store user token for video headers
      setUserToken(user?.token || null);
      setVideoUrl(trailerUrl);
    } catch (err) {
      // DISABLED FOR PERFORMANCE
      // logger.error('❌ fetchVideoUrl Error:', err);
      setVideoUrl(null);
      setVideoError(true);
    } finally {
      setVideoLoading(false);
    }
  }, [trailerKey]);

  const fetchAllVideos = useCallback(async () => {
    try {
      const user = await getDataJson<User | null>('User');
      const config = { headers: customHeaders(user?.token) };
      let response = await axios.get(api.getAllMovies, config);
      setAllVideos(response?.data?.data);
    } catch (err) {}
  }, []);

  const fetchWatchLater = useCallback(async () => {
    const data = await getDataJson<any[]>('WatchLater');
    setWatchLater(data || []);
  }, []);

  const checkIfVideoDownloaded = useCallback(async () => {
    try {
      // Check both possible download folders
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      const videoKeyToCheck = videoKey || trailerKey;
      if (!videoKeyToCheck) {
        logger.warn('❌ No video key available for download check');
        setIsVideoDownloaded(false);
        return;
      }

      logger.info('🔍 Checking if video is downloaded...');
      logger.info('  - Video key:', videoKeyToCheck);
      logger.info('  - Title:', title);

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          const folderExists = await RNFS.exists(folderPath);

          logger.info(
            `  - Checking folder: ${folderPath}, exists: ${folderExists}`,
          );

          if (!folderExists) {
            continue;
          }

          const files = await RNFS.readDir(folderPath);
          logger.info(`  - Files in folder: ${files.length}`);

          // Create multiple variations of the title to check against
          const cleanedTitle = cleanMovieTitle(title);
          const titleVariations = [
            cleanedTitle.toLowerCase(),
            title.toLowerCase(),
            cleanedTitle.replace(/\s+/g, '_').toLowerCase(),
            title.replace(/\s+/g, '_').toLowerCase(),
            cleanedTitle.replace(/\s+/g, '').toLowerCase(),
            title.replace(/\s+/g, '').toLowerCase(),
          ];

          // Create variations of the video key to check against
          const keyVariations = [
            videoKeyToCheck.toLowerCase(),
            videoKeyToCheck.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
          ];

          logger.info(
            `  - Checking files against: key=${videoKeyToCheck}, title=${cleanedTitle}`,
          );

          const isDownloaded = files.some(file => {
            const fileName = file.name.toLowerCase();

            logger.info(`  - Checking file: ${file.name}`);

            // Check against all key variations
            for (const keyVar of keyVariations) {
              if (
                fileName.includes(keyVar) ||
                fileName.includes(`${keyVar}.mp4`) ||
                fileName.includes(`${keyVar}.mov`) ||
                fileName.includes(`${keyVar}.m4v`)
              ) {
                logger.info(`  - ✅ Matched by key variation: ${keyVar}`);
                return true;
              }
            }

            // Check against all title variations
            for (const titleVar of titleVariations) {
              if (
                fileName.includes(titleVar) ||
                fileName.includes(`${titleVar}.mp4`) ||
                fileName.includes(`${titleVar}.mov`) ||
                fileName.includes(`${titleVar}.m4v`)
              ) {
                logger.info(`  - ✅ Matched by title variation: ${titleVar}`);
                return true;
              }
            }

            return false;
          });

          logger.info(`  - Is downloaded in ${folderName}: ${isDownloaded}`);

          if (isDownloaded) {
            logger.info('✅ Video found as downloaded!');
            setIsVideoDownloaded(true);
            return;
          }
        } catch (error) {
          logger.warn(`  - Error checking ${folderName}:`, error);
          // Continue with next folder
          continue;
        }
      }

      logger.info('❌ Video not found in any download folder');
      setIsVideoDownloaded(false);
    } catch (error) {
      logger.error(
        'Error checking if video is downloaded: ' + (error.message || error),
      );
      setIsVideoDownloaded(false);
    }
  }, [videoKey, trailerKey, title]);

  useEffect(() => {
    fetchVideoUrl();
    fetchAllVideos();
    fetchWatchLater();
    checkFollowingStatus();
    checkIfVideoDownloaded();
  }, [
    fetchVideoUrl,
    fetchAllVideos,
    fetchWatchLater,
    checkFollowingStatus,
    checkIfVideoDownloaded,
  ]);

  // Re-check download status when download modal closes
  useEffect(() => {
    if (!showDownload) {
      checkIfVideoDownloaded();
    }
  }, [showDownload, checkIfVideoDownloaded]);

  const handlePlayTrailer = useCallback(() => {
    setIsVideoPaused(false);
  }, []);

  const handleAddWatchLater = useCallback(async () => {
    let updated = [...watchLater];
    if (!updated.find(v => (v.key || v.videoKey) === (videoKey || item.key))) {
      updated.push(item);
      await storeDataJson('WatchLater', updated);
      setWatchLater(updated);
      showAlert(
        'Added to Watch Later',
        'This video has been added to your Watch Later list.',
        'success',
      );
    } else {
      showAlert(
        'Already in Watch Later',
        'This video is already in your Watch Later list.',
        'info',
      );
    }
  }, [watchLater, videoKey, item, showAlert]);

  const handleSavePress = useCallback(() => {
    handleAddWatchLater();
  }, [handleAddWatchLater]);

  const generateShareUrl = useCallback(() => {
    // Create a shareable URL for the movie
    return `https://spred.app/watch/${item._ID || item.id}`;
  }, [item._ID, item.id]);

  const generateShareMessage = useCallback(() => {
    const movieTitle = cleanMovieTitle(title);
    const year = releaseDate
      ? new Date(releaseDate).getFullYear()
      : item.year || 'Unknown';
    return `🎬 Check out "${movieTitle}" ${year ? `(${year})` : ''}!

${description || 'Amazing content you need to watch!'}

${generateShareUrl()}`;
  }, [title, releaseDate, item.year, description, generateShareUrl]);

  const handleSocialShare = useCallback(
    async (platform?: string) => {
      const shareUrl = generateShareUrl();
      const shareMessage = generateShareMessage();

      try {
        if (platform) {
          // Platform-specific sharing using React Native's built-in Share
          switch (platform) {
            case 'twitter':
              const twitterMessage = `🎬 Watching "${cleanMovieTitle(
                title,
              )}" ${shareUrl}`;
              await RNShare.share({
                title: `🎬 ${cleanMovieTitle(title)}`,
                message: twitterMessage,
              });
              break;
            default:
              // Use built-in share for other platforms
              await RNShare.share({
                title: `🎬 ${cleanMovieTitle(title)}`,
                message: shareMessage,
              });
              break;
          }
        } else {
          // General sharing
          await RNShare.share({
            title: `🎬 ${cleanMovieTitle(title)}`,
            message: shareMessage,
          });
        }

        setShowShareModal(false);
      } catch (error) {
        if (error.message !== 'User did not share') {
          // DISABLED FOR PERFORMANCE
          // logger.warn('Share error:', error);
          showAlert(
            'Error',
            'Failed to share content. Please try again.',
            'error',
          );
        }
        setShowShareModal(false);
      }
    },
    [generateShareUrl, generateShareMessage, title, showAlert],
  );

  const handleCopyLink = useCallback(() => {
    const shareUrl = generateShareUrl();
    // Clipboard.setString(shareUrl);
    showAlert(
      '✅ Link Copied!',
      'Movie link has been copied to clipboard.',
      'success',
    );
    setShowShareModal(false);
  }, [generateShareUrl, showAlert]);

  const handleCopyMessage = useCallback(() => {
    const shareMessage = generateShareMessage();
    // Clipboard.setString(shareMessage);
    showAlert(
      '✅ Message Copied!',
      'Share message has been copied to clipboard.',
      'success',
    );
    setShowShareModal(false);
  }, [generateShareMessage, showAlert]);

  // Recommendations: filter out current video
  const RecommendedMovies = useMemo(
    () =>
      allVideos
        .filter(v => (v.key || v.videoKey) !== (videoKey || item.key))
        .slice(0, 10),
    [allVideos, videoKey, item.key],
  );

  const renderRecommendation = useCallback(
    ({ item }) => (
      <VideoCard
        key={item.key || item.videoKey || item._ID}
        title={cleanMovieTitle(item.title)}
        thumbnail={item?.thumbnailUrl}
        duration={item.duration}
        variant="compact"
        onPress={() => navigation.navigate('PlayVideos', { item })}
        style={styles.videoCard}
      />
    ),
    [navigation, spacing.md],
  );

  // Fetch suggested films from the API when component mounts or item changes
  useEffect(() => {
    const fetchSuggestedFilms = async () => {
      try {
        logger.info('🔍 Fetching suggested films for item');

        // Get all available videos from the API using the same endpoint as the main video list
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...customHeaders(userToken),
          },
        };

        let response;
        if (userToken) {
          // Use authenticated endpoint if user is logged in
          logger.info('🔐 Using authenticated endpoint for suggested films');
          response = await axios.get(api.getAllMovies, config);
        } else {
          // Use fallback suggestions when no user token
          logger.info('🔓 No user token - using fallback suggestions');
          const fallbackSuggestions = [
            {
              _ID: 'fallback_1',
              title: 'Action Movie Collection',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/F45303/FFFFFF?text=Action',
              duration: '2:15:00',
              year: '2024',
              genreId: 'action',
            },
            {
              _ID: 'fallback_2',
              title: 'Comedy Classics',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/D69E2E/FFFFFF?text=Comedy',
              duration: '1:45:00',
              year: '2024',
              genreId: 'comedy',
            },
            {
              _ID: 'fallback_3',
              title: 'Drama Series',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/8B8B8B/FFFFFF?text=Drama',
              duration: '2:30:00',
              year: '2024',
              genreId: 'drama',
            },
            {
              _ID: 'fallback_4',
              title: 'Thriller Collection',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Thriller',
              duration: '1:55:00',
              year: '2024',
              genreId: 'thriller',
            },
            {
              _ID: 'fallback_5',
              title: 'Sci-Fi Adventures',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Sci-Fi',
              duration: '2:10:00',
              year: '2024',
              genreId: 'sci-fi',
            },
            {
              _ID: 'fallback_6',
              title: 'Documentary Films',
              thumbnailUrl:
                'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Documentary',
              duration: '1:30:00',
              year: '2024',
              genreId: 'documentary',
            },
          ];
          setSuggestedFilms(fallbackSuggestions);
          logger.info(
            '✅ Fallback suggested films set: ' + fallbackSuggestions.length,
          );
          return;
        }

        logger.info('📥 Received response for suggested films');

        const responseData = response?.data?.data || response?.data || [];
        const allAvailableVideos = Array.isArray(responseData)
          ? responseData
          : [];
        logger.info(
          '📊 Total available videos for suggestions: ' +
            allAvailableVideos.length,
        );

        // Filter out the current video being played
        const filteredVideos = allAvailableVideos.filter(
          v => (v.key || v.videoKey || v._ID) !== (item.key || item._ID),
        );

        logger.info(
          '✂️ Filtered videos after removing current item: ' +
            filteredVideos.length,
        );

        // Select up to 6 random videos for suggestions
        const shuffled = [...filteredVideos].sort(() => 0.5 - Math.random());
        const selectedSuggestions = shuffled.slice(0, 6);

        logger.info(
          '🎲 Selected suggested films: ' + selectedSuggestions.length,
        );
        setSuggestedFilms(selectedSuggestions);
        logger.info('✅ Suggested films set successfully');
      } catch (error) {
        // Handle 403 and other API errors gracefully
        if (error.response?.status === 403) {
          logger.warn('⚠️ API access forbidden - using fallback suggestions');
        } else {
          logger.error(
            '❌ Error fetching suggested films: ' +
              (error.message || 'Unknown error'),
          );
        }
        // Fallback to mock suggestions if API call fails
        const fallbackSuggestions = [
          {
            _ID: 'error_fallback_1',
            title: 'Popular Movies',
            thumbnailUrl:
              'https://via.placeholder.com/300x200/F45303/FFFFFF?text=Popular',
            duration: '2:00:00',
            year: '2024',
            genreId: 'popular',
          },
          {
            _ID: 'error_fallback_2',
            title: 'Trending Now',
            thumbnailUrl:
              'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Trending',
            duration: '1:50:00',
            year: '2024',
            genreId: 'trending',
          },
          {
            _ID: 'error_fallback_3',
            title: 'New Releases',
            thumbnailUrl:
              'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=New',
            duration: '2:20:00',
            year: '2024',
            genreId: 'new',
          },
        ];
        setSuggestedFilms(fallbackSuggestions);
        logger.info(
          '✅ Error fallback suggested films set: ' +
            fallbackSuggestions.length,
        );
      }
    };

    if (item && (item.key || item._ID)) {
      logger.info('🎬 Fetching suggested films for current item');
      fetchSuggestedFilms();
    } else {
      logger.warn(
        '⚠️ Skipping suggested films fetch - no current item available',
      );
      setSuggestedFilms([]);
    }
  }, [item, userToken]);

  // Render function for suggested films


  const renderSuggestedFilm = useCallback(
    ({ item }) => (
      <VideoCard
        key={item._ID}
        title={cleanMovieTitle(item.title)}
        thumbnail={item?.thumbnailUrl}
        duration={item.duration}
        variant="compact"
        onPress={() => navigation.navigate('PlayVideos', { item })}
        style={styles.videoCard}
      />
    ),
    [navigation, spacing.md],
  );

  return (
    <View style={styles.container}>
      {/* Video Player Section - Separate from content */}
      <View style={styles.videoPlayerContainer}>
        {/* Floating Back Button - only show when not in fullscreen */}
        {!isFullscreen && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.floatingBackButton}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Floating Nearby Sharing Button - only show when not in fullscreen */}
        {!isFullscreen && (
          <TouchableOpacity
            onPress={handleSpredShare}
            style={styles.floatingNearbyButton}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialIcons name="send" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Floating Receiver Mode Button - only show when not in fullscreen */}
        {!isFullscreen && (
          <TouchableOpacity
            onPress={handleReceiverMode}
            style={styles.floatingReceiverButton}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialIcons name="wifi-tethering" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {videoLoading ? (
          <View
            style={[styles.videoLoadingContainer, { height: getVideoPlayerHeight() }]}
          >
            <ActivityIndicator size="large" color="#F45303" />
            <CustomText
              fontSize={getResponsiveFontSize(14)}
              color="#CCCCCC"
              style={styles.loadingText}
            >
              {TEXT_CONSTANTS.LOADING_TRAILER}
            </CustomText>
          </View>
        ) : videoUrl && !videoError ? (
          <SimpleVideoPlayer
            source={{
              uri: videoUrl,
              headers: customHeaders(userToken),
            }}
            style={[styles.videoPlayer, { height: getVideoPlayerHeight() }]}
            paused={isVideoPaused}
            onPlayPause={paused => {
              setIsVideoPaused(paused);
            }}
            onFullscreenChange={(fullscreen) => {
              setIsFullscreen(fullscreen);
            }}
            resizeMode="contain"
            onLoad={data => {
              // Video loaded successfully
            }}
            onError={error => {
              // DISABLED FOR PERFORMANCE
              // console.log('Video error:', error);
              setVideoError(true);
              setVideoLoading(false);

              // More user-friendly error handling - don't show alert immediately
              // Just set the error state to show fallback UI
            }}
          />
        ) : (
          <View
            style={[styles.videoErrorContainer, { height: getVideoPlayerHeight() }]}
          >
            <Icon
              name="video"
              size={isSmallScreen ? 24 : 32}
              color="#CCCCCC"
            />
            <CustomText
              fontSize={getResponsiveFontSize(16)}
              color="#CCCCCC"
              style={styles.errorText}
            >
              {videoError ? TEXT_CONSTANTS.UNABLE_TO_LOAD : TEXT_CONSTANTS.VIDEO_UNAVAILABLE}
            </CustomText>
            {videoError && (
              <TouchableOpacity
                onPress={() => {
                  setVideoError(false);
                  fetchVideoUrl();
                }}
                style={styles.retryButton}
              >
                <CustomText
                  fontSize={getResponsiveFontSize(14)}
                  fontWeight="600"
                  color="#FFFFFF"
                >
                  {TEXT_CONSTANTS.RETRY}
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content Below Video - Only show when not in fullscreen */}
      {!isFullscreen && (
        <ScrollView
          style={styles.contentSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          bouncesZoom={false}
          overScrollMode="never"
        >

        {/* Video Info Section */}
        <View style={styles.videoInfoContainer}>
          {/* Video Title */}
          <CustomText
            fontSize={getResponsiveFontSize(24)}
            fontWeight="700"
            color="#FFFFFF"
            style={styles.title}
            numberOfLines={isSmallScreen ? 2 : 3}
            ellipsizeMode="tail"
          >
            {cleanMovieTitle(title)}
          </CustomText>

          {/* Video Metadata */}
          <View
            style={styles.metaDataContainer}
          >
            <CustomText
              fontSize={getResponsiveFontSize(14)}
              color="#CCCCCC"
              style={styles.metaDataText}
            >
              {year} {TEXT_CONSTANTS.DURATION} {duration}
            </CustomText>
            {getGenreName(genreId) && (
              <CustomText fontSize={getResponsiveFontSize(14)} color="#CCCCCC">
                {getGenreName(genreId)}
              </CustomText>
            )}
          </View>

          {/* Video Engagement Metrics */}
          <View
            style={styles.engagementContainer}
          >
            <View
              style={styles.engagementMetric}
            >
              <Icon
                name="eye"
                size={16}
                color="#8B8B8B"
                style={styles.engagementIcon}
              />
              <CustomText
                fontSize={12}
                color="#8B8B8B"
                style={styles.engagementText}
              >
                {item.views || TEXT_CONSTANTS.DEFAULT_VIEWS} {TEXT_CONSTANTS.VIEWS}
              </CustomText>
            </View>
            <View
              style={styles.engagementMetric}
            >
              <Icon
                name="download"
                size={16}
                color="#8B8B8B"
                style={styles.engagementIcon}
              />
              <CustomText
                fontSize={12}
                color="#8B8B8B"
                style={styles.engagementText}
              >
                {item.downloads || TEXT_CONSTANTS.DEFAULT_DOWNLOADS} {TEXT_CONSTANTS.DOWNLOADS}
              </CustomText>
            </View>
            <View style={styles.engagementMetric}>
              <Icon
                name="whatshot"
                size={16}
                color="#8B8B8B"
                style={styles.engagementIcon}
              />
              <CustomText fontSize={12} color="#8B8B8B">
                {item.offlineShares || TEXT_CONSTANTS.DEFAULT_SHARES} {TEXT_CONSTANTS.SHARES}
              </CustomText>
            </View>
          </View>

          {/* Additional Action Buttons */}
          <View
            style={styles.additionalActionsContainer}
          >
            <TouchableOpacity
              onPress={handleAddWatchLater}
              style={styles.additionalActionButton}
            >
              <Icon
                name="plus"
                size={12}
                color="#FFFFFF"
                style={styles.additionalActionIcon}
              />
              <CustomText
                fontSize={10}
                fontWeight="500"
                color="#FFFFFF"
                numberOfLines={1}
              >
                {TEXT_CONSTANTS.ADD_TO_LIST}
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Download')}
              style={styles.additionalActionButton}
            >
              <Icon
                name="download"
                size={12}
                color="#FFFFFF"
                style={styles.additionalActionIcon}
              />
              <CustomText
                fontSize={10}
                fontWeight="500"
                color="#FFFFFF"
                numberOfLines={1}
              >
                {TEXT_CONSTANTS.VIEW_DOWNLOADS}
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowShareModal(true)}
              style={styles.additionalActionButton}
            >
              <Icon
                name="share"
                size={12}
                color="#FFFFFF"
                style={styles.additionalActionIcon}
              />
              <CustomText
                fontSize={10}
                fontWeight="500"
                color="#FFFFFF"
                numberOfLines={1}
              >
                {TEXT_CONSTANTS.SHARE}
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {showDownload ? (
            <DownloadItems
              url={videoKey || trailerKey}
              title={cleanMovieTitle(title)}
            />
          ) : (
            <View>
              {/* Simplified Action Buttons */}
              <View
                style={styles.actionButtonsContainer}
              >
                <TouchableOpacity
                  onPress={() => setShowDownload(true)}
                  style={styles.downloadButton}
                >
                  <Icon
                    name="download"
                    size={20}
                    color="#FFFFFF"
                    style={styles.downloadButtonIcon}
                  />
                  <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                    {TEXT_CONSTANTS.DOWNLOAD}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSpredShare}
                  style={styles.spredButton}
                  // NEVER add disabled={!isVideoDownloaded} - keep button clickable for alert dialogs
                >
                  <Image
                    source={require('../../../assets/spred-white.png')}
                    style={styles.spredButtonIcon}
                  />
                  <CustomText
                    fontSize={16}
                    fontWeight="600"
                    color={isVideoDownloaded ? '#FFFFFF' : '#CCCCCC'}
                  >
                    {TEXT_CONSTANTS.SPRED}
                  </CustomText>
                  {!isVideoDownloaded && (
                    <Icon
                      name="download"
                      size={16}
                      color="#CCCCCC"
                      style={styles.engagementIcon}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Creator Section */}
              <View style={styles.creatorSection}>
                <View
                  style={styles.creatorContainer}
                >
                  <View
                    style={styles.creatorInfoContainer}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('CreatorProfile', {
                          creatorName: uploaderInfo.name,
                          creatorId: `creator_${uploaderInfo.name
                            .toLowerCase()
                            .replace(/\s+/g, '_')}`,
                        })
                      }
                      style={styles.creatorAvatarContainer}
                    >
                      {uploaderInfo.avatar ? (
                        <Image
                          source={{ uri: uploaderInfo.avatar }}
                          style={styles.creatorAvatar}
                        />
                      ) : (
                        <View
                          style={[styles.creatorAvatarPlaceholder, { backgroundColor: getAvatarColor(uploaderInfo.name) }]}
                        >
                          <CustomText
                            fontSize={isSmallScreen ? 14 : 18}
                            fontWeight="700"
                            color="#FFFFFF"
                          >
                            {getInitials(uploaderInfo.name)}
                          </CustomText>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View
                      style={styles.creatorNameContainer}
                    >
                      <CustomText
                        fontSize={getResponsiveFontSize(16)}
                        fontWeight="600"
                        color="#FFFFFF"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {uploaderInfo.name}
                      </CustomText>
                      <CustomText
                        fontSize={getResponsiveFontSize(12)}
                        color="#CCCCCC"
                        style={styles.creatorName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatSubscriberCount(uploaderInfo.subscribers)}
                      </CustomText>
                    </View>
                  </View>
                  <View
                    style={styles.subscribeButtonContainer}
                  >
                    <TouchableOpacity
                      onPress={handleFollowToggle}
                      disabled={followingLoading}
                      style={styles.subscribeButton}
                    >
                      <CustomText
                        fontSize={getResponsiveFontSize(14)}
                        fontWeight="600"
                        color="#FFFFFF"
                        style={styles.subscribeButtonText}
                      >
                        {followingLoading
                          ? TEXT_CONSTANTS.LOADING_TRAILER
                            : isFollowing
                            ? TEXT_CONSTANTS.FOLLOWING
                            : TEXT_CONSTANTS.SUBSCRIBE}
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* About Section with Tabs */}
              <View style={styles.aboutSection}>
                {/* Tab Headers */}
                <View
                  style={styles.tabHeaders}
                >
                  <TouchableOpacity
                    onPress={() => setActiveTab(TAB_KEYS.ABOUT)}
                    style={[
                      styles.tab,
                      activeTab === TAB_KEYS.ABOUT && styles.activeTab
                    ]}
                  >
                    <CustomText
                      fontSize={14}
                      fontWeight={activeTab === TAB_KEYS.ABOUT ? '600' : '400'}
                      color={activeTab === TAB_KEYS.ABOUT ? '#FFFFFF' : '#CCCCCC'}
                    >
                      {TEXT_CONSTANTS.ABOUT}
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab(TAB_KEYS.CASTS)}
                    style={[
                      styles.tab,
                      activeTab === TAB_KEYS.CASTS && styles.activeTab
                    ]}
                  >
                    <CustomText
                      fontSize={14}
                      fontWeight={activeTab === TAB_KEYS.CASTS ? '600' : '400'}
                      color={activeTab === TAB_KEYS.CASTS ? '#FFFFFF' : '#CCCCCC'}
                    >
                      {TEXT_CONSTANTS.CASTS_BTS}
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab(TAB_KEYS.COMMENTS)}
                    style={[
                      styles.tab,
                      activeTab === TAB_KEYS.COMMENTS && styles.activeTab
                    ]}
                  >
                    <CustomText
                      fontSize={14}
                      fontWeight={activeTab === TAB_KEYS.COMMENTS ? '600' : '400'}
                      color={activeTab === TAB_KEYS.COMMENTS ? '#FFFFFF' : '#CCCCCC'}
                    >
                      {TEXT_CONSTANTS.COMMENTS}
                    </CustomText>
                  </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === TAB_KEYS.ABOUT && (
                  <View>
                    <CustomText fontSize={14} color="#CCCCCC" lineHeight={20}>
                      {description}
                    </CustomText>
                  </View>
                )}

                {activeTab === TAB_KEYS.CASTS && (
                  <View>
                    <CustomText
                      fontSize={12}
                      fontWeight="500"
                      color="#CCCCCC"
                      style={styles.detailValue}
                    >
                      {TEXT_CONSTANTS.DIRECTOR}
                    </CustomText>
                    <CustomText
                      fontSize={14}
                      color="#FFFFFF"
                      style={styles.detailValue}
                    >
                      {director || TEXT_CONSTANTS.NOT_AVAILABLE}
                    </CustomText>

                    <CustomText
                      fontSize={12}
                      fontWeight="500"
                      color="#CCCCCC"
                      style={styles.detailValue}
                    >
                      {TEXT_CONSTANTS.CAST}
                    </CustomText>
                    <CustomText fontSize={14} color="#FFFFFF">
                      {cast || TEXT_CONSTANTS.CAST_INFO_NOT_AVAILABLE}
                    </CustomText>
                  </View>
                )}

                {activeTab === TAB_KEYS.COMMENTS && (
                  <View>
                    <CustomText
                      fontSize={14}
                      color="#CCCCCC"
                      fontStyle="italic"
                    >
                      {TEXT_CONSTANTS.NO_COMMENTS}
                    </CustomText>
                  </View>
                )}
              </View>

              {/* Video Details */}
              <View style={styles.detailsSection}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color="#FFFFFF"
                  style={styles.detailsTitle}
                >
                  {TEXT_CONSTANTS.DETAILS}
                </CustomText>
                <View
                  style={styles.detailsContainer}
                >
                  {[
                    {
                      label: TEXT_CONSTANTS.LANGUAGE,
                      value: language || TEXT_CONSTANTS.ENGLISH,
                    },
                    { label: TEXT_CONSTANTS.DIRECTOR, value: director },
                    { label: TEXT_CONSTANTS.YEAR, value: year },
                    { label: TEXT_CONSTANTS.DURATION, value: duration },
                  ]
                    .filter(item => item.value)
                    .map((item, index) => (
                      <View
                        key={index}
                        style={styles.detailItem}
                      >
                        <CustomText
                          fontSize={12}
                          fontWeight="500"
                          color="#CCCCCC"
                        >
                          {item.label} {TEXT_CONSTANTS.BULLET} {item.value}
                        </CustomText>
                      </View>
                    ))}
                </View>
              </View>
              {/* Recommendations Section */}
              {RecommendedMovies.length > 0 && (
                <View style={styles.recommendationsSection}>
                  <CustomText
                    fontSize={18}
                    fontWeight="700"
                    color="#FFFFFF"
                    style={styles.recommendationsTitle}
                  >
                    {TEXT_CONSTANTS.MORE_LIKE_THIS}
                  </CustomText>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={RecommendedMovies}
                    contentContainerStyle={styles.recommendationsList}
                    renderItem={renderRecommendation}
                  />
                </View>
              )}

              {/* Suggested Films Section - Using API data */}
              {suggestedFilms.length > 0 && (
                <View style={styles.suggestedSection}>
                  <CustomText
                    fontSize={18}
                    fontWeight="700"
                    color="#FFFFFF"
                    style={styles.recommendationsTitle}
                  >
                    {TEXT_CONSTANTS.SUGGESTED_FILMS}
                  </CustomText>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={suggestedFilms}
                    contentContainerStyle={styles.recommendationsList}
                    renderItem={renderSuggestedFilm}
                    keyExtractor={(item, index) => `suggested-${index}`}
                  />
                </View>
              )}
            </View>
          )}
        </View>
        </ScrollView>
      )}

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View
          style={styles.shareModalContainer}
        >
          <View
            style={styles.shareModalContent}
          >
            {/* Modal Header */}
            <View
              style={styles.shareModalHeader}
            >
              <CustomText fontSize={18} fontWeight="600" color="#FFFFFF">
                {TEXT_CONSTANTS.SHARE_MOVIE}
              </CustomText>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={styles.shareModalCloseButton}
              >
                <Icon name="close" size={24} color="#8B8B8B" />
              </TouchableOpacity>
            </View>

            {/* Movie Info */}
            <View
              style={styles.shareMovieInfo}
            >
              <CustomText
                fontSize={16}
                fontWeight="600"
                color="#FFFFFF"
                numberOfLines={2}
              >
                {cleanMovieTitle(title)}
              </CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomText fontSize={14} color="#CCCCCC" style={styles.shareMovieTitle}>
                  {year}
                </CustomText>
                <CustomText fontSize={14} color="#CCCCCC" style={{ marginHorizontal: 6 }}>
                  {TEXT_CONSTANTS.BULLET}
                </CustomText>
                <CustomText fontSize={14} color="#CCCCCC">
                  {duration}
                </CustomText>
                {getGenreName(genreId) ? (
                  <>
                    <CustomText fontSize={14} color="#CCCCCC" style={{ marginHorizontal: 6 }}>
                      {TEXT_CONSTANTS.BULLET}
                    </CustomText>
                    <CustomText fontSize={14} color="#CCCCCC">
                      {getGenreName(genreId)}
                    </CustomText>
                  </>
                ) : null}
              </View>
            </View>

            {/* Social Platform Buttons */}
            <View
              style={styles.socialButtonsContainer}
            >
              {/* Twitter/X */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialShare('twitter')}
              >
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.SHARE_TO_X}
                </CustomText>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialShare('facebook')}
              >
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.FACEBOOK}
                </CustomText>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialShare('whatsapp')}
              >
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.WHATSAPP}
                </CustomText>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialShare('instagram')}
              >
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.INSTAGRAM}
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* Copy Options */}
            <View style={styles.copyOptionsContainer}>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyLink}
              >
                <Icon
                  name="link"
                  size={20}
                  color="#FFFFFF"
                  style={styles.copyButtonIcon}
                />
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.COPY_LINK}
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyMessage}
              >
                <Icon
                  name="content-copy"
                  size={20}
                  color="#FFFFFF"
                  style={styles.copyButtonIcon}
                />
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.COPY_SHARE_MESSAGE}
                </CustomText>
              </TouchableOpacity>

              {/* General Share */}
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleSocialShare()}
              >
                <Icon
                  name="share"
                  size={20}
                  color="#FFFFFF"
                  style={styles.copyButtonIcon}
                />
                <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.MORE_OPTIONS}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Download Required Modal */}
      <Modal
        visible={showDownloadRequiredModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDownloadRequiredModal(false)}
      >
        <View
          style={styles.downloadRequiredModalContainer}
        >
          <View
            style={styles.downloadRequiredModalContent}
          >
            {/* Icon Section */}
            <View
              style={styles.downloadRequiredIconContainer}
            >
              <Icon name="download" size={26} color="#F45303" />
            </View>

            {/* Title */}
            <CustomText
              fontSize={18}
              fontWeight="700"
              color="#FFFFFF"
              style={styles.downloadRequiredTitle}
            >
              {TEXT_CONSTANTS.DOWNLOAD_REQUIRED}
            </CustomText>

            {/* Description */}
            <CustomText
              fontSize={14}
              color="#CCCCCC"
              style={styles.downloadRequiredDescription}
            >
              {`Please download this video first before sharing via ${TEXT_CONSTANTS.SPRED}`}
            </CustomText>

            {/* Action Buttons */}
            <View
              style={styles.downloadRequiredActions}
            >
              {/* Download Now Button */}
              <TouchableOpacity
                style={styles.downloadNowButton}
                onPress={() => {
                  setShowDownloadRequiredModal(false);
                  setShowDownload(true);
                }}
              >
                <Icon
                  name="download"
                  size={18}
                  color="#FFFFFF"
                  style={styles.downloadNowIcon}
                />
                <CustomText fontSize={14} fontWeight="600" color="#FFFFFF">
                  {TEXT_CONSTANTS.DOWNLOAD}
                </CustomText>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDownloadRequiredModal(false)}
              >
                <CustomText fontSize={14} fontWeight="600" color="#8B8B8B">
                  {TEXT_CONSTANTS.CANCEL}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Universal Sharing Modal */}
      <UniversalSharingModal
        visible={showUniversalSharingModal}
        onClose={() => setShowUniversalSharingModal(false)}
        videoPath={resolvedVideoPath}
        videoTitle={cleanMovieTitle(title)}
        onShareComplete={handleShareComplete}
      />

      {/* Unified Alert Modal */}
      <Modal
        visible={alertModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setAlertModal(prev => ({ ...prev, visible: false }))
        }
      >
        <View
          style={styles.alertModalContainer}
        >
          <View
            style={[styles.alertModalContent, alertModalContentBorderColor(alertModal.type)]}
          >
            {/* Icon Section */}
            <View
              style={[styles.alertIconContainer, alertIconBackgroundColor(alertModal.type), alertIconBorderColor(alertModal.type)]}
            >
              <Icon
                name={
                  alertModal.type === 'error'
                    ? 'alert-circle'
                    : alertModal.type === 'success'
                    ? 'check-circle'
                    : alertModal.type === 'warning'
                    ? 'alert-triangle'
                    : 'info'
                }
                size={26}
                color={
                  alertModal.type === 'error'
                    ? '#F45303'
                    : alertModal.type === 'success'
                    ? '#4CAF50'
                    : alertModal.type === 'warning'
                    ? '#FF9800'
                    : '#8B8B8B'
                }
              />
            </View>

            {/* Title */}
            <CustomText
              fontSize={18}
              fontWeight="700"
              color="#FFFFFF"
              style={styles.alertTitle}
            >
              {alertModal.title}
            </CustomText>

            {/* Message */}
            <CustomText
              fontSize={14}
              color="#CCCCCC"
              style={styles.alertMessage}
            >
              {alertModal.message}
            </CustomText>

            {/* Action Buttons */}
            <View
              style={styles.alertActions}
            >
              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.alertConfirmButton, alertConfirmButtonBackgroundColor(alertModal.type), alertConfirmButtonShadowColor(alertModal.type)]}
                onPress={() => {
                  if (alertModal.onConfirm) {
                    alertModal.onConfirm();
                  }
                  setAlertModal(prev => ({ ...prev, visible: false }));
                }}
              >
                <CustomText fontSize={14} fontWeight="600" color="#FFFFFF">
                  {alertModal.confirmText}
                </CustomText>
              </TouchableOpacity>

              {/* Cancel Button (if needed) */}
              {alertModal.showCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    if (alertModal.onCancel) {
                      alertModal.onCancel();
                    }
                    setAlertModal(prev => ({ ...prev, visible: false }));
                  }}
                >
                  <CustomText fontSize={14} fontWeight="600" color="#8B8B8B">
                    {alertModal.cancelText}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating RECEIVE Button - Hide when in fullscreen */}
      {!isFullscreen && (
        <TouchableOpacity
          style={styles.receiveFloatingButton}
          onPress={openReceiveModal}
        >
          <View style={styles.receiveButtonContent}>
            <View style={styles.spredLogoContainer}>
              <MaterialIcons name="arrow-circle-down" size={16} color="#FFFFFF" />
            </View>
            <CustomText fontSize={14} fontWeight="700" color="#FFFFFF" style={styles.receiveButtonText}>
              {TEXT_CONSTANTS.RECEIVE}
            </CustomText>
          </View>
        </TouchableOpacity>
      )}

      {/* P2P Receive Modal */}
      <P2PReceiveScreen
        visible={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        deviceName="P2P Device"
        onTransferStart={() => console.log('Transfer started')}
        onTransferComplete={filePath => {
          console.log('Transfer completed:', filePath);
          setShowReceiveModal(false);
        }}
      />
    </View>
  );
};

// Create dynamic styles that use theme colors
  const createStyles = (colors: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary, // Use theme color instead of hardcoded
    },
    contentSection: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollViewContent: {
      paddingBottom: 100,
    },
  videoPlayerContainer: {
    backgroundColor: '#000', // Keep black for video player
  },
  videoPlayer: {
    width: '100%',
    backgroundColor: '#000', // Keep black for video player
  },
  videoCard: {
    width: '100%',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  floatingNearbyButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(244, 83, 3, 0.9)', // SPRED orange color with transparency
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingReceiverButton: {
    position: 'absolute',
    top: 80, // Below the nearby sharing button
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.9)', // Green color for receiver mode
    borderRadius: 22,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  videoLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  videoErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  errorText: {
    marginTop: 10,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: colors.brand.primary[500],
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  videoInfoContainer: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  metaDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaDataText: {
    marginRight: 8,
  },
  engagementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  engagementMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  engagementIcon: {
    marginRight: 4,
  },
  engagementText: {
    fontSize: 12,
  },
  additionalActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  additionalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary, // Card Surface background
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  additionalActionIcon: {
    marginRight: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  downloadButtonIcon: {
    marginRight: 8,
  },
  spredButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.status.success,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  spredButtonIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  creatorSection: {
    marginBottom: 16,
    backgroundColor: colors.background.secondary, // Card Surface background (#2A2A2A)
    borderRadius: 12,
    padding: 16,
    // Add a subtle border to make it more visible
    borderWidth: 1,
    borderColor: colors.interactive.border,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Background removed - using parent container background
  },
  creatorAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  creatorAvatar: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorNameContainer: {
    justifyContent: 'center',
  },
  creatorName: {
    marginTop: 2,
  },
  subscribeButtonContainer: {},
  subscribeButton: {
    backgroundColor: colors.brand.primary[500],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  subscribeButtonText: {
    fontSize: 14,
  },
  aboutSection: {
    marginBottom: 16,
  },
  tabHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tab: {
    marginRight: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(244, 83, 3, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: '#F45303',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 8,
  },
  detailValue: {
    marginTop: 4,
  },
  detailsTitle: {
    marginBottom: 8,
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    marginBottom: 12,
  },
  recommendationsList: {
    paddingRight: 16,
  },
  suggestedSection: {
    marginBottom: 16,
  },
  shareModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shareModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareModalCloseButton: {
    padding: 8,
  },
  shareMovieInfo: {
    marginBottom: 16,
  },
  shareMovieTitle: {
    marginTop: 4,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  socialButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  copyOptionsContainer: {
    marginTop: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  copyButtonIcon: {
    marginRight: 12,
  },
  downloadRequiredModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  downloadRequiredModalContent: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 83, 3, 0.25)',
  },
  downloadRequiredIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  downloadRequiredTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  downloadRequiredDescription: {
    textAlign: 'center',
    marginBottom: 24,
  },
  downloadRequiredActions: {
    width: '100%',
  },
  downloadNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: colors.brand.primary[500],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  downloadNowIcon: {
    marginRight: 8,
  },
  receiveFloatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#F45303',
    padding: 12,
    borderRadius: 30,
  },
  receiveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spredLogoContainer: {
    marginRight: 8,
  },
  receiveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  alertModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  alertModalContent: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  alertTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    textAlign: 'center',
    marginBottom: 24,
  },
  alertActions: {
    width: '100%',
  },
  alertConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

// Alert style helpers used inline in JSX; keep them simple and deterministic
const alertColors = {
  error: {
    border: 'rgba(244,83,3,0.25)',
    background: '#FFF5F0',
    iconBorder: '#F45303',
    buttonBg: '#F45303',
    buttonShadow: '#F45303',
  },
  success: {
    border: 'rgba(76,175,80,0.15)',
    background: '#F0FFF4',
    iconBorder: '#4CAF50',
    buttonBg: '#4CAF50',
    buttonShadow: '#4CAF50',
  },
  warning: {
    border: 'rgba(255,152,0,0.15)',
    background: '#FFF9F0',
    iconBorder: '#FF9800',
    buttonBg: '#FF9800',
    buttonShadow: '#FF9800',
  },
  info: {
    border: 'rgba(139,139,139,0.08)',
    background: '#F8F8F8',
    iconBorder: '#8B8B8B',
    buttonBg: '#8B8B8B',
    buttonShadow: '#8B8B8B',
  },
};

function alertModalContentBorderColor(type: 'info' | 'success' | 'error' | 'warning') {
  return { borderColor: alertColors[type].border };
}

function alertIconBackgroundColor(type: 'info' | 'success' | 'error' | 'warning') {
  return { backgroundColor: alertColors[type].background };
}

function alertIconBorderColor(type: 'info' | 'success' | 'error' | 'warning') {
  return { borderColor: alertColors[type].iconBorder };
}

function alertConfirmButtonBackgroundColor(type: 'info' | 'success' | 'error' | 'warning') {
  return { backgroundColor: alertColors[type].buttonBg };
}

function alertConfirmButtonShadowColor(type: 'info' | 'success' | 'error' | 'warning') {
  return { shadowColor: alertColors[type].buttonShadow };
}


export default PlayVideos;
