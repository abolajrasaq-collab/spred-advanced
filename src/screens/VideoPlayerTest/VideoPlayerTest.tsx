import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useOrientation } from '../../hooks/useOrientation';
import FullscreenVideoPlayer from '../../components/FullscreenVideoPlayer/FullscreenVideoPlayer';
import { useFullscreenVideo } from '../../contexts/FullscreenVideoContext';
// Import TouchableOpacity for optimized touch interactions
// import TouchableOpacity from '../../components/TouchableOpacity/TouchableOpacity';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayerTest: React.FC = () => {
  const navigation = useNavigation();
  const { lockToPortrait, lockToLandscape } = useOrientation();
  const { enterFullscreen } = useFullscreenVideo();

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<Video>(null);

  // Sanitize video source to prevent requestHeaders errors
  const sanitizedSource = React.useMemo(() => {
    if (!selectedVideo) {
      return { uri: '' };
    }
    // Ensure clean source object without problematic headers
    return { uri: selectedVideo };
  }, [selectedVideo]);

  // Test video sources
  const testVideos = [
    {
      id: '1',
      name: 'Sample Video 1',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'remote',
    },
    {
      id: '2',
      name: 'Sample Video 2',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      type: 'remote',
    },
  ];

  const selectVideo = (video: any) => {
    setSelectedVideo(video.uri);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const handleFullscreen = () => {
    if (selectedVideo) {
      enterFullscreen({ uri: selectedVideo });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityHint="Navigate to previous screen"
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Player Test</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Test Video</Text>
          {testVideos.map(video => (
            <TouchableOpacity
              key={video.id}
              style={[
                styles.videoOption,
                selectedVideo === video.uri && styles.selectedVideoOption,
              ]}
              onPress={() => selectVideo(video)}
              accessibilityLabel={`Select ${video.name} video`}
              accessibilityHint={`Play ${video.name} test video`}
            >
              <Text style={styles.videoOptionText}>{video.name}</Text>
              <Text style={styles.videoOptionSubtext}>{video.type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Video Player */}
        {selectedVideo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Video Player</Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={sanitizedSource}
                style={styles.video}
                paused={!isPlaying}
                controls={false}
                resizeMode="contain"
                onLoad={handleLoad}
                onProgress={handleProgress}
                onError={error => {
                  // DISABLED FOR PERFORMANCE
                  // console.log('Video error:', error);
                  Alert.alert('Video Error', 'Failed to load video');
                }}
                repeat={false}
              />

              {/* Custom Controls */}
              <View style={styles.controlsOverlay}>
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={togglePlayback}
                  accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
                  accessibilityHint="Toggle video playback"
                >
                  <Icon
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={40}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={handleFullscreen}
                  accessibilityLabel="Enter fullscreen"
                  accessibilityHint="Make video fullscreen"
                >
                  <Icon name="fullscreen" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Test Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Instructions</Text>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instruction}>
              1. Select a test video from the options above
            </Text>
            <Text style={styles.instruction}>
              2. Use the play/pause button to control playback
            </Text>
            <Text style={styles.instruction}>
              3. Tap fullscreen button to test fullscreen mode
            </Text>
            <Text style={styles.instruction}>
              4. Check if bottom navigation hides in fullscreen
            </Text>
            <Text style={styles.instruction}>
              5. Test orientation changes and video resizing
            </Text>
          </View>
        </View>

        {/* Features Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features to Test</Text>
          <View style={styles.featuresContainer}>
            <Text style={styles.feature}>✅ Video Loading</Text>
            <Text style={styles.feature}>✅ Custom Controls</Text>
            <Text style={styles.feature}>✅ Progress Tracking</Text>
            <Text style={styles.feature}>✅ Fullscreen Mode</Text>
            <Text style={styles.feature}>✅ Orientation Handling</Text>
            <Text style={styles.feature}>✅ Navigation Hiding</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  videoOption: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVideoOption: {
    borderColor: '#F45303',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
  },
  videoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoOptionSubtext: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 4,
  },
  videoContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 15,
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
  },
  progressContainer: {
    backgroundColor: '#1A1A1A',
    padding: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  feature: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 6,
  },
});

export default VideoPlayerTest;
