import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  Platform,
  NativeModules,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Orientation from 'react-native-orientation-locker';
import { useOrientation } from '../../hooks/useOrientation';
import { UserMetricsService } from '../../services/UserMetricsService';
import SystemUI from '../../native/SystemUIModule';

interface SimpleVideoPlayerProps {
  source: any;
  style?: any;
  paused?: boolean;
  onPlayPause?: (paused: boolean) => void;
  onLoad?: (data: any) => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onBuffer?: (data: any) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  source,
  style,
  paused = true,
  onPlayPause,
  onLoad,
  onError,
  onLoadStart,
  onBuffer,
  onFullscreenChange,
  resizeMode = 'contain',
}) => {
  // Sanitize source prop to prevent requestHeaders errors
  const sanitizedSource = React.useMemo(() => {
    if (!source || typeof source !== 'object') {
      return { uri: '' };
    }

    // Ensure source has the correct structure and remove any problematic headers
    const cleanSource: any = { uri: source.uri || '' };

    // Only include valid headers if they exist and are properly formatted
    if (source.headers && typeof source.headers === 'object' && !Array.isArray(source.headers)) {
      cleanSource.headers = source.headers;
    }

    // Remove any requestHeaders that might be arrays (causing the error)
    if (cleanSource.requestHeaders && Array.isArray(cleanSource.requestHeaders)) {
      delete cleanSource.requestHeaders;
    }

    // Debug: Log the sanitized source
    console.log('🎬 [SimpleVideoPlayer] Source received:', source);
    console.log('🎬 [SimpleVideoPlayer] Sanitized source:', cleanSource);

    return cleanSource;
  }, [source]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(paused);
  const [showControls, setShowControls] = useState(true);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [fullscreenResizeMode, setFullscreenResizeMode] = useState<
    'contain' | 'cover' | 'stretch'
  >('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<Video>(null);
  const hasLoadedRef = useRef(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownTime = useRef(0);
  const justEnteredFullscreenRef = useRef(false);

  // Use enhanced orientation hook
  const { isLandscape, unlockAllOrientations } = useOrientation();

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 600;

  // Responsive progress bar width
  const getProgressWidth = () => {
    if (isSmallScreen) {
      return screenWidth - 160;
    }
    if (isMediumScreen) {
      return screenWidth - 180;
    }
    return screenWidth - 200;
  };

  const getFullscreenProgressWidth = () => {
    if (isSmallScreen) {
      return screenWidth - 120;
    }
    return screenWidth - 140;
  };

  const [progressWidth, setProgressWidth] = useState(getProgressWidth());
  const fullscreenProgressWidth = getFullscreenProgressWidth();

  // Dynamic dimension handling for responsive fullscreen
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Responsive control sizes
  const getControlButtonSize = () => {
    if (isSmallScreen) {
      return 40;
    }
    return 48;
  };

  const getControlIconSize = () => {
    if (isSmallScreen) {
      return 20;
    }
    return 24;
  };

  // Duration retry logic for downloaded videos
  const [durationRetryCount, setDurationRetryCount] = useState(0);
  const maxDurationRetries = 3;
  const durationRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle video progress
  const onProgress = (data: any) => {
    if (
      !isSeeking &&
      data &&
      typeof data.currentTime === 'number' &&
      !isNaN(data.currentTime)
    ) {
      console.log('🎬 Progress update:', {
        currentTime: data.currentTime,
        duration,
        progressWidth,
        isVideoPaused
      });
      setCurrentTime(data.currentTime);
      lastKnownTime.current = data.currentTime;

      // If duration is not set and we have progress data, try to get it from there
      if (
        (duration <= 0 || !isFinite(duration) || duration < 0) &&
        data.seekableDuration &&
        data.seekableDuration > 0
      ) {
        setDuration(data.seekableDuration);
      }

      // Debug progress - use fallback duration if current duration is invalid
      let effectiveDuration = duration > 0 ? duration : (data.seekableDuration || 0);
      
      // If still no valid duration, use a fallback based on current time
      if (effectiveDuration <= 0 && data.currentTime > 0) {
        // Estimate duration as 1.5x current time as a reasonable fallback
        effectiveDuration = data.currentTime * 1.5;
      }
      
      if (effectiveDuration > 0) {
        const progressPercent = (data.currentTime / effectiveDuration) * 100;

        // Track watch time every 30 seconds
        const watchTimeMinutes = Math.floor(data.currentTime / 60);
        if (watchTimeMinutes > 0 && watchTimeMinutes % 0.5 === 0) {
          // Every 30 seconds
          UserMetricsService.updateWatchTime(watchTimeMinutes);
        }

        // Track video completion (80% watched)
        if (progressPercent >= 80 && !hasLoadedRef.current) {
          hasLoadedRef.current = true; // Prevent multiple calls
          const durationMinutes = Math.floor(effectiveDuration / 60);
          UserMetricsService.updateVideoWatched(durationMinutes);
        }
      }
    }
  };

  // Retry duration detection after a delay
  const retryDurationDetection = () => {
    if (durationRetryCount < maxDurationRetries) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   `🔄 Retrying duration detection (${
      //     durationRetryCount + 1
      //   }/${maxDurationRetries})`,
      // );
      setDurationRetryCount(prev => prev + 1);

      // Clear any existing timeout
      if (durationRetryTimeoutRef.current) {
        clearTimeout(durationRetryTimeoutRef.current);
      }

      // Retry after 1 second
      durationRetryTimeoutRef.current = setTimeout(() => {
        // Manual duration check - getCurrentTime method doesn't exist in current react-native-video
        // DISABLED FOR PERFORMANCE
        // console.log('🎯 Manual duration check - retrying...');
      }, 1000);
    }
  };

  // Handle video load
  const onLoadData = (data: any) => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📹 Video load event received');
      // DISABLED FOR PERFORMANCE - console.('📹 Load data object:', JSON.stringify(data, null, 2));

      // Process video load normally since we only have one video component
      if (data && typeof data === 'object' && data.duration !== undefined) {
        const duration = data.duration;
        // DISABLED FOR PERFORMANCE
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '📹 Raw duration value:',
        //   duration,
        //   'Type:',
        //   typeof duration,
        // );

        if (!isNaN(duration) && isFinite(duration) && duration > 0) {
          setDuration(duration);
          hasLoadedRef.current = true;
          setDurationRetryCount(0); // Reset retry count on success
          onLoad?.(data);
        } else {
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '🎬 Video loaded with invalid duration:',
          //   duration,
          //   'isNaN:',
          //   isNaN(duration),
          //   'isFinite:',
          //   isFinite(duration),
          //   'duration > 0:',
          //   duration > 0,
          // );

          // For downloaded videos, the duration might not be immediately available
          // Try to retry detection for local files
          if (
            source?.isNetwork === false &&
            durationRetryCount < maxDurationRetries
          ) {
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '...',
            // );
            retryDurationDetection();
          }

          setDuration(Math.abs(duration) || 0); // Use absolute value as fallback
          hasLoadedRef.current = true;
          onLoad?.(data);
        }
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '🎬 Video loaded without duration data. Data type:',
        //   typeof data,
        //   'Has duration:',
        //   data?.duration !== undefined,
        // );

        // For downloaded videos without duration, try to get it later
        if (
          source?.isNetwork === false &&
          durationRetryCount < maxDurationRetries
        ) {
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '...',
          // );
          retryDurationDetection();
        }

        setDuration(0);
        hasLoadedRef.current = true;
        onLoad?.(data);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Error in onLoadData:', error?.message || 'Unknown error');
      setDuration(0);
      hasLoadedRef.current = true;
      onLoad?.(data);
    }
  };

  // Seek to specific time
  const onSeek = (seekTime: number) => {
    // DISABLED FOR PERFORMANCE
    // console.log('🎯 Seeking to position:', seekTime);
    setCurrentTime(seekTime);
    lastKnownTime.current = seekTime;

    // Seek the video component
    try {
      videoRef.current?.seek(seekTime);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Video seek error:', error?.message);
    }
  };

  // Handle timeline touch
  const handleTimelineTouch = (event: any) => {
    const touchX = event.nativeEvent.locationX;
    const progressBarWidth = progressWidth;
    const progress = Math.max(0, Math.min(1, touchX / progressBarWidth));
    const seekTime = progress * (duration || 0);

    // DISABLED FOR PERFORMANCE
    // DISABLED FOR PERFORMANCE
    // console.log('🎯 Timeline Touch Debug:', {
    //   touchX,
    //   progressBarWidth,
    //   progress,
    //   duration,
    //   seekTime,
    //   currentTime,
    // });

    // Only seek if we have a valid duration
    if (duration > 0) {
      onSeek(seekTime);
    } else {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Cannot seek: duration is 0 or undefined');
    }
  };

  // PanResponder completely removed to prevent gesture handler issues

  // Auto-hide fullscreen controls with improved timing
  useEffect(() => {
    console.log('🎛️ Fullscreen controls state:', {
      showFullscreenControls,
      isFullscreen,
      isVideoPaused,
      justEnteredFullscreen: justEnteredFullscreenRef.current
    });

    // Don't auto-hide immediately when entering fullscreen (give user 1 second to see controls)
    if (showFullscreenControls && isFullscreen && !isVideoPaused && !justEnteredFullscreenRef.current) {
      console.log('⏰ Setting auto-hide timeout for fullscreen controls (5s)');
      controlsTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-hiding fullscreen controls');
        setShowFullscreenControls(false);
      }, 5000); // Increased to 5 seconds for better UX
    }

    // Reset the "just entered" flag after a short delay
    if (justEnteredFullscreenRef.current) {
      const timer = setTimeout(() => {
        justEnteredFullscreenRef.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showFullscreenControls, isFullscreen, isVideoPaused]);

  // Handle orientation changes for better fullscreen experience
  useEffect(() => {
    if (isFullscreen) {
      // Update video dimensions when orientation changes
      const dimensions = getVideoDimensions();
      // DISABLED FOR PERFORMANCE
      // console.log('🔄 Orientation changed in fullscreen:', {
      //   isLandscape,
      //   screenWidth,
      //   screenHeight,
      //   dimensions,
      // });

      // Force video to resize properly on orientation change
      setTimeout(() => {
        // DISABLED FOR PERFORMANCE
        // console.log('🔄 Forcing video resize after orientation change');
      }, 100);
    }
  }, [isLandscape, isFullscreen, screenWidth, screenHeight]);

  // Handle fullscreen state changes
  useEffect(() => {
    if (isFullscreen) {
      console.log('🎥 Entering fullscreen mode - hiding system UI');
      StatusBar.setHidden(true, 'fade');

      // Hide system UI for true fullscreen on Android
      if (Platform.OS === 'android') {
        try {
          console.log('📱 Android: Calling SystemUI.hideSystemUI()');
          SystemUI.hideSystemUI();
        } catch (error) {
          console.log('⚠️ Error entering immersive fullscreen:', error);
        }
      }
    } else {
      console.log('🎥 Exiting fullscreen mode - showing system UI');
      StatusBar.setHidden(false, 'fade');

      // Restore system UI on Android
      if (Platform.OS === 'android') {
        try {
          console.log('📱 Android: Calling SystemUI.showSystemUI()');
          SystemUI.showSystemUI();
        } catch (error) {
          console.log('⚠️ Error restoring system UI:', error);
        }
      }
    }
  }, [isFullscreen, onFullscreenChange]);

  // Sync paused state with props to prevent video reloading
  useEffect(() => {
    setIsVideoPaused(paused);
  }, [paused]);

  // Reset load state when source changes
  useEffect(() => {
    // DISABLED FOR PERFORMANCE
    // console.log('🔄 Source changed, resetting load state:', source?.uri);
    hasLoadedRef.current = false;
    setDuration(0);
    setCurrentTime(0);
    lastKnownTime.current = 0;
    setDurationRetryCount(0); // Reset retry count

    // Clear any existing retry timeout
    if (durationRetryTimeoutRef.current) {
      clearTimeout(durationRetryTimeoutRef.current);
      durationRetryTimeoutRef.current = null;
    }
  }, [source?.uri]);

  // Cleanup timeout and system UI on unmount
  useEffect(() => {
    return () => {
      if (durationRetryTimeoutRef.current) {
        clearTimeout(durationRetryTimeoutRef.current);
      }
      // Reset orientation to portrait when component unmounts
      try {
        unlockAllOrientations();
        StatusBar.setHidden(false);

        // Restore system UI on Android
        if (Platform.OS === 'android') {
          try {
            console.log('🧹 Component unmounting - restoring system UI');
            SystemUI.showSystemUI();
          } catch (error) {
            console.log('⚠️ Error restoring system UI on unmount:', error);
          }
        }
      } catch (error) {
        console.log('⚠️ Error unlocking orientations on unmount:', error);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    // DISABLED FOR PERFORMANCE
    // console.log('🔄 Toggle fullscreen - seamless transition');

    if (isFullscreen) {
      // Exit fullscreen
      setIsFullscreen(false);
      setShowFullscreenControls(true);
      onFullscreenChange?.(false);
      justEnteredFullscreenRef.current = false; // Reset the flag

      // Unlock orientations when exiting fullscreen
      setTimeout(() => {
        try {
          unlockAllOrientations();
          // DISABLED FOR PERFORMANCE
          // console.log('🔄 Unlocked all orientations when exiting fullscreen');
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error unlocking orientations:', error);
        }
      }, 100);
    } else {
      // Enter fullscreen - automatically rotate to landscape
      setIsFullscreen(true);
      setShowFullscreenControls(true);
      onFullscreenChange?.(true);
      justEnteredFullscreenRef.current = true; // Mark that we just entered fullscreen

      // Auto-rotate to landscape for better fullscreen experience
      setTimeout(() => {
        try {
          Orientation.lockToLandscape();
          // DISABLED FOR PERFORMANCE
          // console.log('🔄 Auto-rotated to landscape for fullscreen');

          // Additional delay to ensure orientation lock takes effect
          setTimeout(() => {
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '...',
            // );
            // Force component update to ensure video fills screen properly with proper aspect ratio
            setFullscreenResizeMode('contain');
            // Force video component to re-render completely
            setVideoKey(prev => prev + 1);
          }, 300);
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error rotating to landscape:', error);
          // Fallback to unlocking all orientations
          unlockAllOrientations();
        }
      }, 100);
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    // Hide controls after 4 seconds for better UX
    setTimeout(() => {
      if (!isVideoPaused) {
        setShowControls(false);
      }
    }, 4000);
  };

  const handleFullscreenVideoPress = () => {
    console.log('👆 Fullscreen screen tapped - toggling controls');
    console.log('👆 Current showFullscreenControls:', showFullscreenControls);
    setShowFullscreenControls(!showFullscreenControls);
  };

  // Double tap to toggle fullscreen (only in regular mode)
  const handleDoubleTap = () => {
    if (!isFullscreen) {
      toggleFullscreen();
    }
  };

  // Enhanced play/pause with better state management
  const togglePlayPause = () => {
    const newPausedState = !isVideoPaused;
    setIsVideoPaused(newPausedState);
    onPlayPause?.(newPausedState);

    // Show controls when toggling play/pause
    if (isFullscreen) {
      setShowFullscreenControls(true);
    } else {
      setShowControls(true);
    }
  };

  const cycleResizeMode = () => {
    const modes: ('contain' | 'cover' | 'stretch')[] = [
      'contain',
      'cover',
      'stretch',
    ];
    const currentIndex = modes.indexOf(fullscreenResizeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFullscreenResizeMode(modes[nextIndex]);
  };

  const getResizeModeIcon = () => {
    switch (fullscreenResizeMode) {
      case 'contain':
        return 'fit-screen'; // Fit - shows content within bounds
      case 'cover':
        return 'crop-free'; // Crop - fills screen, may crop content
      case 'stretch':
        return 'aspect-ratio'; // Stretch - distorts to fill
      default:
        return 'fit-screen';
    }
  };

  const getResizeModeLabel = () => {
    switch (fullscreenResizeMode) {
      case 'contain':
        return 'FIT';
      case 'cover':
        return 'CROP';
      case 'stretch':
        return 'STRETCH';
      default:
        return 'FIT';
    }
  };

  // Get current dimensions based on orientation and fullscreen state
  const getVideoDimensions = () => {
    if (isFullscreen) {
      return {
        width: dimensions.width,
        height: dimensions.height,
      };
    }
    return { width: '100%', height: '100%' };
  };

  // Regular mode controls
  const regularControls = showControls && (
    <View style={styles.controlsOverlay}>
      <View style={styles.controlsContainer}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              width: getControlButtonSize(),
              height: getControlButtonSize(),
              borderRadius: getControlButtonSize() / 2,
            },
          ]}
          onPress={togglePlayPause}
        >
          <Icon
            name={isVideoPaused ? 'play-arrow' : 'pause'}
            size={getControlIconSize()}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Timeline Bar */}
        <TouchableOpacity
          style={[
            styles.progressBarContainer,
            {
              height: isSmallScreen ? 36 : 44,
              marginHorizontal: isSmallScreen ? 6 : 8,
              paddingVertical: isSmallScreen ? 12 : 16,
            },
          ]}
          activeOpacity={0.9}
          onPress={event => {
            // DISABLED FOR PERFORMANCE
            // console.log('🎯 Timeline TouchableOpacity pressed');
            handleTimelineTouch(event);
          }}
          onLayout={event => {
            const { width } = event.nativeEvent.layout;
            // DISABLED FOR PERFORMANCE
            // console.log(`Timeline container width: ${width}`);
            setProgressWidth(width);
          }}
        >
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: (() => {
                    let effectiveDuration = duration > 0 ? duration : 0;
                    if (effectiveDuration <= 0 && currentTime > 0) {
                      effectiveDuration = currentTime * 1.5; // Fallback estimation
                    }
                    const calculatedWidth =
                      effectiveDuration > 0 && progressWidth > 0
                        ? (currentTime / effectiveDuration) * progressWidth
                        : 0;
                    return calculatedWidth;
                  })(),
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.progressThumb,
              {
                width: isSmallScreen ? 12 : 16,
                height: isSmallScreen ? 12 : 16,
                borderRadius: isSmallScreen ? 6 : 10,
                top: isSmallScreen ? 12 : 14,
                left:
                  progressWidth > 0
                    ? (() => {
                        let effectiveDuration = duration > 0 ? duration : 0;
                        if (effectiveDuration <= 0 && currentTime > 0) {
                          effectiveDuration = currentTime * 1.5; // Fallback estimation
                        }
                        const calculatedLeft = effectiveDuration > 0 ? Math.max(0, (currentTime / effectiveDuration) * progressWidth - (isSmallScreen ? 6 : 8)) : 0;
                        console.log('🎯 Regular thumb debug:', {
                          currentTime,
                          effectiveDuration,
                          progressWidth,
                          calculatedLeft,
                          ratio: effectiveDuration > 0 ? currentTime / effectiveDuration : 0
                        });
                        return calculatedLeft;
                      })()
                    : 0,
              },
            ]}
          />
        </TouchableOpacity>

        {/* Time Display */}
        <Text
          style={[
            styles.timeText,
            {
              fontSize: isSmallScreen ? 12 : 14,
              minWidth: isSmallScreen ? 80 : 100,
              paddingHorizontal: isSmallScreen ? 6 : 8,
              paddingVertical: isSmallScreen ? 2 : 4,
            },
          ]}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>

        {/* Fullscreen Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              width: getControlButtonSize(),
              height: getControlButtonSize(),
              borderRadius: getControlButtonSize() / 2,
            },
          ]}
          onPress={toggleFullscreen}
        >
          <Icon name="fullscreen" size={getControlIconSize()} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Fullscreen mode controls
  console.log('🎛️ Rendering fullscreen controls, showFullscreenControls:', showFullscreenControls);
  const fullscreenControls = showFullscreenControls && (
    <View style={[styles.fullscreenControlsOverlay, { zIndex: 1002, elevation: 1002 }]}>
      <View style={styles.fullscreenControlsContainer}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              width: getControlButtonSize(),
              height: getControlButtonSize(),
              borderRadius: getControlButtonSize() / 2,
            },
          ]}
          onPress={togglePlayPause}
        >
          <Icon
            name={isVideoPaused ? 'play-arrow' : 'pause'}
            size={getControlIconSize()}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Timeline Bar */}
        <TouchableOpacity
          style={styles.fullscreenProgressBarContainer}
          activeOpacity={0.9}
          onPress={event => {
            // DISABLED FOR PERFORMANCE
            // console.log('🎯 Fullscreen Timeline TouchableOpacity pressed');
            handleTimelineTouch(event);
          }}
          onLayout={event => {
            const { width } = event.nativeEvent.layout;
            // DISABLED FOR PERFORMANCE
            // console.log(`Fullscreen timeline container width: ${width}`);
            setProgressWidth(width);
          }}
        >
          <View style={styles.fullscreenProgressBarBackground}>
            <View
              style={[
                styles.fullscreenProgressBarFill,
                {
                  width: (() => {
                    let effectiveDuration = duration > 0 ? duration : 0;
                    if (effectiveDuration <= 0 && currentTime > 0) {
                      effectiveDuration = currentTime * 1.5; // Fallback estimation
                    }
                    const calculatedWidth =
                      effectiveDuration > 0 && progressWidth > 0
                        ? (currentTime / effectiveDuration) * progressWidth
                        : 0;
                    return calculatedWidth;
                  })(),
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.fullscreenProgressThumb,
              {
                left:
                  progressWidth > 0
                    ? (() => {
                        let effectiveDuration = duration > 0 ? duration : 0;
                        if (effectiveDuration <= 0 && currentTime > 0) {
                          effectiveDuration = currentTime * 1.5; // Fallback estimation
                        }
                        const calculatedLeft = effectiveDuration > 0 ? Math.max(0, (currentTime / effectiveDuration) * progressWidth - 10) : 0;
                        console.log('🎯 Fullscreen thumb debug:', {
                          currentTime,
                          effectiveDuration,
                          progressWidth,
                          calculatedLeft,
                          ratio: effectiveDuration > 0 ? currentTime / effectiveDuration : 0
                        });
                        return calculatedLeft;
                      })()
                    : 0,
              },
            ]}
          />
        </TouchableOpacity>

        {/* Time Display */}
        <Text
          style={[
            styles.timeText,
            {
              fontSize: isSmallScreen ? 12 : 14,
              minWidth: isSmallScreen ? 80 : 100,
              paddingHorizontal: isSmallScreen ? 6 : 8,
              paddingVertical: isSmallScreen ? 2 : 4,
            },
          ]}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>

        {/* Exit Fullscreen Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              width: getControlButtonSize(),
              height: getControlButtonSize(),
              borderRadius: getControlButtonSize() / 2,
            },
          ]}
          onPress={toggleFullscreen}
        >
          <Icon
            name="fullscreen-exit"
            size={getControlIconSize()}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Resize Mode Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              width: getControlButtonSize(),
              height: getControlButtonSize(),
              borderRadius: getControlButtonSize() / 2,
            },
          ]}
          onPress={cycleResizeMode}
        >
          <Icon
            name={getResizeModeIcon()}
            size={getControlIconSize()}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Exit button (top right) */}
      <TouchableOpacity style={styles.exitButton} onPress={toggleFullscreen}>
        <Icon name="close" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Single video component with dynamic styling
  const currentVideoComponent = (
    <Video
      key="main-video-player"
      ref={videoRef}
      source={sanitizedSource}
      style={isFullscreen
        ? [styles.fullscreenVideo, {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          }]
        : StyleSheet.absoluteFill
      }
      paused={isVideoPaused}
      controls={false}
      resizeMode={isFullscreen ? fullscreenResizeMode : resizeMode}
      onLoad={onLoadData}
      onError={error => {
        console.log('❌ Video error:', error);
        console.log('📁 Source URI:', sanitizedSource?.uri);
        onError?.(error);
      }}
      onLoadStart={() => {
        console.log('🎬 Video load start:', sanitizedSource?.uri);
        onLoadStart?.();
      }}
      onBuffer={onBuffer}
      onProgress={onProgress}
      repeat={false}
      playInBackground={false}
      playWhenInactive={false}
      ignoreSilentSwitch="ignore"
      preventsDisplaySleepDuringVideoPlayback={isFullscreen}
      reportBandwidth={false}
      useTextureView={false}
      disableFocus={true}
      muted={false}
      posterResizeMode="cover"
      allowsExternalPlayback={false}
      bufferConfig={{
        minBufferMs: 2000,
        maxBufferMs: 8000,
        bufferForPlaybackMs: 500,
        bufferForPlaybackAfterRebufferMs: 1000,
      }}
    />
  );

  // Fullscreen overlay (only render when in fullscreen mode)
  const fullscreenOverlay = isFullscreen ? (
    <View
      style={[
        styles.fullscreenContainer,
        {
          zIndex: 1000,
          elevation: 1000,
        },
      ]}
    >
      {currentVideoComponent}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={handleFullscreenVideoPress}
        activeOpacity={1}
      />
      {fullscreenControls}
    </View>
  ) : null;

  // Choose which controls to render based on mode
  const currentControls = isFullscreen ? fullscreenControls : regularControls;

  // Choose which touch overlay to render based on mode
  const touchOverlay = isFullscreen ? (
    <TouchableOpacity
      style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
      onPress={handleFullscreenVideoPress}
      activeOpacity={1}
    />
  ) : (
    <TouchableOpacity
      onPress={handleVideoPress}
      onLongPress={handleDoubleTap}
      style={StyleSheet.absoluteFill}
      activeOpacity={1}
      delayLongPress={300}
    />
  );

  // Unified component - works seamlessly with both regular and fullscreen modes
  return (
    <View style={[
      style,
      isFullscreen && {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
      },
      { position: 'relative', overflow: 'hidden' }
    ]}>
      {currentVideoComponent}

      {/* Touch handler - works for both modes */}
      <TouchableOpacity
        onPress={isFullscreen ? handleFullscreenVideoPress : handleVideoPress}
        onLongPress={!isFullscreen ? handleDoubleTap : undefined}
        style={StyleSheet.absoluteFill}
        activeOpacity={isFullscreen ? 1 : 1}
        delayLongPress={300}
      />

      {/* Controls - conditionally rendered based on mode */}
      {isFullscreen ? fullscreenControls : regularControls}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  fullscreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: 24, // Ensure controls don't touch screen edge
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4, // Add horizontal margin for better spacing
  },
  progressBarContainer: {
    flex: 1,
    height: 48, // Increased touch target
    justifyContent: 'center',
    marginHorizontal: 12,
    paddingVertical: 18, // Extra padding for easier touching
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#F45303',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16, // Larger thumb for easier dragging
    height: 16,
    backgroundColor: '#F45303',
    borderRadius: 10,
    top: 14, // Centered on progress bar
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeAndFullscreenContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 10,
  },
  fullscreenButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 10,
    zIndex: 1000,
  },
  fullscreenControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 30,
  },
  fullscreenControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
    justifyContent: 'space-between',
    paddingBottom: Math.max(20, 24), // Ensure minimum 24px from screen edge
  },
  fullscreenPlayButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    padding: 12,
  },
  fullscreenProgressBarContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 16,
    maxWidth: '100%', // Ensure it doesn't exceed container width
  },
  fullscreenProgressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  fullscreenProgressBarFill: {
    height: 6,
    backgroundColor: '#F45303',
    borderRadius: 3,
  },
  fullscreenProgressThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#F45303',
    borderRadius: 10,
    top: 5,
  },
  fullscreenTimeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
  },
  fullscreenRightControls: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  resizeModeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  resizeModeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  exitFullscreenButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
});

export default SimpleVideoPlayer;
