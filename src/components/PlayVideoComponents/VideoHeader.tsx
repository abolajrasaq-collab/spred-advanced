import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../Icon/Icon';

const COLORS = {
  text: '#FFFFFF',
} as const;

const SPACING = {
  md: 16,
} as const;

interface VideoHeaderProps {
  isVideoFullscreen?: boolean;
}

const VideoHeader: React.FC<VideoHeaderProps> = ({
  isVideoFullscreen = false,
}) => {
  const navigation = useNavigation();

  if (isVideoFullscreen) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      activeOpacity={0.7}
    >
      <Icon name="arrow-left" size={24} color={COLORS.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 80,
    left: SPACING.md,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoHeader;
