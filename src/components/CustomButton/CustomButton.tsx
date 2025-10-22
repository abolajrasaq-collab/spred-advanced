import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
// Import SleekButton for modern, polished button functionality
import SleekButton from '../SleekButton/SleekButton';
import { useTheme } from '../../hooks';

interface CustomButtonProps {
  title: string;
  image?: any;
  icon?: React.ReactNode;
  onPress?: () => void | Promise<void>;
  width?: string | number;
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  hapticFeedback?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  image,
  icon,
  onPress,
  width,
  height,
  borderRadius,
  backgroundColor,
  disabled,
  loading = false,
  loadingText,
  hapticFeedback = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  testID,
}) => {
  const { Common, Gutters, Layout } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: { height: 36, fontSize: 14, paddingHorizontal: 16 },
    medium: { height: 50, fontSize: 16, paddingHorizontal: 24 },
    large: { height: 60, fontSize: 18, paddingHorizontal: 32 },
  };

  const currentSize = sizeConfig[size];

  // Variant configurations
  const getVariantStyles = () => {
    const baseColor =
      backgroundColor || Common?.button?.base?.backgroundColor || '#F45303';

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: baseColor,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: Common?.button?.base?.backgroundColor || '#6B7280',
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: baseColor,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: baseColor,
          borderWidth: 0,
        };
    }
  };

  const handlePress = useCallback(() => {
    if (disabled || loading || !onPress) {
      return;
    }

    // Execute onPress immediately without async/await for better responsiveness
    try {
      onPress();
    } catch (error) {
      // Silent error handling to avoid console noise in production
      if (__DEV__) {
        console.warn('Button press error:', error);
      }
    }
  }, [disabled, loading, onPress]);

  const buttonStyle: ViewStyle = {
    width: (width as any) || '100%',
    height: currentSize.height,
    ...getVariantStyles(),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius || 8,
    flexDirection: 'row',
    opacity: disabled || loading ? 0.6 : 1,
    ...Gutters.regularHPadding,
    ...style,
  };

  const textColor =
    variant === 'outline' || variant === 'ghost'
      ? backgroundColor || Common?.button?.base?.backgroundColor || '#F45303'
      : '#FFFFFF';

  // Use SleekButton for modern, polished button functionality while maintaining backward compatibility
  return (
    <SleekButton
      title={loading && loadingText ? loadingText : title}
      onPress={handlePress}
      style={buttonStyle}
      textStyle={{
        ...styles.buttonText,
        color: textColor,
        fontSize: currentSize.fontSize,
        ...textStyle,
      }}
      backgroundColor={backgroundColor}
      textColor={textColor}
      disabled={disabled || loading}
      loading={loading}
      variant={variant === 'outline' ? 'outline' : variant === 'ghost' ? 'ghost' : 'primary'}
      size={size}
    />
  );
};

// Memoize for performance
const OptimizedCustomButton = memo(CustomButton);

export default OptimizedCustomButton;

const styles = StyleSheet.create({
  button: {
    // backgroundColor will be set dynamically via buttonStyle
  },
  buttonImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export type { CustomButtonProps };
