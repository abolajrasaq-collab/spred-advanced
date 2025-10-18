/**
 * Enhanced Testing Utilities
 * Provides comprehensive testing helpers and mocks for React Native
 */

import React from 'react';
import { render, RenderOptions, RenderAPI } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore, Store } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { store as appStore } from '../../store';
import { RootState } from '../../store';

// Mock data generators
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  wallet: 1000,
  profilePicture: 'https://example.com/avatar.jpg',
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLogin: '2024-01-01T00:00:00Z',
};

export const mockAuthState = {
  token: 'mock-jwt-token',
  isAuthenticated: true,
  user: mockUser,
  loading: false,
  error: null,
};

export const mockVideoContent = {
  id: '1',
  title: 'Test Video',
  description: 'Test video description',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 120,
  views: 1000,
  likes: 50,
  createdAt: '2024-01-01T00:00:00Z',
  category: 'entertainment',
};

export const mockCategory = {
  id: '1',
  name: 'Entertainment',
  description: 'Entertainment category',
  iconUrl: 'https://example.com/icon.jpg',
  contentCount: 100,
};

// Navigation mock
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// API mocks
export const mockApiResponse = <T>(data: T) => ({
  data,
  message: 'Success',
  statusCode: 200,
  success: true,
});

export const mockApiError = (message: string, statusCode: number = 400) => ({
  response: {
    data: {
      message,
      statusCode,
      success: false,
    },
    status: statusCode,
  },
  message,
  isAxiosError: true,
});

// Store factory
export const createMockStore = (preloadedState?: Partial<RootState>): Store => {
  return configureStore({
    reducer: appStore.reducer,
    preloadedState: {
      auth: mockAuthState,
      ...preloadedState,
    },
  });
};

// Custom render function with all providers
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    store = createMockStore(),
    ...renderOptions
  }: {
    store?: Store;
  } & Omit<RenderOptions, 'wrapper'> = {},
): RenderAPI => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </ThemeProvider>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock async storage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock MMKV storage
export const mockMMKV = {
  set: jest.fn(),
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  delete: jest.fn(),
  clearAll: jest.fn(),
  getAllKeys: jest.fn(),
  contains: jest.fn(),
};

// Mock image picker
export const mockImagePicker = {
  showImagePicker: jest.fn(),
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
};

// Mock file system
export const mockFileSystem = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
  copyFile: jest.fn(),
  moveFile: jest.fn(),
};

// Mock network info
export const mockNetInfo = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
};

// Mock video player
export const mockVideoPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  seek: jest.fn(),
  stop: jest.fn(),
  getCurrentTime: jest.fn(),
  getDuration: jest.fn(),
  setVolume: jest.fn(),
  setMuted: jest.fn(),
};

// Mock camera
export const mockCamera = {
  takePicture: jest.fn(),
  recordVideo: jest.fn(),
  stopRecording: jest.fn(),
  switchCamera: jest.fn(),
  setFlashMode: jest.fn(),
  setFocusMode: jest.fn(),
};

// Mock permissions
export const mockPermissions = {
  request: jest.fn(),
  check: jest.fn(),
  requestMultiple: jest.fn(),
  checkMultiple: jest.fn(),
};

// Mock device info
export const mockDeviceInfo = {
  getModel: jest.fn(() => 'iPhone 14'),
  getBrand: jest.fn(() => 'Apple'),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '16.0'),
  getUniqueId: jest.fn(() => 'unique-device-id'),
  getManufacturer: jest.fn(() => 'Apple'),
  isTablet: jest.fn(() => false),
  hasNotch: jest.fn(() => true),
};

// Mock analytics
export const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  alias: jest.fn(),
  group: jest.fn(),
  page: jest.fn(),
  screen: jest.fn(),
  flush: jest.fn(),
  reset: jest.fn(),
};

// Mock crashlytics
export const mockCrashlytics = {
  crash: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
  setUserId: jest.fn(),
  setUserEmail: jest.fn(),
  setUserName: jest.fn(),
  setAttributes: jest.fn(),
};

// Test data generators
export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockUser,
    id: `${index + 1}`,
    username: `user${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
};

export const generateMockVideos = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockVideoContent,
    id: `${index + 1}`,
    title: `Test Video ${index + 1}`,
    views: Math.floor(Math.random() * 10000),
    likes: Math.floor(Math.random() * 1000),
  }));
};

export const generateMockCategories = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockCategory,
    id: `${index + 1}`,
    name: `Category ${index + 1}`,
    contentCount: Math.floor(Math.random() * 1000),
  }));
};

// Wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock timers
export const mockTimers = () => {
  jest.useFakeTimers();
  return () => jest.useRealTimers();
};

// Mock date
export const mockDate = (date: string | Date) => {
  const mockDate = new Date(date);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  return () => jest.restoreAllMocks();
};

// Mock fetch
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
  
  return () => {
    (global.fetch as jest.Mock).mockRestore();
  };
};

// Mock axios
export const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  create: jest.fn(() => mockAxios),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Test helpers
export const expectToBeAccessible = (element: any) => {
  expect(element).toHaveAccessibilityRole();
  expect(element).toHaveAccessibilityLabel();
};

export const expectToBeInDocument = (element: any) => {
  expect(element).toBeTruthy();
};

export const expectToHaveText = (element: any, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectToHaveStyle = (element: any, style: object) => {
  expect(element).toHaveStyle(style);
};

// Performance testing helpers
export const measureRenderTime = async (renderFunction: () => void) => {
  const start = performance.now();
  renderFunction();
  const end = performance.now();
  return end - start;
};

export const measureMemoryUsage = () => {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage();
};

// Snapshot testing helpers
export const createSnapshot = (component: React.ReactElement) => {
  const { toJSON } = renderWithProviders(component);
  return toJSON();
};

export const expectSnapshotToMatch = (component: React.ReactElement) => {
  expect(createSnapshot(component)).toMatchSnapshot();
};

// Integration test helpers
export const renderWithNavigation = (
  component: React.ReactElement,
  initialRouteName: string = 'Home'
) => {
  return renderWithProviders(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

export const fireEvent = {
  press: (element: any) => element.props.onPress?.(),
  changeText: (element: any, text: string) => element.props.onChangeText?.(text),
  scroll: (element: any, event: any) => element.props.onScroll?.(event),
  focus: (element: any) => element.props.onFocus?.(),
  blur: (element: any) => element.props.onBlur?.(),
};

// Export all mocks
export const mocks = {
  navigation: mockNavigation,
  route: mockRoute,
  apiResponse: mockApiResponse,
  apiError: mockApiError,
  asyncStorage: mockAsyncStorage,
  mmkv: mockMMKV,
  imagePicker: mockImagePicker,
  fileSystem: mockFileSystem,
  netInfo: mockNetInfo,
  videoPlayer: mockVideoPlayer,
  camera: mockCamera,
  permissions: mockPermissions,
  deviceInfo: mockDeviceInfo,
  analytics: mockAnalytics,
  crashlytics: mockCrashlytics,
  axios: mockAxios,
};

// Export test data
export const testData = {
  users: generateMockUsers,
  videos: generateMockVideos,
  categories: generateMockCategories,
  user: mockUser,
  authState: mockAuthState,
  videoContent: mockVideoContent,
  category: mockCategory,
};

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render with our enhanced version
export { renderWithProviders as render };
