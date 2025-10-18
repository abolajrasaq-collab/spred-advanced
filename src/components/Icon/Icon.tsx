import React, { memo } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  IconMappings,
  IconSizes,
  IconColors,
  IconName,
  IconSize,
  IconColor,
} from '../../theme/IconTheme';
import { useThemeColors } from '../../theme/ThemeProvider';

export interface IconProps {
  name: IconName | string;
  size?: IconSize | number;
  color?: IconColor | string;
  style?: any;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'white',
  style,
}) => {
  const themeColors = useThemeColors();

  // Map semantic name to MaterialIcons icon name with fallback
  const getIconName = (inputName: string): string => {
    // First check our IconMappings
    if (inputName in IconMappings) {
      return IconMappings[inputName as IconName];
    }

    // Common MaterialIcons icon mappings for direct usage
    const directMappings: Record<string, string> = {
      // Basic icons
      home: 'home',
      search: 'search',
      download: 'file-download',
      'file-download': 'file-download',
      add: 'add',
      plus: 'add',
      person: 'person',
      'video-library': 'video-library',
      notifications: 'notifications',
      bell: 'notifications',

      // Navigation
      'play-arrow': 'play-arrow',
      'arrow-left': 'arrow-back',
      'arrow-back': 'arrow-back',
      'arrow-forward': 'arrow-forward',
      back: 'arrow-back',
      right: 'arrow-forward',
      close: 'close',

      // Account & Settings
      wallet: 'account-balance-wallet',
      dashboard: 'dashboard',
      settings: 'settings',
      logout: 'logout',
      edit: 'edit',

      // Media icons
      playcircleo: 'play-circle-outline',
      'play-circle': 'play-circle-outline',
      'play-circle-outline': 'play-circle-outline',
      pause: 'pause',
      'pause-circle': 'pause-circle-outline',
      video: 'video-library',
      'video-collection': 'video-library',

      // Time & Schedule
      clockcircleo: 'schedule',
      schedule: 'schedule',
      clock: 'schedule',

      // Social & Sharing
      sharealt: 'share',
      share: 'share',
      heart: 'favorite-border',
      star: 'star-border',
      bookmark: 'bookmark',

      // Status & Info
      questioncircleo: 'help-outline',
      'help-outline': 'help-outline',
      'check-circle': 'check-circle',
      check: 'check',
      info: 'info',
      warning: 'warning',
      error: 'error',

      // Visual & Media
      camera: 'camera-alt',
      eye: 'visibility',
      fire: 'whatshot',
      'trending-up': 'trending-up',
      movie: 'movie',
      image: 'image',

      // Device & System
      devices: 'devices',
      wifi: 'wifi',
      'wifi-off': 'wifi-off',
      phone: 'phone',
      mail: 'mail',
      message: 'message',

      // File operations
      folder: 'folder',
      'folder-shared': 'folder-shared',
      file: 'description',

      // Video & Media specific
      videocamera: 'videocam',
      videocam: 'videocam',

      // Actions
      delete: 'delete',
      save: 'save',
      'stop-circle': 'stop-circle',
      recommend: 'thumb-up',

      // Fullscreen
      fullscreen: 'fullscreen',
      'fullscreen-exit': 'fullscreen-exit',

      // Additional common mappings
      down: 'keyboard-arrow-down',
      up: 'keyboard-arrow-up',
      pluscircleo: 'add-circle-outline',
      'cloud-upload': 'cloud-upload',

      // Fix singular vs plural naming
      notification: 'notifications',

      // Fix non-existent icons
      crown: 'stars',
      rocket: 'rocket-launch',
      book: 'menu-book',

      // Constants mappings
      ARROW_LEFT: 'arrow-back',
      CLOSE: 'close',
      INFO: 'info',
      REFRESH: 'refresh',
      VIDEO_LIBRARY: 'video-library',
      PEOPLE: 'people',
      EYE: 'visibility',
      DOWNLOAD_ARROW: 'file-download',
      STARS: 'stars',
      SCHEDULE: 'schedule',
      CLOUD_UPLOAD: 'cloud-upload',
      ANALYTICS: 'analytics',
      SETTINGS: 'settings',
    };

    if (inputName in directMappings) {
      return directMappings[inputName];
    }

    // Default fallback to prevent '?' icons
    return inputName || 'home';
  };

  const iconName = getIconName(name as string);

  // Get size value
  const iconSize =
    typeof size === 'string' && size in IconSizes
      ? IconSizes[size as IconSize]
      : (size as number);

  // Get color value with theme support
  const iconColor = (() => {
    if (typeof color === 'string' && color in IconColors) {
      return IconColors[color as IconColor];
    }
    // Check if it's a theme color
    if (typeof color === 'string' && color in themeColors.legacy) {
      return themeColors.legacy[color as keyof typeof themeColors.legacy];
    }
    return color as string;
  })();

  return (
    <MaterialIcons
      name={iconName}
      size={iconSize}
      color={iconColor}
      style={style}
    />
  );
};

export default memo(Icon);
