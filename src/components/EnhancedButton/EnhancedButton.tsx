/**
 * Enhanced Button Component
 * Provides a robust, accessible, and customizable button component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

export interface EnhancedButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  loadingText,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: '#F45303',
        borderColor: '#F45303',
      },
      secondary: {
        backgroundColor: '#D69E2E',
        borderColor: '#D69E2E',
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#8B8B8B',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: '#E53E3E',
        borderColor: '#E53E3E',
      },
    };

    // Disabled styles
    const disabledStyle: ViewStyle = isDisabled
      ? {
          backgroundColor: '#444444',
          borderColor: '#444444',
          opacity: 0.6,
        }
      : {};

    // Full width style
    const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...fullWidthStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size text styles
    const sizeTextStyles: Record<string, TextStyle> = {
      small: {
        fontSize: 14,
      },
      medium: {
        fontSize: 16,
      },
      large: {
        fontSize: 18,
      },
    };

    // Variant text styles
    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: '#8B8B8B',
      },
      ghost: {
        color: '#8B8B8B',
      },
      danger: {
        color: '#FFFFFF',
      },
    };

    // Disabled text style
    const disabledTextStyle: TextStyle = isDisabled
      ? {
          color: '#999999',
        }
      : {};

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...disabledTextStyle,
      ...textStyle,
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#8B8B8B' : '#FFFFFF'}
            style={{ marginRight: 8 }}
          />
          <Text style={getTextStyle()}>
            {loadingText || 'Loading...'}
          </Text>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <>{icon}</>
        )}
        <Text style={getTextStyle()}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <>{icon}</>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={loading ? 'Loading' : 'Tap to perform action'}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default EnhancedButton;
