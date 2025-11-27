/**
 * PermissionInitializationService - Automatic permission initialization
 * 
 * This service handles automatic permission requests on app startup
 * and provides fallback options when permissions are denied.
 */

import { Alert, Platform } from 'react-native';
import AutoPermissionManager from '../utils/AutoPermissionManager';
import logger from '../utils/logger';

export interface PermissionInitResult {
  success: boolean;
  hasAllPermissions: boolean;
  hasCriticalPermissions: boolean;
  canUseCoreFeatures: boolean;
  deniedPermissions: string[];
  error?: string;
}

export class PermissionInitializationService {
  private static instance: PermissionInitializationService;
  private autoPermissionManager: AutoPermissionManager;
  private initialized = false;

  private constructor() {
    this.autoPermissionManager = AutoPermissionManager.getInstance();
  }

  static getInstance(): PermissionInitializationService {
    if (!PermissionInitializationService.instance) {
      PermissionInitializationService.instance = new PermissionInitializationService();
    }
    return PermissionInitializationService.instance;
  }

  /**
   * Initialize permissions on app startup
   */
  async initializePermissions(): Promise<PermissionInitResult> {
    try {
      logger.info('🚀 PermissionInitializationService: Starting permission initialization...');

      if (Platform.OS !== 'android') {
        logger.info('📱 Not on Android, skipping permission initialization');
        return {
          success: true,
          hasAllPermissions: true,
          hasCriticalPermissions: true,
          canUseCoreFeatures: true,
          deniedPermissions: [],
        };
      }

      // Check current status first
      const status = await this.autoPermissionManager.getPermissionStatus();
      
      if (status.canProceed) {
        logger.info('✅ All critical permissions already granted');
        this.initialized = true;
        return {
          success: true,
          hasAllPermissions: status.summary.allGranted,
          hasCriticalPermissions: true,
          canUseCoreFeatures: true,
          deniedPermissions: [],
        };
      }

      // Request permissions automatically
      logger.info('🔐 Requesting permissions automatically...');
      const result = await this.autoPermissionManager.requestAllPermissions();
      
      // Check status after request
      const newStatus = await this.autoPermissionManager.getPermissionStatus();
      
      this.initialized = true;
      
      const initResult: PermissionInitResult = {
        success: result.success,
        hasAllPermissions: newStatus.summary.allGranted,
        hasCriticalPermissions: newStatus.canProceed,
        canUseCoreFeatures: newStatus.canProceed,
        deniedPermissions: result.denied,
      };

      // Handle denied permissions
      if (result.denied.length > 0) {
        await this.handleDeniedPermissions(result.denied, newStatus.canProceed);
      }

      logger.info('✅ Permission initialization completed:', initResult);
      return initResult;

    } catch (error: any) {
      logger.error('❌ Permission initialization failed:', error);
      
      return {
        success: false,
        hasAllPermissions: false,
        hasCriticalPermissions: false,
        canUseCoreFeatures: false,
        deniedPermissions: [],
        error: error.message,
      };
    }
  }

  /**
   * Handle denied permissions with user-friendly guidance
   */
  private async handleDeniedPermissions(deniedPermissions: string[], canStillProceed: boolean): Promise<void> {
    try {
      const criticalDenied = deniedPermissions.filter(permission => {
        // Check if this is a critical permission
        const criticalPermissions = [
          'android.permission.NEARBY_WIFI_DEVICES',
          'android.permission.ACCESS_COARSE_LOCATION',
          // FINE_LOCATION not needed - using COARSE_LOCATION instead
          // 'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.READ_MEDIA_IMAGES',
          'android.permission.READ_MEDIA_VIDEO',
        ];
        return criticalPermissions.includes(permission);
      });

      if (criticalDenied.length === 0) {
        // Only optional permissions denied
        logger.info('ℹ️ Only optional permissions denied, continuing normally');
        return;
      }

      // Show appropriate alert based on severity
      if (canStillProceed) {
        this.showOptionalPermissionAlert(criticalDenied);
      } else {
        this.showCriticalPermissionAlert(criticalDenied);
      }

    } catch (error) {
      logger.error('❌ Error handling denied permissions:', error);
    }
  }

  /**
   * Show alert for optional permissions
   */
  private showOptionalPermissionAlert(deniedPermissions: string[]): void {
    const permissionNames = this.getPermissionNames(deniedPermissions);
    
    Alert.alert(
      'Some Permissions Not Granted',
      `The following permissions were not granted:\n\n${permissionNames.join('\n')}\n\nYou can enable them later in Settings to unlock additional features.`,
      [
        {
          text: 'Enable Now',
          onPress: () => this.autoPermissionManager.openAppSettings(),
        },
        {
          text: 'Later',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Show alert for critical permissions
   */
  private showCriticalPermissionAlert(deniedPermissions: string[]): void {
    const permissionNames = this.getPermissionNames(deniedPermissions);
    
    Alert.alert(
      'Important Permissions Required',
      `SPRED needs these permissions to work properly:\n\n${permissionNames.join('\n')}\n\nWithout these permissions, some features may not work correctly.`,
      [
        {
          text: 'Open Settings',
          onPress: () => this.autoPermissionManager.openAppSettings(),
        },
        {
          text: 'Continue Anyway',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Get user-friendly permission names
   */
  private getPermissionNames(permissions: string[]): string[] {
    const nameMap: { [key: string]: string } = {
      'android.permission.NEARBY_WIFI_DEVICES': '• Nearby Devices - for device discovery',
      // FINE_LOCATION not needed - using COARSE_LOCATION instead
      // 'android.permission.ACCESS_FINE_LOCATION': '• Location - for device discovery',
      'android.permission.ACCESS_COARSE_LOCATION': '• Location (Approximate) - for device discovery',
      'android.permission.READ_EXTERNAL_STORAGE': '• Files and Media - to access your files',
      'android.permission.READ_MEDIA_IMAGES': '• Photos - to access your images',
      'android.permission.READ_MEDIA_VIDEO': '• Videos - to access your videos',
      'android.permission.BLUETOOTH_CONNECT': '• Bluetooth - for device communication',
      'android.permission.BLUETOOTH_ADVERTISE': '• Bluetooth - for device advertising',
      'android.permission.BLUETOOTH_SCAN': '• Bluetooth - for device scanning',
    };

    return permissions
      .map(permission => nameMap[permission] || `• ${permission}`)
      .filter(name => name);
  }

  /**
   * Check if permissions are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current permission status
   */
  async getStatus(): Promise<{
    canUseCoreFeatures: boolean;
    canUseNearbySharing: boolean;
    canAccessFiles: boolean;
    missingPermissions: string[];
  }> {
    try {
      const status = await this.autoPermissionManager.getPermissionStatus();
      
      return {
        canUseCoreFeatures: status.canProceed,
        canUseNearbySharing: status.summary.statuses.some(s => 
          (s.permission.includes('NEARBY') || s.permission.includes('LOCATION')) && 
          s.status === 'granted'
        ),
        canAccessFiles: status.summary.statuses.some(s => 
          (s.permission.includes('STORAGE') || s.permission.includes('MEDIA')) && 
          s.status === 'granted'
        ),
        missingPermissions: status.criticalMissing,
      };
    } catch (error) {
      logger.error('❌ Error getting permission status:', error);
      return {
        canUseCoreFeatures: false,
        canUseNearbySharing: false,
        canAccessFiles: false,
        missingPermissions: [],
      };
    }
  }

  /**
   * Request permissions again (for retry scenarios)
   */
  async retryPermissions(): Promise<boolean> {
    try {
      logger.info('🔄 Retrying permission requests...');
      const result = await this.autoPermissionManager.requestAllPermissions();
      return result.success && result.denied.length === 0;
    } catch (error) {
      logger.error('❌ Error retrying permissions:', error);
      return false;
    }
  }

  /**
   * Open app settings for manual permission configuration
   */
  async openSettings(): Promise<boolean> {
    try {
      return await this.autoPermissionManager.openAppSettings();
    } catch (error) {
      logger.error('❌ Error opening settings:', error);
      return false;
    }
  }
}

export default PermissionInitializationService;