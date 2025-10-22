import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import OptimizedTouchable from './OptimizedTouchable';
import { usePerformanceTracking } from '../services/PerformanceMonitor';

export interface OptimizedButtonProps {
  // Content
  title: string;
  onPress: () => void;
  
  // Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Behavior
  disabled?: boolean;
  loading?: boolean;
  
  // Icon
  iconName?: string;
  iconSize?: number;
  iconPosition?: 'left' | 'right';
  
  // Size variants
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  // Performance
  trackPerformance?: boolean;
  enableHaptics?: boolean;
}

// Theme constants for consistent styling
const THEME = {
  colors: {
    primary: '#F45303',
    primaryDark: '#D43D00',
    secondary: '#6C757D',
    success: '#4CAF50',
    white: '#FFFFFF',
    gray: '#8B8B8B',
    lightGray: '#CCCCCC',
    transparent: 'transparent',
  },
  spacing: {
    small: { horizontal: 12, vertical: 8 },
    medium: { horizontal: 20, vertical: 12 },
    large: { horizontal: 24, vertical: 16 },
  },
  fontSize: {
    small: 14,
    medium: 16,
    large: 18,
  },
  borderRadius: 8,
  iconSpacing: 8,
} as const;

/**
 * Optimized Button Component
 * - Memoized styles and calculations
 * - Minimal re-renders with React.memo
 * - Performance tracking integration
 * - Consistent theming
 * - Accessibility support
 */
const OptimizedButton: React.FC<OptimizedButtonProps> = React.memo(({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  iconName,
  iconSize,
  iconPosition = 'left',
  size = 'medium',
  variant = 'primary',
  trackPerformance = false,
  enableHaptics = false,
}) => {
  const { trackUserAction } = usePerformanceTracking();

  // Memoized size styles
  const sizeStyles = useMemo(() => {
    const spacing = THEME.spacing[size];
    return {
      paddingHorizontal: spacing.horizontal,
      paddingVertical: spacing.vertical,
      fontSize: THEME.fontSize[size],
    };
  }, [size]);

  // Memoized variant styles
  const variantStyles = useMemo(() => {
    const isDisabled = disabled || loading;
    
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDisabled ? THEME.colors.lightGray : THEME.colors.secondary,
          borderColor: isDisabled ? THEME.colors.lightGray : THEME.colors.secondary,
          borderWidth: 1,
          textColor: THEME.colors.white,
        };
      case 'outline':
        return {
          backgroundColor: THEME.colors.transparent,
          borderColor: isDisabled ? THEME.colors.lightGray : THEME.colors.primary,
          borderWidth: 2,
          textColor: isDisabled ? THEME.colors.lightGray : THEME.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: THEME.colors.transparent,
          borderColor: THEME.colors.transparent,
          borderWidth: 0,
          textColor: isDisabled ? THEME.colors.lightGray : THEME.colors.primary,
        };
      default: // primary
        return {
          backgroundColor: isDisabled ? THEME.colors.lightGray : THEME.colors.primary,
          borderColor: isDisabled ? THEME.colors.lightGray : THEME.colors.primary,
          borderWidth: 1,
          textColor: THEME.colors.white,
        };
    }
  }, [variant, disabled, loading]);

  // Memoized icon size
  const computedIconSize = useMemo(() => {
    if (iconSize) return iconSize;
    return size === 'small' ? 16 : size === 'large' ? 24 : 20;
  }, [iconSize, size]);

  // Memoized button styles
  const buttonStyles = useMemo(() => ({
    ...styles.button,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: THEME.borderRadius,
    ...(Platform.OS === 'android' && styles.androidButton),
    ...(style as any),
  }), [variantStyles, sizeStyles, style]);

  // Memoized text styles
  const textStyles = useMemo(() => ({
    ...styles.buttonText,
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    ...(textStyle as any),
  }), [variantStyles.textColor, sizeStyles.fontSize, textStyle]);

  // Optimized press handler
  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    if (trackPerformance) {
      trackUserAction(`button_${variant}_${size}`);
    }

    onPress();
  }, [disabled, loading, onPress, trackPerformance, trackUserAction, variant, size]);

  // Memoized icon component
  const iconComponent = useMemo(() => {
    if (!iconName) return null;

    return (
      <MaterialIcons 
        name={iconName as any} 
        size={computedIconSize} 
        color={variantStyles.textColor}
        style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
      />
    );
  }, [iconName, computedIconSize, variantStyles.textColor, iconPosition]);

  // Memoized loading indicator
  const loadingComponent = useMemo(() => {
    if (!loading) return null;

    return (
      <View style={styles.loadingContainer}>
        <Text style={[textStyles, styles.loadingText]}>Loading...</Text>
      </View>
    );
  }, [loading, textStyles]);

  return (
    <OptimizedTouchable
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      enableHaptics={enableHaptics}
      trackPerformance={trackPerformance}
      // Accessibility
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      <View style={styles.buttonContent}>
        {iconPosition === 'left' && iconComponent}
        {loading ? loadingComponent : (
          <Text style={textStyles} numberOfLines={1}>
            {title}
          </Text>
        )}
        {iconPosition === 'right' && iconComponent}
      </View>
    </OptimizedTouchable>
  );
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility minimum touch target
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
    elevation: Platform.OS === 'android' ? 1 : 0,
  },
  androidButton: {
    // Android-specific optimizations
    overflow: 'hidden', // Ensures ripple effect stays within bounds
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: THEME.iconSpacing,
  },
  iconRight: {
    marginLeft: THEME.iconSpacing,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    opacity: 0.7,
  },
});

OptimizedButton.displayName = 'OptimizedButton';

export default OptimizedButton;