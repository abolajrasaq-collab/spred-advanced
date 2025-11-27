/**
 * Performance Optimization Utilities
 * Provides optimized components and utilities for better app responsiveness
 */

import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, TouchableOpacityProps, ScrollView, ScrollViewProps } from 'react-native';

// Optimized TouchableOpacity with better performance
export const OptimizedTouchableOpacity = memo<TouchableOpacityProps>((props) => {
  const { children, onPress, ...restProps } = props;
  
  const handlePress = useCallback((event: any) => {
    if (onPress) {
      onPress(event);
    }
  }, [onPress]);

  return (
    <TouchableOpacity
      {...restProps}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {children}
    </TouchableOpacity>
  );
});

// Optimized ScrollView with performance settings
export const OptimizedScrollView = memo<ScrollViewProps>((props) => {
  const { children, ...restProps } = props;

  const optimizedProps = useMemo(() => ({
    removeClippedSubviews: true,
    scrollEventThrottle: 16,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    bounces: true,
    bouncesZoom: false,
    overScrollMode: 'never' as const,
    ...restProps,
  }), [restProps]);

  return (
    <ScrollView {...optimizedProps}>
      {children}
    </ScrollView>
  );
});

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useMemo(() => Date.now(), []);
  
  React.useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // More than one frame
      console.warn(`⚠️ Slow render in ${componentName}: ${renderTime}ms`);
    }
  }, [componentName, startTime]);
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// Memoized style creator
export const createMemoizedStyles = <T extends Record<string, any>>(
  styleCreator: () => T
) => {
  let cachedStyles: T | null = null;
  
  return () => {
    if (!cachedStyles) {
      cachedStyles = styleCreator();
    }
    return cachedStyles;
  };
};

// Performance-optimized FlatList props
export const getOptimizedFlatListProps = () => ({
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: 5,
  windowSize: 10,
  getItemLayout: undefined, // Let FlatList calculate
  keyExtractor: (item: any, index: number) => `${item.id || index}`,
});

// Performance-optimized Image props
export const getOptimizedImageProps = () => ({
  resizeMode: 'cover' as const,
  fadeDuration: 0, // Disable fade animation for better performance
  loadingIndicatorSource: undefined,
});
