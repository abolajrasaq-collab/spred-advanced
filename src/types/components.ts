/**
 * Component Props Interfaces
 * Defines proper TypeScript interfaces for component props
 */

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { VideoResponse, UserInfo, VideoMetadata } from './api';

// Video Player Component Props
export interface FullscreenVideoPlayerProps {
  source: { uri: string } | number;
  style?: ViewStyle;
  onLoad?: (data: {
    duration: number;
    naturalSize: { width: number; height: number };
    canPlayFastForward: boolean;
    canPlayReverse: boolean;
    canPlaySlowForward: boolean;
    canPlaySlowReverse: boolean;
    canStepBackward: boolean;
    canStepForward: boolean;
  }) => void;
  onError?: (error: {
    error: {
      errorString: string;
      errorException: string;
      errorStackTrace?: string;
    };
  }) => void;
  onBuffer?: (data: { isBuffering: boolean }) => void;
  onProgress?: (data: {
    currentTime: number;
    playableDuration: number;
    seekableDuration: number;
  }) => void;
  headers?: Record<string, string>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  paused?: boolean;
  volume?: number;
  muted?: boolean;
  rate?: number;
  seek?: number;
  onEnd?: () => void;
  onFullscreenPlayerWillPresent?: () => void;
  onFullscreenPlayerDidPresent?: () => void;
  onFullscreenPlayerWillDismiss?: () => void;
  onFullscreenPlayerDidDismiss?: () => void;
  allowsExternalPlayback?: boolean;
  playInBackground?: boolean;
  playWhenInactive?: boolean;
  ignoreSilentSwitch?: 'inherit' | 'ignore' | 'obey';
  mixWithOthers?: 'inherit' | 'mix' | 'duck';
}

export interface SimpleVideoPlayerProps {
  source: { uri: string } | number;
  style?: ViewStyle;
  thumbnail?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onFullscreen?: () => void;
}

// Navigation and Screen Props
export interface AppBarProps {
  userInfo?: UserInfo;
  title?: string;
  showBalance?: boolean;
  showNotifications?: boolean;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onLogoPress?: () => void;
}

export interface BackHeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showTitle?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export interface HomepageHeaderProps {
  user?: UserInfo;
  onSearchPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  greeting?: string;
}

// Custom UI Component Props
export interface CustomButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: string;
  rightIcon?: string;
}

export interface CustomTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  fontSize?: number;
  fontWeight?:
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | 'normal'
    | 'bold';
  color?: string;
  marginLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  lineHeight?: number;
  fontFamily?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  onPress?: () => void;
}

export interface CustomInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  label?: string;
  error?: string;
  disabled?: boolean;
  secure?: boolean;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}

// Video and Content Component Props
export interface VideoCardProps {
  video: VideoResponse;
  onPress: (video: VideoResponse) => void;
  onDownload?: (video: VideoResponse) => void;
  onShare?: (video: VideoResponse) => void;
  onAddToWatchLater?: (video: VideoResponse) => void;
  style?: ViewStyle;
  showDownloadButton?: boolean;
  showShareButton?: boolean;
}

export interface ContentCardProps {
  title: string;
  description?: string;
  imageUri?: string;
  onPress: () => void;
  style?: ViewStyle;
  aspectRatio?: number;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
}

export interface CategorySectionProps {
  title: string;
  data: VideoResponse[];
  onSeeAll?: () => void;
  onItemPress: (item: VideoResponse) => void;
  horizontal?: boolean;
  showSeeAll?: boolean;
  emptyMessage?: string;
}

// Download and P2P Component Props
export interface DownloadItemsProps {
  video: VideoResponse;
  onDownload: (quality: 'HD' | 'SD') => void;
  onCancel: () => void;
  downloadProgress?: number;
  isDownloading?: boolean;
  userToken?: string;
}

export interface P2PComponentProps {
  // P2P callbacks removed
  onTransferComplete?: (fileId: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  discoveryTimeout?: number;
}

// Creator Dashboard Component Props
export interface CreatorDashboardProps {
  navigation: any; // TODO: Type this properly with navigation prop
  stats?: {
    totalVideos: number;
    totalViews: number;
    totalEarnings: number;
    subscriberCount: number;
  };
}

export interface VideoTypeToggleProps {
  selectedType: 'video' | 'short' | 'livestream';
  onTypeChange: (type: 'video' | 'short' | 'livestream') => void;
  style?: ViewStyle;
}

// Upload Component Props
export interface UploadProgressProps {
  progress: number;
  fileName: string;
  fileSize?: number;
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

// Notification Component Props
export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  onPress?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showZero?: boolean;
}

// Search Component Props
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  style?: ViewStyle;
  autoFocus?: boolean;
  showRecentSearches?: boolean;
  recentSearches?: string[];
  onRecentSearchPress?: (query: string) => void;
}

// Icon Component Props
export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

// Tab Bar Component Props
export interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  style?: ViewStyle;
  activeColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
}

// Theme and Style Props
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface StyleUtils {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
  };
  shadows: {
    small: ViewStyle;
    medium: ViewStyle;
    large: ViewStyle;
  };
}
