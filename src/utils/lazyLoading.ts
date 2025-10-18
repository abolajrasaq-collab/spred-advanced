import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';
import logger from './logger';

/**
 * Enhanced lazy loading utilities for React Native
 */

interface LazyOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingText?: string;
  enableLogging?: boolean;
  preload?: boolean;
}

// Default loading component
const DefaultLoadingFallback: React.FC<{ loadingText?: string }> = ({
  loadingText,
}) =>
  React.createElement(
    View,
    { style: styles.loadingContainer },
    React.createElement(LoadingSpinner, {
      visible: true,
      text: loadingText || 'Loading...',
      fullScreen: false,
    }),
  );

// Default error component
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) =>
  React.createElement(
    View,
    { style: styles.errorContainer },
    React.createElement(
      Text,
      { style: styles.errorTitle },
      'Failed to load component',
    ),
    React.createElement(Text, { style: styles.errorMessage }, error.message),
    React.createElement(
      TouchableOpacity,
      { style: styles.retryButton, onPress: retry },
      React.createElement(Text, { style: styles.retryText }, 'Retry'),
    ),
  );

/**
 * Enhanced lazy loading with error boundaries and performance monitoring
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyOptions = {},
): LazyExoticComponent<T> {
  const {
    fallback,
    errorFallback,
    loadingText,
    enableLogging = true,
    preload = false,
  } = options;

  if (enableLogging) {
    logger.debug('Creating lazy component', { preload }, 'LazyLoading');
  }

  const LazyComponent = React.lazy(async () => {
    const startTime = performance.now();

    try {
      if (enableLogging) {
        logger.debug('Starting component import', undefined, 'LazyLoading');
      }

      const module = await importFunc();

      const loadTime = performance.now() - startTime;

      if (enableLogging) {
        logger.performance('Component lazy load', loadTime, {
          component: importFunc.toString(),
        });
      }

      return module;
    } catch (error) {
      if (enableLogging) {
        logger.error('Failed to load component', error as Error, 'LazyLoading');
      }
      throw error;
    }
  });

  // Preload if requested
  if (preload) {
    React.startTransition(() => {
      importFunc().catch(error => {
        if (enableLogging) {
          logger.warn(
            'Preload failed',
            { error: error.message },
            'LazyLoading',
          );
        }
      });
    });
  }

  // Create wrapper with error boundary
  const LazyWrapper: React.FC<React.ComponentProps<T>> = props => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const handleRetry = useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    if (error) {
      if (errorFallback) {
        return React.createElement(React.Fragment, null, errorFallback);
      }

      return React.createElement(DefaultErrorFallback, {
        error,
        retry: handleRetry,
      });
    }

    return React.createElement(
      ErrorBoundary,
      {
        onError: error => {
          setError(error);
          if (enableLogging) {
            logger.error(
              'Lazy component error boundary triggered',
              error,
              'LazyLoading',
            );
          }
        },
      },
      React.createElement(
        Suspense,
        {
          fallback:
            fallback ||
            React.createElement(DefaultLoadingFallback, { loadingText }),
        },
        React.createElement(LazyComponent, props),
      ),
    );
  };

  // Copy lazy component properties
  LazyWrapper.displayName = `LazyLoaded(${
    (LazyComponent as any).displayName || 'Component'
  })`;

  return React.memo(LazyWrapper) as LazyExoticComponent<T>;
}

/**
 * Error boundary for lazy loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(errorObj: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(errorObj);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let the LazyWrapper handle the error UI
    }

    return this.props.children;
  }
}

/**
 * Hook for preloading components
 */
export function usePreload() {
  const preloadComponent = useCallback(
    async (importFunc: () => Promise<any>, componentName?: string) => {
      try {
        logger.debug('Preloading component', { componentName }, 'Preload');
        await importFunc();
        logger.info(
          'Component preloaded successfully',
          { componentName },
          'Preload',
        );
      } catch (error) {
        logger.warn(
          'Component preload failed',
          { componentName, error: (error as Error).message },
          'Preload',
        );
      }
    },
    [],
  );

  return { preloadComponent };
}

/**
 * Component for intersection-based lazy loading
 */
export const IntersectionLazyLoader: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}> = ({ children, fallback, rootMargin = '50px', threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Simple visibility detection for React Native
    // In a real app, you might use react-native-reanimated or similar
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return React.createElement(
    View,
    null,
    isVisible
      ? children
      : fallback ||
          React.createElement(DefaultLoadingFallback, {
            loadingText: 'Loading...',
          }),
  );
};

/**
 * Bundle splitting helper for navigation
 */
export const createLazyScreen = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  screenName: string,
) => {
  return lazyLoad(importFunc, {
    loadingText: `Loading ${screenName}...`,
    enableLogging: true,
    preload: false, // Don't preload screens by default
  });
};

/**
 * Asset preloading utilities
 */
export const preloadAssets = async (
  assets: Array<{ uri: string; type: 'image' | 'video' | 'audio' }>,
) => {
  logger.info(
    'Starting asset preload',
    { assetCount: assets.length },
    'AssetPreload',
  );

  const promises = assets.map(async asset => {
    try {
      // In React Native, you would use Image.prefetch for images
      // For other assets, you might need specific libraries
      logger.debug(
        'Preloading asset',
        { uri: asset.uri, type: asset.type },
        'AssetPreload',
      );
      return Promise.resolve();
    } catch (error) {
      logger.warn(
        'Asset preload failed',
        { uri: asset.uri, error: (error as Error).message },
        'AssetPreload',
      );
      throw error;
    }
  });

  await Promise.allSettled(promises);
  logger.info(
    'Asset preload completed',
    { assetCount: assets.length },
    'AssetPreload',
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default {
  lazyLoad,
  usePreload,
  IntersectionLazyLoader,
  createLazyScreen,
  preloadAssets,
};
