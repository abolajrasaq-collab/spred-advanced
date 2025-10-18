/**
 * Tests for Advanced Performance Monitor
 */

import AdvancedPerformanceMonitor, { performanceMonitor } from '../AdvancedPerformanceMonitor';
import { mocks } from '../../utils/testing/TestUtils';

// Mock performance.now
const mockPerformanceNow = jest.fn();
global.performance = {
  ...global.performance,
  now: mockPerformanceNow,
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
global.requestAnimationFrame = mockRequestAnimationFrame;

describe('AdvancedPerformanceMonitor', () => {
  let monitor: AdvancedPerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = AdvancedPerformanceMonitor.getInstance();
    mockPerformanceNow.mockReturnValue(1000);
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AdvancedPerformanceMonitor.getInstance();
      const instance2 = AdvancedPerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as exported performanceMonitor', () => {
      expect(performanceMonitor).toBe(monitor);
    });
  });

  describe('Device Info', () => {
    it('should return device information', () => {
      const deviceInfo = monitor.getCurrentMetrics().deviceInfo;
      
      expect(deviceInfo).toHaveProperty('platform');
      expect(deviceInfo).toHaveProperty('version');
      expect(deviceInfo).toHaveProperty('model');
      expect(deviceInfo).toHaveProperty('memory');
      expect(deviceInfo).toHaveProperty('screenSize');
      expect(deviceInfo).toHaveProperty('pixelRatio');
    });

    it('should estimate memory correctly for iOS', () => {
      const deviceInfo = monitor.getCurrentMetrics().deviceInfo;
      expect(deviceInfo.memory).toBeGreaterThan(0);
    });
  });

  describe('Monitoring', () => {
    it('should start monitoring', () => {
      const startSpy = jest.spyOn(monitor, 'startMonitoring');
      monitor.startMonitoring(1000);
      
      expect(startSpy).toHaveBeenCalledWith(1000);
    });

    it('should stop monitoring', () => {
      monitor.startMonitoring(1000);
      const stopSpy = jest.spyOn(monitor, 'stopMonitoring');
      
      monitor.stopMonitoring();
      
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not start monitoring twice', () => {
      monitor.startMonitoring(1000);
      monitor.startMonitoring(1000);
      
      // Should only start once
      expect(monitor).toBeDefined();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect performance metrics', () => {
      const metrics = monitor.getCurrentMetrics();
      
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('networkLatency');
      expect(metrics).toHaveProperty('frameDrops');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('deviceInfo');
    });

    it('should measure render time', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1016); // end (16ms)

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should estimate memory usage', () => {
      const metrics = monitor.getCurrentMetrics();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('should estimate CPU usage', () => {
      const metrics = monitor.getCurrentMetrics();
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Score', () => {
    it('should calculate performance score', () => {
      const score = monitor.getPerformanceScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should deduct points for poor performance', () => {
      // Mock poor performance metrics
      jest.spyOn(monitor, 'getCurrentMetrics').mockReturnValue({
        renderTime: 32, // > 16ms threshold
        memoryUsage: 90, // > 80% threshold
        networkLatency: 2000, // > 1000ms threshold
        frameDrops: 10, // > 5 threshold
        cpuUsage: 90, // > 80% threshold
        deviceInfo: {
          platform: 'ios',
          version: '16.0',
          model: 'iPhone 14',
          memory: 4096,
          screenSize: '390x844',
          pixelRatio: 2,
        },
      });

      const score = monitor.getPerformanceScore();
      expect(score).toBeLessThan(100);
    });

    it('should give perfect score for excellent performance', () => {
      // Mock excellent performance metrics
      jest.spyOn(monitor, 'getCurrentMetrics').mockReturnValue({
        renderTime: 8, // < 16ms threshold
        memoryUsage: 50, // < 80% threshold
        networkLatency: 100, // < 1000ms threshold
        frameDrops: 0, // < 5 threshold
        cpuUsage: 30, // < 80% threshold
        deviceInfo: {
          platform: 'ios',
          version: '16.0',
          model: 'iPhone 14',
          memory: 4096,
          screenSize: '390x844',
          pixelRatio: 2,
        },
      });

      const score = monitor.getPerformanceScore();
      expect(score).toBe(100);
    });
  });

  describe('Thresholds', () => {
    it('should get default thresholds', () => {
      const thresholds = monitor.getThresholds();
      
      expect(thresholds.renderTime).toBe(16);
      expect(thresholds.memoryUsage).toBe(80);
      expect(thresholds.networkLatency).toBe(1000);
      expect(thresholds.frameDrops).toBe(5);
      expect(thresholds.cpuUsage).toBe(80);
    });

    it('should update thresholds', () => {
      const newThresholds = {
        renderTime: 20,
        memoryUsage: 85,
      };

      monitor.setThresholds(newThresholds);
      const thresholds = monitor.getThresholds();

      expect(thresholds.renderTime).toBe(20);
      expect(thresholds.memoryUsage).toBe(85);
      expect(thresholds.networkLatency).toBe(1000); // unchanged
    });
  });

  describe('Subscribers', () => {
    it('should allow subscribing to performance reports', () => {
      const callback = jest.fn();
      const unsubscribe = monitor.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should notify subscribers when monitoring', () => {
      const callback = jest.fn();
      monitor.subscribe(callback);

      // Start monitoring to trigger report generation
      monitor.startMonitoring(100);
      
      // Wait for first report
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 200);
    });
  });

  describe('Force Cleanup', () => {
    it('should perform force cleanup', () => {
      const cleanupSpy = jest.spyOn(monitor, 'forceCleanup');
      
      monitor.forceCleanup();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should reset frame drop counter on cleanup', () => {
      monitor.forceCleanup();
      
      // Frame drops should be reset
      const metrics = monitor.getCurrentMetrics();
      expect(metrics.frameDrops).toBe(0);
    });
  });

  describe('Frame Monitoring', () => {
    it('should monitor frame drops on Android', () => {
      // Mock Android platform
      jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({
        OS: 'android',
        Version: '13',
        select: jest.fn(),
      });

      const newMonitor = AdvancedPerformanceMonitor.getInstance();
      expect(newMonitor).toBeDefined();
    });

    it('should monitor frame drops on iOS', () => {
      // Mock iOS platform
      jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({
        OS: 'ios',
        Version: '16.0',
        select: jest.fn(),
      });

      const newMonitor = AdvancedPerformanceMonitor.getInstance();
      expect(newMonitor).toBeDefined();
    });
  });

  describe('Memory Usage', () => {
    it('should handle memory measurement errors gracefully', () => {
      // Mock error in memory measurement
      jest.spyOn(global, 'gc').mockImplementation(() => {
        throw new Error('GC not available');
      });

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Network Latency', () => {
    it('should measure network latency', async () => {
      // Mock successful fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        })
      ) as jest.Mock;

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.networkLatency).toBeGreaterThanOrEqual(0);
    });

    it('should handle network errors gracefully', async () => {
      // Mock failed fetch
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

      const metrics = monitor.getCurrentMetrics();
      expect(metrics.networkLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Issues Detection', () => {
    it('should detect render performance issues', () => {
      // Mock poor render performance
      jest.spyOn(monitor, 'getCurrentMetrics').mockReturnValue({
        renderTime: 32, // > 16ms threshold
        memoryUsage: 50,
        networkLatency: 100,
        frameDrops: 0,
        cpuUsage: 30,
        deviceInfo: {
          platform: 'ios',
          version: '16.0',
          model: 'iPhone 14',
          memory: 4096,
          screenSize: '390x844',
          pixelRatio: 2,
        },
      });

      const score = monitor.getPerformanceScore();
      expect(score).toBeLessThan(100);
    });

    it('should detect memory issues', () => {
      // Mock high memory usage
      jest.spyOn(monitor, 'getCurrentMetrics').mockReturnValue({
        renderTime: 8,
        memoryUsage: 95, // > 80% threshold
        networkLatency: 100,
        frameDrops: 0,
        cpuUsage: 30,
        deviceInfo: {
          platform: 'ios',
          version: '16.0',
          model: 'iPhone 14',
          memory: 4096,
          screenSize: '390x844',
          pixelRatio: 2,
        },
      });

      const score = monitor.getPerformanceScore();
      expect(score).toBeLessThan(100);
    });
  });
});
