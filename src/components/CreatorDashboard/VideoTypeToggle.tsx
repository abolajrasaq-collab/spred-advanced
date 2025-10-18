import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type VideoType = 'video' | 'short' | 'livestream';

interface VideoTypeToggleProps {
  selectedType: VideoType;
  onTypeChange: (type: VideoType) => void;
}

const VideoTypeToggle: React.FC<VideoTypeToggleProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const toggleOptions: { type: VideoType; label: string }[] = [
    { type: 'video', label: 'Uploaded Videos' },
    { type: 'short', label: 'Uploaded Shorts' },
    { type: 'livestream', label: 'Livestreams' },
  ];

  return (
    <View style={styles.container}>
      {toggleOptions.map(option => (
        <TouchableOpacity
          key={option.type}
          style={[
            styles.toggleButton,
            {
              backgroundColor:
                selectedType === option.type ? '#F45303' : '#2A2A2A',
              borderColor: '#333333',
            },
          ]}
          onPress={() => onTypeChange(option.type)}
        >
          <Text
            style={[
              styles.toggleText,
              {
                color: selectedType === option.type ? '#FFFFFF' : '#FFFFFF',
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 4,
    marginVertical: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VideoTypeToggle;
