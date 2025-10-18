import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ConnectingStateProps {
  connectionStatus: string;
}

const ConnectingState: React.FC<ConnectingStateProps> = ({ connectionStatus }) => {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#F45303" />
      </View>
      <Text style={styles.stateTitle}>Establishing Connection</Text>
      <Text style={styles.stateSubtitle}>{connectionStatus ? connectionStatus : 'Connecting with sender...'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  stateContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
export default ConnectingState;