/**
 * Production Logger - Smart logging system for production and development
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export interface LogConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  enableStackTrace: boolean;
}

class ProductionLogger {
  private config: LogConfig;
  private isProduction: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isProduction = !__DEV__;
    this.isDebugMode = __DEV__ || process.env.NODE_ENV === 'development';

    this.config = {
      level: this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG,
      enableTimestamps: true,
      enableColors: this.isDebugMode,
      enableStackTrace: this.isDebugMode,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    let formatted = '';

    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }

    formatted += `[${level}] ${message}`;
    return formatted;
  }

  private getStackTrace(): string {
    if (!this.config.enableStackTrace) {
      return '';
    }

    const stack = new Error().stack;
    if (!stack) {
      return '';
    }

    const lines = stack.split('\n');
    // Skip the first 3 lines (Error, getStackTrace, and the calling function)
    return lines.slice(3, 6).join('\n');
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return;
    }

    const formatted = this.formatMessage('ERROR', message, ...args);
    // DISABLED FOR PERFORMANCE
    // console.log(formatted, ...args);

    if (this.config.enableStackTrace) {
      // DISABLED FOR PERFORMANCE - console.('Stack trace:', this.getStackTrace());
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) {
      return;
    }

    const formatted = this.formatMessage('WARN', message, ...args);
    // DISABLED FOR PERFORMANCE
    // console.log(formatted, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) {
      return;
    }

    const formatted = this.formatMessage('INFO', message, ...args);
    // DISABLED FOR PERFORMANCE
    // console.log(formatted, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) {
      return;
    }

    const formatted = this.formatMessage('DEBUG', message, ...args);
    // DISABLED FOR PERFORMANCE
    // console.log(formatted, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.VERBOSE)) {
      return;
    }

    const formatted = this.formatMessage('VERBOSE', message, ...args);
    // DISABLED FOR PERFORMANCE
    // console.log(formatted, ...args);
  }

  // Performance logging
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  // Group logging for better organization
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.groupEnd();
    }
  }

  // Update configuration
  setConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): LogConfig {
    return { ...this.config };
  }

  // Set log level
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Export singleton instance
export const logger = new ProductionLogger();

// Export convenience functions
export const logError = (message: string, ...args: any[]) =>
  logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) =>
  logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) =>
  logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) =>
  logger.debug(message, ...args);
export const logVerbose = (message: string, ...args: any[]) =>
  logger.verbose(message, ...args);

export default logger;
