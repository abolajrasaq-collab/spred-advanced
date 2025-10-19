/**
 * Configuration for Nearby API integration
 * 
 * This file controls whether to use real APIs or mock implementations
 * for development and testing purposes.
 */

export interface NearbyConfig {
  // Set to false to use real APIs, true for mock/testing
  useMockMode: boolean;
  
  // Service identifier for Nearby connections
  serviceId: string;
  
  // Device name to advertise
  deviceName: string;
  
  // Connection strategy for Android Nearby Connections
  connectionStrategy: 'CLUSTER' | 'STAR' | 'POINT_TO_POINT';
  
  // Auto-accept connections (for testing)
  autoAcceptConnections: boolean;
  
  // Timeout settings (in milliseconds)
  discoveryTimeout: number;
  connectionTimeout: number;
  transferTimeout: number;
}

// Default configuration
export const defaultNearbyConfig: NearbyConfig = {
  // Toggle this to switch between mock and real API
  // ENABLED FOR REAL DEVICE TESTING - crash protection is still active
  useMockMode: false, // Set to true for testing, false for production
  
  serviceId: 'SPRED_VIDEO_SHARE',
  deviceName: 'SPRED_Device',
  connectionStrategy: 'CLUSTER',
  autoAcceptConnections: true, // For testing - set to false in production
  
  // Timeouts
  discoveryTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  transferTimeout: 300000,  // 5 minutes
};

// Environment-based configuration
export const getNearbyConfig = (): NearbyConfig => {
  // You can add environment-based logic here
  // For example, automatically use mock mode in development
  const isDevelopment = __DEV__;
  
  return {
    ...defaultNearbyConfig,
    // Uncomment to automatically use mock mode in development
    // useMockMode: isDevelopment,
  };
};

export default getNearbyConfig;