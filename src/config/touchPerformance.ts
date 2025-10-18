import { Platform } from 'react-native';

// Touch performance optimization configuration
export const TOUCH_CONFIG = {
  // Response timing configurations
  delayPressIn: Platform.select({
    ios: 0, // Immediate response on iOS
    android: 50, // Small delay on Android for better touch detection
  }),
  delayPressOut: 0, // Immediate release
  delayLongPress: 500, // Standard long press delay

  // Hit area expansion for better touch targets
  defaultHitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },

  // Active opacity values for different button types
  activeOpacity: {
    primary: 0.6, // More responsive feel
    secondary: 0.7,
    tab: 0.6, // Fast tab switching
    card: 0.8, // Subtle feedback for cards
  },

  // Minimum touch target sizes (following accessibility guidelines)
  minTouchTarget: {
    width: 44,
    height: 44,
  },

  // Performance optimizations
  enableOptimizations: true,
  throttleTouchEvents: Platform.OS === 'android', // Only on Android if needed
  touchEventDepthLimit: 10, // Prevent infinite recursion

  // Animation performance
  enableNativeDriver: true,
  animationDuration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
};

// Platform-specific optimizations
export const PLATFORM_OPTIMIZATIONS = {
  android: {
    // Android-specific touch improvements
    enableHapticFeedback: false, // Reduce system overhead
    preferNativeComponents: true,
    enableHardwareAcceleration: true,
  },
  ios: {
    // iOS-specific touch improvements
    enableHapticFeedback: true,
    preferSmoothAnimations: true,
    enableEdgeSwipeGesture: true,
  },
};

// Button type configurations
export const BUTTON_CONFIGS = {
  primary: {
    activeOpacity: TOUCH_CONFIG.activeOpacity.primary,
    delayPressIn: 0, // Fast response for primary actions
    hitSlop: { ...TOUCH_CONFIG.defaultHitSlop, top: 10, bottom: 10 },
  },
  secondary: {
    activeOpacity: TOUCH_CONFIG.activeOpacity.secondary,
    delayPressIn: TOUCH_CONFIG.delayPressIn,
    hitSlop: TOUCH_CONFIG.defaultHitSlop,
  },
  tab: {
    activeOpacity: TOUCH_CONFIG.activeOpacity.tab,
    delayPressIn: 0, // Immediate tab switching
    hitSlop: TOUCH_CONFIG.defaultHitSlop,
  },
  card: {
    activeOpacity: TOUCH_CONFIG.activeOpacity.card,
    delayPressIn: TOUCH_CONFIG.delayPressIn,
    hitSlop: {
      ...TOUCH_CONFIG.defaultHitSlop,
      top: 5,
      bottom: 5,
      left: 5,
      right: 5,
    },
  },
};

// Performance monitoring utilities
export const TouchPerformanceMonitor = {
  // Log performance metrics in development
  logTouchMetrics: (componentName: string, startTime: number) => {
    if (__DEV__) {
      const duration = Date.now() - startTime;
      if (duration > 100) {
        // Log slow interactions
        console.warn(
          `🐌 Slow touch response in ${componentName}: ${duration}ms`,
        );
      }
    }
  },

  // Measure touch response time
  measureTouchResponse: (componentName: string) => {
    const startTime = Date.now();
    return () =>
      TouchPerformanceMonitor.logTouchMetrics(componentName, startTime);
  },
};

// Default props for optimized touch components
export const DEFAULT_TOUCH_PROPS = {
  activeOpacity: TOUCH_CONFIG.activeOpacity.primary,
  hitSlop: TOUCH_CONFIG.defaultHitSlop,
  delayPressIn: TOUCH_CONFIG.delayPressIn,
  delayPressOut: TOUCH_CONFIG.delayPressOut,
  delayLongPress: TOUCH_CONFIG.delayLongPress,
};
