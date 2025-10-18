import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  Animated,
} from 'react-native';

interface InstantTouchableOpacityProps
  extends Omit<TouchableOpacityProps, 'activeOpacity'> {
  children: React.ReactNode;
  instantFeedback?: boolean;
  feedbackOpacity?: number;
  scaleAnimation?: boolean;
  scaleAmount?: number;
}

const InstantTouchableOpacity: React.FC<InstantTouchableOpacityProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  delayPressIn = 0, // Always immediate - no delay at all
  delayPressOut = 0, // Always immediate - no delay at all
  delayLongPress = 300, // Reduced long press delay
  instantFeedback = true,
  feedbackOpacity = 0.6, // More responsive opacity change
  scaleAnimation = true,
  scaleAmount = 0.94, // More noticeable scale for feedback
  hitSlop,
  ...props
}) => {
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (scaleAnimation && instantFeedback) {
        Animated.spring(animatedScale, {
          toValue: scaleAmount,
          useNativeDriver: true,
          speed: 100, // Faster animation
          bounciness: 0,
        }).start();
      }
    },
    [scaleAnimation, instantFeedback, scaleAmount],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (scaleAnimation && instantFeedback) {
        Animated.spring(animatedScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 100, // Faster animation
          bounciness: 0,
        }).start();
      }
    },
    [scaleAnimation, instantFeedback],
  );

  // Optimized touch handler with immediate execution
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (onPress) {
        // Execute immediately without any async/await delays
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

  // Enhanced hit area for better touch responsiveness
  const optimizedHitSlop = hitSlop || {
    top: 15,
    bottom: 15,
    left: 15,
    right: 15,
  };

  if (instantFeedback && scaleAnimation) {
    // Use Pressable with animated transform for instant feedback
    return (
      <Animated.View
        style={{
          transform: [{ scale: animatedScale }],
        }}
      >
        <TouchableOpacity
          {...props}
          style={style}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={props.disabled}
          activeOpacity={feedbackOpacity}
          hitSlop={optimizedHitSlop}
          delayPressIn={delayPressIn}
          delayPressOut={delayPressOut}
          delayLongPress={delayLongPress}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Standard TouchableOpacity with optimized settings
  return (
    <TouchableOpacity
      {...props}
      style={style}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={props.disabled}
      activeOpacity={feedbackOpacity}
      hitSlop={optimizedHitSlop}
      delayPressIn={delayPressIn}
      delayPressOut={delayPressOut}
      delayLongPress={delayLongPress}
    >
      {children}
    </TouchableOpacity>
  );
};

// Memoize for performance
export default memo(InstantTouchableOpacity);

// Export named export for easier importing
export { InstantTouchableOpacity };
export type { InstantTouchableOpacityProps };
