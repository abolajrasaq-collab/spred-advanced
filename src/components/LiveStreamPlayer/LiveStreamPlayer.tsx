import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Text,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Orientation from 'react-native-orientation-locker';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Navigation types
type RootStackParamList = {
  LiveStream: {
    streamUrl: string;
    channelInfo: any;
  };
  [key: string]: any;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProviderInfo {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  headquarters?: string;
  type: 'News' | 'Sports' | 'Entertainment' | 'Gaming' | 'Music' | 'Talk Show';
}

interface StreamingDetails {
  quality: string;
  protocol: 'HLS' | 'DASH' | 'RTMP' | 'MP4';
  bitrate?: string;
  resolution?: string;
  codec?: string;
  startTime: Date;
  duration?: string;
}

interface LiveStreamPlayerProps {
  streamUrl: string;
  channelInfo: {
    id: string;
    title: string;
    category: string;
    viewerCount?: number;
    isLive: boolean;
    provider?: ProviderInfo;
    streamingDetails?: StreamingDetails;
    description?: string;
    tags?: string[];
  };
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  streamUrl,
  channelInfo,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [streamDuration, setStreamDuration] = useState('00:00');
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current screen dimensions - FIXED
  const [screenDimens, setScreenDimens] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimens(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const handleLoad = () => {
    // DISABLED FOR PERFORMANCE
    // console.log('📺 Live stream loaded successfully');
    setLoading(false);
    setError(null);
  };

  const handleError = (error: any) => {
    // DISABLED FOR PERFORMANCE
    // console.log('❌ Live stream error:', error);
    setError(error?.error?.errorString || 'Failed to load live stream');
    setLoading(false);
  };

  const handleBuffer = (data: any) => {
    // DISABLED FOR PERFORMANCE
    // console.log('📡 Buffering:', data.isBuffering);
  };

  const handlePlayPause = () => {
    setPaused(!paused);
  };

  const handleBack = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      navigation.goBack();
    }
  };

  const enterFullscreen = () => {
    setIsFullscreen(true);
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
    Orientation.unlockAllOrientations();
    StatusBar.setHidden(false);
  };

  // Cleanup orientation on unmount
  useEffect(() => {
    return () => {
      try {
        Orientation.unlockAllOrientations();
        StatusBar.setHidden(false);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error resetting orientation on unmount:', error);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStreamProtocol = (url: string): string => {
    if (url.includes('.m3u8')) {
      return 'HLS';
    }
    if (url.includes('.mpd')) {
      return 'DASH';
    }
    if (url.includes('rtmp://')) {
      return 'RTMP';
    }
    if (url.includes('.mp4')) {
      return 'MP4';
    }
    return 'Unknown';
  };

  const getStreamQuality = (url: string): string => {
    if (url.includes('1080p') || url.includes('1920x1080')) {
      return '1080p HD';
    }
    if (url.includes('720p') || url.includes('1280x720')) {
      return '720p HD';
    }
    if (url.includes('480p') || url.includes('854x480')) {
      return '480p SD';
    }
    if (url.includes('360p') || url.includes('640x360')) {
      return '360p SD';
    }
    return 'Auto Quality';
  };

  // Recommended channels data from Homepage
  const allLiveChannels = [
    {
      id: 'live-1',
      title: 'Super Simple Songs TV',
      imageUrl:
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop',
      category: 'Kids',
      viewerCount: 8540,
      streamUrl:
        'https://janson-supersimplesongs-1-us.roku.wurl.tv/playlist.m3u8',
    },
    {
      id: 'live-2',
      title: 'MBC 4 Live',
      imageUrl:
        'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=225&fit=crop',
      category: 'Entertainment',
      viewerCount: 34200,
      streamUrl:
        'https://shd-gcp-live.edgenextcdn.net/live/bitmovin-mbc-4/24f134f1cd63db9346439e96b86ca6ed/index.m3u8',
    },
    {
      id: 'live-3',
      title: 'News Central Nigeria',
      imageUrl:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop',
      category: 'News',
      viewerCount: 15600,
      streamUrl: 'https://wf.newscentral.ng:8443/hls/stream.m3u8',
    },
    {
      id: 'live-8',
      title: 'Al Jazeera English Live',
      imageUrl:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop',
      category: 'News',
      viewerCount: 45200,
      streamUrl: 'https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8',
    },
    {
      id: 'live-9',
      title: 'B4U Music Live',
      imageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
      category: 'Music',
      viewerCount: 12800,
      streamUrl: 'https://cdnb4u.wiseplayout.com/B4U_Music/master.m3u8',
    },
    {
      id: 'live-11',
      title: 'Bloomberg TV Asia',
      imageUrl:
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
      category: 'News',
      viewerCount: 28400,
      streamUrl: 'https://bloomberg.com/media-manifest/streams/asia.m3u8',
    },
  ];

  const getRecommendedChannels = (currentCategory: string) => {
    // Filter out current channel and prioritize same category
    const otherChannels = allLiveChannels.filter(
      channel => channel.id !== channelInfo.id,
    );
    const sameCategory = otherChannels.filter(
      channel => channel.category === currentCategory,
    );
    const differentCategory = otherChannels.filter(
      channel => channel.category !== currentCategory,
    );

    // Return same category first, then different categories, max 4 recommendations
    return [...sameCategory, ...differentCategory].slice(0, 4);
  };

  const handleRecommendedChannelPress = (recommendedChannel: any) => {
    navigation.navigate('LiveStream', {
      streamUrl: recommendedChannel.streamUrl,
      channelInfo: {
        id: recommendedChannel.id,
        title: recommendedChannel.title,
        category: recommendedChannel.category,
        viewerCount: recommendedChannel.viewerCount,
        isLive: true,
        description: `Live ${recommendedChannel.category.toLowerCase()} content`,
      },
    });
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar hidden />
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.errorContent}>
          <Icon name="error-outline" size={80} color="#F45303" />
          <Text style={styles.errorTitle}>Stream Unavailable</Text>
          <Text style={styles.errorMessage}>
            {error || 'Unable to load the live stream'}
          </Text>
          <Text style={styles.errorHint}>
            The broadcaster may have ended the stream or there may be a
            connection issue.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const videoContainerStyle = {
    width: isFullscreen ? screenDimens.width : screenWidth,
    height: isFullscreen ? screenDimens.height : screenHeight * 0.3, // 30% of screen height in normal mode
  };

  return (
    <View
      style={[
        styles.container,
        isFullscreen && [
          styles.fullscreenContainer,
          { width: screenDimens.width, height: screenDimens.height },
        ],
      ]}
    >
      <StatusBar hidden={isFullscreen} />

      {/* Video Player */}
      <View style={[styles.videoContainer, videoContainerStyle]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
          <Video
            ref={videoRef}
            source={{ uri: streamUrl }}
            style={[
              styles.video,
              isFullscreen && [
                styles.fullscreenVideo,
                { width: screenDimens.width, height: screenDimens.height },
              ],
            ]}
            resizeMode={isFullscreen ? 'cover' : 'contain'}
            paused={paused}
            onLoad={handleLoad}
            onError={handleError}
            onBuffer={handleBuffer}
            playWhenInactive={false}
            playInBackground={false}
            // Live stream optimizations
            bufferConfig={{
              minBufferMs: 2000,
              maxBufferMs: 5000,
              bufferForPlaybackMs: 1000,
              bufferForPlaybackAfterRebufferMs: 1500,
            }}
            // Hide native controls - we'll use custom ones
            controls={false}
            disableFocus={true}
          />

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#F45303" />
              <Text style={styles.loadingText}>
                Connecting to live stream...
              </Text>
            </View>
          )}

          {/* Controls Overlay */}
          {showControls && !loading && (
            <View style={styles.controlsOverlay}>
              {/* Top Controls */}
              <View
                style={[
                  styles.topControls,
                  isFullscreen && styles.topControlsFullscreen,
                ]}
              >
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Icon
                    name={isFullscreen ? 'fullscreen-exit' : 'arrow-back'}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <View style={styles.channelInfo}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                    <Text style={styles.streamDuration}>{streamDuration}</Text>
                  </View>
                  <Text style={styles.channelTitle}>{channelInfo.title}</Text>
                  <Text style={styles.channelCategory}>
                    {channelInfo.category}
                  </Text>
                  {channelInfo.viewerCount && (
                    <Text style={styles.viewerCount}>
                      👥 {formatViewerCount(channelInfo.viewerCount)} watching
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setShowStreamInfo(!showStreamInfo)}
                >
                  <Icon name="info-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Center Controls */}
              <View style={styles.centerControls}>
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={handlePlayPause}
                >
                  <Icon
                    name={paused ? 'play-arrow' : 'pause'}
                    size={isFullscreen ? 80 : 60}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              <View
                style={[
                  styles.bottomControls,
                  isFullscreen && styles.bottomControlsFullscreen,
                ]}
              >
                <View style={styles.leftBottomControls}>
                  <Text style={styles.streamInfo}>
                    📡 Live Stream • {channelInfo.category}
                  </Text>
                  {channelInfo.description && (
                    <Text style={styles.streamDescription} numberOfLines={2}>
                      {channelInfo.description}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={toggleFullscreen}
                >
                  <Icon
                    name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                    size={28}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stream Info Panel */}
          {showStreamInfo && showControls && (
            <View
              style={[
                styles.streamInfoPanel,
                isFullscreen && styles.streamInfoPanelFullscreen,
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Provider Information */}
                {channelInfo.provider && (
                  <View style={styles.providerSection}>
                    <Text style={styles.sectionTitle}>Provider</Text>
                    <View style={styles.providerInfo}>
                      {channelInfo.provider.logo && (
                        <Image
                          source={{ uri: channelInfo.provider.logo }}
                          style={styles.providerLogo}
                        />
                      )}
                      <View style={styles.providerDetails}>
                        <Text style={styles.providerName}>
                          {channelInfo.provider.name}
                        </Text>
                        {channelInfo.provider.establishedYear && (
                          <Text style={styles.providerDetail}>
                            Est. {channelInfo.provider.establishedYear}
                          </Text>
                        )}
                        {channelInfo.provider.headquarters && (
                          <Text style={styles.providerDetail}>
                            📍 {channelInfo.provider.headquarters}
                          </Text>
                        )}
                      </View>
                    </View>
                    {channelInfo.provider.description && (
                      <Text style={styles.providerDescription}>
                        {channelInfo.provider.description}
                      </Text>
                    )}
                  </View>
                )}

                {/* Streaming Details */}
                <View style={styles.streamDetailsSection}>
                  <Text style={styles.sectionTitle}>Stream Details</Text>
                  <View style={styles.streamDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Protocol:</Text>
                      <Text style={styles.detailValue}>
                        {getStreamProtocol(streamUrl)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quality:</Text>
                      <Text style={styles.detailValue}>
                        {getStreamQuality(streamUrl)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={[styles.detailValue, { color: '#F45303' }]}>
                        🔴 LIVE
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Viewers:</Text>
                      <Text style={styles.detailValue}>
                        {channelInfo.viewerCount
                          ? formatViewerCount(channelInfo.viewerCount)
                          : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tags */}
                {channelInfo.tags && channelInfo.tags.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {channelInfo.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Pause Overlay */}
          {paused && !showControls && (
            <TouchableOpacity
              style={styles.pausedOverlay}
              onPress={() => setPaused(false)}
            >
              <Icon
                name="play-arrow"
                size={isFullscreen ? 120 : 80}
                color="rgba(255, 255, 255, 0.8)"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Below Video */}
      {!isFullscreen && (
        <ScrollView
          style={styles.contentSection}
          showsVerticalScrollIndicator={false}
        >
          {/* Provider Information */}
          {channelInfo.provider && (
            <View style={styles.providerCard}>
              <Text style={styles.sectionTitle}>About the Channel</Text>
              <View style={styles.providerInfo}>
                {channelInfo.provider.logo && (
                  <Image
                    source={{ uri: channelInfo.provider.logo }}
                    style={styles.providerLogo}
                  />
                )}
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>
                    {channelInfo.provider.name}
                  </Text>
                  <Text style={styles.providerType}>
                    {channelInfo.provider.type}
                  </Text>
                  {channelInfo.provider.establishedYear && (
                    <Text style={styles.providerDetail}>
                      Established {channelInfo.provider.establishedYear}
                    </Text>
                  )}
                  {channelInfo.provider.headquarters && (
                    <Text style={styles.providerDetail}>
                      📍 {channelInfo.provider.headquarters}
                    </Text>
                  )}
                </View>
              </View>
              {channelInfo.provider.description && (
                <Text style={styles.providerDescription}>
                  {channelInfo.provider.description}
                </Text>
              )}
            </View>
          )}

          {/* Tags */}
          {channelInfo.tags && channelInfo.tags.length > 0 && (
            <View style={styles.tagsCard}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {channelInfo.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommended Live Channels */}
          <View style={styles.recommendedChannelsCard}>
            <Text style={styles.sectionTitle}>Recommended Live Channels</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recommendedChannelsScroll}
            >
              {getRecommendedChannels(channelInfo.category).map(
                (recommendedChannel, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recommendedChannelItem}
                    onPress={() =>
                      handleRecommendedChannelPress(recommendedChannel)
                    }
                  >
                    <Image
                      source={{ uri: recommendedChannel.imageUrl }}
                      style={styles.recommendedChannelImage}
                    />
                    {/* Live Badge */}
                    <View style={styles.recommendedLiveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.recommendedLiveText}>LIVE</Text>
                    </View>
                    {/* Channel Info */}
                    <View style={styles.recommendedChannelInfo}>
                      <Text
                        style={styles.recommendedChannelTitle}
                        numberOfLines={2}
                      >
                        {recommendedChannel.title}
                      </Text>
                      <Text style={styles.recommendedChannelCategory}>
                        {recommendedChannel.category}
                      </Text>
                      <Text style={styles.recommendedChannelViewers}>
                        {formatViewerCount(recommendedChannel.viewerCount)}{' '}
                        watching
                      </Text>
                    </View>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoContainer: {
    position: 'relative',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
  },
  channelInfoSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  providerCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  providerType: {
    color: '#D69E2E',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  streamDetailsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tagsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#8B8B8B',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topControlsFullscreen: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  channelInfo: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F45303',
    marginRight: 6,
  },
  liveText: {
    color: '#F45303',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  streamDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 12,
  },
  channelTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  channelCategory: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
  viewerCount: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bottomControlsFullscreen: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  leftBottomControls: {
    flex: 1,
  },
  streamInfo: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  streamDescription: {
    color: '#8B8B8B',
    fontSize: 11,
    lineHeight: 14,
  },
  fullscreenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamInfoPanel: {
    position: 'absolute',
    top: 80,
    right: 16,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
  },
  streamInfoPanelFullscreen: {
    top: 60,
    right: 24,
    width: 350,
    maxHeight: 500,
  },
  sectionTitle: {
    color: '#F45303',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  providerSection: {
    marginBottom: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2A2A2A',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  providerDetail: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 1,
  },
  providerDescription: {
    color: '#CCCCCC',
    fontSize: 12,
    lineHeight: 16,
  },
  streamDetailsSection: {
    marginBottom: 16,
  },
  streamDetails: {
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#8B8B8B',
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F45303',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    color: '#8B8B8B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Recommended Channels Styles
  recommendedChannelsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendedChannelsScroll: {
    marginTop: 12,
  },
  recommendedChannelItem: {
    width: 200,
    marginRight: 16,
  },
  recommendedChannelImage: {
    width: 200,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#353535',
  },
  recommendedLiveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  recommendedChannelInfo: {
    paddingTop: 8,
  },
  recommendedChannelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendedChannelCategory: {
    color: '#D69E2E',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  recommendedChannelViewers: {
    color: '#8B8B8B',
    fontSize: 11,
  },
});

export default LiveStreamPlayer;
