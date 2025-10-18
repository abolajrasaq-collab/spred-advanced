import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native';

const COLORS = {
  primary: '#F45303',
  surface: '#2A2A2A',
  text: '#FFFFFF',
} as const;

const SPACING = {
  md: 16,
  lg: 20,
} as const;

interface MainActionButtonsProps {
  onDownloadPress: () => void;
  onSpredPress: () => void;
}

const MainActionButtons: React.FC<MainActionButtonsProps> = ({
  onDownloadPress,
  onSpredPress,
}) => {
  return (
    <View style={styles.mainButtonsRow}>
      <TouchableOpacity style={styles.downloadButton} onPress={onDownloadPress}>
        <Text style={styles.downloadButtonText}>DOWNLOAD</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.spredButton} onPress={onSpredPress}>
        <Text style={styles.spredButtonText}>SPRED</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  downloadButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spredButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  spredButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default MainActionButtons;
