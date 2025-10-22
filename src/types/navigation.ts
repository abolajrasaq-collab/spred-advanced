/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { VideoContent, User } from './api';

// Root Stack Navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  PlayVideos: { item: VideoContent };
  LiveStream: {
    streamUrl: string;
    channelInfo: LiveStreamInfo;
  };
  LiveCategory: undefined;
  CategoryScreen: {
    categoryName: string;
    categoryId?: string;
  };
  SignIn: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  ConfirmEmail: { email: string };
  VerificationSuccessful: undefined;
  Success: { message: string };
  Help: undefined;
  Settings: undefined;
  Security: undefined;
  Account: undefined;
  Deposit: undefined;
  Upload: undefined;
  Download: undefined;
  Receive: undefined;
  TransferHistory: undefined;
  SpredShare: undefined;
  CreatorDashboard: undefined;
  CreatorProfile: { creatorId: string };
  NotificationDashboard: undefined;
  NotificationSettings: undefined;
  AccessibilitySettings: undefined;
  OfflineSettings: undefined;
  SecurityDashboard: undefined;
  EnhancedSettings: undefined;
  Search: undefined;
  Following: undefined;
  NewRelease: undefined;
  Maintenance: undefined;
  Offline: undefined;
  OfflineVideos: undefined;
  PlayDownloadedVideo: { videoPath: string; videoTitle: string };
  VideoPlayerTest: undefined;
  RealFileShareTest: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Homepage: undefined;
  Shorts: undefined;
  Upload: undefined;
  Download: undefined;
  Account: undefined;
};

// Application Stack Navigator
export type ApplicationStackParamList = {
  Main: NavigatorScreenParams<RootStackParamList>;
};

// Live Stream Types
export interface LiveStreamInfo {
  id: string;
  title: string;
  category: string;
  viewerCount: number;
  isLive: boolean;
  description: string;
  tags: string[];
  provider: {
    name: string;
    logo: string;
    description: string;
    establishedYear: number;
    headquarters: string;
    type: 'News' | 'Entertainment' | 'Music' | 'Kids';
  };
  streamingDetails: {
    quality: string;
    protocol: 'HLS' | 'MP4';
    bitrate: string;
    resolution: string;
    codec: string;
    startTime: string;
    duration: string;
  };
}

// Navigation Props
export interface NavigationProps {
  navigation: any;
  route: any;
}

// Screen Props
export interface ScreenProps<T = any> {
  navigation: any;
  route: {
    params: T;
  };
}

// Tab Bar Props
export interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Drawer Props
export interface DrawerProps {
  navigation: any;
  state: any;
  descriptors: any;
}