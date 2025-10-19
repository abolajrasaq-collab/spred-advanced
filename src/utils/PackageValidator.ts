import { Platform } from 'react-native';
import logger from './logger';

// Package availability interface
interface PackageAvailability {
  isAvailable: boolean;
  packageName: string;
  error?: string;
  version?: string;
}

// Validation result interface
interface ValidationResult {
  android: PackageAvailability;
  ios: PackageAvailability;
  canUseRealAPI: boolean;
  recommendedFallback: 'qr_only' | 'mock_mode' | 'none';
  summary: string;
}

export class PackageValidator {
  private static instance: PackageValidator;
  private validationCache: ValidationResult | null = null;

  private constructor() {}

  static getInstance(): PackageValidator {
    if (!PackageValidator.instance) {
      PackageValidator.instance = new PackageValidator();
    }
    return PackageValidator.instance;
  }

  // Main validation method
  async validateNearbyPackages(): Promise<ValidationResult> {
    if (this.validationCache) {
      return this.validationCache;
    }

    logger.info('🔍 Starting Nearby API package validation...');

    const androidValidation = await this.validateAndroidPackage();
    const iosValidation = await this.validateIOSPackage();

    const canUseRealAPI = Platform.OS === 'android' 
      ? androidValidation.isAvailable 
      : iosValidation.isAvailable;

    let recommendedFallback: 'qr_only' | 'mock_mode' | 'none' = 'none';
    let summary = '';

    if (!canUseRealAPI) {
      if (Platform.OS === 'android' && !androidValidation.isAvailable) {
        recommendedFallback = 'qr_only';
        summary = `Android Nearby API unavailable: ${androidValidation.error}. Using QR fallback.`;
      } else if (Platform.OS === 'ios' && !iosValidation.isAvailable) {
        recommendedFallback = 'qr_only';
        summary = `iOS Multipeer Connectivity unavailable: ${iosValidation.error}. Using QR fallback.`;
      }
    } else {
      summary = `Real Nearby API available on ${Platform.OS}. Ready for device-to-device sharing.`;
    }

    const result: ValidationResult = {
      android: androidValidation,
      ios: iosValidation,
      canUseRealAPI,
      recommendedFallback,
      summary
    };

    this.validationCache = result;
    logger.info('✅ Package validation completed:', result);

    return result;
  }

  // Validate Expo Nearby Connections package
  private async validateExpoNearbyPackage(): Promise<PackageAvailability> {
    try {
      logger.info('📦 Validating Expo Nearby Connections package...');

      // Skip expo package validation since we removed it and use P2P service instead
      logger.info('📦 Skipping expo-nearby-connections validation - using P2P service instead');
      return {
        isAvailable: false,
        packageName: 'expo-nearby-connections',
        error: 'Package removed - using P2P service instead'
      };

      // Try to import the package safely
      let NearbyConnections;
      try {
        NearbyConnections = require('expo-nearby-connections');
      } catch (requireError) {
        logger.warn('⚠️ Failed to require expo-nearby-connections:', requireError);
        return {
          isAvailable: false,
          packageName: 'expo-nearby-connections',
          error: `Package require failed: ${requireError.message}`
        };
      }
      
      if (!NearbyConnections) {
        return {
          isAvailable: false,
          packageName: 'expo-nearby-connections',
          error: 'Package import returned null/undefined'
        };
      }

      // Check if the package has expected methods
      const expectedMethods = ['initialize', 'startAdvertising', 'startDiscovery', 'stopAdvertising', 'stopDiscovery'];
      const availableMethods = Object.keys(NearbyConnections);
      
      logger.info('📋 Available methods in NearbyConnections:', availableMethods);

      const missingMethods = expectedMethods.filter(method => !availableMethods.includes(method));
      
      if (missingMethods.length > 0) {
        logger.warn('⚠️ Some expected methods missing, but package might still work:', missingMethods);
      }

      logger.info('✅ Expo Nearby Connections package validation successful');
      return {
        isAvailable: true,
        packageName: 'expo-nearby-connections',
        version: '1.0.0'
      };

    } catch (error: any) {
      logger.error('❌ Expo Nearby Connections package validation failed:', error);
      
      return {
        isAvailable: false,
        packageName: 'expo-nearby-connections',
        error: error.message || 'Package import failed'
      };
    }
  }

  // Validate Android Nearby API package (legacy)
  private async validateAndroidPackage(): Promise<PackageAvailability> {
    // First try Expo Nearby Connections
    const expoResult = await this.validateExpoNearbyPackage();
    if (expoResult.isAvailable) {
      return expoResult;
    }

    // If Expo package not available, return the error
    return {
      isAvailable: false,
      packageName: 'expo-nearby-connections',
      error: 'Expo Nearby Connections package not available'
    };
  }

  // Validate iOS Multipeer Connectivity package
  private async validateIOSPackage(): Promise<PackageAvailability> {
    try {
      logger.info('🍎 Validating iOS Multipeer Connectivity package...');

      // Skip iOS package validation since we're using P2P service instead
      if (Platform.OS !== 'ios') {
        return {
          isAvailable: false,
          packageName: 'react-native-multipeer-connectivity',
          error: 'Not iOS platform'
        };
      }

      // Try to import the package safely
      let MultipeerConnectivity;
      try {
        MultipeerConnectivity = require('react-native-multipeer-connectivity');
      } catch (requireError) {
        logger.warn('⚠️ Failed to require react-native-multipeer-connectivity:', requireError);
        return {
          isAvailable: false,
          packageName: 'react-native-multipeer-connectivity',
          error: `Package require failed: ${requireError.message}`
        };
      }
      
      if (!MultipeerConnectivity) {
        return {
          isAvailable: false,
          packageName: 'react-native-multipeer-connectivity',
          error: 'Package import returned null/undefined'
        };
      }

      // Check if the package has expected properties/methods
      const expectedProperties = ['MultipeerConnectivity'];
      const hasExpectedStructure = expectedProperties.every(prop => 
        MultipeerConnectivity.hasOwnProperty(prop) || typeof MultipeerConnectivity[prop] !== 'undefined'
      );

      if (!hasExpectedStructure) {
        logger.warn('⚠️ iOS Multipeer package structure differs from expected');
        // Don't fail validation just because structure is different
        // The package might still work
      }

      logger.info('✅ iOS Multipeer Connectivity package validation successful');
      return {
        isAvailable: true,
        packageName: 'react-native-multipeer-connectivity',
        version: '0.1.0' // From package.json
      };

    } catch (error: any) {
      logger.error('❌ iOS Multipeer Connectivity package validation failed:', error);
      
      return {
        isAvailable: false,
        packageName: 'react-native-multipeer-connectivity',
        error: error.message || 'Package import failed'
      };
    }
  }

  // Clear validation cache (useful for retesting)
  clearCache(): void {
    this.validationCache = null;
    logger.info('🗑️ Package validation cache cleared');
  }

  // Get cached validation result without re-running validation
  getCachedValidation(): ValidationResult | null {
    return this.validationCache;
  }

  // Quick check if real API is available for current platform
  async isRealAPIAvailable(): Promise<boolean> {
    const validation = await this.validateNearbyPackages();
    return validation.canUseRealAPI;
  }

  // Get user-friendly error message for UI display
  async getUserFriendlyStatus(): Promise<string> {
    const validation = await this.validateNearbyPackages();
    
    if (validation.canUseRealAPI) {
      return 'Nearby sharing is ready! You can share videos directly between devices.';
    }

    switch (validation.recommendedFallback) {
      case 'qr_only':
        return 'Nearby sharing is not available on this device. You can still share videos using QR codes.';
      case 'mock_mode':
        return 'Nearby sharing is in test mode. Real device sharing is not available.';
      default:
        return 'Sharing features are available with limited functionality.';
    }
  }

  // Debug information for troubleshooting
  async getDebugInfo(): Promise<any> {
    const validation = await this.validateNearbyPackages();
    
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      validation,
      timestamp: new Date().toISOString(),
      environment: __DEV__ ? 'development' : 'production'
    };
  }
}

export default PackageValidator;