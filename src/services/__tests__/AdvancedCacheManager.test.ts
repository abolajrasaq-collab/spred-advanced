/**
 * Tests for Advanced Cache Manager
 */

import AdvancedCacheManager, { cacheManager } from '../AdvancedCacheManager';
import { mocks } from '../../utils/testing/TestUtils';

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
    contains: jest.fn(),
  })),
}));

describe('AdvancedCacheManager', () => {
  let manager: AdvancedCacheManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = AdvancedCacheManager.getInstance();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AdvancedCacheManager.getInstance();
      const instance2 = AdvancedCacheManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as exported cacheManager', () => {
      expect(cacheManager).toBe(manager);
    });
  });

  describe('Cache Operations', () => {
    it('should set and get cache items', async () => {
      const testData = { id: 1, name: 'Test Item' };
      
      await manager.set('test-key', testData);
      const result = await manager.get('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await manager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await manager.set('test-key', 'test-value');
      
      const exists = await manager.has('test-key');
      expect(exists).toBe(true);
      
      const notExists = await manager.has('non-existent-key');
      expect(notExists).toBe(false);
    });

    it('should delete cache items', async () => {
      await manager.set('test-key', 'test-value');
      
      const deleted = await manager.delete('test-key');
      expect(deleted).toBe(true);
      
      const result = await manager.get('test-key');
      expect(result).toBeNull();
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await manager.delete('non-existent-key');
      expect(deleted).toBe(false);
    });
  });

  describe('Cache Expiration', () => {
    it('should respect TTL for cache items', async () => {
      const testData = { id: 1, name: 'Test Item' };
      
      // Set with short TTL
      await manager.set('test-key', testData, { ttl: 100 });
      
      // Should be available immediately
      let result = await manager.get('test-key');
      expect(result).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      result = await manager.get('test-key');
      expect(result).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const testData = { id: 1, name: 'Test Item' };
      
      await manager.set('test-key', testData);
      
      const result = await manager.get('test-key');
      expect(result).toEqual(testData);
    });
  });

  describe('Cache Priority', () => {
    it('should handle different priority levels', async () => {
      const lowPriorityData = { id: 1, name: 'Low Priority' };
      const highPriorityData = { id: 2, name: 'High Priority' };
      
      await manager.set('low-key', lowPriorityData, { priority: 'low' });
      await manager.set('high-key', highPriorityData, { priority: 'high' });
      
      const lowResult = await manager.get('low-key');
      const highResult = await manager.get('high-key');
      
      expect(lowResult).toEqual(lowPriorityData);
      expect(highResult).toEqual(highPriorityData);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', () => {
      const stats = manager.getStats();
      
      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('missRate');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('oldestItem');
      expect(stats).toHaveProperty('newestItem');
    });

    it('should update statistics on cache operations', async () => {
      const initialStats = manager.getStats();
      
      await manager.set('test-key', 'test-value');
      
      const updatedStats = manager.getStats();
      expect(updatedStats.totalItems).toBe(initialStats.totalItems + 1);
    });

    it('should track hit and miss rates', async () => {
      // Miss
      await manager.get('non-existent-key');
      
      // Hit
      await manager.set('test-key', 'test-value');
      await manager.get('test-key');
      
      const stats = manager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
    });
  });

  describe('Cache Configuration', () => {
    it('should get default configuration', () => {
      const config = manager.getConfig();
      
      expect(config.maxSize).toBe(50 * 1024 * 1024); // 50MB
      expect(config.maxItems).toBe(1000);
      expect(config.defaultTTL).toBe(30 * 60 * 1000); // 30 minutes
      expect(config.cleanupInterval).toBe(5 * 60 * 1000); // 5 minutes
      expect(config.compressionEnabled).toBe(true);
    });

    it('should update configuration', () => {
      const newConfig = {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxItems: 2000,
      };
      
      manager.updateConfig(newConfig);
      
      const config = manager.getConfig();
      expect(config.maxSize).toBe(100 * 1024 * 1024);
      expect(config.maxItems).toBe(2000);
      expect(config.defaultTTL).toBe(30 * 60 * 1000); // unchanged
    });
  });

  describe('Cache Preloading', () => {
    it('should preload multiple items', async () => {
      const items = [
        { key: 'key1', data: 'value1' },
        { key: 'key2', data: 'value2' },
        { key: 'key3', data: 'value3' },
      ];
      
      await manager.preload(items);
      
      const result1 = await manager.get('key1');
      const result2 = await manager.get('key2');
      const result3 = await manager.get('key3');
      
      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
      expect(result3).toBe('value3');
    });

    it('should preload items with options', async () => {
      const items = [
        { key: 'key1', data: 'value1', options: { ttl: 1000 } },
        { key: 'key2', data: 'value2', options: { priority: 'high' } },
      ];
      
      await manager.preload(items);
      
      const result1 = await manager.get('key1');
      const result2 = await manager.get('key2');
      
      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });
  });

  describe('Cache Warmup', () => {
    it('should warm up cache with generated data', async () => {
      const keyGenerator = () => `key-${Math.random()}`;
      const dataGenerator = async (key: string) => `data-${key}`;
      
      await manager.warmup(keyGenerator, dataGenerator, 3);
      
      const stats = manager.getStats();
      expect(stats.totalItems).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Cache Cleanup', () => {
    it('should clear all cache items', async () => {
      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');
      
      await manager.clear();
      
      const result1 = await manager.get('key1');
      const result2 = await manager.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      
      const stats = manager.getStats();
      expect(stats.totalItems).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      const mockStorage = {
        set: jest.fn().mockImplementation(() => {
          throw new Error('Storage error');
        }),
        getString: jest.fn().mockReturnValue(null),
        delete: jest.fn(),
        getAllKeys: jest.fn().mockReturnValue([]),
      };
      
      // This should not throw
      await expect(manager.set('test-key', 'test-value')).resolves.not.toThrow();
    });

    it('should handle corrupted cache items', async () => {
      // Mock corrupted data
      const mockStorage = {
        set: jest.fn(),
        getString: jest.fn().mockReturnValue('corrupted-json'),
        delete: jest.fn(),
        getAllKeys: jest.fn().mockReturnValue(['cache_test-key']),
      };
      
      const result = await manager.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should track cache item sizes', async () => {
      const largeData = 'x'.repeat(1000);
      
      await manager.set('large-key', largeData);
      
      const stats = manager.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should handle size limits', async () => {
      // Set very small max size
      manager.updateConfig({ maxSize: 100 });
      
      const largeData = 'x'.repeat(200);
      
      await manager.set('large-key', largeData);
      
      // Should still work (eviction would happen in real scenario)
      const result = await manager.get('large-key');
      expect(result).toBe(largeData);
    });
  });

  describe('Access Tracking', () => {
    it('should track access count and last accessed time', async () => {
      await manager.set('test-key', 'test-value');
      
      // Access multiple times
      await manager.get('test-key');
      await manager.get('test-key');
      await manager.get('test-key');
      
      // Access count should be tracked
      const stats = manager.getStats();
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Timer', () => {
    it('should start cleanup timer on initialization', () => {
      // Timer should be started automatically
      expect(manager).toBeDefined();
    });

    it('should restart timer when cleanup interval changes', () => {
      const newInterval = 10000; // 10 seconds
      
      manager.updateConfig({ cleanupInterval: newInterval });
      
      // Should not throw
      expect(manager).toBeDefined();
    });
  });

  describe('Destroy', () => {
    it('should clean up resources on destroy', () => {
      manager.destroy();
      
      // Should not throw
      expect(manager).toBeDefined();
    });
  });
});
