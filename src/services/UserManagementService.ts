import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from './AnalyticsService';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  preferences: UserPreferences;
  settings: UserSettings;
  stats: UserStats;
  createdAt: number;
  updatedAt: number;
  lastActive: number;
  isVerified: boolean;
  isPremium: boolean;
  subscription?: Subscription;
  socialLinks: SocialLinks;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
}

interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  videoQuality: 'low' | 'medium' | 'high' | 'auto';
  autoPlay: boolean;
  downloadQuality: 'low' | 'medium' | 'high';
  wifiOnlyDownloads: boolean;
  backgroundPlay: boolean;
  subtitles: boolean;
  parentalControls: boolean;
  contentFiltering: 'strict' | 'moderate' | 'lenient';
}

interface UserSettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  allowMessages: boolean;
  allowFriendRequests: boolean;
  showActivity: boolean;
  dataUsage: 'low' | 'medium' | 'high';
  cacheSize: number;
  autoSync: boolean;
  biometricAuth: boolean;
  twoFactorAuth: boolean;
}

interface UserStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalWatchTime: number;
  averageRating: number;
  followers: number;
  following: number;
  level: number;
  experience: number;
  badges: string[];
  achievements: string[];
  streak: number;
  lastActivity: number;
}

interface Subscription {
  type: 'free' | 'premium' | 'pro';
  startDate: number;
  endDate: number;
  autoRenew: boolean;
  features: string[];
}

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  github?: string;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showActivity: boolean;
  allowSearch: boolean;
  allowMessages: boolean;
  dataSharing: boolean;
  analytics: boolean;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  newVideos: boolean;
  comments: boolean;
  likes: boolean;
  shares: boolean;
  follows: boolean;
  mentions: boolean;
  systemUpdates: boolean;
  marketing: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

class UserManagementService {
  private static instance: UserManagementService;
  private currentUser: UserProfile | null = null;
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'user_profile';

  private constructor() {}

  public static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('👤 Initializing User Management Service...');

      await this.loadUserProfile();

      this.isInitialized = true;

      AnalyticsService.trackEvent('user_management_initialized');

      // DISABLED FOR PERFORMANCE
      // console.log('✅ User Management Service initialized');
      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize User Management Service:', error);
      return false;
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.currentUser = JSON.parse(data);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load user profile:', error);
    }
  }

  private async saveUserProfile(): Promise<void> {
    try {
      if (this.currentUser) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.currentUser),
        );
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save user profile:', error);
    }
  }

  public async createUserProfile(
    userData: Partial<UserProfile>,
  ): Promise<string> {
    try {
      const userProfile: UserProfile = {
        id: this.generateUserId(),
        username: userData.username || '',
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        avatar: userData.avatar,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        preferences: userData.preferences || this.getDefaultPreferences(),
        settings: userData.settings || this.getDefaultSettings(),
        stats: userData.stats || this.getDefaultStats(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastActive: Date.now(),
        isVerified: false,
        isPremium: false,
        subscription: userData.subscription,
        socialLinks: userData.socialLinks || {},
        privacy: userData.privacy || this.getDefaultPrivacy(),
        notifications: userData.notifications || this.getDefaultNotifications(),
      };

      this.currentUser = userProfile;
      await this.saveUserProfile();

      AnalyticsService.trackEvent('user_profile_created', {
        userId: userProfile.id,
        username: userProfile.username,
      });

      return userProfile.id;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to create user profile:', error);
      throw error;
    }
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: Date.now(),
      };
      await this.saveUserProfile();

      AnalyticsService.trackEvent('user_profile_updated', {
        userId: this.currentUser.id,
        updates: Object.keys(updates),
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  public async updateUserPreferences(
    preferences: Partial<UserPreferences>,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser.preferences = {
        ...this.currentUser.preferences,
        ...preferences,
      };
      this.currentUser.updatedAt = Date.now();
      await this.saveUserProfile();

      AnalyticsService.trackEvent('user_preferences_updated', preferences);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update user preferences:', error);
      throw error;
    }
  }

  public async updateUserSettings(
    settings: Partial<UserSettings>,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser.settings = { ...this.currentUser.settings, ...settings };
      this.currentUser.updatedAt = Date.now();
      await this.saveUserProfile();

      AnalyticsService.trackEvent('user_settings_updated', settings);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update user settings:', error);
      throw error;
    }
  }

  public async updateUserStats(stats: Partial<UserStats>): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser.stats = { ...this.currentUser.stats, ...stats };
      this.currentUser.updatedAt = Date.now();
      await this.saveUserProfile();

      AnalyticsService.trackEvent('user_stats_updated', stats);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update user stats:', error);
      throw error;
    }
  }

  public async updatePrivacySettings(
    privacy: Partial<PrivacySettings>,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser.privacy = { ...this.currentUser.privacy, ...privacy };
      this.currentUser.updatedAt = Date.now();
      await this.saveUserProfile();

      AnalyticsService.trackEvent('privacy_settings_updated', privacy);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update privacy settings:', error);
      throw error;
    }
  }

  public async updateNotificationSettings(
    notifications: Partial<NotificationSettings>,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      this.currentUser.notifications = {
        ...this.currentUser.notifications,
        ...notifications,
      };
      this.currentUser.updatedAt = Date.now();
      await this.saveUserProfile();

      AnalyticsService.trackEvent(
        'notification_settings_updated',
        notifications,
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update notification settings:', error);
      throw error;
    }
  }

  public async addAchievement(achievement: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      if (!this.currentUser.stats.achievements.includes(achievement)) {
        this.currentUser.stats.achievements.push(achievement);
        this.currentUser.updatedAt = Date.now();
        await this.saveUserProfile();

        AnalyticsService.trackEvent('achievement_unlocked', {
          userId: this.currentUser.id,
          achievement,
        });
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add achievement:', error);
      throw error;
    }
  }

  public async addBadge(badge: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No user profile found');
      }

      if (!this.currentUser.stats.badges.includes(badge)) {
        this.currentUser.stats.badges.push(badge);
        this.currentUser.updatedAt = Date.now();
        await this.saveUserProfile();

        AnalyticsService.trackEvent('badge_earned', {
          userId: this.currentUser.id,
          badge,
        });
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add badge:', error);
      throw error;
    }
  }

  public async updateLastActive(): Promise<void> {
    try {
      if (!this.currentUser) {
        return;
      }

      this.currentUser.lastActive = Date.now();
      await this.saveUserProfile();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update last active:', error);
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getUserStats(): UserStats | null {
    return this.currentUser?.stats || null;
  }

  public getUserPreferences(): UserPreferences | null {
    return this.currentUser?.preferences || null;
  }

  public getUserSettings(): UserSettings | null {
    return this.currentUser?.settings || null;
  }

  public getPrivacySettings(): PrivacySettings | null {
    return this.currentUser?.privacy || null;
  }

  public getNotificationSettings(): NotificationSettings | null {
    return this.currentUser?.notifications || null;
  }

  public isUserLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  public isUserPremium(): boolean {
    return this.currentUser?.isPremium || false;
  }

  public isUserVerified(): boolean {
    return this.currentUser?.isVerified || false;
  }

  public async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      AnalyticsService.trackEvent('user_logged_out');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to logout:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      timezone: 'UTC',
      theme: 'auto',
      fontSize: 'medium',
      videoQuality: 'auto',
      autoPlay: true,
      downloadQuality: 'medium',
      wifiOnlyDownloads: true,
      backgroundPlay: false,
      subtitles: false,
      parentalControls: false,
      contentFiltering: 'moderate',
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true,
      allowFriendRequests: true,
      showActivity: true,
      dataUsage: 'medium',
      cacheSize: 100,
      autoSync: true,
      biometricAuth: false,
      twoFactorAuth: false,
    };
  }

  private getDefaultStats(): UserStats {
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalDownloads: 0,
      totalWatchTime: 0,
      averageRating: 0,
      followers: 0,
      following: 0,
      level: 1,
      experience: 0,
      badges: [],
      achievements: [],
      streak: 0,
      lastActivity: Date.now(),
    };
  }

  private getDefaultPrivacy(): PrivacySettings {
    return {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: false,
      showActivity: true,
      allowSearch: true,
      allowMessages: true,
      dataSharing: false,
      analytics: true,
    };
  }

  private getDefaultNotifications(): NotificationSettings {
    return {
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      newVideos: true,
      comments: true,
      likes: true,
      shares: true,
      follows: true,
      mentions: true,
      systemUpdates: true,
      marketing: false,
      quietHours: false,
      quietStart: '22:00',
      quietEnd: '08:00',
    };
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }
}

export default UserManagementService.getInstance();
