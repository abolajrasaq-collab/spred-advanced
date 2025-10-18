/**
 * Application configuration management
 * Centralized configuration for the entire app
 */

import { LogLevel } from '../utils/logger';

export interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };

  // Authentication
  auth: {
    tokenExpiryBuffer: number; // minutes before expiry to refresh
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
  };

  // UI/UX
  ui: {
    defaultLoadingTimeout: number;
    animationDuration: number;
    debounceDelay: number;
    throttleDelay: number;
  };

  // Storage
  storage: {
    maxCacheSize: number; // MB
    cacheExpiry: number; // hours
    maxOfflineStorage: number; // MB
  };

  // Performance
  performance: {
    enablePerformanceMonitoring: boolean;
    slowRenderThreshold: number; // ms
    largeListThreshold: number; // items
  };

  // Logging
  logging: {
    level: LogLevel;
    enableRemoteLogging: boolean;
    maxLogEntries: number;
    logRetentionDays: number;
  };

  // Feature Flags
  features: {
    enableOfflineMode: boolean;
    enablePushNotifications: boolean;
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enableLiveStreaming: boolean;
    enableP2PTransfer: boolean;
  };

  // Development
  development: {
    enableReduxDevTools: boolean;
    enableReactDevTools: boolean;
    enableFlipper: boolean;
    enableStorybook: boolean;
    mockApiResponses: boolean;
  };
}

const createConfig = (): AppConfig => {
  const isDevelopment = __DEV__;
  const isProduction = !isDevelopment;

  return {
    // API Configuration
    api: {
      baseUrl: process.env.API_URL || 'https://www.spred.cc/api',
      timeout: 30000, // 30 seconds
      retries: isProduction ? 3 : 0,
      retryDelay: 1000, // 1 second
    },

    // Authentication
    auth: {
      tokenExpiryBuffer: 5, // 5 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutes
    },

    // UI/UX
    ui: {
      defaultLoadingTimeout: 10000, // 10 seconds
      animationDuration: 300, // 300ms
      debounceDelay: 300, // 300ms
      throttleDelay: 100, // 100ms
    },

    // Storage
    storage: {
      maxCacheSize: 100, // 100MB
      cacheExpiry: 24, // 24 hours
      maxOfflineStorage: 500, // 500MB
    },

    // Performance
    performance: {
      enablePerformanceMonitoring: false, // Disabled for better performance
      slowRenderThreshold: 100, // 100ms
      largeListThreshold: 50, // 50 items
    },

    // Logging
    logging: {
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
      enableRemoteLogging: isProduction,
      maxLogEntries: 1000,
      logRetentionDays: 7,
    },

    // Feature Flags
    features: {
      enableOfflineMode: true,
      enablePushNotifications: true,
      enableAnalytics: false, // Disabled for better performance
      enableCrashReporting: isProduction,
      enableLiveStreaming: true,
      enableP2PTransfer: true,
    },

    // Development
    development: {
      enableReduxDevTools: isDevelopment,
      enableReactDevTools: isDevelopment,
      enableFlipper: isDevelopment,
      enableStorybook: false,
      mockApiResponses: isDevelopment,
    },
  };
};

// Create and export the configuration
export const appConfig = createConfig();

// Export individual config sections for convenience
export const {
  api,
  auth,
  ui,
  storage,
  performance,
  logging,
  features,
  development,
} = appConfig;

// Type guard to check if we're in development
export const isDevelopment = __DEV__;
export const isProduction = !isDevelopment;

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  if (isDevelopment) {
    return {
      name: 'development',
      apiUrl: process.env.API_URL || 'https://dev.spred.cc/api',
      enableDebugFeatures: true,
    };
  }

  if (process.env.NODE_ENV === 'staging') {
    return {
      name: 'staging',
      apiUrl: process.env.API_URL || 'https://staging.spred.cc/api',
      enableDebugFeatures: false,
    };
  }

  return {
    name: 'production',
    apiUrl: process.env.API_URL || 'https://www.spred.cc/api',
    enableDebugFeatures: false,
  };
};

// Feature flag helpers
export const isFeatureEnabled = (
  feature: keyof AppConfig['features'],
): boolean => {
  return appConfig.features[feature];
};

// Performance monitoring helpers
export const shouldMonitorPerformance = (): boolean => {
  return appConfig.performance.enablePerformanceMonitoring;
};

// Logging helpers
export const shouldLog = (level: LogLevel): boolean => {
  return level >= appConfig.logging.level;
};

export default appConfig;
