/**
 * Performance Testing Setup
 * Configures mocks and utilities for performance testing
 */

// Mock performance.now for consistent testing
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
};

// Mock requestAnimationFrame for performance tests
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock process.memoryUsage for memory testing
const mockMemoryUsage = jest.fn(() => ({
  rss: 100 * 1024 * 1024, // 100MB
  heapTotal: 50 * 1024 * 1024, // 50MB
  heapUsed: 30 * 1024 * 1024, // 30MB
  external: 10 * 1024 * 1024, // 10MB
  arrayBuffers: 5 * 1024 * 1024, // 5MB
}));

global.process = {
  ...global.process,
  memoryUsage: mockMemoryUsage,
};

// Mock fetch for network performance tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('OK'),
  })
);

// Mock MMKV for cache performance tests
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

// Mock AsyncStorage for storage performance tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo for network performance tests
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Performance testing utilities
global.performanceTesting = {
  measureRenderTime: (component) => {
    const start = performance.now();
    // Component rendering would happen here
    const end = performance.now();
    return end - start;
  },
  
  measureMemoryUsage: () => {
    const memBefore = process.memoryUsage();
    // Operations would happen here
    const memAfter = process.memoryUsage();
    return memAfter.heapUsed - memBefore.heapUsed;
  },
  
  simulateNetworkLatency: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  generateLargeDataset: (size) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: `Data for item ${i}`,
    }));
  },
};

// Mock console methods for performance tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Performance test configuration
global.performanceConfig = {
  thresholds: {
    renderTime: 16, // 60fps
    memoryUsage: 50 * 1024 * 1024, // 50MB
    networkLatency: 1000, // 1 second
    cacheHitRate: 0.8, // 80%
  },
  testData: {
    smallDataset: 100,
    mediumDataset: 1000,
    largeDataset: 10000,
  },
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
