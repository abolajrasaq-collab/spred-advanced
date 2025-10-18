import { useState, useEffect } from 'react';

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
  Platform,
  SafeAreaView,
} from 'react-native';
import Video from 'react-native-video';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import {
  Icon,
  CustomText,
  SimpleVideoPlayer,
  VideoCard,
} from '../../components';
import Dataset from '../../MockData/Dataset';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { cleanMovieTitle } from '../../helpers/utils';
import {
  getDataJson,
  storeDataJson,
} from '../../../src/helpers/api/Asyncstorage';

// Text constants to avoid string literals in JSX
const TEXT_CONSTANTS = {
  CHECKING_VIDEO: 'Checking video file...',
  AVAILABLE_OFFLINE: 'Available Offline',
  NO_VIEW_TRACKING: 'No view tracking',
  DOWNLOADED: 'Downloaded',
  YOU_MAY_ALSO_LIKE: 'You May Also Like',
} as const;
const PlayDownloadedVideos = props => {
  const [isVideoPaused, setIsVideoPaused] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [allVideos, setAllVideos] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  // Extract video metadata from file path
  const movie = props.route.params?.movie;
  const [videoPath, setVideoPath] = useState('');
  const [videoUri, setVideoUri] = useState('');
  const [fileExists, setFileExists] = useState(false);

  // Check if movie data is valid
  useEffect(() => {
    if (!movie || !movie.path) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Invalid movie data received:', movie);
      Alert.alert(
        'Error',
        'Invalid video data. Please go back and try again.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      return;
    }
  }, [movie]);

  // Generate proper video URI for platform
  const generateVideoUri = (filePath: string): string => {
    if (!filePath) {
      return '';
    }

    // For Android, ensure proper file:// protocol
    if (Platform.OS === 'android') {
      // Remove any existing protocol
      const cleanPath = filePath.replace(/^file:\/\//, '');
      return `file://${cleanPath}`;
    }

    // For iOS, use the file path directly
    return Platform.OS === 'ios' ? filePath : `file://${filePath}`;
  };

  // Extract title from filename
  const getVideoTitle = () => {
    if (!videoPath) {
      return 'Downloaded Video';
    }
    const filename =
      videoPath.split('/').pop()?.split('\\').pop() || 'Downloaded Video';
    const titleWithoutExt = filename.replace(
      /\.(mp4|mov|avi|mkv|flv|webm)$/i,
      '',
    );
    return cleanMovieTitle(titleWithoutExt);
  };

  // Extract year from file metadata or filename
  const getVideoYear = () => {
    const yearMatch = videoPath.match(/(19|20)\d{2}/);
    return yearMatch ? yearMatch[0] : '2024';
  };

  // Extract genre from filename or default
  const getVideoGenre = () => {
    const title = getVideoTitle().toLowerCase();
    if (title.includes('action')) {
      return 'Action';
    }
    if (title.includes('comedy')) {
      return 'Comedy';
    }
    if (title.includes('drama')) {
      return 'Drama';
    }
    if (title.includes('horror')) {
      return 'Horror';
    }
    if (title.includes('thriller')) {
      return 'Thriller';
    }
    return 'General';
  };

  // Generate video key for sharing (use file path or unique identifier)
  const getVideoKey = () => {
    const title = getVideoTitle();
    return (
      movie?.path ||
      videoPath ||
      `downloaded_${Date.now()}_${title.replace(/\s+/g, '_')}`
    );
  };

  const videoTitle = getVideoTitle();
  const videoYear = getVideoYear();
  const videoGenre = getVideoGenre();
  const videoKey = getVideoKey();

  const handleVideoPress = () => {
    setIsVideoPaused(false);
  };

  // handleSpredPress function removed to prevent crashes

  const RecommendedMovies = Dataset.filter(item => Number(item.key) < 5);

  // Video load handler
  const handleVideoLoad = (data: any) => {
    const duration = data.duration;

    // Handle invalid duration values
    if (!isNaN(duration) && isFinite(duration) && duration > 0) {
      setVideoDuration(duration);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Downloaded video loaded with valid duration:', duration);
    } else if (duration < 0) {
      // For negative durations (like -0.001), try using absolute value
      const absDuration = Math.abs(duration);
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '⚠️ Negative duration detected, using absolute value:',
      //   absDuration,
      // );
      setVideoDuration(absDuration > 0 ? absDuration : null);
    } else {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Invalid duration detected:', duration);
      setVideoDuration(null);
    }

    setVideoLoading(false);
    // DISABLED FOR PERFORMANCE
    // console.log('✅ Downloaded video loaded:', data);
  };

  const handleVideoError = (error: any) => {
    setVideoLoading(false);
    // DISABLED FOR PERFORMANCE
    // console.log('❌ Video playback error:', error);
    // DISABLED FOR PERFORMANCE
    // console.log('📁 File path:', videoPath);
    // DISABLED FOR PERFORMANCE
    // console.log('📱 URI that failed:', videoUri);
    // DISABLED FOR PERFORMANCE
    // console.log('🔧 Platform:', Platform.OS);

    Alert.alert(
      'Video Playback Error',
      'Failed to load the video file. This may be due to:\n\n• Corrupted video file\n• Unsupported video format\n• File access permissions\n• Invalid file path\n\nWould you like to try again?',
      [
        {
          text: 'Go Back',
          onPress: () => navigation.goBack(),
          style: 'cancel',
        },
        {
          text: 'Retry',
          onPress: () => {
            setVideoLoading(true);
            setFileExists(false);
            setVideoPath('');
            setVideoUri('');
            validateVideoPath();
          },
        },
      ],
    );
  };

  // Format duration helper
  const formatDuration = (seconds: number | null) => {
    if (!seconds || !isFinite(seconds) || seconds <= 0) {
      return 'Unknown';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Validate and set video path
  const validateVideoPath = async () => {
    try {
      // Additional safety check for movie object
      if (!movie) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Movie object is undefined');
        Alert.alert('Error', 'No video data available.');
        setVideoLoading(false);
        return;
      }

      const rawPath = movie.path || '';
      // DISABLED FOR PERFORMANCE
      // console.log('🎬 Raw video path:', rawPath);

      if (!rawPath) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ No video path provided');
        Alert.alert('Error', 'No video path found.');
        setVideoLoading(false);
        return;
      }

      // Check if file exists
      const exists = await RNFS.exists(rawPath);
      // DISABLED FOR PERFORMANCE
      // console.log('📁 File exists:', exists, 'at path:', rawPath);

      if (!exists) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Video file not found:', rawPath);
        Alert.alert(
          'File Not Found',
          'The video file could not be found. It may have been deleted or moved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        setVideoLoading(false);
        return;
      }

      // Check file stats to ensure it's not empty
      const fileStats = await RNFS.stat(rawPath);
      // DISABLED FOR PERFORMANCE
      // console.log('📊 File stats:', {
      //   size: fileStats.size,
      //   isFile: fileStats.isFile(),
      //   path: rawPath,
      // });

      if (fileStats.size === 0) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Video file is empty:', rawPath);
        Alert.alert(
          'Error',
          'The video file appears to be corrupted or empty.',
        );
        setVideoLoading(false);
        return;
      }

      // Set the validated path and URI
      const generatedUri = generateVideoUri(rawPath);
      setVideoPath(rawPath);
      setVideoUri(generatedUri);
      setFileExists(true);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Video path validated successfully');
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Video URI generated:', generatedUri);
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Platform:', Platform.OS);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error validating video path:', error);
      Alert.alert(
        'Error',
        'Failed to access the video file. Please check if the file exists.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      setVideoLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchWatchLater();
      if (movie?.path) {
        await validateVideoPath();
      }
    };

    initializeData();
  }, [movie?.path]);

  const fetchWatchLater = async () => {
    try {
      const data = await getDataJson('WatchLater');
      setWatchLater((data as any[]) || []);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error fetching watch later data:', error);
      setWatchLater([]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      {/* Video Player Section - Separate from content */}
      <View style={{ paddingTop: 0 }}>
        {/* Floating Back Button - only show when not in fullscreen */}
        {!isFullscreen && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: 'absolute',
              top: spacing.md,
              left: spacing.md,
              width: 40,
              height: 40,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {!fileExists || !videoUri ? (
          <View
            style={{
              width: '100%',
              height: 220,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#2A2A2A',
            }}
          >
            <ActivityIndicator size="large" color="#F45303" />
            <CustomText
              fontSize={14}
              color="#CCCCCC"
              style={{ marginTop: spacing.sm }}
            >
              {TEXT_CONSTANTS.CHECKING_VIDEO}
            </CustomText>
          </View>
        ) : (
          <SimpleVideoPlayer
            source={{
              uri: videoUri,
              type: 'mp4',
              isNetwork: false,
            }}
            style={{
              width: '100%',
              height: 220,
              backgroundColor: '#000',
            }}
            paused={isVideoPaused}
            onPlayPause={setIsVideoPaused}
            onFullscreenChange={(fullscreen) => {
              setIsFullscreen(fullscreen);
            }}
            resizeMode="contain"
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onLoadStart={() => {
              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '🎬 Downloaded video load started for URI:',
              //   videoUri,
              // );
              // DISABLED FOR PERFORMANCE
              // console.log('🎬 Video source type: local file');
            }}
            onBuffer={data => {
              // DISABLED FOR PERFORMANCE
              // console.log('📊 Downloaded video buffering:', data);
            }}
          />
        )}
      </View>

      {/* Content Below Video - Only show when not in fullscreen */}
      {!isFullscreen && (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl, paddingTop: 0 }}
        >

        {/* Video Info Section */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          {/* Video Title */}
          <CustomText
            fontSize={24}
            fontWeight="700"
            color="#FFFFFF"
            style={{ marginBottom: spacing.sm, lineHeight: 32 }}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {videoTitle}
          </CustomText>

          {/* Video Metadata */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <CustomText
              fontSize={14}
              color="#CCCCCC"
              style={{ marginRight: spacing.md }}
            >
              {videoYear} • Duration: {formatDuration(videoDuration)}
            </CustomText>
            <CustomText fontSize={14} color="#CCCCCC">
              {videoGenre}
            </CustomText>
          </View>

          {/* Video Engagement Metrics */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.lg,
              paddingHorizontal: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name="visibility"
                size={16}
                color="#4CAF50"
                style={{ marginRight: 6 }}
              />
              <View>
                <CustomText fontSize={12} color="#4CAF50" fontWeight="600">
                  {TEXT_CONSTANTS.AVAILABLE_OFFLINE}
                </CustomText>
                <CustomText fontSize={10} color="#8B8B8B">
                  {TEXT_CONSTANTS.NO_VIEW_TRACKING}
                </CustomText>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name="check-circle"
                size={16}
                color="#F45303"
                style={{ marginRight: 6 }}
              />
              <CustomText fontSize={12} color="#F45303" fontWeight="600">
                {TEXT_CONSTANTS.DOWNLOADED}
              </CustomText>
            </View>
          </View>

          {/* Action Buttons - SPRED VIDEO button removed to prevent crashes */}
        </View>

        {/* Recommendations Section */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <CustomText
            fontSize={18}
            fontWeight="700"
            color="#FFFFFF"
            style={{ marginBottom: spacing.lg }}
          >
            {TEXT_CONSTANTS.YOU_MAY_ALSO_LIKE}
          </CustomText>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={RecommendedMovies}
            keyExtractor={item =>
              item.key?.toString() || Math.random().toString()
            }
            contentContainerStyle={{
              paddingHorizontal: 0,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.key}
                onPress={() =>
                  navigation.navigate('PlayVideos', {
                    item: item as any,
                  })
                }
                style={{ marginRight: spacing.md }}
              >
                <Image
                  source={item.src}
                  style={{
                    width: 120,
                    height: 180,
                    resizeMode: 'cover',
                    borderRadius: 8,
                  }}
                />
                <CustomText
                  fontSize={12}
                  color="#FFFFFF"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{ marginTop: spacing.xs, maxWidth: 120 }}
                >
                  {cleanMovieTitle(item.title || (item as any).name || 'Movie')}
                </CustomText>
              </TouchableOpacity>
            )}
          />
        </View>
        </ScrollView>
      )}
    </View>
  );
};

export default PlayDownloadedVideos;
