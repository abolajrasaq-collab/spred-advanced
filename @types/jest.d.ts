/**
 * Jest Type Declarations
 * Provides TypeScript support for Jest testing framework
 */

/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      // Custom Jest matchers can be added here if needed
    }
  }
}

export {};
