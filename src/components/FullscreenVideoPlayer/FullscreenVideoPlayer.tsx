import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  BackHandler,
} from 'react-native';
import Video from 'react-native-video';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useOrientation } from '../../hooks/useOrientation';
import { useFullscreenVideo } from '../../contexts/FullscreenVideoContext';

interface FullscreenVideoPlayerProps {
  source: any;
  style?: any;
  paused?: boolean;
  onPlayPause?: (paused: boolean) => void;
  onLoad?: (data: any) => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onBuffer?: (data: any) => void;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  headers?: any;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const FullscreenVideoPlayer: React.FC<FullscreenVideoPlayerProps> = ({
  source,
  style,
  paused = true,
  onPlayPause,
  onLoad,
  onError,
  onLoadStart,
  onBuffer,
  resizeMode = 'contain',
  headers,
  onFullscreenChange,
}) => {
  const [isVideoPaused, setIsVideoPaused] = useState(paused);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { enterFullscreen } = useFullscreenVideo();

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    setIsVideoPaused(paused);
  }, [paused]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && !isVideoPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isVideoPaused]);

  const toggleFullscreen = useCallback(() => {
    // Trigger global fullscreen player instead of local fullscreen
    enterFullscreen(source);
    onFullscreenChange?.(true);
  }, [enterFullscreen, source, onFullscreenChange]);

  const togglePlayPause = () => {
    const newPausedState = !isVideoPaused;
    setIsVideoPaused(newPausedState);
    onPlayPause?.(newPausedState);
    setShowControls(true);
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const handleLoad = (data: any) => {
    setIsLoading(false);
    onLoad?.(data);
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    onError?.(error);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const containerStyle = style;
  const videoStyle = { flex: 1 };

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <Video
          key={`video-${videoKey}`}
          ref={videoRef}
          source={source}
          style={videoStyle}
          paused={isVideoPaused}
          controls={false}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={handleLoadStart}
          onBuffer={onBuffer}
          repeat={false}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          {...(headers && { headers })}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Custom controls overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Play/Pause button */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <Icon
                name={isVideoPaused ? 'play-arrow' : 'pause'}
                size={40}
                color="#fff"
              />
            </TouchableOpacity>

            {/* Fullscreen toggle button */}
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={toggleFullscreen}
            >
              <Icon name="fullscreen" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 15,
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
  },
  exitFullscreenButton: {
    bottom: 30,
    right: 30,
  },
});

export default FullscreenVideoPlayer;
