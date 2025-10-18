// Simplified Image Component - Basic functionality only

import React, { useState, memo, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import { CommonProps, VerticalScale, HorizontalScale } from '../../theme';

interface OptimizedImageProps {
  src: string;
  width: number;
  height: number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  testID?: string;
}

// Main OptimizedImage Component
const OptimizedImageComponent = forwardRef<View, OptimizedImageProps>(
  (
    {
      src,
      width,
      height,
      style,
      resizeMode = 'cover',
      onLoad,
      onError,
      testID,
    },
    ref,
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Handle successful image load
    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    // Handle image load error
    const handleError = (error: any) => {
      // Safely log the error to prevent console warnings
      const errorMessage =
        error?.message ||
        error?.toString() ||
        JSON.stringify(error) ||
        'Unknown error';
      console.warn('🖼️ OptimizedImage Load Error:', errorMessage);
      setIsLoading(false);
      setHasError(true);
      onError?.(error);
    };

    // Render loading indicator
    const renderLoadingIndicator = () => {
      if (!isLoading || hasError) {
        return null;
      }

      return (
        <View style={[styles.loadingContainer, { width, height }]}>
          <ActivityIndicator
            size="small"
            color="#F45303"
            style={styles.loadingIndicator}
          />
        </View>
      );
    };

    // Render error state
    const renderErrorState = () => {
      if (!hasError) {
        return null;
      }

      return (
        <View style={[styles.errorContainer, { width, height }, style]}>
          <RNImage
            source={require('../../theme/assets/images/sparkles-bottom-left.png')}
            style={styles.errorIcon}
            resizeMode="contain"
          />
        </View>
      );
    };

    return (
      <View
        ref={ref}
        style={[styles.container, { width, height }, style]}
        testID={`optimized-image-container-${testID || 'default'}`}
      >
        {/* Main Image */}
        <RNImage
          source={{ uri: src }}
          style={[{ width, height }, style]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          testID={testID}
        />

        {/* Loading Indicator */}
        {renderLoadingIndicator()}

        {/* Error State */}
        {renderErrorState()}
      </View>
    );
  },
);

const OptimizedImage = memo(OptimizedImageComponent);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingIndicator: {
    opacity: 0.8,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(244, 83, 3, 0.3)',
    borderStyle: 'dashed',
  },
  errorIcon: {
    width: 24,
    height: 24,
    opacity: 0.6,
  },
});

export default OptimizedImage;
export type { OptimizedImageProps };
