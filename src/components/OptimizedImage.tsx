import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';

// Define ResizeMode type manually to avoid import issues
type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center';

interface OptimizedImageProps extends Omit<FastImageProps, 'source' | 'resizeMode'> {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: ResizeMode;
  showLoader?: boolean;
  loaderColor?: string;
  loaderSize?: 'small' | 'large';
  fallbackSource?: { uri: string } | number;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  priority?: 'low' | 'normal' | 'high';
  cache?: 'immutable' | 'web' | 'cacheOnly';
}

/**
 * Optimized Image Component using FastImage
 * Provides caching, loading states, and fallback handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  showLoader = true,
  loaderColor = '#F45303',
  loaderSize = 'small',
  fallbackSource,
  onLoadStart,
  onLoad,
  onError,
  priority = 'normal',
  cache = 'immutable',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Determine the source to use
  const imageSource = hasError && fallbackSource ? fallbackSource : source;

  // Convert source to FastImage format if it's a URI
  const fastImageSource = typeof imageSource === 'object' && 'uri' in imageSource
    ? {
        uri: imageSource.uri,
        priority: FastImage.priority[priority],
        cache: FastImage.cacheControl[cache],
      }
    : imageSource;

  return (
    <View style={[styles.container, style]}>
      <FastImage
        {...props}
        source={fastImageSource}
        style={[StyleSheet.absoluteFillObject, style]}
        resizeMode={FastImage.resizeMode[resizeMode] || FastImage.resizeMode.cover}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading indicator */}
      {isLoading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator 
            size={loaderSize} 
            color={loaderColor} 
          />
        </View>
      )}
    </View>
  );
};

/**
 * Specialized component for video thumbnails
 */
export const VideoThumbnail: React.FC<OptimizedImageProps & {
  videoKey?: string;
}> = ({ videoKey, ...props }) => {
  return (
    <OptimizedImage
      {...props}
      priority="high"
      cache="immutable"
      resizeMode="cover"
      showLoader={true}
      loaderColor="#F45303"
      onError={() => {
        console.log('🎬 VideoThumbnail error for URL:', typeof props.source === 'object' && 'uri' in props.source ? props.source.uri : 'unknown');
      }}
    />
  );
};

/**
 * Specialized component for user avatars
 */
export const UserAvatar: React.FC<OptimizedImageProps & {
  size?: number;
  userId?: string;
}> = ({ size = 40, userId, style, ...props }) => {
  const avatarStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  return (
    <OptimizedImage
      {...props}
      style={avatarStyle}
      priority="normal"
      cache="immutable"
      resizeMode="cover"
      showLoader={true}
      loaderSize="small"
    />
  );
};

/**
 * Preload images for better performance
 */
export const preloadImages = (urls: string[]) => {
  const sources = urls.map(url => ({
    uri: url,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,
  }));
  
  FastImage.preload(sources);
};

/**
 * Clear image cache
 */
export const clearImageCache = () => {
  FastImage.clearMemoryCache();
  FastImage.clearDiskCache();
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default OptimizedImage;