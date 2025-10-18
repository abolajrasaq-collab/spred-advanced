import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  MemoryManager,
  createCleanupManager,
  performThrottled,
} from '../../utils/memoryUtils';

// Performance-optimized FlatList wrapper
interface OptimizedFlatListProps<T> extends FlatListProps<T> {
  children?: any;
  memoryOptimized?: boolean;
  cleanupOnUnmount?: boolean;
}

const OptimizedFlatList = <T extends any>({
  data,
  renderItem,
  keyExtractor,
  style,
  contentContainerStyle,
  onScroll,
  memoryOptimized = true,
  cleanupOnUnmount = true,
  ...props
}: OptimizedFlatListProps<T>) => {
  const cleanupManager = useRef(createCleanupManager());
  const lastVisibleIndex = useRef(0);
  // Memory-aware scroll handler with throttling
  const handleScroll = useCallback(
    performThrottled((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onScroll) {
        requestAnimationFrame(() => {
          onScroll(event);
        });
      }

      // Check memory usage during scroll for memory optimization
      if (memoryOptimized) {
        const currentOffset = event.nativeEvent.contentOffset.y;
        if (Math.abs(currentOffset - lastVisibleIndex.current) > 500) {
          MemoryManager.checkMemoryUsage();
          lastVisibleIndex.current = currentOffset;
        }
      }
    }, 16), // ~60fps
    [onScroll, memoryOptimized],
  );

  // Memoized key extractor
  const memoizedKeyExtractor = useMemo(() => {
    return keyExtractor || ((item: any, index: number) => `item-${index}`);
  }, [keyExtractor]);

  // Optimized FlatList configuration with memory management
  const optimizedProps = useMemo(
    () => ({
      ...props,
      // Performance optimizations
      removeClippedSubviews: memoryOptimized,
      maxToRenderPerBatch: memoryOptimized ? 5 : 10,
      updateCellsBatchingPeriod: memoryOptimized ? 50 : 100,
      initialNumToRender: memoryOptimized ? 3 : 5,
      windowSize: memoryOptimized ? 7 : 10,
      legacyImplementation: false,
      disableVirtualization: false,

      // Scroll optimizations
      scrollEventThrottle: 16, // ~60fps
      nestedScrollEnabled: Platform.OS === 'android',

      // Memory optimizations
      getItemLayout: props.getItemLayout,
      maintainVisibleContentPosition: {
        autoscrollToTopThreshold: memoryOptimized ? 50 : 100,
        minIndexForVisible: 0,
      },

      // Performance monitoring disabled for production
      debug: __DEV__ ? false : undefined,
    }),
    [props, memoryOptimized],
  );

  // Component lifecycle management for memory optimization
  useEffect(() => {
    if (memoryOptimized) {
      // Initial memory check
      MemoryManager.checkMemoryUsage();
    }

    return () => {
      if (cleanupOnUnmount) {
        cleanupManager.current.cleanup();
        if (memoryOptimized) {
          MemoryManager.performCleanup();
        }
      }
    };
  }, [memoryOptimized, cleanupOnUnmount]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={memoizedKeyExtractor}
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      onScroll={handleScroll}
      {...optimizedProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default memo(OptimizedFlatList) as typeof OptimizedFlatList;
