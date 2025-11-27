/**
 * AutoPermissionManager - Automatic permission handling with direct settings links
 * 
 * This service automatically requests required permissions and provides direct links
 * to enable them in Android settings when automatic requests fail.
 */

import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import logger from './logger';
import SafePermissionManager, { PermissionResult, PermissionSummary } from './SafePermissionManager';

export interface AutoPermissionConfig {
  autoRequest: boolean;
  showSettingsDialog: boolean;
  showRationale: boolean;
  retryCount: number;
}

export interface PermissionAction {
  type: 'request' | 'settings' | 'retry' | 'skip';
  title: string;
  description: string;
  action: () => Promise<void>;
}

export interface PermissionGuide {
  permission: string;
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'optional';
  settingsPath: string[];
  actions: PermissionAction[];
}

export class AutoPermissionManager {
  private static instance: AutoPermissionManager;
  private safePermissionManager: SafePermissionManager;
  private config: AutoPermissionConfig;

  // Modern Android permissions for different API levels
  private static readonly PERMISSION_SETS = {
    // Android 13+ (API 33+) - Uses NEARBY_WIFI_DEVICES instead of location
    modern: [
      PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    ],
    // Android 12 (API 31-32) - WiFi Direct + location (no Bluetooth needed)
    intermediate: [
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      // FINE_LOCATION not needed for WiFi P2P
      // PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ],
    // Android 11 and below (API 30-) - Legacy permissions
    legacy: [
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      // FINE_LOCATION not needed for WiFi P2P
      // PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
      PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ],
  };

  // User-friendly permission descriptions
  private static readonly PERMISSION_GUIDES: { [key: string]: PermissionGuide } = {
    [PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES]: {
      permission: PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      title: 'Nearby Devices',
      description: 'Required to discover and connect to nearby devices for file sharing',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Nearby devices'],
      actions: [],
    },
    // ACCESS_FINE_LOCATION not needed for WiFi P2P - using COARSE_LOCATION instead
    /*
    [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]: {
      permission: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      title: 'Location (Precise)',
      description: 'Required to discover nearby devices (Android requirement for WiFi Direct)',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Location'],
      actions: [],
    },
    */
    [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]: {
      permission: PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      title: 'Location (Approximate)',
      description: 'Required to discover nearby devices (Android requirement for WiFi Direct)',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Location'],
      actions: [],
    },
    [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]: {
      permission: PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      title: 'Bluetooth Connect',
      description: 'Required for Bluetooth-based device discovery and connection',
      importance: 'important',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Nearby devices'],
      actions: [],
    },
    [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE]: {
      permission: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      title: 'Files and Media',
      description: 'Required to access and share your photos and videos',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Files and media'],
      actions: [],
    },
    [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES]: {
      permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      title: 'Photos and Images',
      description: 'Required to access and share your photos',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Photos and videos'],
      actions: [],
    },
    [PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]: {
      permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      title: 'Videos',
      description: 'Required to access and share your videos',
      importance: 'critical',
      settingsPath: ['Settings', 'Apps', 'SPRED', 'Permissions', 'Photos and videos'],
      actions: [],
    },
  };

  private constructor() {
    this.safePermissionManager = SafePermissionManager.getInstance();
    this.config = {
      autoRequest: true,
      showSettingsDialog: true,
      showRationale: true,
      retryCount: 2,
    };
  }

  static getInstance(): AutoPermissionManager {
    if (!AutoPermissionManager.instance) {
      AutoPermissionManager.instance = new AutoPermissionManager();
    }
    return AutoPermissionManager.instance;
  }

  /**
   * Get the appropriate permission set for the current Android version
   */
  private getPermissionsForAndroidVersion(): string[] {
    if (Platform.OS !== 'android') {
      return [];
    }

    const androidVersion = Platform.Version as number;
    
    if (androidVersion >= 33) {
      return AutoPermissionManager.PERMISSION_SETS.modern.filter(p => p);
    } else if (androidVersion >= 31) {
      return AutoPermissionManager.PERMISSION_SETS.intermediate.filter(p => p);
    } else {
      return AutoPermissionManager.PERMISSION_SETS.legacy.filter(p => p);
    }
  }

  /**
   * Automatically request all required permissions with user-friendly flow
   */
  async requestAllPermissions(): Promise<PermissionResult> {
    try {
      logger.info('🔐 AutoPermissionManager: Starting automatic permission flow...');

      if (Platform.OS !== 'android') {
        logger.info('📱 Not on Android, skipping permission requests');
        return {
          success: true,
          granted: [],
          denied: [],
          error: 'Not on Android platform',
        };
      }

      const requiredPermissions = this.getPermissionsForAndroidVersion();
      logger.info('🔐 Required permissions for Android', Platform.Version, ':', requiredPermissions);

      // First, check current status
      const currentStatus = await this.safePermissionManager.checkPermissions(requiredPermissions);
      
      if (currentStatus.success && currentStatus.denied.length === 0) {
        logger.info('✅ All permissions already granted');
        return currentStatus;
      }

      // Show rationale if configured
      if (this.config.showRationale && currentStatus.denied.length > 0) {
        await this.showPermissionRationale(currentStatus.denied);
      }

      // Request permissions
      const requestResult = await this.safePermissionManager.requestPermissions(requiredPermissions);
      
      // Handle denied permissions
      if (requestResult.denied.length > 0) {
        logger.warn('⚠️ Some permissions were denied:', requestResult.denied);
        
        if (this.config.showSettingsDialog) {
          await this.showSettingsDialog(requestResult.denied);
        }
      }

      return requestResult;
    } catch (error: any) {
      logger.error('❌ AutoPermissionManager: Error in automatic permission flow:', error);
      return {
        success: false,
        granted: [],
        denied: this.getPermissionsForAndroidVersion(),
        error: error.message,
      };
    }
  }

  /**
   * Show permission rationale dialog
   */
  private async showPermissionRationale(deniedPermissions: string[]): Promise<void> {
    return new Promise((resolve) => {
      const guides = deniedPermissions
        .map(permission => AutoPermissionManager.PERMISSION_GUIDES[permission])
        .filter(guide => guide);

      const criticalPermissions = guides.filter(guide => guide.importance === 'critical');
      
      let title = 'Permissions Required';
      let message = 'SPRED needs the following permissions to work properly:\n\n';
      
      criticalPermissions.forEach(guide => {
        message += `• ${guide.title}: ${guide.description}\n`;
      });
      
      message += '\nThese permissions are essential for sharing files between devices.';

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Grant Permissions',
            onPress: () => resolve(),
          },
        ]
      );
    });
  }

  /**
   * Show settings dialog for denied permissions
   */
  private async showSettingsDialog(deniedPermissions: string[]): Promise<void> {
    return new Promise((resolve) => {
      const guides = deniedPermissions
        .map(permission => AutoPermissionManager.PERMISSION_GUIDES[permission])
        .filter(guide => guide);

      const criticalPermissions = guides.filter(guide => guide.importance === 'critical');
      
      if (criticalPermissions.length === 0) {
        resolve();
        return;
      }

      let title = 'Enable Permissions in Settings';
      let message = 'Some permissions were denied. To use all features, please enable:\n\n';
      
      criticalPermissions.forEach(guide => {
        message += `• ${guide.title}\n`;
      });
      
      message += '\nWould you like to open Settings to enable these permissions?';

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await this.openAppSettings();
              resolve();
            },
          },
        ]
      );
    });
  }

  /**
   * Open app settings directly
   */
  async openAppSettings(): Promise<boolean> {
    try {
      logger.info('⚙️ Opening app settings...');
      
      // Try to open app-specific settings
      const appSettingsUrl = 'app-settings:';
      const canOpen = await Linking.canOpenURL(appSettingsUrl);
      
      if (canOpen) {
        await Linking.openURL(appSettingsUrl);
        return true;
      }
      
      // Fallback to general settings
      await Linking.openSettings();
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to open settings:', error);
      return false;
    }
  }

  /**
   * Get permission status with user-friendly information
   */
  async getPermissionStatus(): Promise<{
    summary: PermissionSummary;
    guides: PermissionGuide[];
    canProceed: boolean;
    criticalMissing: string[];
  }> {
    try {
      const requiredPermissions = this.getPermissionsForAndroidVersion();
      const summary = await this.safePermissionManager.getPermissionSummary(requiredPermissions);
      
      const guides = requiredPermissions
        .map(permission => {
          const guide = AutoPermissionManager.PERMISSION_GUIDES[permission];
          if (!guide) return null;
          
          // Add actions to the guide
          const actions: PermissionAction[] = [
            {
              type: 'request',
              title: 'Request Permission',
              description: 'Ask for this permission again',
              action: async () => {
                await this.safePermissionManager.requestPermissions([permission]);
              },
            },
            {
              type: 'settings',
              title: 'Open Settings',
              description: 'Open app settings to enable manually',
              action: async () => {
                await this.openAppSettings();
              },
            },
          ];
          
          return { ...guide, actions };
        })
        .filter(guide => guide) as PermissionGuide[];
      
      const criticalMissing = summary.statuses
        .filter(status => status.status !== 'granted')
        .map(status => status.permission)
        .filter(permission => {
          const guide = AutoPermissionManager.PERMISSION_GUIDES[permission];
          return guide && guide.importance === 'critical';
        });
      
      const canProceed = criticalMissing.length === 0;
      
      return {
        summary,
        guides,
        canProceed,
        criticalMissing,
      };
    } catch (error: any) {
      logger.error('❌ Error getting permission status:', error);
      
      return {
        summary: {
          allGranted: false,
          requiredGranted: false,
          statuses: [],
          canProceed: false,
          issues: [error.message],
        },
        guides: [],
        canProceed: false,
        criticalMissing: [],
      };
    }
  }

  /**
   * Check if critical permissions are granted
   */
  async hasCriticalPermissions(): Promise<boolean> {
    try {
      const status = await this.getPermissionStatus();
      return status.canProceed;
    } catch (error: any) {
      logger.error('❌ Error checking critical permissions:', error);
      return false;
    }
  }

  /**
   * Initialize permissions on app start
   */
  async initializePermissions(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing permissions on app start...');
      
      // Check current status first
      const status = await this.getPermissionStatus();
      
      if (status.canProceed) {
        logger.info('✅ All critical permissions already granted');
        return true;
      }
      
      // Auto-request if configured
      if (this.config.autoRequest) {
        const result = await this.requestAllPermissions();
        return result.success && result.denied.length === 0;
      }
      
      return false;
    } catch (error: any) {
      logger.error('❌ Error initializing permissions:', error);
      return false;
    }
  }

  /**
   * Get user-friendly permission instructions
   */
  getPermissionInstructions(permission: string): string[] {
    const guide = AutoPermissionManager.PERMISSION_GUIDES[permission];
    if (!guide) {
      return ['Go to Settings → Apps → SPRED → Permissions and enable the required permission'];
    }
    
    return [
      `1. Open ${guide.settingsPath.join(' → ')}`,
      '2. Toggle the permission to "Allow"',
      '3. Return to SPRED and try again',
    ];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoPermissionConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('⚙️ AutoPermissionManager config updated:', this.config);
  }
}

export default AutoPermissionManager;