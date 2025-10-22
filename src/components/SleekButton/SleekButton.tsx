/**
 * SleekButton - A polished, Android12Button-inspired component
 *
 * Features:
 * - ✅ Sleek, modern design with subtle shadows and rounded corners
 * - ✅ Smooth animations and state transitions
 * - ✅ Multiple variants (primary, secondary, outline, ghost)
 * - ✅ Size variants (small, medium, large)
 * - ✅ Icon support with proper spacing
 * - ✅ Loading states with spinner
 * - ✅ Disabled state handling
 * - ✅ Ripple effects on Android
 * - ✅ Optimized for performance
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Android12CompatibleTouchable from '../Android12CompatibleTouchable/Android12CompatibleTouchable';

export interface SleekButtonProps {
  // Content
  title: string;
  onPress: () => void;

  // Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;

  // Behavior
  disabled?: boolean;
  loading?: boolean;

  // Icon
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  iconPosition?: 'left' | 'right';

  // Size variants
  size?: 'small' | 'medium' | 'large';

  // Style variants
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';

  // Animation
  enableScaleAnimation?: boolean;
  scaleAmount?: number;
}

const SleekButton: React.FC<SleekButtonProps> = memo(({
  title,
  onPress,
  style,
  textStyle,
  backgroundColor = '#F45303',
  textColor = '#FFFFFF',
  disabled = false,
  loading = false,
  iconName,
  iconSize = 20,
  iconColor,
  iconPosition = 'left',
  size = 'medium',
  variant = 'primary',
  enableScaleAnimation = true,
  scaleAmount = 0.98,
}) => {
  const [pressed, setPressed] = useState(false);

  // Handle press events
  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      setPressed(true);
    }
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    if (!disabled && !loading) {
      setPressed(false);
    }
  }, [disabled, loading]);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  // Get size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          borderRadius: 6,
        };
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          fontSize: 18,
          borderRadius: 12,
        };
      default: // medium
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          fontSize: 16,
          borderRadius: 8,
        };
    }
  };

  // Get variant-based styles
  const getVariantStyles = () => {
    const baseStyles = {
      backgroundColor,
      borderColor: backgroundColor,
      borderWidth: 1,
    };

    switch (variant) {
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: '#6C757D',
          borderColor: '#6C757D',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: backgroundColor,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#F44336',
          borderColor: '#F44336',
        };
      default: // primary
        return baseStyles;
    }
  };

  // Get disabled styles
  const getDisabledStyles = () => {
    if (disabled || loading) {
      return {
        backgroundColor: '#CCCCCC',
        borderColor: '#CCCCCC',
        opacity: 0.6,
      };
    }
    return {};
  };

  // Get pressed styles
  const getPressedStyles = () => {
    if (pressed && enableScaleAnimation) {
      return {
        transform: [{ scale: scaleAmount }],
      };
    }
    return {};
  };

  // Combine all styles
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const disabledStyles = getDisabledStyles();
  const pressedStyles = getPressedStyles();

  const buttonStyles = [
    styles.button,
    {
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      borderRadius: sizeStyles.borderRadius,
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
      ...disabledStyles,
    },
    pressedStyles,
    style,
  ];

  const buttonTextStyles = [
    styles.buttonText,
    {
      fontSize: sizeStyles.fontSize,
      color: variant === 'outline' || variant === 'ghost' ? backgroundColor : textColor,
    },
    textStyle,
  ];

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? backgroundColor : textColor}
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {iconName && iconPosition === 'left' && (
          <MaterialIcons
            name={iconName as any}
            size={iconSize}
            color={iconColor || (variant === 'outline' || variant === 'ghost' ? backgroundColor : textColor)}
            style={styles.leftIcon}
          />
        )}
        <Text style={buttonTextStyles} numberOfLines={1}>
          {title}
        </Text>
        {iconName && iconPosition === 'right' && (
          <MaterialIcons
            name={iconName as any}
            size={iconSize}
            color={iconColor || (variant === 'outline' || variant === 'ghost' ? backgroundColor : textColor)}
            style={styles.rightIcon}
          />
        )}
      </View>
    );
  };

  return (
    <Android12CompatibleTouchable
      style={buttonStyles as any}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={enableScaleAnimation ? 0.9 : 0.8}
    >
      {renderContent()}
    </Android12CompatibleTouchable>
  );
});

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS accessibility
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default SleekButton;