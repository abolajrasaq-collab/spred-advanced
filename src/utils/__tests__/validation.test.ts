/**
 * Validation Utilities Tests
 */

import {
  validateEmail,
  validatePassword,
  validateNigerianPhone,
  validateNigerianBankAccount,
  validateCreditCard,
  validateUrl,
  validateFilename,
  validateInput,
  sanitizeInput,
  containsSecurityThreats,
  isCommonPassword,
  luhnCheck,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        '',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'ComplexP@ssw0rd',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBe('strong');
      });
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc',
        'Password',
        'password123',
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('rejects common passwords', () => {
      const commonPasswords = [
        'password',
        '123456',
        'qwerty',
        'admin',
      ];

      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a stronger password');
      });
    });

    it('rejects empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateNigerianPhone', () => {
    it('validates correct Nigerian phone numbers', () => {
      const validPhones = [
        '08012345678',
        '08123456789',
        '07012345678',
        '09012345678',
        '+2348012345678',
        '2348012345678',
      ];

      validPhones.forEach(phone => {
        const result = validateNigerianPhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid Nigerian phone numbers', () => {
      const invalidPhones = [
        '1234567890',
        '0801234567',
        '080123456789',
        '05012345678',
        'abc12345678',
        '',
      ];

      invalidPhones.forEach(phone => {
        const result = validateNigerianPhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateNigerianBankAccount', () => {
    it('validates correct Nigerian bank account numbers', () => {
      const validAccounts = [
        '1234567890',
        '9876543210',
        '0000000001',
      ];

      validAccounts.forEach(account => {
        const result = validateNigerianBankAccount(account);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid Nigerian bank account numbers', () => {
      const invalidAccounts = [
        '123456789',
        '12345678901',
        'abc1234567',
        '123456789a',
        '',
      ];

      invalidAccounts.forEach(account => {
        const result = validateNigerianBankAccount(account);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateCreditCard', () => {
    it('validates correct credit card numbers', () => {
      const validCards = [
        '4111111111111111', // Visa test card
        '5555555555554444', // Mastercard test card
        '378282246310005',  // American Express test card
      ];

      validCards.forEach(card => {
        const result = validateCreditCard(card);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid credit card numbers', () => {
      const invalidCards = [
        '1234567890123456',
        '4111111111111112',
        '123',
        'abc1234567890123',
        '',
      ];

      invalidCards.forEach(card => {
        const result = validateCreditCard(card);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateUrl', () => {
    it('validates correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com:8080/path?query=value',
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'example.com',
        '',
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateFilename', () => {
    it('validates correct filenames', () => {
      const validFilenames = [
        'document.pdf',
        'image-2024.jpg',
        'file_name.txt',
        'MyFile.docx',
      ];

      validFilenames.forEach(filename => {
        const result = validateFilename(filename);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid filenames', () => {
      const invalidFilenames = [
        'file<script>.txt',
        'file with spaces.txt',
        'file/with/slashes.txt',
        'CON.txt',
        '',
      ];

      invalidFilenames.forEach(filename => {
        const result = validateFilename(filename);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateInput', () => {
    it('validates input with rules', () => {
      const rules = [
        { required: true, message: 'Field is required' },
        { minLength: 3, message: 'Minimum 3 characters' },
        { maxLength: 10, message: 'Maximum 10 characters' },
      ];

      const result = validateInput('test', rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects input that violates rules', () => {
      const rules = [
        { required: true, message: 'Field is required' },
        { minLength: 5, message: 'Minimum 5 characters' },
      ];

      const result = validateInput('ab', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum 5 characters');
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes dangerous characters', () => {
      const dangerousInput = 'test<script>alert("xss")</script>';
      const sanitized = sanitizeInput(dangerousInput);
      expect(sanitized).toBe('testalertxss');
    });

    it('normalizes whitespace', () => {
      const input = 'test   with    spaces';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('test with spaces');
    });

    it('limits length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeInput(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('containsSecurityThreats', () => {
    it('detects SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      expect(containsSecurityThreats(sqlInjection)).toBe(true);
    });

    it('detects script tags', () => {
      const scriptTag = '<script>alert("xss")</script>';
      expect(containsSecurityThreats(scriptTag)).toBe(true);
    });

    it('detects sensitive paths', () => {
      const sensitivePath = '/etc/passwd';
      expect(containsSecurityThreats(sensitivePath)).toBe(true);
    });

    it('allows safe input', () => {
      const safeInput = 'This is a normal text input';
      expect(containsSecurityThreats(safeInput)).toBe(false);
    });
  });

  describe('isCommonPassword', () => {
    it('identifies common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
      commonPasswords.forEach(password => {
        expect(isCommonPassword(password)).toBe(true);
      });
    });

    it('allows uncommon passwords', () => {
      const uncommonPasswords = ['MyUniqueP@ssw0rd', 'Complex123!', 'SecurePass456'];
      uncommonPasswords.forEach(password => {
        expect(isCommonPassword(password)).toBe(false);
      });
    });
  });

  describe('luhnCheck', () => {
    it('validates correct credit card numbers', () => {
      const validCards = ['4111111111111111', '5555555555554444'];
      validCards.forEach(card => {
        expect(luhnCheck(card)).toBe(true);
      });
    });

    it('rejects invalid credit card numbers', () => {
      const invalidCards = ['4111111111111112', '1234567890123456'];
      invalidCards.forEach(card => {
        expect(luhnCheck(card)).toBe(false);
      });
    });
  });
});
