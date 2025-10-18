import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  Platform,
  GestureResponderEvent,
} from 'react-native';

interface OptimizedTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
  optimized?: boolean;
  hitSlopCustom?: boolean;
  delayPressInCustom?: number;
  delayPressOutCustom?: number;
  delayLongPressCustom?: number;
}

const OptimizedTouchableOpacity: React.FC<OptimizedTouchableOpacityProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  delayPressIn = 0, // Immediate response on both platforms
  delayPressOut = 0, // Immediate release
  delayLongPress = 500,
  activeOpacity = 0.5, // More responsive visual feedback
  hitSlop,
  optimized = true,
  hitSlopCustom = true,
  delayPressInCustom = true,
  delayPressOutCustom = true,
  delayLongPressCustom = true,
  ...props
}) => {
  // Optimized hit area for better touch responsiveness
  const optimizedHitSlop =
    hitSlop ||
    (hitSlopCustom
      ? {
          top: 12,
          bottom: 12,
          left: 12,
          right: 12,
        }
      : undefined);

  // Optimized touch handler to prevent multiple rapid presses
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (onPress) {
        onPress(event);
      }
    },
    [onPress],
  );

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (onLongPress) {
        onLongPress(event);
      }
    },
    [onLongPress],
  );

  // Performance optimizations
  const optimizedProps: TouchableOpacityProps = {
    ...props,
    style: style as ViewStyle,
    onPress: handlePress,
    onLongPress: handleLongPress,
    activeOpacity,
    hitSlop: optimizedHitSlop,
  };

  // Apply performance optimizations if enabled
  if (optimized) {
    if (delayPressInCustom) {
      optimizedProps.delayPressIn = delayPressIn;
    }
    if (delayPressOutCustom) {
      optimizedProps.delayPressOut = delayPressOut;
    }
    if (delayLongPressCustom) {
      optimizedProps.delayLongPress = delayLongPress;
    }
  }

  return <TouchableOpacity {...optimizedProps}>{children}</TouchableOpacity>;
};

// Memoize for performance
export default memo(OptimizedTouchableOpacity);

// Export named export for easier importing
export { OptimizedTouchableOpacity };
export type { OptimizedTouchableOpacityProps };
