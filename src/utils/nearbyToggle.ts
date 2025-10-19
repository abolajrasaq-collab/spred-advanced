/**
 * Utility for toggling between mock and real Nearby API modes
 * 
 * This is useful for development and testing purposes.
 * In production, you should set the mode in nearbyConfig.ts
 */

import { defaultNearbyConfig } from '../config/nearbyConfig';
import logger from './logger';

export class NearbyModeToggle {
  private static currentMode: 'mock' | 'real' = defaultNearbyConfig.useMockMode ? 'mock' : 'real';

  /**
   * Get the current mode
   */
  static getCurrentMode(): 'mock' | 'real' {
    return this.currentMode;
  }

  /**
   * Check if currently in mock mode
   */
  static isMockMode(): boolean {
    return this.currentMode === 'mock';
  }

  /**
   * Check if currently in real API mode
   */
  static isRealMode(): boolean {
    return this.currentMode === 'real';
  }

  /**
   * Toggle between mock and real modes
   * Note: This requires app restart to take effect
   */
  static toggleMode(): 'mock' | 'real' {
    this.currentMode = this.currentMode === 'mock' ? 'real' : 'mock';
    
    logger.info(`🔄 Nearby API mode toggled to: ${this.currentMode.toUpperCase()}`);
    logger.warn('⚠️ App restart required for mode change to take effect');
    
    return this.currentMode;
  }

  /**
   * Set specific mode
   * Note: This requires app restart to take effect
   */
  static setMode(mode: 'mock' | 'real'): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      logger.info(`🔧 Nearby API mode set to: ${mode.toUpperCase()}`);
      logger.warn('⚠️ App restart required for mode change to take effect');
    }
  }

  /**
   * Force mock mode (useful for testing)
   */
  static forceMockMode(): void {
    this.setMode('mock');
  }

  /**
   * Force real API mode (useful for production)
   */
  static forceRealMode(): void {
    this.setMode('real');
  }

  /**
   * Get mode status information
   */
  static getStatus(): {
    currentMode: 'mock' | 'real';
    configuredMode: 'mock' | 'real';
    requiresRestart: boolean;
  } {
    const configuredMode = defaultNearbyConfig.useMockMode ? 'mock' : 'real';
    
    return {
      currentMode: this.currentMode,
      configuredMode,
      requiresRestart: this.currentMode !== configuredMode,
    };
  }

  /**
   * Log current status
   */
  static logStatus(): void {
    const status = this.getStatus();
    
    logger.info('📊 Nearby API Mode Status:');
    logger.info(`   Current Mode: ${status.currentMode.toUpperCase()}`);
    logger.info(`   Configured Mode: ${status.configuredMode.toUpperCase()}`);
    logger.info(`   Requires Restart: ${status.requiresRestart ? 'YES' : 'NO'}`);
    
    if (status.requiresRestart) {
      logger.warn('⚠️ Mode change detected - restart app to apply changes');
    }
  }
}

export default NearbyModeToggle;