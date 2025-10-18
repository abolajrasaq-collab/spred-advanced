/**
 * Authentication Types
 * Comprehensive type definitions for authentication system
 */

export interface User {
  id: string;
  username: string;
  email: string;
  wallet?: WalletInfo;
  profilePicture?: string;
  isVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface WalletInfo {
  account_Reference?: string;
  balance?: number;
  currency?: string;
  [key: string]: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  lastLogin?: string;
  loginAttempts?: number;
  isLocked?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    token: string;
    refreshToken?: string;
  };
  message?: string;
  error?: string;
}

export interface UserDetails {
  id: string;
  username: string;
  email: string;
  wallet: WalletInfo;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  autoPlay: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  sessionTimeout: number;
}
