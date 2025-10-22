import React, { useCallback, useRef, useMemo } from 'react';
import {
    TouchableWithoutFeedback,
    Animated,
    Platform,
    TouchableOpacityProps,
    ViewStyle,
    StyleSheet,
} from 'react-native';
// import { usePerformanceTracking } from '../services/PerformanceMonitor';

interface OptimizedTouchableProps extends Omit<TouchableOpacityProps, 'style'> {
    style?: ViewStyle;
    children: React.ReactNode;
    activeOpacity?: number;
    disabled?: boolean;
    onPress?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    onLongPress?: () => void;
    // Performance optimizations
    enableHaptics?: boolean;
    enableScaleAnimation?: boolean;
    animationDuration?: number;
    trackPerformance?: boolean;
}

/**
 * Optimized Touchable Component
 * - Minimal re-renders using useCallback and useMemo
 * - Single Animated.Value for better performance
 * - Proper cleanup and memory management
 * - Optional performance tracking
 * - Haptic feedback support
 */
const OptimizedTouchable: React.FC<OptimizedTouchableProps> = React.memo(({
    style,
    children,
    activeOpacity = 0.7,
    disabled = false,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    enableHaptics = false,
    enableScaleAnimation = true,
    animationDuration = 100,
    trackPerformance = false,
    ...props
}) => {
    // Single animated value for better performance
    const animatedValue = useRef(new Animated.Value(1)).current;
    // const { trackUserAction } = usePerformanceTracking();

    // Memoized styles to prevent recalculation
    const containerStyle = useMemo(() => [
        styles.container,
        style,
        Platform.OS === 'android' && styles.androidOptimizations,
    ], [style]);

    const animatedStyle = useMemo(() => ({
        opacity: animatedValue.interpolate({
            inputRange: [0.7, 1],
            outputRange: [activeOpacity, 1],
            extrapolate: 'clamp',
        }),
        transform: enableScaleAnimation ? [{
            scale: animatedValue.interpolate({
                inputRange: [0.7, 1],
                outputRange: [0.98, 1],
                extrapolate: 'clamp',
            }),
        }] : [],
    }), [activeOpacity, enableScaleAnimation, animatedValue]);

    // Optimized animation functions
    const animateIn = useCallback(() => {
        Animated.timing(animatedValue, {
            toValue: 0.7,
            duration: animationDuration,
            useNativeDriver: true,
        }).start();
    }, [animatedValue, animationDuration]);

    const animateOut = useCallback(() => {
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: animationDuration,
            useNativeDriver: true,
        }).start();
    }, [animatedValue, animationDuration]);

    // Optimized event handlers with useCallback
    const handlePressIn = useCallback(() => {
        if (disabled) return;

        animateIn();
        onPressIn?.();

        if (enableHaptics && Platform.OS === 'ios') {
            // Add haptic feedback for iOS
            const { HapticFeedback } = require('react-native');
            HapticFeedback?.impact?.(HapticFeedback.ImpactFeedbackStyle.Light);
        }
    }, [disabled, animateIn, onPressIn, enableHaptics]);

    const handlePressOut = useCallback(() => {
        if (disabled) return;

        animateOut();
        onPressOut?.();
    }, [disabled, animateOut, onPressOut]);

    const handlePress = useCallback(() => {
        if (disabled) return;

        // Track performance if enabled
        // if (trackPerformance) {
        //     trackUserAction('button_press');
        // }

        onPress?.();
    }, [disabled, onPress, trackPerformance]);

    const handleLongPress = useCallback(() => {
        if (disabled) return;

        // if (trackPerformance) {
        //     trackUserAction('button_long_press');
        // }

        onLongPress?.();
    }, [disabled, onLongPress, trackPerformance]);

    return (
        <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            onLongPress={handleLongPress}
            disabled={disabled}
            {...props}
        >
            <Animated.View style={[containerStyle, animatedStyle]}>
                {children}
            </Animated.View>
        </TouchableWithoutFeedback>
    );
});

const styles = StyleSheet.create({
    container: {
        // Base container styles
    },
    androidOptimizations: {
        // Android-specific optimizations
        elevation: 0,
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
    },
});

OptimizedTouchable.displayName = 'OptimizedTouchable';

export default OptimizedTouchable;