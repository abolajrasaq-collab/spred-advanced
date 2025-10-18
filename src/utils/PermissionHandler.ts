import { Platform, PermissionsAndroid, Alert } from 'react-native';
import logger from './logger';

export interface PermissionResult {
  granted: boolean;
  permissions: string[];
  deniedPermissions: string[];
}

export class PermissionHandler {
  private static instance: PermissionHandler;

  private constructor() {}

  static getInstance(): PermissionHandler {
    if (!PermissionHandler.instance) {
      PermissionHandler.instance = new PermissionHandler();
    }
    return PermissionHandler.instance;
  }

  async requestCorePermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true, permissions: [], deniedPermissions: [] };
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION || 'android.permission.ACCESS_FINE_LOCATION',
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION || 'android.permission.ACCESS_COARSE_LOCATION',
      ].filter(permission => permission !== null && permission !== undefined);

      if (permissions.length === 0) {
        logger.warn('⚠️ No valid permissions to request');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }

      logger.info('🔐 Requesting core permissions...');
      
      // Check if PermissionsAndroid is available
      if (!PermissionsAndroid || !PermissionsAndroid.requestMultiple) {
        logger.error('❌ PermissionsAndroid not available');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const grantedPermissions: string[] = [];
      const deniedPermissions: string[] = [];

      Object.entries(granted).forEach(([permission, result]) => {
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          grantedPermissions.push(permission);
        } else {
          deniedPermissions.push(permission);
        }
      });

      return {
        granted: grantedPermissions.length > 0,
        permissions: grantedPermissions,
        deniedPermissions: deniedPermissions,
      };
    } catch (error) {
      logger.error('❌ Core permission request failed:', error);
      return { granted: false, permissions: [], deniedPermissions: [] };
    }
  }

  async requestStoragePermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true, permissions: [], deniedPermissions: [] };
    }

    try {
      const androidVersion = Platform.Version;
      let permissions: string[];

      if (androidVersion >= 33) {
        // Android 13+ uses granular media permissions
        permissions = [
          'android.permission.READ_MEDIA_VIDEO',
          'android.permission.READ_MEDIA_IMAGES',
        ];
      } else {
        // Legacy storage permissions with fallbacks
        permissions = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE || 'android.permission.READ_EXTERNAL_STORAGE',
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE || 'android.permission.WRITE_EXTERNAL_STORAGE',
        ].filter(permission => permission !== null && permission !== undefined);
      }

      if (permissions.length === 0) {
        logger.warn('⚠️ No valid storage permissions to request');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }

      logger.info('💾 Requesting storage permissions...');
      
      // Check if PermissionsAndroid is available
      if (!PermissionsAndroid || !PermissionsAndroid.requestMultiple) {
        logger.error('❌ PermissionsAndroid not available');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const grantedPermissions: string[] = [];
      const deniedPermissions: string[] = [];

      Object.entries(granted).forEach(([permission, result]) => {
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          grantedPermissions.push(permission);
        } else {
          deniedPermissions.push(permission);
        }
      });

      return {
        granted: grantedPermissions.length > 0,
        permissions: grantedPermissions,
        deniedPermissions: deniedPermissions,
      };
    } catch (error) {
      logger.error('❌ Storage permission request failed:', error);
      return { granted: false, permissions: [], deniedPermissions: [] };
    }
  }

  async requestWiFiPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== 'android') {
      return { granted: true, permissions: [], deniedPermissions: [] };
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE || 'android.permission.ACCESS_WIFI_STATE',
        PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE || 'android.permission.CHANGE_WIFI_STATE',
        PermissionsAndroid.PERMISSIONS.CAMERA || 'android.permission.CAMERA',
      ].filter(permission => permission !== null && permission !== undefined);

      if (permissions.length === 0) {
        logger.warn('⚠️ No valid WiFi permissions to request');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }

      logger.info('📶 Requesting WiFi and Camera permissions...');
      
      // Check if PermissionsAndroid is available
      if (!PermissionsAndroid || !PermissionsAndroid.requestMultiple) {
        logger.error('❌ PermissionsAndroid not available');
        return { granted: false, permissions: [], deniedPermissions: [] };
      }
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const grantedPermissions: string[] = [];
      const deniedPermissions: string[] = [];

      Object.entries(granted).forEach(([permission, result]) => {
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          grantedPermissions.push(permission);
        } else {
          deniedPermissions.push(permission);
        }
      });

      return {
        granted: grantedPermissions.length > 0,
        permissions: grantedPermissions,
        deniedPermissions: deniedPermissions,
      };
    } catch (error) {
      logger.error('❌ WiFi permission request failed:', error);
      return { granted: false, permissions: [], deniedPermissions: [] };
    }
  }

  async requestAllPermissions(): Promise<{
    core: PermissionResult;
    storage: PermissionResult;
    wifi: PermissionResult;
  }> {
    logger.info('🔐 Requesting all permissions...');

    const [core, storage, wifi] = await Promise.allSettled([
      this.requestCorePermissions(),
      this.requestStoragePermissions(),
      this.requestWiFiPermissions(),
    ]);

    const result = {
      core:
        core.status === 'fulfilled'
          ? core.value
          : { granted: false, permissions: [], deniedPermissions: [] },
      storage:
        storage.status === 'fulfilled'
          ? storage.value
          : { granted: false, permissions: [], deniedPermissions: [] },
      wifi:
        wifi.status === 'fulfilled'
          ? wifi.value
          : { granted: false, permissions: [], deniedPermissions: [] },
    };

    logger.info('✅ Permission request completed:', result);
    return result;
  }

  showPermissionAlert(deniedPermissions: string[]) {
    if (deniedPermissions.length === 0) {
      return;
    }

    Alert.alert(
      'Permissions Required',
      `Some permissions were denied: ${deniedPermissions.join(
        ', ',
      )}. The app may have limited functionality.`,
      [{ text: 'OK' }],
    );
  }
}

export default PermissionHandler.getInstance();
