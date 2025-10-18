import { getDataJson, storeDataJson } from '../helpers/api/Asyncstorage';
const CryptoJS = require('crypto-js');

export interface SecuritySettings {
  isPinSet: boolean;
  isBiometricsEnabled: boolean;
  requireAuthForTransactions: boolean;
  transactionLimit: number;
}

class WalletSecurityService {
  private static instance: WalletSecurityService;
  private readonly PIN_KEY = 'spred_wallet_pin';
  private readonly SETTINGS_KEY = 'spred_wallet_security_settings';

  private constructor() {}

  public static getInstance(): WalletSecurityService {
    if (!WalletSecurityService.instance) {
      WalletSecurityService.instance = new WalletSecurityService();
    }
    return WalletSecurityService.instance;
  }

  // PIN Management
  async setPin(pin: string): Promise<void> {
    try {
      // Hash the PIN before storing
      const hashedPin = await this.hashPin(pin);
      await storeDataJson(this.PIN_KEY, hashedPin);

      // Update security settings
      const settings = await this.getSecuritySettings();
      await this.updateSecuritySettings({
        ...settings,
        isPinSet: true,
        requireAuthForTransactions: true,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error setting PIN:', error);
      throw new Error('Failed to set PIN');
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const storedPin = await getDataJson(this.PIN_KEY);
      if (!storedPin) {
        return false;
      }

      const hashedPin = await this.hashPin(pin);
      return hashedPin === storedPin;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error verifying PIN:', error);
      return false;
    }
  }

  async changePin(oldPin: string, newPin: string): Promise<void> {
    const isValid = await this.verifyPin(oldPin);
    if (!isValid) {
      throw new Error('Current PIN is incorrect');
    }

    await this.setPin(newPin);
  }

  async isPinSet(): Promise<boolean> {
    try {
      const storedPin = await getDataJson(this.PIN_KEY);
      return !!storedPin;
    } catch (error) {
      return false;
    }
  }

  // Biometric Management (simplified - always returns false since keychain not available)
  async enableBiometrics(): Promise<void> {
    try {
      const supported = await this.isBiometricsSupported();
      if (!supported) {
        throw new Error('Biometrics not supported on this device');
      }

      const settings = await this.getSecuritySettings();
      await this.updateSecuritySettings({
        ...settings,
        isBiometricsEnabled: true,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error enabling biometrics:', error);
      throw new Error('Failed to enable biometrics');
    }
  }

  async disableBiometrics(): Promise<void> {
    try {
      const settings = await this.getSecuritySettings();
      await this.updateSecuritySettings({
        ...settings,
        isBiometricsEnabled: false,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error disabling biometrics:', error);
      throw new Error('Failed to disable biometrics');
    }
  }

  async isBiometricsSupported(): Promise<boolean> {
    // Simplified - return false since keychain not available
    return false;
  }

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const settings = await getDataJson(this.SETTINGS_KEY);
      return {
        isPinSet: false,
        isBiometricsEnabled: false,
        requireAuthForTransactions: true,
        transactionLimit: 100000, // Default ₦100,000
        ...settings,
      };
    } catch (error) {
      return {
        isPinSet: false,
        isBiometricsEnabled: false,
        requireAuthForTransactions: true,
        transactionLimit: 100000,
      };
    }
  }

  async updateSecuritySettings(
    settings: Partial<SecuritySettings>,
  ): Promise<void> {
    try {
      const currentSettings = await this.getSecuritySettings();
      await storeDataJson(this.SETTINGS_KEY, {
        ...currentSettings,
        ...settings,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error updating security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  // Transaction Authentication
  async authenticateForTransaction(amount: number): Promise<boolean> {
    try {
      const settings = await this.getSecuritySettings();

      // Skip if auth not required
      if (!settings.requireAuthForTransactions) {
        return true;
      }

      // Skip for small amounts below limit
      if (amount <= settings.transactionLimit) {
        return true;
      }

      // Fall back to PIN if set
      if (settings.isPinSet) {
        // This should be handled by the UI
        return true; // UI will handle PIN entry
      }

      return false;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error authenticating for transaction:', error);
      return false;
    }
  }

  // Security Validation
  async validateSecurityForAction(
    action: 'transfer' | 'withdrawal',
    amount: number,
  ): Promise<{
    isValid: boolean;
    requiresAuth: boolean;
    reason?: string;
  }> {
    const settings = await this.getSecuritySettings();

    // Check if PIN is set for security-critical actions
    if (!settings.isPinSet) {
      return {
        isValid: false,
        requiresAuth: false,
        reason: 'Please set up a PIN to secure your wallet',
      };
    }

    // Check if authentication is required
    const requiresAuth =
      settings.requireAuthForTransactions && amount > settings.transactionLimit;

    return {
      isValid: true,
      requiresAuth,
    };
  }

  // Security Status
  async getSecurityStatus(): Promise<{
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    const settings = await this.getSecuritySettings();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!settings.isPinSet) {
      warnings.push('No PIN set');
      recommendations.push('Set up a PIN to secure your wallet');
    }

    if (settings.transactionLimit > 50000) {
      recommendations.push(
        'Consider lowering your transaction limit for better security',
      );
    }

    return {
      isSecure: settings.isPinSet,
      warnings,
      recommendations,
    };
  }

  // Reset Security
  async resetSecurity(): Promise<void> {
    try {
      // Clear PIN from AsyncStorage
      await storeDataJson(this.PIN_KEY, null);

      // Reset security settings
      await storeDataJson(this.SETTINGS_KEY, {
        isPinSet: false,
        isBiometricsEnabled: false,
        requireAuthForTransactions: true,
        transactionLimit: 100000,
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error resetting security:', error);
      throw new Error('Failed to reset security settings');
    }
  }

  // Private helper methods
  private async hashPin(pin: string): Promise<string> {
    // Hash the PIN using crypto-js for React Native compatibility
    return CryptoJS.SHA256(pin).toString();
  }
}

export default WalletSecurityService;
