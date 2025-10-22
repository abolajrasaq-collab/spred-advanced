/**
 * SafePermissionManager - Null-safe Android permission handling
 * 
 * This utility class wraps all Android permission operations with comprehensive
 * error handling to prevent crashes from null pointer exceptions and other
 * permission-related failures.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import logger from './logger';

export interface PermissionResult {
  success: boolean;
  granted: string[];
  denied: string[];
  error?: string;
  details?: {
    [permission: string]: string;
  };
}

export interface PermissionStatus {
  permission: string;
  status: 'granted' | 'denied' | 'never_ask_again' | 'unknown' | 'error';
  required: boolean;
  description: string;
}

export interface PermissionSummary {
  allGranted: boolean;
  requiredGranted: boolean;
  statuses: PermissionStatus[];
  canProceed: boolean;
  issues: string[];
}

export class SafePermissionManager {
  private static instance: SafePermissionManager;

  // Standard Android permissions needed for Nearby API
  public static readonly NEARBY_PERMISSIONS = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
    PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
    PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
  ].filter(permission => permission !== undefined && permission !== null);

  // Permission descriptions for user-friendly messages
  private static readonly PERMISSION_DESCRIPTIONS = {
    [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]: 'Precise location access for device discovery',
    [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]: 'Approximate location access for device discovery',
    [PermissionsAndroid.PERMISSIONS.BLUETOOTH]: 'Bluetooth access for device communication',
    [PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN]: 'Bluetooth administration for device management',
    [PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE]: 'WiFi state access for network discovery',
    [PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE]: 'WiFi control for network management',
  };

  private constructor() {}

  static getInstance(): SafePermissionManager {
    if (!SafePermissionManager.instance) {
      SafePermissionManager.instance = new SafePermissionManager();
    }
    return SafePermissionManager.instance;
  }

  /**
   * Safely check if the Android permissions API is available
   */
  private isPermissionAPIAvailable(): boolean {
    try {
      if (Platform.OS !== 'android') {
        logger.info('📱 Not on Android platform, skipping permission checks');
        return false;
      }

      if (!PermissionsAndroid) {
        logger.warn('⚠️ PermissionsAndroid module not available');
        return false;
      }

      if (typeof PermissionsAndroid.check !== 'function') {
        logger.warn('⚠️ PermissionsAndroid.check not available');
        return false;
      }

      if (typeof PermissionsAndroid.requestMultiple !== 'function') {
        logger.warn('⚠️ PermissionsAndroid.requestMultiple not available');
        return false;
      }

      // Test the permission API with a simple call to detect native crashes
      try {
        // This is a synchronous test that might reveal the native crash issue
        const testResult = PermissionsAndroid?.RESULTS;
        if (!testResult || !testResult.GRANTED) {
          logger.warn('⚠️ PermissionsAndroid.RESULTS not properly available');
          return false;
        }
      } catch (testError) {
        logger.error('❌ Permission API test failed - native module issue detected:', testError);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ Error checking permission API availability:', error);
      return false;
    }
  }

  /**
   * Safely check a single permission with maximum defensive programming
   */
  async isPermissionGranted(permission: string): Promise<boolean> {
    try {
      if (!this.isPermissionAPIAvailable()) {
        logger.info('📱 Permission API not available, assuming granted for compatibility');
        return true;
      }

      // Extra defensive wrapper around the native call
      let result: any = null;
      try {
        logger.debug(`🔍 Attempting to check permission: ${permission}`);
        result = await PermissionsAndroid.check(permission as any);
        logger.debug(`🔍 Permission check result for ${permission}:`, result);
      } catch (nativeError: any) {
        logger.error(`❌ Native permission check failed for ${permission}:`, {
          message: nativeError.message,
          stack: nativeError.stack,
          code: nativeError.code,
          permission
        });
        
        // This is the exact crash you're experiencing - return false safely
        if (nativeError.message?.includes('null') || 
            nativeError.stack?.includes('checkSelfPermission') ||
            nativeError.stack?.includes('PermissionsModule')) {
          logger.warn(`⚠️ Detected native permission crash for ${permission} - returning denied`);
          return false;
        }
        
        throw nativeError; // Re-throw if it's a different error
      }
      
      // Handle null/undefined results
      if (result === null || result === undefined) {
        logger.warn(`⚠️ Permission check returned null for ${permission}`);
        return false;
      }

      const isGranted = result === true;
      logger.debug(`🔍 Permission ${permission}: ${isGranted ? 'GRANTED' : 'DENIED'}`);
      
      return isGranted;
    } catch (error: any) {
      logger.error(`❌ Error checking permission ${permission}:`, {
        message: error.message,
        stack: error.stack,
        permission
      });
      return false;
    }
  }

  /**
   * Safely check multiple permissions
   */
  async checkPermissions(permissions: string[] = SafePermissionManager.NEARBY_PERMISSIONS): Promise<PermissionResult> {
    try {
      // Filter out any undefined or null permissions
      const validPermissions = permissions.filter(permission => 
        permission !== undefined && 
        permission !== null && 
        typeof permission === 'string' && 
        permission.trim() !== ''
      );
      
      logger.info('🔍 Starting safe permission check for:', validPermissions);

      if (!this.isPermissionAPIAvailable()) {
        return {
          success: true,
          granted: [...validPermissions], // Assume all granted for non-Android or when API unavailable
          denied: [],
          error: 'Permission API not available - assuming granted for compatibility'
        };
      }

      const granted: string[] = [];
      const denied: string[] = [];
      const details: { [permission: string]: string } = {};

      // Check each permission individually to avoid batch failures
      for (const permission of validPermissions) {
        try {
          let result: any = null;
          
          try {
            logger.debug(`🔍 Checking individual permission: ${permission}`);
            result = await PermissionsAndroid.check(permission as any);
            logger.debug(`🔍 Individual permission result for ${permission}:`, result);
          } catch (nativeError: any) {
            logger.error(`❌ Native permission check failed for ${permission}:`, {
              message: nativeError.message,
              stack: nativeError.stack,
              code: nativeError.code,
              permission
            });
            
            // Handle the specific native crash you're experiencing
            if (nativeError.message?.includes('null') || 
                nativeError.stack?.includes('checkSelfPermission') ||
                nativeError.stack?.includes('PermissionsModule')) {
              logger.warn(`⚠️ Detected native permission crash for ${permission} - marking as denied`);
              denied.push(permission);
              details[permission] = 'native_crash_detected';
              continue;
            }
            
            throw nativeError; // Re-throw if it's a different error
          }
          
          if (result === null || result === undefined) {
            logger.warn(`⚠️ Permission check returned null for ${permission}`);
            denied.push(permission);
            details[permission] = 'null_result';
            continue;
          }

          if (result === true) {
            granted.push(permission);
            details[permission] = 'granted';
          } else {
            denied.push(permission);
            details[permission] = 'denied';
          }
        } catch (error: any) {
          logger.error(`❌ Error checking individual permission ${permission}:`, {
            message: error.message,
            stack: error.stack,
            permission
          });
          denied.push(permission);
          details[permission] = `error: ${error.message}`;
        }
      }

      const result: PermissionResult = {
        success: true,
        granted,
        denied,
        details
      };

      logger.info('✅ Permission check completed:', {
        granted: granted.length,
        denied: denied.length,
        total: permissions.length
      });

      return result;
    } catch (error) {
      logger.error('❌ Critical error during permission check:', error);
      return {
        success: false,
        granted: [],
        denied: [...permissions],
        error: `Permission check failed: ${error.message}`,
        details: {}
      };
    }
  }

  /**
   * Safely request multiple permissions
   */
  async requestPermissions(permissions: string[] = SafePermissionManager.NEARBY_PERMISSIONS): Promise<PermissionResult> {
    try {
      // Filter out any undefined or null permissions
      const validPermissions = permissions.filter(permission => 
        permission !== undefined && 
        permission !== null && 
        typeof permission === 'string' && 
        permission.trim() !== ''
      );
      
      logger.info('📝 Starting safe permission request for:', validPermissions);

      if (!this.isPermissionAPIAvailable()) {
        return {
          success: true,
          granted: [...validPermissions], // Assume all granted for non-Android or when API unavailable
          denied: [],
          error: 'Permission API not available - assuming granted for compatibility'
        };
      }

      // First check current status to avoid unnecessary requests
      const currentStatus = await this.checkPermissions(validPermissions);
      if (currentStatus.success && currentStatus.denied.length === 0) {
        logger.info('✅ All permissions already granted, skipping request');
        return currentStatus;
      }

      // Request permissions with comprehensive error handling
      let requestResult: any = null;
      try {
        requestResult = await PermissionsAndroid.requestMultiple(validPermissions as any);
      } catch (error) {
        logger.error('❌ Permission request threw exception:', error);
        return {
          success: false,
          granted: [],
          denied: [...validPermissions],
          error: `Permission request failed: ${error.message}`
        };
      }

      // Handle null/undefined request results
      if (!requestResult || typeof requestResult !== 'object') {
        logger.error('❌ Permission request returned null or invalid result:', requestResult);
        return {
          success: false,
          granted: [],
          denied: [...permissions],
          error: 'Permission request returned null - this is the source of the original crash'
        };
      }

      // Safely process the results
      const granted: string[] = [];
      const denied: string[] = [];
      const details: { [permission: string]: string } = {};

      for (const permission of permissions) {
        try {
          const status = requestResult[permission];
          
          if (status === null || status === undefined) {
            logger.warn(`⚠️ Permission result null for ${permission}`);
            denied.push(permission);
            details[permission] = 'null_result';
            continue;
          }

          if (status === PermissionsAndroid.RESULTS.GRANTED) {
            granted.push(permission);
            details[permission] = 'granted';
          } else {
            denied.push(permission);
            details[permission] = status || 'unknown';
          }
        } catch (error) {
          logger.error(`❌ Error processing permission result for ${permission}:`, error);
          denied.push(permission);
          details[permission] = `processing_error: ${error.message}`;
        }
      }

      const result: PermissionResult = {
        success: true,
        granted,
        denied,
        details
      };

      logger.info('✅ Permission request completed:', {
        granted: granted.length,
        denied: denied.length,
        total: permissions.length
      });

      return result;
    } catch (error) {
      logger.error('❌ Critical error during permission request:', error);
      return {
        success: false,
        granted: [],
        denied: [...permissions],
        error: `Permission request failed: ${error.message}`
      };
    }
  }

  /**
   * Get a comprehensive summary of permission status
   */
  async getPermissionSummary(permissions: string[] = SafePermissionManager.NEARBY_PERMISSIONS): Promise<PermissionSummary> {
    try {
      const result = await this.checkPermissions(permissions);
      
      const statuses: PermissionStatus[] = permissions.map(permission => {
        const isGranted = result.granted.includes(permission);
        const details = result.details?.[permission] || 'unknown';
        
        let status: PermissionStatus['status'] = 'unknown';
        if (isGranted) {
          status = 'granted';
        } else if (details === 'never_ask_again') {
          status = 'never_ask_again';
        } else if (details.startsWith('error')) {
          status = 'error';
        } else {
          status = 'denied';
        }

        return {
          permission,
          status,
          required: true, // All nearby permissions are required
          description: SafePermissionManager.PERMISSION_DESCRIPTIONS[permission] || 'Required for nearby sharing'
        };
      });

      const allGranted = result.granted.length === permissions.length;
      const requiredGranted = allGranted; // All permissions are required
      const canProceed = allGranted;
      
      const issues: string[] = [];
      if (!result.success) {
        issues.push(result.error || 'Permission check failed');
      }
      if (result.denied.length > 0) {
        issues.push(`${result.denied.length} permission(s) denied`);
      }

      return {
        allGranted,
        requiredGranted,
        statuses,
        canProceed,
        issues
      };
    } catch (error) {
      logger.error('❌ Error getting permission summary:', error);
      
      // Return safe fallback summary
      return {
        allGranted: false,
        requiredGranted: false,
        statuses: permissions.map(permission => ({
          permission,
          status: 'error',
          required: true,
          description: SafePermissionManager.PERMISSION_DESCRIPTIONS[permission] || 'Required for nearby sharing'
        })),
        canProceed: false,
        issues: [`Permission summary failed: ${error.message}`]
      };
    }
  }

  /**
   * Check if we have the minimum required permissions for Nearby API
   */
  async hasMinimumPermissions(): Promise<boolean> {
    try {
      const summary = await this.getPermissionSummary();
      return summary.canProceed;
    } catch (error) {
      logger.error('❌ Error checking minimum permissions:', error);
      return false;
    }
  }

  /**
   * Get user-friendly error message for permission issues
   */
  getPermissionErrorMessage(result: PermissionResult): string {
    if (!result.success) {
      if (result.error?.includes('null')) {
        return 'Permission system error detected. The app will use test mode instead.';
      }
      return 'Unable to check device permissions. The app will use test mode instead.';
    }

    if (result.denied.length > 0) {
      return `${result.denied.length} permission(s) are needed for nearby sharing. The app will use QR code sharing instead.`;
    }

    return 'Permission check completed successfully.';
  }
}

export default SafePermissionManager;