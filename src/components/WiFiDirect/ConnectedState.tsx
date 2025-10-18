import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ConnectedStateProps {
  connectionStatus: string;
}

const ConnectedState: React.FC<ConnectedStateProps> = ({ connectionStatus }) => {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <MaterialIcons name