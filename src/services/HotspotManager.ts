import { Platform, PermissionsAndroid } from 'react-native';
import logger from '../utils/logger';

export interface HotspotConfig {
  ssid: string;
  password: string;
  isWPA2: boolean;
}

export interface HotspotStatus {
  isActive: boolean;
  ssid?: string;
  connectedDevices: number;
  error?: string;
}

export class HotspotManager {
  private static instance: HotspotManager;
  private currentConfig: HotspotConfig | null = null;
  private isHotspotActive = false;

  private constructor() {}

  static getInstance(): HotspotManager {
    if (!HotspotManager.instance) {
      HotspotManager.instance = new HotspotManager();
    }
    return HotspotManager.instance;
  }

  /**
   * Check if device supports hotspot creation
   */
  async isHotspotSupported(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS requires manual hotspot setup
        return false;
      }

      if (Platform.OS === 'android') {
        // Check Android version and permissions
        const hasPermissions = await this.checkHotspotPermissions();
        return hasPermissions;
      }

      return false;
    } catch (error) {
      logger.error('❌ Error checking hotspot support:', error);
      return false;
    }
  }

  /**
   * Request necessary permissions for hotspot
   */
  async requestHotspotPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
        PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      // Add WRITE_SETTINGS for Android 6+
      if (Platform.Version >= 23) {
        permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_SETTINGS);
      }

      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        logger.info('✅ All hotspot permissions granted');
        return true;
      } else {
        logger.warn('⚠️ Some hotspot permissions denied:', results);
        return false;
      }

    } catch (error) {
      logger.error('❌ Error requesting hotspot permissions:', error);
      return false;
    }
  }

  /**
   * Check if hotspot permissions are granted
   */
  private async checkHotspotPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
        PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      for (const permission of permissions) {
        const result = await PermissionsAndroid.check(permission);
        if (!result) {
          logger.warn('⚠️ Missing permission:', permission);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('❌ Error checking hotspot permissions:', error);
      return false;
    }
  }

  /**
   * Create WiFi hotspot with enhanced error handling
   */
  async createHotspot(config: HotspotConfig): Promise<boolean> {
    try {
      logger.info('📶 Creating hotspot:', config.ssid);

      // Check support first
      const isSupported = await this.isHotspotSupported();
      if (!isSupported) {
        throw new Error('Hotspot not supported on this device');
      }

      // Request permissions if needed
      const hasPermissions = await this.checkHotspotPermissions();
      if (!hasPermissions) {
        const granted = await this.requestHotspotPermissions();
        if (!granted) {
          throw new Error('Hotspot permissions required');
        }
      }

      if (Platform.OS === 'android') {
        // Temporarily disabled - requires external package
        logger.warn('⚠️ Hotspot creation disabled - requires react-native-wifi-hotspot package');
        throw new Error('Hotspot functionality requires additional setup');

        // When package is available:
        // const WifiHotspot = require('react-native-wifi-hotspot');

        // // Stop existing hotspot first
        // if (this.isHotspotActive) {
        //   await this.stopHotspot();
        // }

        // // Create new hotspot
        // const result = await WifiHotspot.createHotspot({
        //   ssid: config.ssid,
        //   password: config.password,
        //   isWPA2: config.isWPA2,
        // });

        // if (result) {
        //   this.currentConfig = config;
        //   this.isHotspotActive = true;
        //   logger.info('✅ Hotspot created successfully:', config.ssid);
        //   return true;
        // } else {
        //   throw new Error('Failed to create hotspot');
        // }

      } else if (Platform.OS === 'ios') {
        // iOS requires manual setup
        throw new Error('iOS requires manual hotspot setup in Settings > Personal Hotspot');
      }

      return false;

    } catch (error: any) {
      logger.error('❌ Failed to create hotspot:', error);
      this.isHotspotActive = false;
      this.currentConfig = null;
      throw new Error(`Hotspot creation failed: ${error.message}`);
    }
  }

  /**
   * Stop WiFi hotspot
   */
  async stopHotspot(): Promise<void> {
    try {
      if (!this.isHotspotActive) {
        logger.info('ℹ️ No active hotspot to stop');
        return;
      }

      logger.info('🛑 Stopping hotspot...');

      if (Platform.OS === 'android') {
        // Temporarily disabled - requires external package
        logger.warn('⚠️ Hotspot stopping disabled - requires react-native-wifi-hotspot package');

        // When package is available:
        // const WifiHotspot = require('react-native-wifi-hotspot');
        // await WifiHotspot.stopHotspot();
      }

      this.isHotspotActive = false;
      this.currentConfig = null;
      logger.info('✅ Hotspot stopped');

    } catch (error: any) {
      logger.error('❌ Error stopping hotspot:', error);
      // Reset state even if stop failed
      this.isHotspotActive = false;
      this.currentConfig = null;
    }
  }

  /**
   * Get current hotspot status
   */
  async getHotspotStatus(): Promise<HotspotStatus> {
    try {
      if (!this.isHotspotActive || !this.currentConfig) {
        return {
          isActive: false,
          connectedDevices: 0,
        };
      }

      // Try to get connected devices count
      let connectedDevices = 0;
      try {
        if (Platform.OS === 'android') {
          // Temporarily disabled - requires external package
          logger.warn('⚠️ Connected devices count disabled - requires react-native-wifi-hotspot package');
          connectedDevices = 0;

          // When package is available:
          // const WifiHotspot = require('react-native-wifi-hotspot');
          // const devices = await WifiHotspot.getConnectedDevices();
          // connectedDevices = devices ? devices.length : 0;
        }
      } catch (error) {
        logger.warn('⚠️ Could not get connected devices count:', error);
      }

      return {
        isActive: this.isHotspotActive,
        ssid: this.currentConfig.ssid,
        connectedDevices,
      };

    } catch (error: any) {
      logger.error('❌ Error getting hotspot status:', error);
      return {
        isActive: false,
        connectedDevices: 0,
        error: error.message,
      };
    }
  }

  /**
   * Check if hotspot is currently active
   */
  isActive(): boolean {
    return this.isHotspotActive;
  }

  /**
   * Get current hotspot configuration
   */
  getCurrentConfig(): HotspotConfig | null {
    return this.currentConfig;
  }

  /**
   * Generate secure hotspot credentials
   */
  generateHotspotCredentials(prefix: string = 'SPRED'): HotspotConfig {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6);
    
    return {
      ssid: `${prefix}_${timestamp}`,
      password: this.generateSecurePassword(),
      isWPA2: true,
    };
  }

  /**
   * Generate secure password
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(error: any): string {
    const message = error?.message || 'Unknown error';
    
    if (message.includes('permission')) {
      return 'Location and WiFi permissions are required to create hotspot';
    }
    
    if (message.includes('not supported')) {
      return 'WiFi hotspot is not supported on this device';
    }
    
    if (message.includes('iOS')) {
      return 'Please enable Personal Hotspot manually in Settings';
    }
    
    if (message.includes('already active')) {
      return 'Another hotspot is already active';
    }
    
    return `Hotspot error: ${message}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isHotspotActive) {
        await this.stopHotspot();
      }
      logger.info('✅ HotspotManager cleanup completed');
    } catch (error) {
      logger.error('❌ Error during HotspotManager cleanup:', error);
    }
  }
}

export default HotspotManager;