import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import CustomText from '../CustomText/CustomText';
import Icon from '../Icon/Icon';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';

interface StreamingHeaderProps {
  title?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
  showProfile?: boolean;
  rightActions?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'transparent';
}

const StreamingHeader: React.FC<StreamingHeaderProps> = ({
  title,
  onBack,
  onSearch,
  onProfile,
  showProfile = true,
  rightActions,
  variant = 'default',
}) => {
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const getHeaderStyle = () => {
    const baseStyle = {
      paddingTop: (StatusBar.currentHeight || 44) + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    };

    switch (variant) {
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'transparent':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.interactive.border,
        };
    }
  };

  return (
    <View style={getHeaderStyle()}>
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    variant === 'transparent'
                      ? 'rgba(0, 0, 0, 0.5)'
                      : 'transparent',
                },
              ]}
              activeOpacity={0.7}
            >
              <Icon
                name="back"
                size="md"
                color={
                  variant === 'transparent'
                    ? colors.text.primary
                    : colors.interactive.primary
                }
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <CustomText
                fontSize={20}
                fontWeight="800"
                color={colors.interactive.primary}
                style={styles.logo}
              >
                SPRED
              </CustomText>
            </View>
          )}

          {title && (
            <CustomText
              fontSize={18}
              fontWeight="700"
              color={colors.text.primary}
              style={[styles.title, { marginLeft: onBack ? spacing.md : 0 }]}
              numberOfLines={1}
            >
              {title}
            </CustomText>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightActions || (
            <>
              {onSearch && (
                <TouchableOpacity
                  onPress={onSearch}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        variant === 'transparent'
                          ? 'rgba(0, 0, 0, 0.5)'
                          : 'transparent',
                      marginRight: spacing.sm,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon name="search" size="md" color={colors.text.primary} />
                </TouchableOpacity>
              )}

              {showProfile && onProfile && (
                <TouchableOpacity
                  onPress={onProfile}
                  style={[
                    styles.profileButton,
                    {
                      backgroundColor:
                        variant === 'transparent'
                          ? 'rgba(0, 0, 0, 0.5)'
                          : colors.background.secondary,
                      borderColor: colors.interactive.primary,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="user"
                    size="sm"
                    color={colors.interactive.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    paddingVertical: 4,
  },
  logo: {
    letterSpacing: 2,
  },
  title: {
    flex: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default StreamingHeader;
export type { StreamingHeaderProps };
