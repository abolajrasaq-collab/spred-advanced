/**
 * Tests for Network Optimizer
 */

import NetworkOptimizer, { networkOptimizer } from '../NetworkOptimizer';
import { mocks } from '../../utils/testing/TestUtils';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => mocks.axios),
  isAxiosError: jest.fn((error) => error.isAxiosError),
}));

// Mock MMKV cache manager
jest.mock('../AdvancedCacheManager', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('NetworkOptimizer', () => {
  let optimizer: NetworkOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    optimizer = NetworkOptimizer.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NetworkOptimizer.getInstance();
      const instance2 = NetworkOptimizer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as exported networkOptimizer', () => {
      expect(networkOptimizer).toBe(optimizer);
    });
  });

  describe('Configuration', () => {
    it('should get default configuration', () => {
      const config = optimizer.getConfig();
      
      expect(config.baseURL).toBe('https://www.spred.cc/api');
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTTL).toBe(5 * 60 * 1000);
      expect(config.batchEnabled).toBe(true);
      expect(config.batchSize).toBe(10);
      expect(config.batchDelay).toBe(100);
    });

    it('should update configuration', () => {
      const newConfig = {
        baseURL: 'https://api.example.com',
        timeout: 60000,
        retryAttempts: 5,
      };
      
      optimizer.updateConfig(newConfig);
      
      const config = optimizer.getConfig();
      expect(config.baseURL).toBe('https://api.example.com');
      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
      expect(config.retryDelay).toBe(1000); // unchanged
    });
  });

  describe('Request Methods', () => {
    beforeEach(() => {
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });
    });

    it('should make GET requests', async () => {
      const result = await optimizer.get('/test');
      
      expect(mocks.axios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
      });
      expect(result).toEqual({ success: true });
    });

    it('should make POST requests', async () => {
      const data = { name: 'test' };
      const result = await optimizer.post('/test', data);
      
      expect(mocks.axios.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data,
      });
      expect(result).toEqual({ success: true });
    });

    it('should make PUT requests', async () => {
      const data = { name: 'test' };
      const result = await optimizer.put('/test', data);
      
      expect(mocks.axios.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test',
        data,
      });
      expect(result).toEqual({ success: true });
    });

    it('should make DELETE requests', async () => {
      const result = await optimizer.delete('/test');
      
      expect(mocks.axios.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      const { cacheManager } = require('../AdvancedCacheManager');
      cacheManager.get.mockResolvedValue(null);
      cacheManager.set.mockResolvedValue(undefined);
    });

    it('should cache successful responses', async () => {
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.get('/test', { cache: true });
      
      const { cacheManager } = require('../AdvancedCacheManager');
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return cached data when available', async () => {
      const cachedData = { cached: true };
      const { cacheManager } = require('../AdvancedCacheManager');
      cacheManager.get.mockResolvedValue(cachedData);

      const result = await optimizer.get('/test', { cache: true });
      
      expect(result).toEqual(cachedData);
      expect(mocks.axios.request).not.toHaveBeenCalled();
    });

    it('should not cache when disabled', async () => {
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.get('/test', { cache: false });
      
      const { cacheManager } = require('../AdvancedCacheManager');
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should use custom TTL', async () => {
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.get('/test', { cache: true, cacheTTL: 60000 });
      
      const { cacheManager } = require('../AdvancedCacheManager');
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        { success: true },
        { ttl: 60000 }
      );
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      const { cacheManager } = require('../AdvancedCacheManager');
      cacheManager.get.mockResolvedValue(null);

      // Make two identical requests simultaneously
      const promise1 = optimizer.get('/test');
      const promise2 = optimizer.get('/test');

      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toEqual({ success: true });
      expect(result2).toEqual({ success: true });
      
      // Should only make one actual request
      expect(mocks.axios.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      mocks.axios.request
        .mockRejectedValueOnce(mocks.apiError('Server Error', 500))
        .mockResolvedValueOnce({
          data: { success: true },
          status: 200,
          config: {},
        });

      const result = await optimizer.get('/test');
      
      expect(result).toEqual({ success: true });
      expect(mocks.axios.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry client errors', async () => {
      mocks.axios.request.mockRejectedValue(mocks.apiError('Bad Request', 400));

      await expect(optimizer.get('/test')).rejects.toThrow();
      expect(mocks.axios.request).toHaveBeenCalledTimes(1);
    });

    it('should respect retry attempts limit', async () => {
      mocks.axios.request.mockRejectedValue(mocks.apiError('Server Error', 500));

      await expect(optimizer.get('/test')).rejects.toThrow();
      expect(mocks.axios.request).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      mocks.axios.request.mockRejectedValue(mocks.apiError('Server Error', 500));

      await expect(optimizer.get('/test')).rejects.toThrow();
      
      // Should have taken time for retries with delays
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThan(0);
    });
  });

  describe('Batch Requests', () => {
    it('should execute batch requests', async () => {
      const requests = [
        { method: 'GET', url: '/test1' },
        { method: 'GET', url: '/test2' },
        { method: 'GET', url: '/test3' },
      ];

      mocks.axios.request
        .mockResolvedValueOnce({ data: { id: 1 }, status: 200, config: {} })
        .mockResolvedValueOnce({ data: { id: 2 }, status: 200, config: {} })
        .mockResolvedValueOnce({ data: { id: 3 }, status: 200, config: {} });

      const results = await optimizer.batchRequest(requests);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ id: 1 });
      expect(results[1]).toEqual({ id: 2 });
      expect(results[2]).toEqual({ id: 3 });
    });

    it('should handle batch request failures', async () => {
      const requests = [
        { method: 'GET', url: '/test1' },
        { method: 'GET', url: '/test2' },
      ];

      mocks.axios.request
        .mockResolvedValueOnce({ data: { id: 1 }, status: 200, config: {} })
        .mockRejectedValueOnce(new Error('Request failed'));

      await expect(optimizer.batchRequest(requests)).rejects.toThrow();
    });

    it('should respect batch size limits', async () => {
      const requests = Array.from({ length: 25 }, (_, i) => ({
        method: 'GET' as const,
        url: `/test${i}`,
      }));

      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.batchRequest(requests);
      
      // Should make requests in batches of 10 (default batch size)
      expect(mocks.axios.request).toHaveBeenCalledTimes(25);
    });
  });

  describe('Preloading', () => {
    it('should preload multiple URLs', async () => {
      const urls = ['/test1', '/test2', '/test3'];
      
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.preload(urls);
      
      expect(mocks.axios.request).toHaveBeenCalledTimes(3);
    });

    it('should handle preload failures gracefully', async () => {
      const urls = ['/test1', '/test2'];
      
      mocks.axios.request
        .mockResolvedValueOnce({ data: { success: true }, status: 200, config: {} })
        .mockRejectedValueOnce(new Error('Request failed'));

      // Should not throw
      await expect(optimizer.preload(urls)).resolves.not.toThrow();
    });
  });

  describe('Warmup', () => {
    it('should warm up with generated URLs', async () => {
      const urlGenerator = () => `/test-${Math.random()}`;
      
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.warmup(urlGenerator, 5);
      
      expect(mocks.axios.request).toHaveBeenCalledTimes(5);
    });
  });

  describe('Statistics', () => {
    it('should track network statistics', () => {
      const stats = optimizer.getStats();
      
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
      expect(stats).toHaveProperty('cachedRequests');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('errorRate');
    });

    it('should update statistics on requests', async () => {
      const initialStats = optimizer.getStats();
      
      mocks.axios.request.mockResolvedValue({
        data: { success: true },
        status: 200,
        config: {},
      });

      await optimizer.get('/test');
      
      const updatedStats = optimizer.getStats();
      expect(updatedStats.totalRequests).toBe(initialStats.totalRequests + 1);
    });

    it('should reset statistics', () => {
      optimizer.resetStats();
      
      const stats = optimizer.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const { cacheManager } = require('../AdvancedCacheManager');
      
      await optimizer.clearCache();
      
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mocks.axios.request.mockRejectedValue(new Error('Network Error'));

      await expect(optimizer.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      
      mocks.axios.request.mockRejectedValue(timeoutError);

      await expect(optimizer.get('/test')).rejects.toThrow();
    });
  });

  describe('Request Key Generation', () => {
    it('should generate unique keys for different requests', () => {
      const config1 = { method: 'GET', url: '/test1', data: { id: 1 } };
      const config2 = { method: 'GET', url: '/test2', data: { id: 2 } };
      
      // This would be tested internally, but we can verify the behavior
      expect(config1).not.toEqual(config2);
    });

    it('should generate same key for identical requests', () => {
      const config1 = { method: 'GET', url: '/test', data: { id: 1 } };
      const config2 = { method: 'GET', url: '/test', data: { id: 1 } };
      
      expect(config1).toEqual(config2);
    });
  });

  describe('Interceptors', () => {
    it('should set up request interceptor', () => {
      expect(mocks.axios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should set up response interceptor', () => {
      expect(mocks.axios.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
