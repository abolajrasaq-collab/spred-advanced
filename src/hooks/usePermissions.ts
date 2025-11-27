/**
 * usePermissions - React hook for permission management
 * 
 * This hook provides a simple interface to manage permissions throughout the app
 */

import { useState, useEffect, useCallback } from 'react';
import AutoPermissionManager from '../utils/AutoPermissionManager';
import { PermissionSummary } from '../utils/SafePermissionManager';
import logger from '../utils/logger';

export interface UsePermissionsResult {
  // Status
  loading: boolean;
  hasPermissions: boolean;
  hasCriticalPermissions: boolean;
  summary: PermissionSummary | null;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  openSettings: () => Promise<boolean>;
  refresh: () => Promise<void>;
  
  // Utilities
  canUseFeature: (feature: 'nearby' | 'p2p' | 'files' | 'location' | 'bluetooth') => Promise<boolean>;
  getFeatureStatus: (feature: string) => 'available' | 'permission_needed' | 'not_supported';
}

export const usePermissions = (autoInitialize: boolean = true): UsePermissionsResult => {
  const [loading, setLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [hasCriticalPermissions, setHasCriticalPermissions] = useState(false);
  const [summary, setSummary] = useState<PermissionSummary | null>(null);
  const [autoPermissionManager] = useState(() => AutoPermissionManager.getInstance());

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      const status = await autoPermissionManager.getPermissionStatus();
      const critical = await autoPermissionManager.hasCriticalPermissions();

      setSummary(status.summary);
      setHasPermissions(status.summary.allGranted);
      setHasCriticalPermissions(critical);

      logger.info('🔐 Permission status updated:', {
        allGranted: status.summary.allGranted,
        criticalGranted: critical,
        canProceed: status.canProceed,
        totalStatuses: status.summary.statuses.length,
        grantedStatuses: status.summary.statuses.filter(s => s.status === 'granted').length,
        deniedStatuses: status.summary.statuses.filter(s => s.status === 'denied').length,
      });

      // Log each permission status for debugging
      status.summary.statuses.forEach((permStatus) => {
        logger.info(`🔐 Permission status: ${permStatus.permission} = ${permStatus.status}`);
      });

    } catch (error) {
      logger.error('❌ Error refreshing permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [autoPermissionManager]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      const result = await autoPermissionManager.requestAllPermissions();
      await refresh();
      
      return result.success && result.denied.length === 0;
    } catch (error) {
      logger.error('❌ Error requesting permissions:', error);
      return false;
    }
  }, [autoPermissionManager, refresh]);

  const openSettings = useCallback(async (): Promise<boolean> => {
    try {
      return await autoPermissionManager.openAppSettings();
    } catch (error) {
      logger.error('❌ Error opening settings:', error);
      return false;
    }
  }, [autoPermissionManager]);

  const canUseFeature = useCallback(async (feature: 'nearby' | 'p2p' | 'files' | 'location' | 'bluetooth'): Promise<boolean> => {
    // For nearby/P2P, return true and let the native Android code handle actual permission validation
    // This bypasses the unstable React Native PermissionsAndroid API
    if (feature === 'nearby' || feature === 'p2p') {
      console.log('🔐 P2P permission check: Bypassing React Native API, using native validation');
      return true;
    }

    // For other features, check their specific permissions
    const requiredPermissions: { [key: string]: string[] } = {
      files: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
      ],
      location: [
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
      bluetooth: [
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_ADVERTISE',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_ADMIN',
      ],
    };

    const permissions = requiredPermissions[feature] || [];
    return permissions.some(permission =>
      summary?.statuses?.some(status =>
        status.permission === permission && status.status === 'granted'
      ) || false
    );
  }, [summary, loading, refresh]);

  const getFeatureStatus = useCallback((feature: string): 'available' | 'permission_needed' | 'not_supported' => {
    if (!summary) return 'not_supported';

    const featureMap: { [key: string]: 'nearby' | 'p2p' | 'files' | 'location' | 'bluetooth' } = {
      'wifi-direct': 'nearby',
      'p2p': 'nearby',
      'nearby-sharing': 'nearby',
      'file-access': 'files',
      'media-access': 'files',
      'location-services': 'location',
      'device-discovery': 'location',
      'bluetooth-sharing': 'bluetooth',
    };
    
    const mappedFeature = featureMap[feature];
    if (!mappedFeature) return 'not_supported';
    
    return canUseFeature(mappedFeature) ? 'available' : 'permission_needed';
  }, [canUseFeature]);

  // Initialize permissions on mount
  useEffect(() => {
    if (autoInitialize) {
      refresh();
    }
  }, [autoInitialize, refresh]);

  return {
    loading,
    hasPermissions,
    hasCriticalPermissions,
    summary,
    requestPermissions,
    openSettings,
    refresh,
    canUseFeature,
    getFeatureStatus,
  };
};

export default usePermissions;