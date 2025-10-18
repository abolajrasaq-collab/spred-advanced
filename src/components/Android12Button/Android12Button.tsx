/**
 * Android 12 Optimized Button Component
 * 
 * This component provides reliable touch handling for Android 12+ devices
 * using TouchableWithoutFeedback + manual state management.
 * 
 * Features:
 * - ✅ No stuck button issues on Android 12
 * - ✅ Manual state management (idle → pressed → released → idle)
 * - ✅ Force reset mechanism to prevent stuck states
 * - ✅ Visual feedback with different colors for each state
 * - ✅ Real-time state display for debugging
 * - ✅ Customizable styling and behavior
 * - ✅ Fallback Pressable option for compatibility
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Pressable,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface Android12ButtonProps {
  // Content
  title: string;
  onPress: () => void;
  
  // Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
  buttonColor?: string;
  pressedColor?: string;
  releasedColor?: string;
  textColor?: string;
  
  // Behavior
  disabled?: boolean;
  showState?: boolean; // Show current button state for debugging
  useFallback?: boolean; // Use Pressable as fallback instead of TouchableWithoutFeedback
  
  // Icon
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  
  // Size variants
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

type ButtonState = 'idle' | 'pressed' | 'released';

const Android12Button: React.FC<Android12ButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  buttonColor = '#F45303',
  pressedColor = '#D43D00',
  releasedColor = '#4CAF50',
  textColor = '#FFFFFF',
  disabled = false,
  showState = false,
  useFallback = false,
  iconName,
  iconSize = 24,
  iconColor = '#FFFFFF',
  size = 'medium',
  variant = 'primary',
}) => {
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handlePressIn = () => {
    if (disabled) return;
    
    console.log('🔘 Android 12 Button: Press IN');
    setButtonState('pressed');
    
    // Clear any existing timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    console.log('🔘 Android 12 Button: Press OUT');
    setButtonState('released');
    
    // Force reset after a short delay to prevent stuck states
    resetTimeoutRef.current = setTimeout(() => {
      setButtonState('idle');
    }, 100);
  };

  const handlePress = () => {
    if (disabled) return;
    
    console.log('🔘 Android 12 Button: TAPPED!');
    setButtonState('idle');
    onPress();
  };

  const handleFallbackPress = () => {
    if (disabled) return;
    
    console.log('🔘 Fallback Pressable tapped!');
    onPress();
  };

  // Get size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 18,
        };
      default: // medium
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
        };
    }
  };

  // Get variant-based styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: '#6C757D',
          borderColor: '#6C757D',
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: buttonColor,
          borderWidth: 2,
        };
      default: // primary
        return {
          backgroundColor: buttonColor,
          borderColor: buttonColor,
          borderWidth: 1,
        };
    }
  };

  // Get current button color based on state
  const getCurrentButtonColor = () => {
    if (disabled) return '#CCCCCC';
    
    switch (buttonState) {
      case 'pressed':
        return pressedColor;
      case 'released':
        return releasedColor;
      default:
        return getVariantStyles().backgroundColor;
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const currentButtonColor = getCurrentButtonColor();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: currentButtonColor,
      borderColor: variant === 'outline' ? buttonColor : currentButtonColor,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
    },
    variantStyles,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    {
      color: variant === 'outline' ? buttonColor : textColor,
      fontSize: sizeStyles.fontSize,
    },
    textStyle,
  ];

  // Render fallback Pressable button
  if (useFallback) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...buttonStyles,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleFallbackPress}
        disabled={disabled}
        android_ripple={{ color: '#FFFFFF', borderless: false }}
      >
        <View style={styles.buttonContent}>
          {iconName && (
            <MaterialIcons 
              name={iconName as any} 
              size={iconSize} 
              color={variant === 'outline' ? buttonColor : iconColor} 
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {showState && (
            <Text style={styles.stateText}>Fallback</Text>
          )}
        </View>
      </Pressable>
    );
  }

  // Render main TouchableWithoutFeedback button
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
      >
        <View style={buttonStyles}>
          <View style={styles.buttonContent}>
            {iconName && (
              <MaterialIcons 
                name={iconName as any} 
                size={iconSize} 
                color={variant === 'outline' ? buttonColor : iconColor} 
              />
            )}
            <Text style={textStyles}>{title}</Text>
            {showState && (
              <Text style={styles.stateText}>
                {buttonState.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container for TouchableWithoutFeedback
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 8,
  },
  buttonPressed: {
    elevation: 0,
    shadowOpacity: 0,
    transform: [{ scale: 0.98 }],
  },
  stateText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

export default Android12Button;
