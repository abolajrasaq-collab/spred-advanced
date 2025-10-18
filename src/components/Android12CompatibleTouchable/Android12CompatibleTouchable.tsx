/**
 * Android 12 Compatible Touchable Component
 * Fixes RNG Opacity and gesture handler issues on Android 12
 */

import React, { useState, useRef } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Animated,
  Platform,
  TouchableOpacityProps,
  ViewStyle,
  StyleSheet,
} from 'react-native';

interface Android12CompatibleTouchableProps extends Omit<TouchableOpacityProps, 'style'> {
  style?: ViewStyle;
  children: React.ReactNode;
  activeOpacity?: number;
  disabled?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
}

const Android12CompatibleTouchable: React.FC<Android12CompatibleTouchableProps> = ({
  style,
  children,
  activeOpacity = 0.7,
  disabled = false,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    setIsPressed(true);
    onPressIn?.();
    
    // Android 12 compatible animation
    if (Platform.OS === 'android') {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: activeOpacity,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // iOS uses native TouchableOpacity behavior
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    setIsPressed(false);
    onPressOut?.();
    
    // Reset animations
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    onLongPress?.();
  };

  // Android 12 specific optimizations
  const android12Style: ViewStyle = Platform.OS === 'android' ? {
    // Remove problematic properties for Android 12
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  } : {};

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          styles.container,
          style,
          android12Style,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base container styles
  },
});

export default Android12CompatibleTouchable;
