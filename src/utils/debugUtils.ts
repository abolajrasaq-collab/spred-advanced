/**
 * Development Tools and Debugging Utilities
 * Provides comprehensive debugging, logging, and development assistance tools
 */

import React, { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { performance } from './performance';
import { errorHandler } from './errorHandling';

// Debug configuration
export interface DebugConfig {
  enableConsoleLogging: boolean;
  enablePerformanceLogging: boolean;
  enableNetworkLogging: boolean;
  enableStateLogging: boolean;
  enableNavigationLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
}

export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enableConsoleLogging: __DEV__,
  enablePerformanceLogging: __DEV__,
  enableNetworkLogging: __DEV__,
  enableStateLogging: __DEV__,
  enableNavigationLogging: __DEV__,
  logLevel: 'debug',
  maxLogEntries: 1000,
};

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

// Debug service for managing development tools
class DebugService {
  private static instance: DebugService;
  private config: DebugConfig;
  private logs: LogEntry[] = [];
  private networkRequests: Map<string, any> = new Map();
  private componentRenderCounts: Map<string, number> = new Map();
  private stateChangeHistory: any[] = [];

  private constructor(config: DebugConfig = DEFAULT_DEBUG_CONFIG) {
    this.config = config;
    this.setupNetworkInterception();
  }

  static getInstance(config?: DebugConfig): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService(config);
    }
    return DebugService.instance;
  }

  /**
   * Log a debug message
   */
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: string,
    message: string,
    data?: any,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      stackTrace: level === 'error' ? new Error().stack : undefined,
    };

    this.addLogEntry(entry);

    if (this.config.enableConsoleLogging) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Debug helper methods
   */
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  /**
   * Track component render counts
   */
  trackComponentRender(componentName: string): void {
    const currentCount = this.componentRenderCounts.get(componentName) || 0;
    this.componentRenderCounts.set(componentName, currentCount + 1);

    if (currentCount > 50) {
      this.warn(
        'Performance',
        `Component ${componentName} has rendered ${currentCount + 1} times`,
        { componentName, renderCount: currentCount + 1 },
      );
    }
  }

  /**
   * Track state changes
   */
  trackStateChange(stateName: string, oldValue: any, newValue: any): void {
    if (!this.config.enableStateLogging) {
      return;
    }

    const changeEntry = {
      timestamp: new Date(),
      stateName,
      oldValue,
      newValue,
      stackTrace: new Error().stack,
    };

    this.stateChangeHistory.push(changeEntry);

    // Keep only recent changes
    if (this.stateChangeHistory.length > 100) {
      this.stateChangeHistory = this.stateChangeHistory.slice(-100);
    }

    this.debug('State', `State change: ${stateName}`, changeEntry);
  }

  /**
   * Track navigation events
   */
  trackNavigation(action: string, screenName: string, params?: any): void {
    if (!this.config.enableNavigationLogging) {
      return;
    }

    this.info('Navigation', `${action}: ${screenName}`, { screenName, params });
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    logs: LogEntry[];
    componentRenderCounts: Record<string, number>;
    networkRequests: any[];
    stateChangeHistory: any[];
    systemInfo: any;
    performanceMetrics: any;
  } {
    const systemInfo = this.getSystemInfo();
    const performanceMetrics = performance.getStats();

    return {
      logs: this.logs.slice(-50), // Last 50 logs
      componentRenderCounts: Object.fromEntries(this.componentRenderCounts),
      networkRequests: Array.from(this.networkRequests.values()).slice(-20),
      stateChangeHistory: this.stateChangeHistory.slice(-20),
      systemInfo,
      performanceMetrics,
    };
  }

  /**
   * Export debug data
   */
  exportDebugData(): string {
    const debugData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      ...this.getDebugInfo(),
    };

    return JSON.stringify(debugData, null, 2);
  }

  /**
   * Clear debug data
   */
  clearDebugData(): void {
    this.logs = [];
    this.networkRequests.clear();
    this.componentRenderCounts.clear();
    this.stateChangeHistory = [];
  }

  /**
   * Setup network request interception
   */
  private setupNetworkInterception(): void {
    if (!this.config.enableNetworkLogging || !__DEV__) {
      return;
    }

    // Intercept fetch requests
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const requestId = this.generateLogId();
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';

      const requestData = {
        id: requestId,
        url,
        method,
        headers: init?.headers,
        body: init?.body,
        timestamp: new Date(),
      };

      this.networkRequests.set(requestId, {
        ...requestData,
        status: 'pending',
      });
      this.debug('Network', `${method} ${url}`, requestData);

      try {
        const startTime = Date.now();
        const response = await originalFetch(input, init);
        const endTime = Date.now();
        const duration = endTime - startTime;

        const responseData = {
          ...requestData,
          status: 'completed',
          statusCode: response.status,
          statusText: response.statusText,
          duration,
          responseHeaders: response.headers
            ? Object.fromEntries(
                Array.from(response.headers as any).map(([key, value]) => [
                  key,
                  value,
                ]),
              )
            : {},
        };

        this.networkRequests.set(requestId, responseData);

        if (response.ok) {
          this.info(
            'Network',
            `${method} ${url} - ${response.status} (${duration}ms)`,
            responseData,
          );
        } else {
          this.warn(
            'Network',
            `${method} ${url} - ${response.status} (${duration}ms)`,
            responseData,
          );
        }

        return response;
      } catch (error: any) {
        const errorData = {
          ...requestData,
          status: 'failed',
          error: error.message,
          duration: Date.now() - requestData.timestamp.getTime(),
        };

        this.networkRequests.set(requestId, errorData);
        this.error('Network', `${method} ${url} - Failed`, errorData);

        throw error;
      }
    };
  }

  /**
   * Get system information
   */
  private getSystemInfo(): any {
    const screen = Dimensions.get('screen');
    const window = Dimensions.get('window');

    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      screen: {
        width: screen.width,
        height: screen.height,
        scale: screen.scale,
        fontScale: screen.fontScale,
      },
      window: {
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      },
      isDebug: __DEV__,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper methods
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);

    return messageLevel >= configLevel;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        // DISABLED FOR PERFORMANCE
        // console.log(message, entry.data || '');
        break;
      case 'info':
        // DISABLED FOR PERFORMANCE
        // console.log(message, entry.data || '');
        break;
      case 'warn':
        // DISABLED FOR PERFORMANCE
        // console.log(message, entry.data || '');
        break;
      case 'error':
        // DISABLED FOR PERFORMANCE
        // console.log(message, entry.data || '');
        if (entry.stackTrace) {
          // DISABLED FOR PERFORMANCE
          // console.log('Stack trace:', entry.stackTrace);
        }
        break;
    }
  }
}

// React Native specific debugging utilities
export class ReactNativeDebugger {
  /**
   * Log component lifecycle events
   */
  static logLifecycle(componentName: string, phase: string, props?: any): void {
    debug.debug('Lifecycle', `${componentName}: ${phase}`, {
      componentName,
      phase,
      props,
    });
  }

  /**
   * Measure component render performance
   */
  static measureComponentRender<T>(
    componentName: string,
    renderFn: () => T,
  ): T {
    const startTime = Date.now();
    const result = renderFn();
    const endTime = Date.now();
    const duration = endTime - startTime;

    performance.addMetric({
      timestamp: endTime,
      name: `${componentName}-render`,
      duration,
      category: 'RENDER',
      metadata: { componentName },
    });

    if (duration > 16) {
      // > 1 frame at 60fps
      debug.warn(
        'Performance',
        `Slow render: ${componentName} took ${duration}ms`,
      );
    }

    return result;
  }

  /**
   * Debug Redux state changes
   */
  static logReduxAction(action: any, prevState: any, nextState: any): void {
    debug.info('Redux', `Action: ${action.type}`, {
      action,
      prevState,
      nextState,
      diff: this.getStateDiff(prevState, nextState),
    });
  }

  /**
   * Get differences between states
   */
  private static getStateDiff(prev: any, next: any): any {
    const diff: any = {};

    for (const key in next) {
      if (prev[key] !== next[key]) {
        diff[key] = {
          from: prev[key],
          to: next[key],
        };
      }
    }

    return diff;
  }
}

// Memory debugging utilities
export class MemoryDebugger {
  private static memorySnapshots: Array<{
    timestamp: Date;
    used: number;
    total: number;
  }> = [];

  /**
   * Take memory snapshot
   */
  static takeSnapshot(): void {
    if (!__DEV__) {
      return;
    }

    // Note: React Native doesn't provide direct memory access
    // This is a placeholder for when such APIs are available
    const snapshot = {
      timestamp: new Date(),
      used: 0, // Would use actual memory API
      total: 0, // Would use actual memory API
    };

    this.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }

    debug.debug('Memory', 'Memory snapshot taken', snapshot);
  }

  /**
   * Get memory usage history
   */
  static getMemoryHistory(): typeof MemoryDebugger.memorySnapshots {
    return this.memorySnapshots;
  }

  /**
   * Clear memory snapshots
   */
  static clearSnapshots(): void {
    this.memorySnapshots = [];
  }
}

// Performance profiling utilities
export class PerformanceProfiler {
  private static profiles: Map<
    string,
    {
      startTime: number;
      samples: number[];
    }
  > = new Map();

  /**
   * Start profiling a function
   */
  static startProfile(name: string): void {
    this.profiles.set(name, {
      startTime: Date.now(),
      samples: [],
    });
  }

  /**
   * Add sample to profile
   */
  static addSample(name: string): void {
    const profile = this.profiles.get(name);
    if (profile) {
      profile.samples.push(Date.now() - profile.startTime);
    }
  }

  /**
   * End profiling and get results
   */
  static endProfile(name: string): {
    duration: number;
    sampleCount: number;
    averageSampleTime: number;
    samples: number[];
  } | null {
    const profile = this.profiles.get(name);
    if (!profile) {
      return null;
    }

    const duration = Date.now() - profile.startTime;
    const averageSampleTime =
      profile.samples.length > 0
        ? profile.samples.reduce((a, b) => a + b, 0) / profile.samples.length
        : 0;

    const result = {
      duration,
      sampleCount: profile.samples.length,
      averageSampleTime,
      samples: profile.samples,
    };

    debug.info('Performance', `Profile ${name} completed`, result);
    this.profiles.delete(name);

    return result;
  }
}

// Development tools overlay (for debugging UI)
export class DevToolsOverlay {
  private static isVisible = false;
  private static overlayRef: any = null;

  /**
   * Show development tools overlay
   */
  static show(): void {
    if (!__DEV__ || this.isVisible) {
      return;
    }

    // This would show an overlay with debug information
    // Implementation would depend on the specific overlay library used
    this.isVisible = true;
    debug.info('DevTools', 'Development tools overlay shown');
  }

  /**
   * Hide development tools overlay
   */
  static hide(): void {
    if (!this.isVisible) {
      return;
    }

    this.isVisible = false;
    debug.info('DevTools', 'Development tools overlay hidden');
  }

  /**
   * Toggle development tools overlay
   */
  static toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// React hooks for debugging
export function useDebugger(componentName: string) {
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current++;
    debug.trackComponentRender(componentName);
    ReactNativeDebugger.logLifecycle(componentName, 'render', {
      renderCount: renderCount.current,
    });
  });

  React.useEffect(() => {
    ReactNativeDebugger.logLifecycle(componentName, 'mount');

    return () => {
      ReactNativeDebugger.logLifecycle(componentName, 'unmount');
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    log: (message: string, data?: any) =>
      debug.debug(componentName, message, data),
    logError: (message: string, error?: any) =>
      debug.error(componentName, message, error),
  };
}

export function useDebugState<T>(stateName: string, state: T): T {
  const prevState = React.useRef<T>(state);

  React.useEffect(() => {
    if (prevState.current !== state) {
      debug.trackStateChange(stateName, prevState.current, state);
      prevState.current = state;
    }
  }, [stateName, state]);

  return state;
}

// Export debug service instance
export const debug = DebugService.getInstance();

// Export convenience functions
export const logDebug = debug.debug.bind(debug);
export const logInfo = debug.info.bind(debug);
export const logWarn = debug.warn.bind(debug);
export const logError = debug.error.bind(debug);

export default debug;
