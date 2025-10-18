/**
 * Enhanced API Configuration
 * Provides secure API headers and configuration
 */

import { ApiHeaders } from '../../types/api';

// TODO: Move these to environment variables for security
const API_CONFIG = {
  MOBILE_APP_BYPASS_KEY: 'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
  USERNAME: 'SpredMediaAdmin',
  PASSWORD: 'SpredMediaLoveSpreding@2023',
} as const;

/**
 * Generate secure API headers
 * @param token - Optional authentication token
 * @returns API headers object
 */
export function customHeaders(token?: string): ApiHeaders {
  const headers: ApiHeaders = {
    'Content-Type': 'application/json',
    mobileAppByPassIVAndKey: API_CONFIG.MOBILE_APP_BYPASS_KEY,
    username: API_CONFIG.USERNAME,
    password: API_CONFIG.PASSWORD,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Generate headers for authenticated requests
 * @param token - Authentication token
 * @returns Authenticated API headers
 */
export function authenticatedHeaders(token: string): ApiHeaders {
  return {
    ...customHeaders(),
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Generate headers for public requests
 * @returns Public API headers
 */
export function publicHeaders(): ApiHeaders {
  return {
    'Content-Type': 'application/json',
    mobileAppByPassIVAndKey: API_CONFIG.MOBILE_APP_BYPASS_KEY,
    username: API_CONFIG.USERNAME,
    password: API_CONFIG.PASSWORD,
  };
}

/**
 * API configuration constants
 */
export const API_CONFIG_CONSTANTS = {
  BASE_URL: 'https://www.spred.cc/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;
