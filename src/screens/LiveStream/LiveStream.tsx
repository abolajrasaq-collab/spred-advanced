import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LiveStreamPlayer from '../../components/LiveStreamPlayer/LiveStreamPlayer';

interface LiveStreamRouteParams {
  streamUrl: string;
  channelInfo: {
    channelName: string;
    category: string;
    estimatedViewers: number;
  };
}

interface LiveStreamProps {
  route: {
    params?: LiveStreamRouteParams;
  };
}

const LiveStream: React.FC<LiveStreamProps> = ({ route }) => {
  const { streamUrl, channelInfo } = route.params || {};

  return (
    <View style={styles.container}>
      <LiveStreamPlayer streamUrl={streamUrl} channelInfo={channelInfo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
});

export default LiveStream;
