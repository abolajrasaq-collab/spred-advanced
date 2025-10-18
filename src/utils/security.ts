import logger from './logger';
/**
 * Security Utilities
 * Provides security functions for data validation, sanitization, and protection
 */

import CryptoJS from 'crypto-js';

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  ENCRYPTION_KEY_LENGTH: 32,
  IV_LENGTH: 16,
  SALT_LENGTH: 16,
} as const;

// Input validation patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SAFE_FILENAME: /^[a-zA-Z0-9._-]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SQL_INJECTION: /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  XSS: /[<>\"'%;()&+]/,
} as const;

// Blocked/dangerous keywords
const SECURITY_THREATS = {
  SQL_KEYWORDS: [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'DROP',
    'UNION',
    'EXEC',
    'EXECUTE',
    'SCRIPT',
    'DECLARE',
    'CREATE',
    'ALTER',
    'TRUNCATE',
  ],
  SCRIPT_TAGS: [
    '<script',
    '</script',
    'javascript:',
    'vbscript:',
    'onload=',
    'onerror=',
    'onclick=',
    'onmouseover=',
    'onfocus=',
    'onblur=',
  ],
  SENSITIVE_PATHS: [
    '/etc/passwd',
    '/etc/shadow',
    'web.config',
    '.env',
    'config.json',
    'database.yml',
    '.htaccess',
    'wp-config.php',
  ],
} as const;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
  strength?: 'weak' | 'medium' | 'strong';
}

/**
 * Email validation with comprehensive checks
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic format validation
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) {
    errors.push('Invalid email format');
  }

  // Length validation
  if (trimmedEmail.length > 254) {
    errors.push('Email address too long');
  }

  // Domain validation
  const [localPart, domain] = trimmedEmail.split('@');
  if (localPart && localPart.length > 64) {
    errors.push('Email local part too long');
  }

  // Check for common typos
  const commonDomainTypos = {
    'gmail.co': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
  };

  let sanitized = trimmedEmail;
  if (domain && commonDomainTypos[domain as keyof typeof commonDomainTypos]) {
    sanitized = `${localPart}@${
      commonDomainTypos[domain as keyof typeof commonDomainTypos]
    }`;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitized !== trimmedEmail ? sanitized : undefined,
  };
};

/**
 * Password validation with strength assessment
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors, strength: 'weak' };
  }

  // Length validation
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`,
    );
  }

  if (password.length > SECURITY_CONFIG.PASSWORD_MAX_LENGTH) {
    errors.push(
      `Password must not exceed ${SECURITY_CONFIG.PASSWORD_MAX_LENGTH} characters`,
    );
  }

  // Strength assessment
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 12;

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const strengthScore = [
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars,
    hasMinLength,
  ].filter(Boolean).length;

  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 2) {
    strength = 'medium';
  }

  // Common password checks
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    '1234567890',
  ];

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common patterns');
    strength = 'weak';
  }

  // Sequential characters check
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push('Password contains sequential characters');
  }

  return {
    isValid: errors.length === 0 && strength !== 'weak',
    errors,
    strength,
  };
};

/**
 * Phone number validation and sanitization
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  // Remove all non-digit characters except +
  const sanitized = phone.replace(/[^\d+]/g, '');

  // Basic format validation
  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    errors.push('Invalid phone number format');
  }

  // Length validation (after sanitization)
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    errors.push('Phone number must be between 10 and 15 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

/**
 * Input sanitization against XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/&/g, '&amp;')
    .trim();
};

/**
 * Check for SQL injection patterns
 */
export const detectSQLInjection = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }

  const upperInput = input.toUpperCase();

  // Check for SQL keywords
  const containsSQLKeywords = SECURITY_THREATS.SQL_KEYWORDS.some(keyword =>
    upperInput.includes(keyword),
  );

  // Check for SQL injection patterns
  const containsSQLPatterns = VALIDATION_PATTERNS.SQL_INJECTION.test(input);

  return containsSQLKeywords || containsSQLPatterns;
};

/**
 * Check for XSS attack patterns
 */
export const detectXSS = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }

  const lowerInput = input.toLowerCase();

  // Check for script tags and event handlers
  const containsScriptTags = SECURITY_THREATS.SCRIPT_TAGS.some(tag =>
    lowerInput.includes(tag),
  );

  // Check for XSS patterns
  const containsXSSPatterns = VALIDATION_PATTERNS.XSS.test(input);

  return containsScriptTags || containsXSSPatterns;
};

/**
 * Secure data encryption
 */
export const encryptData = (data: string, key?: string): string => {
  try {
    const encryptionKey = key || generateSecureKey();
    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Secure data decryption
 */
export const decryptData = (encryptedData: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const originalData = decrypted.toString(CryptoJS.enc.Utf8);

    if (!originalData) {
      throw new Error('Invalid decryption key or corrupted data');
    }

    return originalData;
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate secure random key
 */
export const generateSecureKey = (
  length: number = SECURITY_CONFIG.ENCRYPTION_KEY_LENGTH,
): string => {
  return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
};

/**
 * Generate secure hash
 */
export const generateSecureHash = (data: string, salt?: string): string => {
  const hashSalt = salt || generateSecureKey(SECURITY_CONFIG.SALT_LENGTH);
  return CryptoJS.SHA256(data + hashSalt).toString(CryptoJS.enc.Hex);
};

/**
 * Validate JWT token structure (basic validation)
 */
export const validateJWTStructure = (token: string): boolean => {
  if (typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    // Check if each part is valid base64
    parts.forEach(part => {
      const decoded = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      JSON.parse(decoded);
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if JWT token is expired
 */
export const isJWTExpired = (token: string): boolean => {
  if (!validateJWTStructure(token)) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < currentTime : true;
  } catch {
    return true;
  }
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - record.count);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

/**
 * Session security manager
 */
export class SessionSecurity {
  private sessionStartTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private sessionTimeout: number = SECURITY_CONFIG.SESSION_TIMEOUT;

  updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  isSessionExpired(): boolean {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;
    return timeSinceLastActivity > this.sessionTimeout;
  }

  getSessionRemainingTime(): number {
    const now = Date.now();
    const elapsed = now - this.lastActivityTime;
    return Math.max(0, this.sessionTimeout - elapsed);
  }

  extendSession(additionalTime?: number): void {
    this.lastActivityTime = Date.now();
    if (additionalTime) {
      this.sessionTimeout = additionalTime;
    }
  }

  invalidateSession(): void {
    this.sessionStartTime = 0;
    this.lastActivityTime = 0;
  }
}

/**
 * Secure storage wrapper
 */
export const secureStorage = {
  async setItem(
    key: string,
    value: string,
    encrypt: boolean = true,
  ): Promise<void> {
    try {
      const storageValue = encrypt ? encryptData(value) : value;
      // In a real implementation, use secure storage like Keychain (iOS) or Keystore (Android)
      const {
        getDataJson,
        storeDataJson,
      } = require('../helpers/api/Asyncstorage');
      await storeDataJson(`secure_${key}`, {
        data: storageValue,
        encrypted: encrypt,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.error('Secure storage set failed:', error);
      throw error;
    }
  },

  async getItem(key: string, decrypt: boolean = true): Promise<string | null> {
    try {
      const { getDataJson } = require('../helpers/api/Asyncstorage');
      const stored = await getDataJson(`secure_${key}`);

      if (!stored || !stored.data) {
        return null;
      }

      return decrypt && stored.encrypted
        ? decryptData(stored.data, generateSecureKey())
        : stored.data;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.error('Secure storage get failed:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const { storeDataJson } = require('../helpers/api/Asyncstorage');
      await storeDataJson(`secure_${key}`, null);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.error('Secure storage remove failed:', error);
      throw error;
    }
  },
};

/**
 * Validate file upload security
 */
export const validateFileUpload = (
  fileName: string,
  fileSize: number,
  fileType: string,
  maxSize: number = 50 * 1024 * 1024, // 50MB default
): ValidationResult => {
  const errors: string[] = [];

  // File name validation
  if (!fileName || typeof fileName !== 'string') {
    errors.push('Invalid file name');
  } else {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
    if (sanitizedName !== fileName) {
      errors.push('File name contains invalid characters');
    }

    // Check for sensitive file paths
    const containsSensitivePath = SECURITY_THREATS.SENSITIVE_PATHS.some(path =>
      fileName.toLowerCase().includes(path),
    );
    if (containsSensitivePath) {
      errors.push('File name contains restricted patterns');
    }
  }

  // File size validation
  if (fileSize <= 0) {
    errors.push('Invalid file size');
  } else if (fileSize > maxSize) {
    errors.push(`File size exceeds maximum limit of ${maxSize} bytes`);
  }

  // File type validation
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
    'application/pdf',
    'text/plain',
  ];

  if (!allowedTypes.includes(fileType.toLowerCase())) {
    errors.push('File type not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: fileName ? fileName.replace(/[^a-zA-Z0-9._-]/g, '') : undefined,
  };
};

/**
 * Content Security Policy validation
 */
export const validateCSP = (content: string): ValidationResult => {
  const errors: string[] = [];

  // Check for unsafe inline scripts
  if (/<script[^>]*>.*?<\/script>/gi.test(content)) {
    errors.push('Inline scripts detected');
  }

  // Check for unsafe inline styles
  if (/style\s*=\s*["'][^"']*["']/gi.test(content)) {
    errors.push('Inline styles detected');
  }

  // Check for data URLs
  if (/data:\s*[^;]*;base64/gi.test(content)) {
    errors.push('Data URLs detected');
  }

  // Check for external resource loading
  if (/src\s*=\s*["']https?:\/\/[^"']*["']/gi.test(content)) {
    errors.push('External resource references detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitizeInput(content),
  };
};

// Export singleton instances
export const globalRateLimiter = new RateLimiter();
export const sessionSecurity = new SessionSecurity();

// Export configuration
export { SECURITY_CONFIG, VALIDATION_PATTERNS, SECURITY_THREATS };
