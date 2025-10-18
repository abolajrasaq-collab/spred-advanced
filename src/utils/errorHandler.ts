/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

import { Alert } from 'react-native';
import Snackbar from 'react-native-snackbar';
import logger from './logger';

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTH_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  API = 'API_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  STORAGE = 'STORAGE_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: number;
  context?: string;
  userMessage?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and process errors with appropriate user feedback
   */
  handleError(error: Error | AppError, context?: string): void {
    const appError = this.normalizeError(error, context);
    
    // Log error
    this.logError(appError);
    
    // Show user feedback based on severity
    this.showUserFeedback(appError);
    
    // Report to analytics if critical
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(appError);
    }
  }

  /**
   * Handle API errors with specific error codes
   */
  handleApiError(error: any, context?: string): void {
    const appError: AppError = {
      type: ErrorType.API,
      severity: this.getApiErrorSeverity(error),
      message: error.message || 'API request failed',
      code: error.code || error.response?.status?.toString(),
      details: {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      },
      timestamp: Date.now(),
      context,
      userMessage: this.getApiUserMessage(error),
    };

    this.handleError(appError);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any, context?: string): void {
    const appError: AppError = {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message: error.message || 'Authentication failed',
      code: error.code,
      details: error.details,
      timestamp: Date.now(),
      context,
      userMessage: this.getAuthUserMessage(error),
    };

    this.handleError(appError);
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any, context?: string): void {
    const appError: AppError = {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'Network connection failed',
      code: error.code,
      details: error.details,
      timestamp: Date.now(),
      context,
      userMessage: 'Please check your internet connection and try again.',
    };

    this.handleError(appError);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string, message: string, context?: string): void {
    const appError: AppError = {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      code: 'VALIDATION_ERROR',
      details: { field },
      timestamp: Date.now(),
      context,
      userMessage: message,
    };

    this.handleError(appError);
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.errorLog.forEach(error => {
      const key = `${error.type}_${error.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  }

  private normalizeError(error: Error | AppError, context?: string): AppError {
    if ('type' in error && 'severity' in error) {
      return error as AppError;
    }

    const normalizedError = error as Error;
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: normalizedError.message || 'An unknown error occurred',
      timestamp: Date.now(),
      context,
      userMessage: 'Something went wrong. Please try again.',
    };
  }

  private logError(error: AppError): void {
    // Add to error log
    this.errorLog.unshift(error);
    
    // Keep only recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (__DEV__) {
      logger.error(`[${error.type}] ${error.message}`, {
        severity: error.severity,
        context: error.context,
        details: error.details,
      });
    }
  }

  private showUserFeedback(error: AppError): void {
    const userMessage = error.userMessage || error.message;

    switch (error.severity) {
      case ErrorSeverity.LOW:
        // Show snackbar for low severity
        Snackbar.show({
          text: userMessage,
          duration: Snackbar.LENGTH_SHORT,
        });
        break;

      case ErrorSeverity.MEDIUM:
        // Show snackbar for medium severity
        Snackbar.show({
          text: userMessage,
          duration: Snackbar.LENGTH_LONG,
        });
        break;

      case ErrorSeverity.HIGH:
        // Show alert for high severity
        Alert.alert('Error', userMessage);
        break;

      case ErrorSeverity.CRITICAL:
        // Show alert with action for critical errors
        Alert.alert(
          'Critical Error',
          userMessage,
          [
            { text: 'OK', style: 'default' },
            { text: 'Report', onPress: () => this.reportCriticalError(error) },
          ]
        );
        break;
    }
  }

  private getApiErrorSeverity(error: any): ErrorSeverity {
    const status = error.response?.status;
    
    if (status >= 500) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private getApiUserMessage(error: any): string {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please sign in again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict detected. Please try again.';
      case 422:
        return message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return message || 'An error occurred. Please try again.';
    }
  }

  private getAuthUserMessage(error: any): string {
    const message = error.message?.toLowerCase();
    
    if (message?.includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (message?.includes('account not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message?.includes('account locked')) {
      return 'Your account has been locked. Please contact support.';
    }
    if (message?.includes('token expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    
    return 'Authentication failed. Please try again.';
  }

  private reportCriticalError(error: AppError): void {
    // In a real app, this would send to crash reporting service
    logger.error('Critical error reported:', {
      type: error.type,
      message: error.message,
      context: error.context,
      details: error.details,
    });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: Error | AppError, context?: string) => 
  errorHandler.handleError(error, context);

export const handleApiError = (error: any, context?: string) => 
  errorHandler.handleApiError(error, context);

export const handleAuthError = (error: any, context?: string) => 
  errorHandler.handleAuthError(error, context);

export const handleNetworkError = (error: any, context?: string) => 
  errorHandler.handleNetworkError(error, context);

export const handleValidationError = (field: string, message: string, context?: string) => 
  errorHandler.handleValidationError(field, message, context);
