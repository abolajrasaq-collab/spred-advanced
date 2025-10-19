import { Platform } from 'react-native';

const LOG_LEVELS = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

// Enhanced error context interface
interface ErrorContext {
  operation: string;
  component: string;
  timestamp: number;
  platform: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
    nativeError?: any;
  };
  context?: any;
}

const formatLog = (level: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const platform = Platform.OS;
  
  // Enhanced formatting for error contexts
  const formattedArgs = args.map(arg => {
    if (arg && typeof arg === 'object' && arg.operation && arg.component) {
      // This is an ErrorContext object
      return `\n  ErrorContext: ${JSON.stringify(arg, null, 2)}`;
    }
    return JSON.stringify(arg);
  }).join(' ');
  
  return `[${timestamp}] [${platform.toUpperCase()}] [${level}] ${message} ${formattedArgs}`;
};

// Platform-specific diagnostic information
const getPlatformDiagnostics = () => {
  const diagnostics: any = {
    platform: Platform.OS,
    version: Platform.Version,
    timestamp: new Date().toISOString(),
  };

  if (Platform.OS === 'android') {
    diagnostics.android = {
      apiLevel: Platform.Version,
      // Add more Android-specific info as needed
    };
  } else if (Platform.OS === 'ios') {
    diagnostics.ios = {
      version: Platform.Version,
      // Add more iOS-specific info as needed
    };
  }

  return diagnostics;
};

const logger = {
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, ...args));
    }
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, ...args));
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, ...args));
    }
  },
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, ...args));
    }
  },
  
  // Enhanced error logging with context
  errorWithContext: (message: string, errorContext: ErrorContext) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      const enhancedContext = {
        ...errorContext,
        platformDiagnostics: getPlatformDiagnostics()
      };
      console.error(formatLog('ERROR', message, enhancedContext));
    }
  },

  // Permission-specific logging
  permissionLog: (operation: string, result: any, context?: any) => {
    const logData = {
      operation,
      result,
      context,
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    };
    
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLog('PERMISSION', `Permission ${operation}`, logData));
    }
  },

  // Initialization logging
  initLog: (component: string, status: 'starting' | 'success' | 'failed', details?: any) => {
    const logData = {
      component,
      status,
      details,
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    };
    
    const level = status === 'failed' ? 'ERROR' : 'INFO';
    const message = `${component} initialization ${status}`;
    
    if (status === 'failed' && CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(formatLog(level, message, logData));
    } else if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.log(formatLog(level, message, logData));
    }
  },

  // Real-time status updates
  statusUpdate: (component: string, status: string, data?: any) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const logData = {
        component,
        status,
        data,
        timestamp: new Date().toISOString()
      };
      console.log(formatLog('STATUS', `${component} status: ${status}`, logData));
    }
  },

  // Get platform diagnostics
  getDiagnostics: () => getPlatformDiagnostics(),
};

export default logger;
