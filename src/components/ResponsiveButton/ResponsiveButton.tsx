import React, { memo, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';

interface ResponsiveButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  onLongPress?: (event: GestureResponderEvent) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  width?: string | number;
  height?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '600' | '700';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  animated?: boolean;
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  title,
  onPress,
  onLongPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  width,
  height,
  borderRadius,
  fontSize,
  fontWeight = '600',
  backgroundColor,
  textColor,
  borderColor,
  icon,
  iconPosition = 'left',
  testID,
  style,
  textStyle,
  hapticFeedback = false,
  animated = false,
}) => {
  const colors = useThemeColors();
  const spacing = useSpacing();

  // Size configurations for optimal touch targets
  const sizeConfig = {
    small: {
      height: 40, // Minimum touch target size
      fontSize: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    medium: {
      height: 48, // Recommended touch target size
      fontSize: 16,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    large: {
      height: 56, // Large touch target for accessibility
      fontSize: 18,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  };

  const currentSize = sizeConfig[size];

  // Get variant styles
  const getVariantStyles = useCallback(() => {
    const defaultBg = backgroundColor || colors.primary;
    const defaultText = textColor || colors.text;
    const defaultBorder = borderColor || defaultBg;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: defaultBg,
          borderColor: defaultBg,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: defaultBorder,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: defaultBg,
          borderColor: defaultBg,
          borderWidth: 0,
        };
    }
  }, [variant, backgroundColor, textColor, borderColor, colors]);

  // Get text color based on variant
  const getTextColor = useCallback(() => {
    if (textColor) {
      return textColor;
    }

    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'outline':
        return backgroundColor || colors.primary;
      case 'ghost':
        return colors.textSecondary;
      default:
        return '#FFFFFF';
    }
  }, [variant, textColor, backgroundColor, colors]);

  // Optimized press handler with haptic feedback
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled || loading || !onPress) {
        return;
      }

      if (hapticFeedback && Platform.OS === 'ios') {
        // Simple haptic feedback for iOS
        // You can enhance this with react-native-haptic-feedback if needed
      }

      try {
        onPress(event);
      } catch (error) {
        if (__DEV__) {
          console.warn('Button press error:', error);
        }
      }
    },
    [disabled, loading, onPress, hapticFeedback],
  );

  // Optimized long press handler
  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled || loading || !onLongPress) {
        return;
      }

      if (hapticFeedback && Platform.OS === 'ios') {
        // Enhanced haptic feedback for long press
      }

      try {
        onLongPress(event);
      } catch (error) {
        if (__DEV__) {
          console.warn('Button long press error:', error);
        }
      }
    },
    [disabled, loading, onLongPress, hapticFeedback],
  );

  // Button styles
  const buttonStyle: ViewStyle = {
    width: width || '100%',
    height: height || currentSize.height,
    ...getVariantStyles(),
    borderRadius: borderRadius || 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled || loading ? 0.6 : 1,
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    ...style,
  };

  // Text styles
  const buttonTextStyle: TextStyle = {
    fontSize: fontSize || currentSize.fontSize,
    fontWeight,
    color: getTextColor(),
    textAlign: 'center',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={buttonStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      hitSlop={{
        top: 4,
        bottom: 4,
        left: 4,
        right: 4,
      }}
      delayPressIn={Platform.OS === 'ios' ? 0 : 50}
      delayPressOut={0}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={styles.loadingIndicator}
        />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <View style={styles.iconLeft}>{icon}</View>
      )}

      <Text style={buttonTextStyle}>{loading ? '' : title}</Text>

      {!loading && icon && iconPosition === 'right' && (
        <View style={styles.iconRight}>{icon}</View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingIndicator: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

// Memoize for performance
export default memo(ResponsiveButton);

export type { ResponsiveButtonProps };
