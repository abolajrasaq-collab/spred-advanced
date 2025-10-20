/**
 * PermissionIntegrationExample - Example of integrating permissions into existing screens
 * 
 * This shows how to add permission checking and automatic requests to existing components
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import usePermissions from '../hooks/usePermissions';
import PermissionStatusIndicator from '../components/PermissionStatusIndicator';
import PermissionSetup from '../components/PermissionSetup';

// Example: Integrating permissions into a file sharing screen
export const FileShareScreenExample: React.FC = () => {
  const [showPermissionSetup, setShowPermissionSetup] = useState(false);
  const { hasCriticalPermissions, canUseFeature, requestPermissions } = usePermissions();

  const handleShareFile = async () => {
    // Check if we have the necessary permissions
    if (!canUseFeature('files')) {
      Alert.alert(
        'Permission Required',
        'File access permission is needed to share files.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permission', 
            onPress: async () => {
              const success = await requestPermissions();
              if (success) {
                // Retry the action
                handleShareFile();
              } else {
                setShowPermissionSetup(true);
              }
            }
          },
        ]
      );
      return;
    }

    // Proceed with file sharing
    console.log('📁 Sharing file...');
  };

  const handleNearbyShare = async () => {
    // Check if we have nearby sharing permissions
    if (!canUseFeature('nearby')) {
      Alert.alert(
        'Permission Required',
        'Location and nearby device permissions are needed for WiFi Direct sharing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permission', 
            onPress: async () => {
              const success = await requestPermissions();
              if (success) {
                handleNearbyShare();
              } else {
                setShowPermissionSetup(true);
              }
            }
          },
        ]
      );
      return;
    }

    // Proceed with nearby sharing
    console.log('📡 Starting nearby share...');
  };

  if (showPermissionSetup) {
    return (
      <PermissionSetup
        title="Enable Sharing Features"
        subtitle="Grant permissions to share files with nearby devices"
        onComplete={(success) => {
          setShowPermissionSetup(false);
          if (success) {
            Alert.alert('Success!', 'All permissions granted. You can now use all sharing features.');
          }
        }}
        onSkip={() => setShowPermissionSetup(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>File Sharing</Text>
      
      {/* Permission status indicator */}
      <PermissionStatusIndicator 
        onPermissionChange={(hasPermissions) => {
          console.log('Permission status changed:', hasPermissions);
        }}
      />

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            !canUseFeature('files') && styles.disabledButton
          ]}
          onPress={handleShareFile}
        >
          <Icon name="folder" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Share File</Text>
          {!canUseFeature('files') && (
            <Icon name="lock" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            !canUseFeature('nearby') && styles.disabledButton
          ]}
          onPress={handleNearbyShare}
        >
          <Icon name="wifi" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Nearby Share</Text>
          {!canUseFeature('nearby') && (
            <Icon name="lock" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.setupButton}
        onPress={() => setShowPermissionSetup(true)}
      >
        <Icon name="settings" size={20} color="#2196F3" />
        <Text style={styles.setupText}>Setup Permissions</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example: Simple permission check hook for any component
export const useFeatureAccess = (feature: 'nearby' | 'files' | 'location' | 'bluetooth') => {
  const { canUseFeature, requestPermissions } = usePermissions();
  
  const checkAndRequest = async (): Promise<boolean> => {
    if (canUseFeature(feature)) {
      return true;
    }
    
    const success = await requestPermissions();
    return success && canUseFeature(feature);
  };

  return {
    available: canUseFeature(feature),
    checkAndRequest,
  };
};

// Example: HOC for wrapping components that need permissions
export const withPermissions = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeatures: ('nearby' | 'files' | 'location' | 'bluetooth')[]
) => {
  return (props: P) => {
    const { canUseFeature } = usePermissions();
    const [showSetup, setShowSetup] = useState(false);
    
    const hasRequiredPermissions = requiredFeatures.every(feature => canUseFeature(feature));
    
    if (!hasRequiredPermissions && !showSetup) {
      return (
        <View style={styles.permissionWrapper}>
          <Icon name="security" size={48} color="#2196F3" />
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionMessage}>
            This feature requires additional permissions to work properly.
          </Text>
          <TouchableOpacity 
            style={styles.enableButton}
            onPress={() => setShowSetup(true)}
          >
            <Text style={styles.enableButtonText}>Enable Permissions</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (showSetup) {
      return (
        <PermissionSetup
          onComplete={() => setShowSetup(false)}
          onSkip={() => setShowSetup(false)}
        />
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    gap: 8,
  },
  setupText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  permissionWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F5F5',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FileShareScreenExample;