import { Platform } from 'react-native';

const LOG_LEVELS = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

const CURRENT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

const formatLog = (level: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const platform = Platform.OS;
  return `[${timestamp}] [${platform.toUpperCase()}] [${level}] ${message} ${JSON.stringify(
    args,
  )}`;
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
};

export default logger;
