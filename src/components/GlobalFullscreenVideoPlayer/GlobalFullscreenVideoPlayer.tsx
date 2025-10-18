import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  BackHandler,
  Platform,
  NativeModules,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useOrientation } from '../../hooks/useOrientation';
import { useFullscreenVideo } from '../../contexts/FullscreenVideoContext';
import { logger } from '../../utils/ProductionLogger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GlobalFullscreenVideoPlayer: React.FC = () => {
  const videoRef = useRef<Video>(null);
  const { lockToPortrait, lockToLandscape } = useOrientation();
  const { isFullscreen, videoSource, exitFullscreen, isPaused } =
    useFullscreenVideo();

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    // Set up immersive fullscreen mode for Android
    if (Platform.OS === 'android') {
      // Hide status bar and navigation bar for true fullscreen
      StatusBar.setHidden(true, 'fade');

      // Use Android's immersive fullscreen mode
      try {
        // Import the correct module for Android system UI
        const { StatusBarManager } = NativeModules;
        
        if (StatusBarManager) {
          // Hide status bar
          StatusBarManager.setHidden(true);
        }

        // Use the correct approach for immersive fullscreen
        setTimeout(() => {
          try {
            // Use the proper Android immersive fullscreen flags
            const { UIManager } = require('react-native');
            
            // Get the root view tag
            const rootTag = require('react-native').AppRegistry.getApplication('SpredApp', () => {});
            
            if (UIManager.dispatchViewManagerCommand) {
              // Use the correct system UI flags for immersive fullscreen
              UIManager.dispatchViewManagerCommand(
                rootTag,
                UIManager.getViewManagerConfig('RCTView').Commands.setSystemUiVisibility,
                [0x00000004 | 0x00000002 | 0x00000001] // SYSTEM_UI_FLAG_HIDE_NAVIGATION | SYSTEM_UI_FLAG_FULLSCREEN | SYSTEM_UI_FLAG_IMMERSIVE_STICKY
              );
            }
          } catch (error) {
            logger.debug('Error setting immersive mode:', error);
            // Fallback: try alternative approach
            try {
              const { NativeModules } = require('react-native');
              if (NativeModules.StatusBarManager) {
                NativeModules.StatusBarManager.setHidden(true);
              }
            } catch (fallbackError) {
              logger.debug('Fallback immersive mode failed:', fallbackError);
            }
          }
        }, 200); // Increased delay for better reliability

        logger.debug('Entering Android immersive fullscreen mode');
      } catch (error) {
        logger.error('Error setting up Android fullscreen:', error);
      }
    }

    // Handle Android back button in fullscreen mode
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFullscreen) {
          logger.debug('Android back button pressed in fullscreen');
          exitFullscreen();
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      },
    );

    return () => {
      backHandler.remove();
      // Restore status bar when exiting fullscreen
      if (Platform.OS === 'android') {
        StatusBar.setHidden(false, 'fade');
        try {
          if (NativeModules.StatusBarManager) {
            NativeModules.StatusBarManager.setHidden(false);
          }
        } catch (error) {
          logger.debug('Error restoring status bar:', error);
        }
        logger.debug('Exiting Android fullscreen mode');
      }
    };
  }, [isFullscreen, exitFullscreen]);

  const handleExitFullscreen = () => {
    // Restore status bar
    StatusBar.setHidden(false, 'fade');
    exitFullscreen();
    setTimeout(() => {
      try {
        lockToPortrait();
      } catch (error) {
        logger.debug('Error locking to portrait:', error);
      }
    }, 100);
  };

  // Programmatically enter fullscreen mode for Android
  const enterFullscreenMode = () => {
    if (Platform.OS === 'android' && videoRef.current) {
      try {
        // Use the video player's native fullscreen method
        (videoRef.current as any).presentFullscreenPlayer();
        logger.debug('Programmatically entering Android fullscreen');

        // Force immersive mode after a delay
        setTimeout(() => {
          try {
            // Use a more reliable approach for immersive fullscreen
            const { UIManager } = require('react-native');
            
            // Try multiple approaches for better compatibility
            try {
              // Method 1: Direct system UI visibility
              UIManager.dispatchViewManagerCommand(
                UIManager.getViewManagerConfig('RCTView'),
                UIManager.RCTView.Commands.setSystemUiVisibility,
                [0x00000004 | 0x00000002 | 0x00000001], // Hide navigation + fullscreen + immersive sticky
              );
            } catch (method1Error) {
              logger.debug('Method 1 failed, trying alternative:', method1Error);
              
              // Method 2: Alternative approach using StatusBarManager
              try {
                const { StatusBarManager } = NativeModules;
                if (StatusBarManager && StatusBarManager.setHidden) {
                  StatusBarManager.setHidden(true);
                }
              } catch (method2Error) {
                logger.debug('Method 2 failed:', method2Error);
              }
            }
            
            logger.debug('Forced immersive mode activated');
          } catch (error) {
            logger.debug('Error forcing immersive mode:', error);
          }
        }, 500); // Increased delay for better reliability
      } catch (error) {
        logger.error('Error entering fullscreen programmatically:', error);
      }
    }
  };

  // Force immersive fullscreen mode
  const forceImmersiveMode = () => {
    if (Platform.OS === 'android') {
      try {
        // Method 1: Use UIManager for system UI visibility
        const { UIManager } = require('react-native');
        UIManager.dispatchViewManagerCommand(
          UIManager.getViewManagerConfig('RCTView'),
          UIManager.RCTView.Commands.setSystemUiVisibility,
          [0x00000004 | 0x00000002 | 0x00000001], // SYSTEM_UI_FLAG_HIDE_NAVIGATION | SYSTEM_UI_FLAG_FULLSCREEN | SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
        logger.debug('Forced immersive mode via UIManager');
        
        // Method 2: Additional StatusBar hiding
        StatusBar.setHidden(true, 'fade');
        
        // Method 3: Try using StatusBarManager if available
        try {
          const { StatusBarManager } = NativeModules;
          if (StatusBarManager && StatusBarManager.setHidden) {
            StatusBarManager.setHidden(true);
          }
        } catch (statusBarError) {
          logger.debug('StatusBarManager not available:', statusBarError);
        }
        
      } catch (error) {
        logger.debug('Error forcing immersive mode:', error);
      }
    }
  };

  // Auto-enter fullscreen when component mounts
  useEffect(() => {
    if (isFullscreen && Platform.OS === 'android') {
      const timer = setTimeout(() => {
        enterFullscreenMode();
        // Also force immersive mode
        forceImmersiveMode();
      }, 500); // Small delay to ensure video is ready

      // Also try to force immersive mode immediately
      forceImmersiveMode();

      // Set up periodic immersive mode enforcement
      const immersiveInterval = setInterval(() => {
        forceImmersiveMode();
      }, 1000); // Force immersive mode every second

      return () => {
        clearTimeout(timer);
        clearInterval(immersiveInterval);
      };
    }
  }, [isFullscreen]);

  if (!isFullscreen || !videoSource) {
    return null;
  }

  // Lock to landscape
  setTimeout(() => {
    try {
      lockToLandscape();
    } catch (error) {
      logger.debug('Error locking to landscape:', error);
    }
  }, 100);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: screenWidth,
        height: screenHeight,
        backgroundColor: '#000',
        zIndex: 99999, // Higher z-index to ensure it's above everything
        // Ensure it covers the entire screen including navigation area
        ...(Platform.OS === 'android' && {
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: 0,
          marginBottom: 0,
          // Force full screen coverage
          position: 'absolute',
          top: -50, // Extend beyond status bar
          left: 0,
          right: 0,
          bottom: -50, // Extend beyond navigation bar
        }),
      }}
    >
      <Video
        ref={videoRef}
        source={videoSource}
        style={{
          flex: 1,
          width: screenWidth,
          height: screenHeight,
        }}
        paused={isPaused}
        controls={true}
        resizeMode="contain"
        onLoad={data => {
          logger.debug('GLOBAL FULLSCREEN Video loaded:', data);
        }}
        onError={error => {
          logger.error('GLOBAL FULLSCREEN Video error:', error);
        }}
        onLoadStart={() => {
          logger.debug('GLOBAL FULLSCREEN Video loading started');
        }}
        onBuffer={data => {
          logger.debug('GLOBAL FULLSCREEN Video buffering:', data);
        }}
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        // Android fullscreen properties - use native fullscreen
        {...(Platform.OS === 'android' && {
          fullscreen: true,
          fullscreenOrientation: 'landscape',
          fullscreenAutorotate: false,
          // Force immersive fullscreen mode
          fullscreenMode: 'immersive',
          // Additional Android-specific fullscreen properties
          onFullscreenPlayerWillPresent: () => {
            logger.debug('Android fullscreen player will present');
            // Force immersive mode when fullscreen starts
            setTimeout(() => {
              try {
                // Hide status bar
                StatusBar.setHidden(true, 'fade');
                
                // Force immersive mode with multiple approaches
                const { UIManager } = require('react-native');
                try {
                  UIManager.dispatchViewManagerCommand(
                    UIManager.getViewManagerConfig('RCTView'),
                    UIManager.RCTView.Commands.setSystemUiVisibility,
                    [0x00000004 | 0x00000002 | 0x00000001], // Hide navigation + fullscreen + immersive sticky
                  );
                } catch (uiError) {
                  logger.debug('UIManager approach failed:', uiError);
                  
                  // Alternative approach using StatusBarManager
                  try {
                    const { StatusBarManager } = NativeModules;
                    if (StatusBarManager && StatusBarManager.setHidden) {
                      StatusBarManager.setHidden(true);
                    }
                  } catch (statusBarError) {
                    logger.debug('StatusBarManager approach failed:', statusBarError);
                  }
                }
              } catch (error) {
                logger.debug(
                  'Error setting immersive mode in fullscreen:',
                  error,
                );
              }
            }, 300); // Increased delay for better reliability
          },
          onFullscreenPlayerDidPresent: () => {
            logger.debug('Android fullscreen player did present');
            // Ensure immersive mode is active
            setTimeout(() => {
              try {
                const { UIManager } = require('react-native');
                UIManager.dispatchViewManagerCommand(
                  UIManager.getViewManagerConfig('RCTView'),
                  UIManager.RCTView.Commands.setSystemUiVisibility,
                  [0x00000004 | 0x00000002 | 0x00000001],
                );
              } catch (error) {
                logger.debug('Error maintaining immersive mode:', error);
              }
            }, 500);
          },
          onFullscreenPlayerWillDismiss: () => {
            logger.debug('Android fullscreen player will dismiss');
          },
          onFullscreenPlayerDidDismiss: () => {
            logger.debug('Android fullscreen player did dismiss');
            exitFullscreen();
          },
        })}
        // Additional properties for better fullscreen experience
        preventsDisplaySleepDuringVideoPlayback={true}
        allowsExternalPlayback={false}
        useTextureView={Platform.OS === 'android'}
        disableFocus={false}
        muted={false}
        posterResizeMode="cover"
        reportBandwidth={false}
        bufferConfig={{
          minBufferMs: 2000,
          maxBufferMs: 8000,
          bufferForPlaybackMs: 500,
          bufferForPlaybackAfterRebufferMs: 1000,
        }}
      />

      {/* Exit button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 20,
          padding: 10,
          zIndex: 100000, // Even higher z-index for the button
        }}
        onPress={() => {
          if (Platform.OS === 'android' && videoRef.current) {
            try {
              // Use native fullscreen dismiss method
              (videoRef.current as any).dismissFullscreenPlayer();
              logger.debug('Programmatically exiting Android fullscreen');
            } catch (error) {
              logger.error('Error exiting fullscreen programmatically:', error);
              handleExitFullscreen();
            }
          } else {
            handleExitFullscreen();
          }
        }}
      >
        <Icon name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default GlobalFullscreenVideoPlayer;
