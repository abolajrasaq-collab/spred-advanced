// Animated View Component with Performance Optimizations - Phase 3.5
// Features: useNativeDriver, optimized animations, layout animations, memoization

import React, { forwardRef, memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LayoutAnimation } from 'react-native';

interface OptimizedAnimatedViewProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'fade' | 'slide' | 'scale' | 'bounce' | 'layout';
  duration?: number;
  delay?: number;
  easing?: 'ease' | 'linear' | 'bounce' | 'elastic';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  autoStart?: boolean;
  testID?: string;
  // Layout animation options
  layout?: boolean;
  layoutDuration?: number;
}

// Optimized easing curves
const EASING_FUNCTIONS = {
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  linear: Easing.bezier(0, 0, 1, 1),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const;

// Pre-configured animation variants
const ANIMATION_VARIANTS = {
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slide: {
    from: (direction: string, distance: number) => {
      const slideConfig: any = {
        opacity: 0.8,
      };
      switch (direction) {
        case 'up':
          slideConfig.transform = [{ translateY: distance }];
          break;
        case 'down':
          slideConfig.transform = [{ translateY: -distance }];
          break;
        case 'left':
          slideConfig.transform = [{ translateX: distance }];
          break;
        case 'right':
          slideConfig.transform = [{ translateX: -distance }];
          break;
      }
      return slideConfig;
    },
    to: {
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
    },
  },
  scale: {
    from: { opacity: 0, transform: [{ scale: 0.8 }] },
    to: { opacity: 1, transform: [{ scale: 1 }] },
  },
  bounce: {
    from: { opacity: 0, transform: [{ scale: 0.3 }] },
    to: { opacity: 1, transform: [{ scale: 1 }] },
  },
} as const;

// Main Animated View Component
const OptimizedAnimatedViewComponent = forwardRef<
  View,
  OptimizedAnimatedViewProps
>(
  (
    {
      children,
      style,
      variant = 'fade',
      duration = 300,
      delay = 0,
      easing = 'ease',
      direction = 'up',
      distance = 20,
      autoStart = true,
      testID,
      layout = false,
      layoutDuration = 300,
    },
    ref,
  ) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const isMounted = useRef(false);

    // Configure layout animations
    useEffect(() => {
      if (layout) {
        LayoutAnimation.configureNext({
          duration: layoutDuration,
          create: {
            type: LayoutAnimation.Types.spring,
            property: LayoutAnimation.Properties.scaleXY,
            springDamping: 0.7,
          },
          update: {
            type: LayoutAnimation.Types.spring,
            property: LayoutAnimation.Properties.scaleXY,
            springDamping: 0.7,
          },
          delete: {
            duration: 200,
            type: LayoutAnimation.Types.spring,
            property: LayoutAnimation.Properties.scaleXY,
            springDamping: 0.7,
          },
        });
      }
    }, [layout, layoutDuration]);

    // Start animation when component mounts or autoStart is true
    useEffect(() => {
      if (!isMounted.current && autoStart) {
        isMounted.current = true;
        startAnimation();
      }
    }, [autoStart]);

    // Public animation functions that can be called externally
    const startAnimation = () => {
      const easingFunction = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.ease;

      let animationConfig;
      if (variant === 'slide') {
        animationConfig = ANIMATION_VARIANTS.slide.from(direction, distance);
      } else {
        animationConfig =
          ANIMATION_VARIANTS[variant]?.from || ANIMATION_VARIANTS.fade.from;
      }

      // Reset to start position
      animatedValue.setValue(0);

      // Create animation
      Animated.sequence([
        // Delay if specified
        Animated.delay(delay),
        // Main animation
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          easing: easingFunction,
          useNativeDriver: true, // Critical for performance
        }),
      ]).start();
    };

    const resetAnimation = () => {
      animatedValue.setValue(0);
    };

    const reverseAnimation = () => {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        easing: EASING_FUNCTIONS[easing] || EASING_FUNCTIONS.ease,
        useNativeDriver: true,
      }).start();
    };

    // Expose animation controls via ref (if needed in future)
    React.useImperativeHandle(ref, () => ({
      startAnimation,
      resetAnimation,
      reverseAnimation,
    }));

    // Interpolate values based on variant
    const getInterpolatedStyle = () => {
      const interpolatedStyle: any = {};

      let config = ANIMATION_VARIANTS[variant];
      if (!config) {
        config = ANIMATION_VARIANTS.fade;
      }

      // Interpolate opacity
      if (
        config.from.opacity !== undefined ||
        config.to.opacity !== undefined
      ) {
        interpolatedStyle.opacity = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [config.from.opacity ?? 0, config.to.opacity ?? 1],
        });
      }

      // Interpolate scale
      if (config.from?.transform?.some((t: any) => t.scale !== undefined)) {
        interpolatedStyle.transform = interpolatedStyle.transform || [];
        interpolatedStyle.transform.push({
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [
              config.from.transform.find((t: any) => t.scale !== undefined)
                ?.scale ?? 0.8,
              config.to.transform?.find((t: any) => t.scale !== undefined)
                ?.scale ?? 1,
            ],
          }),
        });
      }

      // Interpolate translate transforms
      if (
        config.from?.transform?.some(
          (t: any) => 'translateX' in t || 'translateY' in t,
        )
      ) {
        interpolatedStyle.transform = interpolatedStyle.transform || [];
        const fromTranslateX =
          config.from.transform.find((t: any) => 'translateX' in t)
            ?.translateX ?? 0;
        const fromTranslateY =
          config.from.transform.find((t: any) => 'translateY' in t)
            ?.translateY ?? 0;

        interpolatedStyle.transform.push({
          translateX: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [fromTranslateX, 0],
          }),
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [fromTranslateY, 0],
          }),
        });
      }

      return interpolatedStyle;
    };

    const animatedStyle = [style, getInterpolatedStyle()];

    return (
      <Animated.View ref={ref} style={animatedStyle} testID={testID}>
        {children}
      </Animated.View>
    );
  },
);

const OptimizedAnimatedView = memo(OptimizedAnimatedViewComponent);

const styles = StyleSheet.create({
  container: {
    // Default container styles if needed
  },
});

export default OptimizedAnimatedView;
export type { OptimizedAnimatedViewProps };
