/**
 * Test Utilities
 * Provides utilities for testing components and functions
 */

import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ThemeProvider } from '../theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <PaperProvider>
          {children}
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  wallet: {
    account_Reference: 'ACC123',
    balance: 1000,
    currency: 'NGN',
  },
  profilePicture: 'https://example.com/avatar.jpg',
  isVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  lastLogin: '2024-01-01T00:00:00Z',
};

export const mockVideoContent = {
  _ID: '1',
  title: 'Test Video',
  categoryId: '1',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 120,
  rating: 4.5,
  year: '2024',
  isLive: false,
  isPremium: false,
  isTrending: true,
  views: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  releaseDate: '2024-01-01',
  contentTypeId: '1',
  description: 'Test video description',
  tags: ['test', 'video'],
};

export const mockCategory = {
  _ID: '1',
  name: 'Test Category',
  description: 'Test category description',
  color: '#F45303',
  icon: 'test-icon',
  isActive: true,
};

// Mock functions
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

// Test helpers
export const createMockStore = (initialState = {}) => {
  return {
    ...store,
    getState: jest.fn(() => initialState),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  };
};

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from testing library
export * from '@testing-library/react-native';
export { customRender as render };
