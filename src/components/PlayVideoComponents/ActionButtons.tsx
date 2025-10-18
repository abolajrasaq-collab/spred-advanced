import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from '../Icon/Icon';

const COLORS = {
  surface: '#2A2A2A',
  border: '#333333',
  text: '#FFFFFF',
} as const;

const SPACING = {
  sm: 8,
  md: 16,
} as const;

interface ActionButtonsProps {
  onPlayTrailer: () => void;
  onDownloadPress: () => void;
  onWatchLaterPress: () => void;
  onSavePress: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onPlayTrailer,
  onDownloadPress,
  onWatchLaterPress,
  onSavePress,
}) => {
  return (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPlayTrailer}
        activeOpacity={0.7}
      >
        <Icon name="play-arrow" size={18} color={COLORS.text} />
        <Text style={styles.actionButtonText}>TRAILER</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onWatchLaterPress}
        activeOpacity={0.7}
      >
        <Icon name="watch-later" size={18} color={COLORS.text} />
        <Text style={styles.actionButtonText}>WATCH LATER</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onSavePress}
        activeOpacity={0.7}
      >
        <Icon name="bookmark" size={18} color={COLORS.text} />
        <Text style={styles.actionButtonText}>SAVE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default ActionButtons;
