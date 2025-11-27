/**
 * Permission Status Component
 * Shows current permission status and allows users to manage permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UniversalPermissionManager, { AppPermissionStatus } from '../../services/UniversalPermissionManager';
import logger from '../../utils/logger';

interface PermissionStatusProps {
  onClose?: () => void;
}

const PermissionStatus: React.FC<PermissionStatusProps> = ({ onClose }) => {
  const [permissionStatus, setPermissionStatus] = useState<AppPermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const permissionManager = UniversalPermissionManager.getInstance();

  // Load permission status
  const loadPermissionStatus = async () => {
    try {
      setLoading(true);
      const status = await permissionManager.getPermissionStatus();
      setPermissionStatus(status);
      logger.info('📊 Permission status loaded:', status);
    } catch (error) {
      logger.error('❌ Failed to load permission status:', error);
      Alert.alert('Error', 'Failed to load permission status');
    } finally {
      setLoading(false);
    }
  };

  // Refresh permission status
  const refreshPermissionStatus = async () => {
    try {
      setRefreshing(true);
      await loadPermissionStatus();
    } finally {
      setRefreshing(false);
    }
  };

  // Request permissions again
  const retryPermissions = async () => {
    try {
      Alert.alert(
        'Request Permissions',
        'This will request all missing permissions again. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request',
            onPress: async () => {
              setLoading(true);
              try {
                const result = await permissionManager.initializePermissions();
                setPermissionStatus(result);
                
                if (result.allGranted) {
                  Alert.alert('Success', 'All permissions granted!');
                } else if (result.criticalGranted) {
                  Alert.alert('Partial Success', 'Core permissions granted. Some features may be limited.');
                } else {
                  Alert.alert('Limited Access', 'Some critical permissions are still missing.');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to request permissions');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error('❌ Failed to retry permissions:', error);
    }
  };

  // Open app settings
  const openSettings = async () => {
    try {
      await permissionManager.openAppSettings();
    } catch (error) {
      Alert.alert('Error', 'Could not open settings');
    }
  };

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  if (loading && !permissionStatus) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Permission Status</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading permission status...</Text>
        </View>
      </View>
    );
  }

  const getStatusIcon = (granted: boolean) => {
    return granted ? 'check-circle' : 'error';
  };

  const getStatusColor = (granted: boolean) => {
    return granted ? '#4CAF50' : '#F44336';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Permission Status</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshPermissionStatus} />
        }
      >
        {/* Overall Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Status</Text>
          
          <View style={styles.statusItem}>
            <MaterialIcons
              name={getStatusIcon(permissionStatus?.allGranted || false)}
              size={24}
              color={getStatusColor(permissionStatus?.allGranted || false)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>All Permissions</Text>
              <Text style={styles.statusDescription}>
                {permissionStatus?.allGranted ? 'All permissions granted' : 'Some permissions missing'}
              </Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <MaterialIcons
              name={getStatusIcon(permissionStatus?.criticalGranted || false)}
              size={24}
              color={getStatusColor(permissionStatus?.criticalGranted || false)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Critical Permissions</Text>
              <Text style={styles.statusDescription}>
                {permissionStatus?.criticalGranted ? 'Core functionality available' : 'Limited functionality'}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Availability</Text>
          
          <View style={styles.statusItem}>
            <MaterialIcons
              name={getStatusIcon(permissionStatus?.canUseCoreFeatures || false)}
              size={24}
              color={getStatusColor(permissionStatus?.canUseCoreFeatures || false)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Core Features</Text>
              <Text style={styles.statusDescription}>
                Basic app functionality
              </Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <MaterialIcons
              name={getStatusIcon(permissionStatus?.canUseP2P || false)}
              size={24}
              color={getStatusColor(permissionStatus?.canUseP2P || false)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>P2P Sharing</Text>
              <Text style={styles.statusDescription}>
                Device-to-device video sharing
              </Text>
            </View>
          </View>

          <View style={styles.statusItem}>
            <MaterialIcons
              name={getStatusIcon(permissionStatus?.canAccessFiles || false)}
              size={24}
              color={getStatusColor(permissionStatus?.canAccessFiles || false)}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>File Access</Text>
              <Text style={styles.statusDescription}>
                Access to photos and videos
              </Text>
            </View>
          </View>
        </View>

        {/* Missing Permissions */}
        {(permissionStatus?.missingCritical.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missing Critical Permissions</Text>
            {permissionStatus?.missingCritical.map((permission, index) => (
              <View key={index} style={styles.missingItem}>
                <MaterialIcons name="warning" size={20} color="#FF9800" />
                <Text style={styles.missingText}>{permission}</Text>
              </View>
            ))}
          </View>
        )}

        {(permissionStatus?.missingOptional.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missing Optional Permissions</Text>
            {permissionStatus?.missingOptional.map((permission, index) => (
              <View key={index} style={styles.missingItem}>
                <MaterialIcons name="info" size={20} color="#2196F3" />
                <Text style={styles.missingText}>{permission}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={retryPermissions}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Request Permissions Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={openSettings}>
            <MaterialIcons name="settings" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Open App Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={refreshPermissionStatus}>
            <MaterialIcons name="sync" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help</Text>
          <Text style={styles.helpText}>
            • Location permissions are required for P2P device discovery{'\n'}
            • File permissions are needed to access your photos and videos{'\n'}
            • Camera permission is optional for QR code scanning{'\n'}
            • You can manually enable permissions in Settings {'>'} Apps {'>'} SPRED {'>'} Permissions
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  missingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  missingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F45303',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
  },
});

export default PermissionStatus;