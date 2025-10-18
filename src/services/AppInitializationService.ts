import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import AdvancedNotificationService from './AdvancedNotificationService';

interface AppSettings {
  isFirstLaunch: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenTutorial: boolean;
  appVersion: string;
  lastLaunchTime: number;
  launchCount: number;
  userPreferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    analytics: boolean;
    autoOptimization: boolean;
  };
}

class AppInitializationService {
  private static instance: AppInitializationService;
  private settings: AppSettings | null = null;
  private readonly STORAGE_KEY = 'app_initialization_settings';
  private readonly CURRENT_VERSION = '1.0.0';

  private constructor() {}

  public static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  public async initialize(): Promise<{
    isFirstLaunch: boolean;
    shouldShowOnboarding: boolean;
    shouldShowTutorial: boolean;
    settings: AppSettings;
  }> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🚀 Initializing app...');

      // Load existing settings
      await this.loadSettings();

      // Check if this is a first launch
      const isFirstLaunch = !this.settings || this.settings.isFirstLaunch;

      // Update launch count and time
      if (this.settings) {
        this.settings.launchCount += 1;
        this.settings.lastLaunchTime = Date.now();
      } else {
        this.settings = this.getDefaultSettings();
      }

      // Check if user should see onboarding (only for first-time users)
      const shouldShowOnboarding = isFirstLaunch;

      // No separate tutorial - onboarding covers everything
      const shouldShowTutorial = false;

      // Save updated settings
      await this.saveSettings();

      // Initialize notification service
      try {
        await AdvancedNotificationService.initialize();
        // DISABLED FOR PERFORMANCE
        // console.log('🔔 Notification service initialized');

        // Clear demo notifications on first launch
        if (isFirstLaunch) {
          await AdvancedNotificationService.clearAllNotifications();
          // DISABLED FOR PERFORMANCE
          // console.log('🧹 Demo notifications cleared on first launch');
        }
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Failed to initialize notification service:', error);
      }

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('app_launch', {
      //   isFirstLaunch,
      //   launchCount: this.settings.launchCount,
      //   platform: Platform.OS,
      //   version: this.CURRENT_VERSION,
      // });

      // DISABLED FOR PERFORMANCE
      // console.log('✅ App initialization completed');
      // DISABLED FOR PERFORMANCE
      // console.log(`📊 First launch: ${isFirstLaunch}`);
      // DISABLED FOR PERFORMANCE
      // console.log(`📊 Show onboarding: ${shouldShowOnboarding}`);
      // DISABLED FOR PERFORMANCE
      // console.log(`📊 Show tutorial: ${shouldShowTutorial}`);
      // DISABLED FOR PERFORMANCE
      // console.log(`📊 Launch count: ${this.settings.launchCount}`);

      return {
        isFirstLaunch,
        shouldShowOnboarding,
        shouldShowTutorial,
        settings: this.settings,
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize app:', error);

      // Return default settings on error
      const defaultSettings = this.getDefaultSettings();
      return {
        isFirstLaunch: true,
        shouldShowOnboarding: true,
        shouldShowTutorial: false,
        settings: defaultSettings,
      };
    }
  }

  public async markOnboardingCompleted(): Promise<void> {
    try {
      if (this.settings) {
        this.settings.hasCompletedOnboarding = true;
        await this.saveSettings();

        // DISABLED FOR PERFORMANCE
        // AnalyticsService.trackEvent('onboarding_completed', {
        //   launchCount: this.settings.launchCount,
        // });

        // DISABLED FOR PERFORMANCE
        // console.log('✅ Onboarding marked as completed');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to mark onboarding as completed:', error);
    }
  }

  public async markTutorialCompleted(): Promise<void> {
    try {
      if (this.settings) {
        this.settings.hasSeenTutorial = true;
        await this.saveSettings();

        // DISABLED FOR PERFORMANCE
        // AnalyticsService.trackEvent('tutorial_completed', {
        //   launchCount: this.settings.launchCount,
        // });

        // DISABLED FOR PERFORMANCE
        // console.log('✅ Tutorial marked as completed');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to mark tutorial as completed:', error);
    }
  }

  public async updateUserPreferences(
    preferences: Partial<AppSettings['userPreferences']>,
  ): Promise<void> {
    try {
      if (this.settings) {
        this.settings.userPreferences = {
          ...this.settings.userPreferences,
          ...preferences,
        };
        await this.saveSettings();

        // DISABLED FOR PERFORMANCE
        // AnalyticsService.trackEvent('preferences_updated', {
        //   preferences: this.settings.userPreferences,
        // });

        // DISABLED FOR PERFORMANCE
        // console.log('✅ User preferences updated');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update user preferences:', error);
    }
  }

  public getSettings(): AppSettings | null {
    return this.settings;
  }

  public async resetApp(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.settings = null;

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('app_reset');

      // DISABLED FOR PERFORMANCE
      // console.log('✅ App settings reset');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to reset app settings:', error);
    }
  }

  public async getAppStats(): Promise<{
    launchCount: number;
    daysSinceFirstLaunch: number;
    lastLaunchTime: number;
    isFirstLaunch: boolean;
    hasCompletedOnboarding: boolean;
    hasSeenTutorial: boolean;
  }> {
    if (!this.settings) {
      return {
        launchCount: 0,
        daysSinceFirstLaunch: 0,
        lastLaunchTime: 0,
        isFirstLaunch: true,
        hasCompletedOnboarding: false,
        hasSeenTutorial: false,
      };
    }

    const daysSinceFirstLaunch = Math.floor(
      (Date.now() - this.settings.lastLaunchTime) / (1000 * 60 * 60 * 24),
    );

    return {
      launchCount: this.settings.launchCount,
      daysSinceFirstLaunch,
      lastLaunchTime: this.settings.lastLaunchTime,
      isFirstLaunch: this.settings.isFirstLaunch,
      hasCompletedOnboarding: this.settings.hasCompletedOnboarding,
      hasSeenTutorial: this.settings.hasSeenTutorial,
    };
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.settings = JSON.parse(data);
        // DISABLED FOR PERFORMANCE
        // console.log('📱 App settings loaded');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load app settings:', error);
      this.settings = null;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      if (this.settings) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.settings),
        );
        // DISABLED FOR PERFORMANCE
        // console.log('💾 App settings saved');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save app settings:', error);
    }
  }

  private getDefaultSettings(): AppSettings {
    return {
      isFirstLaunch: true,
      hasCompletedOnboarding: false,
      hasSeenTutorial: false,
      appVersion: this.CURRENT_VERSION,
      lastLaunchTime: Date.now(),
      launchCount: 1,
      userPreferences: {
        theme: 'dark',
        notifications: true,
        analytics: true,
        autoOptimization: true,
      },
    };
  }
}

export default AppInitializationService.getInstance();
