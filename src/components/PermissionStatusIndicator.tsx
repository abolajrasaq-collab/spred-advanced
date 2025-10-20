/**
 * PermissionStatusIndicator - Simple permission status display
 * 
 * Shows current permission status and provides quick access to enable them
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import usePermissions from '../hooks/usePermissions';

interface PermissionStatusIndicatorProps {
  compact?: boolean;
  showActions?: boolean;
  onPermissionChange?: (hasPermissions: boolean) => void;
}

export const PermissionStatusIndicator: React.FC<PermissionStatusIndicatorProps> = ({
  compact = false,
  showActions = true,
  onPermissionChange,
}) => {
  const {
    loading,
    hasCriticalPermissions,
    canUseFeature,
    requestPermissions,
    openSettings,
  } = usePermissions();

  React.useEffect(() => {
    onPermissionChange?.(hasCriticalPermissions);
  }, [hasCriticalPermissions, onPermissionChange]);

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compact]}>
        <Icon name="hourglass-empty" size={16} color="#666666" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (hasCriticalPermissions) {
    return compact ? (
      <View style={[styles.container, styles.compact, styles.success]}>
        <Icon name="check-circle" size={16} color="#4CAF50" />
        <Text style={styles.successText}>Ready</Text>
      </View>
    ) : null; // Don't show when everything is working
  }

  const nearbyAvailable = canUseFeature('nearby');
  const filesAvailable = canUseFeature('files');

  return (
    <View style={[styles.container, compact && styles.compact, styles.warning]}>
      <Icon name="warning" size={16} color="#FF9800" />
      <View style={styles.content}>
        <Text style={styles.warningText}>
          {compact 
            ? 'Permissions needed'
            : 'Some permissions are missing'
          }
        </Text>
        {!compact && (
          <Text style={styles.detailText}>
            {!nearbyAvailable && !filesAvailable 
              ? 'Nearby sharing and file access unavailable'
              : !nearbyAvailable 
              ? 'Nearby sharing unavailable'
              : 'File access limited'
            }
          </Text>
        )}
      </View>
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={requestPermissions}
          >
            <Icon name="security" size={14} color="#2196F3" />
            <Text style={styles.actionText}>Grant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openSettings}
          >
            <Icon name="settings" size={14} color="#666666" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  compact: {
    padding: 8,
    marginVertical: 2,
  },
  success: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#4CAF50',
  },
  warning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  detailText: {
    fontSize: 12,
    color: '#BF360C',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});

export default PermissionStatusIndicator;