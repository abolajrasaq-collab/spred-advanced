import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
} from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import logger from '../../utils/logger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShortVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorAvatar: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

const mockShorts: ShortVideo[] = [
  {
    id: '1',
    title: 'Afrobeats Dance Challenge 🔥',
    description:
      'Join the hottest afrobeats dance challenge trending in Lagos! 🇳🇬 Move your body to the rhythm',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=1',
    creatorName: 'AfroDanceKing',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=AfroDanceKing&background=f45103&color=fff',
    likes: 89200,
    comments: 3456,
    shares: 2145,
    isLiked: false,
  },
  {
    id: '2',
    title: 'Office Comedy Nigerian Style 😂',
    description:
      'When your boss asks for report Monday morning but you were watching football all weekend!',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=2',
    creatorName: 'LaughGangNG',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=LaughGangNG&background=f45103&color=fff',
    likes: 67834,
    comments: 2890,
    shares: 1567,
    isLiked: true,
  },
  {
    id: '3',
    title: 'Perfect Jollof Rice Recipe 🍚',
    description:
      'The secret ingredient that makes Nigerian party jollof irresistible 🇳🇬 Watch till the end!',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=3',
    creatorName: 'ChefChioma',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=ChefChioma&background=f45103&color=fff',
    likes: 124567,
    comments: 5434,
    shares: 2876,
    isLiked: false,
  },
  {
    id: '4',
    title: 'Football Skills ⚽ Lagos Street',
    description:
      'Watch these incredible football freestyle skills from the streets of Lagos! Pure talent!',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=4',
    creatorName: 'FootballNG',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=FootballNG&background=f45103&color=fff',
    likes: 92389,
    comments: 4234,
    shares: 1876,
    isLiked: false,
  },
  {
    id: '5',
    title: 'Burna Boy Type Beat 🎵',
    description:
      'Latest afrobeats instrumental that\'s breaking the internet! Tag someone who needs this!',
    videoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=5',
    creatorName: 'BurnaBoyFan',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=BurnaBoyFan&background=f45103&color=fff',
    likes: 156789,
    comments: 6789,
    shares: 3456,
    isLiked: true,
  },
  {
    id: '6',
    title: 'Ankara Styles 2025 👗 Fashion',
    description:
      'Rocking the latest Ankara designs that are turning heads in Lagos! Fashion week ready!',
    videoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_1s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=6',
    creatorName: 'StyleQueenNG',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=StyleQueenNG&background=f45103&color=fff',
    likes: 109876,
    comments: 4567,
    shares: 2234,
    isLiked: false,
  },
  {
    id: '7',
    title: 'Tech Reviews Nigeria 📱',
    description:
      'Top 5 gadgets every Nigerian needs in 2025! From Lagos to Abuja, we got you covered!',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=7',
    creatorName: 'TechGuruNG',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=TechGuruNG&background=f45103&color=fff',
    likes: 76543,
    comments: 3210,
    shares: 1543,
    isLiked: false,
  },
  {
    id: '8',
    title: 'Home Workout 💪 No Equipment',
    description:
      '15-minute workout you can do anywhere! Perfect for busy Nigerian professionals #Fitness',
    videoUrl:
      'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://picsum.photos/400/700?random=8',
    creatorName: 'FitLifeNG',
    creatorAvatar:
      'https://ui-avatars.com/api/?name=FitLifeNG&background=f45103&color=fff',
    likes: 54321,
    comments: 2345,
    shares: 987,
    isLiked: true,
  },
];

const Shorts: React.FC = () => {
  const navigation = useNavigation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pausedVideos, setPausedVideos] = useState<{ [key: number]: boolean }>(
    {},
  );
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: string]: any }>({});
  const videoSwitchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Preload first video and start auto-play
    if (mockShorts.length > 0) {
      logger.info('Shorts: Initializing with', mockShorts.length, 'videos');
      setLoading(true);
      // Auto-start first video immediately
      setTimeout(() => {
        if (videoRefs.current[0]) {
          videoRefs.current[0].setNativeProps({ paused: false });
          logger.info('Starting first video auto-play');
        }
        setLoading(false);
      }, 100);
    }

    // Cleanup function
    return () => {
      if (videoSwitchTimeout.current) {
        clearTimeout(videoSwitchTimeout.current);
      }
    };
  }, []);

  const onViewableItemsChanged = useRef(({ changed }: any) => {
    changed.forEach((item: any) => {
      const index = item.index;
      const isViewable = item.isViewable;

      if (isViewable && index !== currentVideoIndex) {
        // Pause previous video
        if (videoRefs.current[currentVideoIndex]) {
          videoRefs.current[currentVideoIndex].setNativeProps({ paused: true });
        }

        setCurrentVideoIndex(index);

        // Clear any existing timeout
        if (videoSwitchTimeout.current) {
          clearTimeout(videoSwitchTimeout.current);
        }

        // Auto-play new video immediately without any manual interaction
        videoSwitchTimeout.current = setTimeout(() => {
          if (videoRefs.current[index]) {
            videoRefs.current[index].setNativeProps({ paused: false });
            logger.info(`Auto-playing video ${index}`);
          }
        }, 50); // Faster response for immediate auto-play
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75, // Higher threshold for better auto-play detection
    minimumViewTime: 200, // Faster response time
    waitForInteraction: false, // Auto-play without user interaction
  }).current;

  const handleLike = (videoId: string) => {
    const video = mockShorts.find(v => v.id === videoId);
    if (video) {
      video.isLiked = !video.isLiked;
      video.likes += video.isLiked ? 1 : -1;
    }
  };

  const handleComment = (videoId: string) => {
    // DISABLED FOR PERFORMANCE
    // logger.info('Comment pressed for video:', videoId);
  };

  const handleShare = (videoId: string) => {
    // DISABLED FOR PERFORMANCE
    // logger.info('Share pressed for video:', videoId);
  };

  const renderItem = ({ item, index }: { item: ShortVideo; index: number }) => (
    <View style={styles.slide}>
      {/* Video Component */}
      <Video
        ref={ref => {
          if (ref) {
            videoRefs.current[index] = ref;
          }
        }}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode="cover"
        repeat
        muted={false}
        paused={index !== currentVideoIndex || pausedVideos[index]}
        controls={false}
        onLoad={() => {
          if (index === currentVideoIndex) {
            setLoading(false);
          }
        }}
        onError={error => {
          logger.error(`Video ${index} error:`, error);
        }}
        onBuffer={buffer => {
          if (buffer.isBuffering) {
            logger.info(`Video ${index} buffering...`);
          }
        }}
        onReadyForDisplay={() => {
          logger.info(`Video ${index} ready for display`);
        }}
      />

      {/* Touchable area for video interaction */}
      <TouchableOpacity
        style={styles.videoTouchable}
        activeOpacity={0.8}
        onPress={handleVideoPress}
      />

      {/* Video Overlay */}
      <View style={styles.overlay}>
        {/* Top Info */}
        <View style={styles.topInfo}>
          <TouchableOpacity
            style={styles.exitButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exitText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.creatorInfo}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.creatorAvatar }}
              style={styles.creatorAvatar}
            />
            <Text style={styles.creatorName}>{item.creatorName}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.followButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Video Title and Description */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDescription}>{item.description}</Text>
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
            onPress={() => handleLike(item.id)}
          >
            <View style={[styles.actionIcon, item.isLiked && styles.likedIcon]}>
              <MaterialIcons
                name={item.isLiked ? 'favorite' : 'favorite-border'}
                size={24}
                color={item.isLiked ? '#FF3040' : '#FFFFFF'}
              />
            </View>
            <Text style={styles.actionCount}>{formatCount(item.likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
            onPress={() => handleComment(item.id)}
          >
            <View style={styles.actionIcon}>
              <MaterialIcons
                name="chat-bubble-outline"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.actionCount}>{formatCount(item.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
            onPress={() => handleShare(item.id)}
          >
            <View style={styles.actionIcon}>
              <MaterialIcons name="share" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>{formatCount(item.shares)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.soundButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <View style={styles.soundIcon}>
              <MaterialIcons name="music-note" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.soundWave}>
              <View style={styles.soundBar} />
              <View style={[styles.soundBar, { height: 20 }]} />
              <View style={[styles.soundBar, { height: 15 }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {index === currentVideoIndex && loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* No pause overlay - videos auto-play on scroll */}
    </View>
  );

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleVideoPress = () => {
    // Toggle pause/resume on tap using state management
    const newPausedState = !pausedVideos[currentVideoIndex];
    setPausedVideos(prev => ({
      ...prev,
      [currentVideoIndex]: newPausedState,
    }));

    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      currentVideo.setNativeProps({ paused: newPausedState });
      logger.info(
        `Video ${currentVideoIndex} tapped - ${
          newPausedState ? 'paused' : 'playing'
        }`,
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={mockShorts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={screenHeight}
        snapToAlignment="start"
        bounces={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        updateCellsBatchingPeriod={50}
        legacyImplementation={false}
        disableVirtualization={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  videoTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 80,
  },
  topInfo: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  creatorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoInfo: {
    paddingHorizontal: 16,
    marginBottom: 80,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  likedIcon: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  soundButton: {
    alignItems: 'center',
  },
  soundIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    gap: 2,
  },
  soundBar: {
    width: 3,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
});

export default Shorts;
