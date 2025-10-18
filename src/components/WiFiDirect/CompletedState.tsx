import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CompletedStateProps {
  incomingFile: string;
  onClose: () => void;
}

const CompletedState: React.FC<CompletedStateProps> = ({
  incomingFile,
  onClose,
}) => {
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.iconContainer, styles.completedIcon]}>
        <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.stateTitle}>Transfer Completed!</Text>
      <Text style={styles.fileName}>
        {incomingFile ? incomingFile : 'File received'}
      </Text>
      <Text style={styles.stateSubtitle}>
        File saved to your Downloads folder
      </Text>
      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <MaterialIcons name="done" size={20} color="#FFFFFF" />
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Different background color
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
  stateSubtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default CompletedState;
