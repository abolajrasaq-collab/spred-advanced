import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Optimized imports
import { useVideoUrl, useAllVideos, useWatchLater, useDownloadStatus } from '../../hooks/useVideoData';
import { useVideoStore, videoSelectors } from '../../store/videoStore';
import { OptimizedImage, VideoThumbnail } from '../../components/OptimizedImage';
import { CustomText, SimpleVideoPlayer, Android12Button } from '../../components';
import ShareVideoScreen from '../ShareVideo';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import DownloadItems from '../DownloadItems/DownloadItems';
import { cleanMovieTitle } from '../../../src/helpers/utils';
import { FollowingService } from '../../services/FollowingService';
import logger from '../../utils/logger';
import FastStorage from '../../services/FastStorage';

// Define User interface for type safety
interface User {
  token?: string;
  [key: string]: any;
}

// Constants for responsive design
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 380;
const isMediumScreen = screenWidth < 600;

const PlayVideosOptimized = (props: any) => {
  const { item } = props.route.params;
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();
  const { spacing } = useSpacing();

  // Extract video data
  const {
    title,
    description,
    trailerKey,
    videoKey,
    thumbnailUrl,
    uploader,
    creator,
    creatorName,
  } = item;

  // Use optimized hooks for data fetching
  const { data: videoUrl, isLoading: videoLoading, error: videoError } = useVideoUrl(trailerKey);
  const { data: allVideos = [] } = useAllVideos();
  const { 
    watchLater, 
    addToWatchLater, 
    isAddingToWatchLater 
  } = useWatchLater();
  const { data: downloadStatus } = useDownloadStatus(videoKey || trailerKey, title);

  // Use Zustand store for state management
  const {
    currentVideo,
    isPlaying,
    setCurrentVideo,
    setPlaybackState,
    isVideoInWatchLater,
    isVideoDownloaded,
  } = useVideoStore();

  // Local UI state (non-persistent)
  const [activeTab, setActiveTab] = useState<'about' | 'related'>('about');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showShareVideoScreen, setShowShareVideoScreen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Memoized calculations
  const uploaderInfo = useMemo(() => {
    const uploaderName = uploader?.name || creator?.name || creatorName || 'Unknown Creator';
    const subscriberCount = uploader?.subscribers || creator?.subscribers || 0;
    const avatarUrl = uploader?.avatar || creator?.avatar;

    return {
      name: uploaderName,
      subscribers: subscriberCount,
      avatar: avatarUrl,
    };
  }, [uploader, creator, creatorName]);

  const isInWatchLater = useMemo(() => {
    return isVideoInWatchLater(videoKey || trailerKey);
  }, [isVideoInWatchLater, videoKey, trailerKey]);

  const isDownloaded = useMemo(() => {
    return downloadStatus?.isDownloaded || isVideoDownloaded(videoKey || trailerKey);
  }, [downloadStatus, isVideoDownloaded, videoKey, trailerKey]);

  // Responsive design helpers
  const getVideoPlayerHeight = useCallback(() => {
    if (isSmallScreen) return 200;
    if (isMediumScreen) return 240;
    return 280;
  }, []);

  const getResponsiveFontSize = useCallback((baseSize: number) => {
    if (isSmallScreen) return baseSize * 0.85;
    if (isMediumScreen) return baseSize * 0.9;
    return baseSize;
  }, []);

  // Optimized event handlers
  const handlePlayVideo = useCallback(() => {
    setCurrentVideo(item);
    setPlaybackState(true);
  }, [item, setCurrentVideo, setPlaybackState]);

  const handleAddToWatchLater = useCallback(() => {
    if (!isInWatchLater && !isAddingToWatchLater) {
      addToWatchLater(item);
    }
  }, [isInWatchLater, isAddingToWatchLater, addToWatchLater, item]);

  const handleFollowToggle = useCallback(async () => {
    if (followingLoading) return;

    try {
      setFollowingLoading(true);
      const creatorId = `creator_${uploaderInfo.name.toLowerCase().replace(/\s+/g, '_')}`;

      if (isFollowing) {
        const success = await FollowingService.unfollowCreator(creatorId);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await FollowingService.followCreator(
          creatorId,
          uploaderInfo.name,
          uploaderInfo.avatar,
        );
        if (success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      logger.warn('Error toggling follow:', error);
    } finally {
      setFollowingLoading(false);
    }
  }, [followingLoading, isFollowing, uploaderInfo]);

  // Check following status on mount
  useEffect(() => {
    const checkFollowingStatus = async () => {
      try {
        const creatorId = `creator_${uploaderInfo.name.toLowerCase().replace(/\s+/g, '_')}`;
        const isFollowingCreator = await FollowingService.isFollowingCreator(creatorId);
        setIsFollowing(isFollowingCreator);
      } catch (error) {
        // Silently fail
      }
    };

    if (uploaderInfo.name) {
      checkFollowingStatus();
    }
  }, [uploaderInfo.name]);

  // Render video player section
  const renderVideoPlayer = useCallback(() => (
    <View style={styles.videoPlayerContainer}>
      {videoLoading ? (
        <View style={[styles.videoPlayer, { height: getVideoPlayerHeight() }]}>
          <ActivityIndicator size="large" color="#F45303" />
        </View>
      ) : videoError ? (
        <View style={[styles.videoPlayer, { height: getVideoPlayerHeight() }]}>
          <MaterialIcons name="error" size={48} color="#FF5252" />
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      ) : (
        <SimpleVideoPlayer
          source={{ uri: videoUrl }}
          style={[styles.videoPlayer, { height: getVideoPlayerHeight() }]}
          paused={!isPlaying}
          onPlay={handlePlayVideo}
        />
      )}
    </View>
  ), [videoLoading, videoError, videoUrl, isPlaying, getVideoPlayerHeight, handlePlayVideo]);

  // Render video info section
  const renderVideoInfo = useCallback(() => (
    <View style={styles.videoInfoContainer}>
      <Text style={[styles.videoTitle, { fontSize: getResponsiveFontSize(18) }]}>
        {cleanMovieTitle(title)}
      </Text>
      
      {description && (
        <Text style={[styles.videoDescription, { fontSize: getResponsiveFontSize(14) }]} numberOfLines={3}>
          {description}
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isInWatchLater && styles.actionButtonActive]}
          onPress={handleAddToWatchLater}
          disabled={isAddingToWatchLater}
        >
          <MaterialIcons 
            name={isInWatchLater ? "bookmark" : "bookmark-border"} 
            size={20} 
            color={isInWatchLater ? "#F45303" : "#8B8B8B"} 
          />
          <Text style={[styles.actionButtonText, isInWatchLater && styles.actionButtonTextActive]}>
            {isAddingToWatchLater ? "Adding..." : isInWatchLater ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowShareModal(true)}
        >
          <MaterialIcons name="share" size={20} color="#8B8B8B" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowDownload(true)}
        >
          <MaterialIcons 
            name={isDownloaded ? "download-done" : "download"} 
            size={20} 
            color={isDownloaded ? "#4CAF50" : "#8B8B8B"} 
          />
          <Text style={[styles.actionButtonText, isDownloaded && { color: "#4CAF50" }]}>
            {isDownloaded ? "Downloaded" : "Download"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [title, description, isInWatchLater, isAddingToWatchLater, isDownloaded, handleAddToWatchLater, getResponsiveFontSize]);

  // Render creator info section
  const renderCreatorInfo = useCallback(() => (
    <View style={styles.creatorContainer}>
      <View style={styles.creatorInfo}>
        <View style={styles.creatorAvatar}>
          {uploaderInfo.avatar ? (
            <OptimizedImage
              source={{ uri: uploaderInfo.avatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {uploaderInfo.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        
        <View style={styles.creatorDetails}>
          <Text style={styles.creatorName}>{uploaderInfo.name}</Text>
          {uploaderInfo.subscribers > 0 && (
            <Text style={styles.subscriberCount}>
              {uploaderInfo.subscribers.toLocaleString()} subscribers
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.followingButton]}
        onPress={handleFollowToggle}
        disabled={followingLoading}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
          {followingLoading ? "..." : isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
  ), [uploaderInfo, isFollowing, followingLoading, handleFollowToggle]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderVideoPlayer()}
        {renderVideoInfo()}
        {renderCreatorInfo()}
      </ScrollView>

      {/* Download Modal */}
      {showDownload && (
        <DownloadItems
          url={videoKey || trailerKey}
          title={title}
          onClose={() => setShowDownload(false)}
        />
      )}

      {/* Share Video Screen */}
      {showShareVideoScreen && (
        <ShareVideoScreen
          visible={showShareVideoScreen}
          onClose={() => setShowShareVideoScreen(false)}
          videoPath=""
          videoTitle={cleanMovieTitle(title)}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  videoPlayerContainer: {
    backgroundColor: '#000',
  },
  videoPlayer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    marginTop: 8,
    fontSize: 14,
  },
  videoInfoContainer: {
    padding: 16,
  },
  videoTitle: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  videoDescription: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
  },
  actionButtonText: {
    color: '#8B8B8B',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtonTextActive: {
    color: '#F45303',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F45303',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subscriberCount: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  followingButton: {
    backgroundColor: '#F45303',
  },
  followButtonText: {
    color: '#F45303',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
});

export default PlayVideosOptimized;