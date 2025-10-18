import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import CustomText from '../CustomText/CustomText';
import Icon from '../Icon/Icon';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  iconColor?: string;
  textColor?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  iconColor,
  textColor,
}) => {
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      opacity: disabled ? 0.6 : 1,
    };

    // Size variants
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing.xs;
        baseStyle.paddingHorizontal = spacing.sm;
        baseStyle.minHeight = 36;
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.lg;
        baseStyle.minHeight = 52;
        break;
      default: // md
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        baseStyle.minHeight = 44;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.interactive.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = colors.interactive.secondary;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.interactive.border;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.interactive.border;
        break;
    }

    return baseStyle;
  };

  const getIconColor = () => {
    if (iconColor) {
      return iconColor;
    }

    switch (variant) {
      case 'primary':
        return colors.text.primary;
      case 'secondary':
        return colors.text.secondary;
      case 'ghost':
        return colors.text.accent;
      default:
        return colors.text.primary;
    }
  };

  const getTextColor = () => {
    if (textColor) {
      return textColor;
    }

    switch (variant) {
      case 'primary':
        return colors.text.primary;
      case 'secondary':
        return colors.text.secondary;
      case 'ghost':
        return colors.text.accent;
      default:
        return colors.text.primary;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      default:
        return 'md';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 11;
      case 'lg':
        return 16;
      default:
        return 13;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Icon
        name={icon as any}
        size={getIconSize() as any}
        color={getIconColor()}
        style={{ marginBottom: spacing.xs }}
      />
      <CustomText
        fontSize={getFontSize()}
        fontWeight="600"
        color={getTextColor()}
        style={styles.label}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ActionButton;
export type { ActionButtonProps };
