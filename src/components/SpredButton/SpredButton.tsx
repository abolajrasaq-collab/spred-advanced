/**
 * SpredButton - Simplified P2P Sharing Button
 * Clean, focused button for initiating SPRED P2P video sharing
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import logger from '../../utils/logger';

const { width } = Dimensions.get('window');

interface SpredButtonProps {
  videoItem: any;
  videoPath?: string;
  style?: any;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const SpredButton: React.FC<SpredButtonProps> = ({
  videoItem,
  videoPath,
  style,
  disabled = false,
  size = 'medium',
  onPress,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [scaleAnim] = useState(new Animated.Value(1));

  // Size configurations
  const sizeConfig = {
    small: {
      buttonWidth: 80,
      buttonHeight: 32,
      fontSize: 12,
      iconSize: 14,
      borderRadius: 16,
    },
    medium: {
      buttonWidth: 100,
      buttonHeight: 40,
      fontSize: 14,
      iconSize: 18,
      borderRadius: 20,
    },
    large: {
      buttonWidth: 120,
      buttonHeight: 48,
      fontSize: 16,
      iconSize: 22,
      borderRadius: 24,
    },
  };

  const config = sizeConfig[size];

  // Pre-validation check for streaming videos
  const validateVideoForP2P = useCallback((video: any, path: string | undefined) => {
    console.log('🔍 SpredButton validation:', {
      title: video?.title,
      hasSrc: !!video?.src,
      hasUrl: !!video?.url,
      hasLocalPath: !!video?.localPath,
      hasDownloadedPath: !!video?.downloadedPath,
      hasFileName: !!video?.fileName,
      srcStartsHttp: video?.src?.startsWith('http'),
      urlStartsHttp: video?.url?.startsWith('http'),
      videoPath: path,
      hasVideoPath: !!path
    });

    // If we have a videoPath, that means the video IS downloaded and ready to share
    if (path) {
      console.log('✅ SpredButton validation: Video path provided, ready for P2P');
      return true;
    }

    // More nuanced check for streaming vs downloaded videos (when no path provided)
    const hasHttpSource = (video.src && video.src.startsWith('http')) ||
                         (video.url && video.url.startsWith('http'));

    const hasLocalIndicators = video.localPath || video.downloadedPath ||
                              video.fileName || video.videoKey || video.key;

    // If it has HTTP source but no local indicators, it's likely streaming only
    if (hasHttpSource && !hasLocalIndicators) {
      console.log('❌ SpredButton validation: Streaming-only video detected, no path available');
      return false;
    }

    // If it has local indicators or no HTTP source, it might be downloadable
    console.log('✅ SpredButton validation: Video might be downloadable');
    return true;
  }, []);

  // Handle button press
  const handlePress = useCallback(async () => {
    if (disabled || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // Validate the video (pass the videoPath for validation)
      const isValid = validateVideoForP2P(videoItem, videoPath);
      if (!isValid) {
        Alert.alert(
          'Download Required',
          'Please download this video first before sharing via P2P.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Get the video path
      const path = videoPath;
      if (!path) {
        Alert.alert(
          'Please download the video first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Navigate to Spred screen with the video data
      logger.info('🎯 SPRED button pressed - navigating to P2P Sender');
      navigation.navigate('Spred', {
        url: path,
        title: videoItem?.title || 'Unknown Video',
      });
    } catch (error) {
      logger.error('❌ SpredButton error:', error);
      Alert.alert(
        'Error',
        'Failed to start P2P sharing. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }

    // Call custom onPress if provided
    if (onPress) {
      onPress();
    }
  }, [disabled, isLoading, videoItem, videoPath, onPress, navigation, scaleAnim, validateVideoForP2P]);

  // Determine button state
  const getButtonState = () => {
    if (disabled) return 'disabled';
    if (isLoading) return 'loading';
    return 'ready';
  };

  const buttonState = getButtonState();

  // Button styling based on state
  const getButtonStyle = () => {
    const baseStyle = {
      width: config.buttonWidth,
      height: config.buttonHeight,
      borderRadius: config.borderRadius,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: '#F45303',
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    };

    switch (buttonState) {
      case 'disabled':
        return {
          ...baseStyle,
          backgroundColor: '#444444',
          shadowOpacity: 0,
          elevation: 0,
        };
      case 'loading':
      case 'sharing':
        return {
          ...baseStyle,
          backgroundColor: '#D69E2E',
        };
      default:
        return baseStyle;
    }
  };

  // Icon based on state
  const getIcon = () => {
    switch (buttonState) {
      case 'loading':
      case 'sharing':
        return <ActivityIndicator size="small" color="#FFFFFF" />;
      default:
        return (
          <MaterialIcons
            name="broadcast-on-home"
            size={config.iconSize}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
        );
    }
  };

  // Text based on state
  const getText = () => {
    switch (buttonState) {
      case 'disabled':
        return 'Share';
      case 'loading':
        return 'Sharing...';
      case 'sharing':
        return 'Active';
      default:
        return 'SPRED';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={handlePress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {getIcon()}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: config.fontSize,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          {getText()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SpredButton;