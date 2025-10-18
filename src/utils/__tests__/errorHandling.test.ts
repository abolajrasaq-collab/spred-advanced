/**
 * Error Handling Utilities Tests
 */

import { Alert } from 'react-native';
import {
  errorHandler,
  handleNetworkError,
  handleApiError,
  handleVideoError,
  handlePaymentError,
  ErrorCategory,
  ErrorSeverity,
} from '../errorHandling';

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
    jest.clearAllMocks();
  });

  describe('createError', () => {
    it('should create a standardized error object', () => {
      const error = errorHandler.createError(
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        'Network timeout',
        'Please check your connection',
        new Error('Timeout'),
        { url: 'https://api.example.com' },
      );

      expect(error).toMatchObject({
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Network timeout',
        userMessage: 'Please check your connection',
        context: { url: 'https://api.example.com' },
      });

      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('handleError', () => {
    it('should handle error with default configuration', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = errorHandler.createError(
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        'Invalid token',
        'Please sign in again',
      );

      errorHandler.handleError(error);

      expect(consoleSpy).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Error',
        'Please sign in again',
        [{ text: 'OK', style: 'default' }],
      );

      consoleSpy.mockRestore();
    });

    it('should not show user notification when disabled', () => {
      const error = errorHandler.createError(
        ErrorCategory.CLIENT,
        ErrorSeverity.LOW,
        'Client error',
        'Something went wrong',
      );

      errorHandler.handleError(error);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should add retry button for retryable errors', () => {
      const error = errorHandler.createError(
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        'Network error',
        'Connection failed',
      );

      errorHandler.handleError(error);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Error',
        'Connection failed',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Retry' }),
          expect.objectContaining({ text: 'OK' }),
        ]),
      );
    });
  });

  describe('getErrorStatistics', () => {
    it('should return correct error statistics', () => {
      // Create test errors
      const error1 = errorHandler.createError(
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        'Network error 1',
        'Network failed',
      );
      const error2 = errorHandler.createError(
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH,
        'Network error 2',
        'Network failed again',
      );
      const error3 = errorHandler.createError(
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        'Validation error',
        'Invalid input',
      );

      errorHandler.handleError(error1, { showUserNotification: false });
      errorHandler.handleError(error2, { showUserNotification: false });
      errorHandler.handleError(error3, { showUserNotification: false });

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBe(2);
      expect(stats.errorsByCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });
  });

  describe('exportErrorLog', () => {
    it('should export error log as JSON string', () => {
      const error = errorHandler.createError(
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        'Test error',
        'Test message',
      );

      errorHandler.handleError(error, { showUserNotification: false });

      const exportedLog = errorHandler.exportErrorLog();
      const parsedLog = JSON.parse(exportedLog);

      expect(Array.isArray(parsedLog)).toBe(true);
      expect(parsedLog).toHaveLength(1);
      expect(parsedLog[0]).toMatchObject({
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test error',
        userMessage: 'Test message',
      });
    });
  });
});

describe('Convenience Error Handlers', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
    jest.clearAllMocks();
  });

  describe('handleNetworkError', () => {
    it('should handle network errors correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const networkError = new Error('Network timeout');

      handleNetworkError(networkError, { url: 'https://api.example.com' });

      expect(consoleSpy).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Retry' }),
          expect.objectContaining({ text: 'OK' }),
        ]),
      );

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('handleApiError', () => {
    it('should handle API errors with proper categorization', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const apiError = {
        code: 'UNAUTHORIZED',
        message: 'Token expired',
        details: {},
        timestamp: new Date().toISOString(),
      };

      handleApiError(apiError);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Error',
        'Your session has expired. Please sign in again.',
        expect.any(Array),
      );

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorsByCategory[ErrorCategory.AUTHENTICATION]).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should handle validation errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const validationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: {},
        timestamp: new Date().toISOString(),
      };

      handleApiError(validationError);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Input Error',
        'Invalid email format',
        expect.any(Array),
      );

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorsByCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should handle generic errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const genericError = new Error('Something went wrong');

      handleApiError(genericError);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Something went wrong. Please try again.',
        expect.any(Array),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleVideoError', () => {
    it('should handle video errors without showing user notification', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const videoError = new Error('Video codec not supported');

      handleVideoError(videoError, 'Test Video Title');

      expect(consoleSpy).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled(); // Video errors don't show alerts

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorsByCategory[ErrorCategory.VIDEO_PLAYBACK]).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('handlePaymentError', () => {
    it('should handle payment errors as high severity', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const paymentError = new Error('Card declined');

      handlePaymentError(paymentError, 199.99);

      expect(consoleSpy).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Error',
        'Payment failed. Please check your payment details and try again.',
        expect.any(Array),
      );

      const stats = errorHandler.getErrorStatistics();
      expect(stats.errorsByCategory[ErrorCategory.PAYMENT]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);

      consoleSpy.mockRestore();
    });
  });
});

describe('Error Handler User ID Management', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
    jest.clearAllMocks();
  });

  it('should associate errors with user ID when set', () => {
    const userId = 'user123';
    errorHandler.setUserId(userId);

    const error = errorHandler.createError(
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      'Test error',
      'Test message',
    );

    expect(error.userId).toBe(userId);
  });

  it('should have null user ID when not set', () => {
    const error = errorHandler.createError(
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      'Test error',
      'Test message',
    );

    expect(error.userId).toBeNull();
  });
});
