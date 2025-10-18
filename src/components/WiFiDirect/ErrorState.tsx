import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  onClose: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorMessage, onRetry, onClose }) => {
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.iconContainer, styles.errorIcon]}>
        <MaterialIcons name="error" size={64} color="#FF5252" />
      </View>
      <Text style={styles.stateTitle}>Transfer Failed</Text>
      <Text style={styles.stateSubtitle}>{errorMessage ? errorMessage : "An error occurred during transfer."}</Text>
      <View style={styles.errorActions}>
        <TouchableOpacity