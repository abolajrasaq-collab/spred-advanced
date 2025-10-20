/**
 * PermissionSetup - User-friendly permission setup component
 * 
 * This component provides an intuitive interface for users to grant
 * required permissions with automatic requests and direct settings links.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AutoPermissionManager, { PermissionGuide } from '../utils/AutoPermissionManager';
import { PermissionSummary } from '../utils/SafePermissionManager';
import logger from '../utils/logger';

interface PermissionSetupProps {
  onComplete?: (success: boolean) => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
  title?: string;
  subtitle?: string;
}

interface PermissionItemProps {
  guide: PermissionGuide;
  status: 'granted' | 'denied' | 'unknown';
  onRequest: () => Promise<void>;
  onOpenSettings: () => Promise<void>;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  guide,
  status,
  onRequest,
  onOpenSettings,
}) => {
  const [requesting, setRequesting] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'granted':
        return <Icon name="check-circle" size={24} color="#4CAF50" />;
      case 'denied':
        return <Icon name="error" size={24} color="#F44336" />;
      default:
        return <Icon name="help" size={24} color="#FF9800" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'granted':
        return '#4CAF50';
      case 'denied':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const handleRequest = async () => {
    try {
      setRequesting(true);
      await onRequest();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.permissionItem}>
      <View style={styles.permissionHeader}>
        <View style={styles.permissionInfo}>
          {getStatusIcon()}
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>{guide.title}</Text>
            <Text style={styles.permissionDescription}>{guide.description}</Text>
          </View>
        </View>
        <View style={styles.permissionActions}>
          {status !== 'granted' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.requestButton]}
                onPress={handleRequest}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="security" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Grant</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.settingsButton]}
                onPress={onOpenSettings}
              >
                <Icon name="settings" size={16} color="#2196F3" />
                <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {guide.importance === 'critical' && status !== 'granted' && (
        <View style={styles.criticalBanner}>
          <Icon name="warning" size={16} color="#FF9800" />
          <Text style={styles.criticalText}>Required for core functionality</Text>
        </View>
      )}
    </View>
  );
};

export const PermissionSetup: React.FC<PermissionSetupProps> = ({
  onComplete,
  onSkip,
  showSkipOption = true,
  title = 'Setup Permissions',
  subtitle = 'SPRED needs these permissions to share files between devices',
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PermissionSummary | null>(null);
  const [guides, setGuides] = useState<PermissionGuide[]>([]);
  const [canProceed, setCanProceed] = useState(false);
  const [autoPermissionManager] = useState(() => AutoPermissionManager.getInstance());

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = async () => {
    try {
      setLoading(true);
      const status = await autoPermissionManager.getPermissionStatus();
      setSummary(status.summary);
      setGuides(status.guides);
      setCanProceed(status.canProceed);
    } catch (error) {
      logger.error('❌ Error loading permission status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAll = async () => {
    try {
      setLoading(true);
      const result = await autoPermissionManager.requestAllPermissions();
      
      if (result.success) {
        await loadPermissionStatus();
        
        if (result.denied.length === 0) {
          Alert.alert(
            'Success!',
            'All permissions have been granted. You can now use all features of SPRED.',
            [{ text: 'Continue', onPress: () => onComplete?.(true) }]
          );
        }
      }
    } catch (error) {
      logger.error('❌ Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSingle = async (permission: string) => {
    try {
      const result = await autoPermissionManager.requestAllPermissions();
      await loadPermissionStatus();
    } catch (error) {
      logger.error('❌ Error requesting single permission:', error);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await autoPermissionManager.openAppSettings();
      
      // Show instructions
      Alert.alert(
        'Enable Permissions',
        'In the Settings app:\n\n1. Find "Permissions" section\n2. Enable the required permissions\n3. Return to SPRED\n\nTap "Refresh" when you\'re done.',
        [
          { text: 'Refresh', onPress: loadPermissionStatus },
          { text: 'Later', style: 'cancel' },
        ]
      );
    } catch (error) {
      logger.error('❌ Error opening settings:', error);
    }
  };

  const handleComplete = () => {
    if (canProceed) {
      onComplete?.(true);
    } else {
      Alert.alert(
        'Missing Permissions',
        'Some critical permissions are still missing. The app may not work properly without them.\n\nDo you want to continue anyway?',
        [
          { text: 'Grant Permissions', onPress: handleRequestAll },
          { text: 'Continue Anyway', onPress: () => onComplete?.(false) },
        ]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permission Setup?',
      'Without proper permissions, you may not be able to:\n\n• Share files with nearby devices\n• Access your photos and videos\n• Use WiFi Direct features\n\nYou can enable permissions later in Settings.',
      [
        { text: 'Setup Now', style: 'cancel' },
        { text: 'Skip', onPress: () => onSkip?.() },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  const criticalGuides = guides.filter(guide => guide.importance === 'critical');
  const optionalGuides = guides.filter(guide => guide.importance !== 'critical');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Icon name="security" size={48} color="#2196F3" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {summary && (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon 
              name={canProceed ? "check-circle" : "warning"} 
              size={24} 
              color={canProceed ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={styles.statusTitle}>
              {canProceed ? 'Ready to Go!' : 'Permissions Needed'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {canProceed 
              ? 'All critical permissions are granted. You can use all features.'
              : `${summary.statuses.filter(s => s.status !== 'granted').length} permission(s) need to be enabled.`
            }
          </Text>
        </View>
      )}

      {criticalGuides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Permissions</Text>
          {criticalGuides.map((guide) => {
            const status = summary?.statuses.find(s => s.permission === guide.permission);
            return (
              <PermissionItem
                key={guide.permission}
                guide={guide}
                status={status?.status || 'unknown'}
                onRequest={() => handleRequestSingle(guide.permission)}
                onOpenSettings={handleOpenSettings}
              />
            );
          })}
        </View>
      )}

      {optionalGuides.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Permissions</Text>
          {optionalGuides.map((guide) => {
            const status = summary?.statuses.find(s => s.permission === guide.permission);
            return (
              <PermissionItem
                key={guide.permission}
                guide={guide}
                status={status?.status || 'unknown'}
                onRequest={() => handleRequestSingle(guide.permission)}
                onOpenSettings={handleOpenSettings}
              />
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, canProceed && styles.successButton]}
          onPress={handleComplete}
        >
          <Icon 
            name={canProceed ? "check" : "arrow-forward"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.primaryButtonText}>
            {canProceed ? 'Continue' : 'Continue Anyway'}
          </Text>
        </TouchableOpacity>

        {!canProceed && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRequestAll}
          >
            <Icon name="security" size={20} color="#2196F3" />
            <Text style={styles.secondaryButtonText}>Grant All Permissions</Text>
          </TouchableOpacity>
        )}

        {showSkipOption && (
          <TouchableOpacity
            style={styles.textButton}
            onPress={handleSkip}
          >
            <Text style={styles.textButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  permissionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  permissionInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  permissionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  requestButton: {
    backgroundColor: '#2196F3',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  criticalText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  textButtonText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default PermissionSetup;