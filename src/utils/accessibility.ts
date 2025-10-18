/**
 * Accessibility Utilities
 * Helper functions and constants for improving app accessibility
 */

import {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityProps,
} from 'react-native';

// Accessibility roles for common components
export const AccessibilityRoles = {
  BUTTON: 'button' as AccessibilityRole,
  LINK: 'link' as AccessibilityRole,
  TEXT: 'text' as AccessibilityRole,
  IMAGE: 'image' as AccessibilityRole,
  HEADER: 'header' as AccessibilityRole,
  SEARCH: 'search' as AccessibilityRole,
  TAB: 'tab' as AccessibilityRole,
  TAB_LIST: 'tablist' as AccessibilityRole,
  LIST: 'list' as AccessibilityRole,
  LIST_ITEM: 'listitem' as AccessibilityRole,
  CHECKBOX: 'checkbox' as AccessibilityRole,
  RADIO: 'radio' as AccessibilityRole,
  SWITCH: 'switch' as AccessibilityRole,
  SLIDER: 'slider' as AccessibilityRole,
  PROGRESS_BAR: 'progressbar' as AccessibilityRole,
  ALERT: 'alert' as AccessibilityRole,
  MENU: 'menu' as AccessibilityRole,
  MENU_ITEM: 'menuitem' as AccessibilityRole,
  TOOLBAR: 'toolbar' as AccessibilityRole,
} as const;

// Accessibility hints for common interactions
export const AccessibilityHints = {
  DOUBLE_TAP_TO_ACTIVATE: 'Double tap to activate',
  DOUBLE_TAP_TO_OPEN: 'Double tap to open',
  DOUBLE_TAP_TO_PLAY: 'Double tap to play',
  DOUBLE_TAP_TO_PAUSE: 'Double tap to pause',
  DOUBLE_TAP_TO_SELECT: 'Double tap to select',
  DOUBLE_TAP_TO_TOGGLE: 'Double tap to toggle',
  SWIPE_LEFT_OR_RIGHT: 'Swipe left or right to navigate',
  SWIPE_UP_FOR_MORE: 'Swipe up for more options',
  ADJUSTABLE: 'Adjustable',
} as const;

// Standard accessibility labels
export const AccessibilityLabels = {
  LOADING: 'Loading',
  CLOSE: 'Close',
  BACK: 'Go back',
  MORE: 'More options',
  SEARCH: 'Search',
  FILTER: 'Filter',
  SORT: 'Sort',
  REFRESH: 'Refresh',
  SHARE: 'Share',
  DOWNLOAD: 'Download',
  PLAY: 'Play',
  PAUSE: 'Pause',
  STOP: 'Stop',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  SKIP: 'Skip',
  VOLUME: 'Volume',
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
  NOTIFICATIONS: 'Notifications',
  HOME: 'Home',
  FAVORITE: 'Favorite',
  ADD_TO_FAVORITES: 'Add to favorites',
  REMOVE_FROM_FAVORITES: 'Remove from favorites',
} as const;

// Common accessibility traits
export interface AccessibilityTraits {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  expanded?: boolean;
  busy?: boolean;
}

// Enhanced accessibility props interface
export interface EnhancedAccessibilityProps extends AccessibilityProps {
  testID?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessible?: boolean;
  accessibilityElementsHidden?: boolean;
  accessibilityViewIsModal?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

/**
 * Generate accessibility props for button components
 */
export const createButtonAccessibility = (
  label: string,
  hint?: string,
  disabled?: boolean,
  selected?: boolean,
): EnhancedAccessibilityProps => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.BUTTON,
  accessibilityLabel: label,
  accessibilityHint: hint || AccessibilityHints.DOUBLE_TAP_TO_ACTIVATE,
  accessibilityState: {
    disabled: disabled || false,
    selected: selected || false,
  },
});

/**
 * Generate accessibility props for text components
 */
export const createTextAccessibility = (
  text: string,
  isHeader?: boolean,
): EnhancedAccessibilityProps => ({
  accessible: true,
  accessibilityRole: isHeader
    ? AccessibilityRoles.HEADER
    : AccessibilityRoles.TEXT,
  accessibilityLabel: text,
});

/**
 * Generate accessibility props for image components
 */
export const createImageAccessibility = (
  altText: string,
  decorative?: boolean,
): EnhancedAccessibilityProps => {
  if (decorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
    };
  }

  return {
    accessible: true,
    accessibilityRole: AccessibilityRoles.IMAGE,
    accessibilityLabel: altText,
  };
};

/**
 * Generate accessibility props for input components
 */
export const createInputAccessibility = (
  label: string,
  value?: string,
  placeholder?: string,
  required?: boolean,
  invalid?: boolean,
  errorMessage?: string,
): EnhancedAccessibilityProps => {
  const accessibilityLabel = required ? `${label}, required field` : label;
  let accessibilityHint = placeholder
    ? `Placeholder: ${placeholder}`
    : undefined;

  if (invalid && errorMessage) {
    accessibilityHint = `${
      accessibilityHint || ''
    } Error: ${errorMessage}`.trim();
  }

  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint,
    accessibilityValue: value ? { text: value } : undefined,
    accessibilityState: {
      disabled: false,
    },
  };
};

/**
 * Generate accessibility props for list items
 */
export const createListItemAccessibility = (
  title: string,
  description?: string,
  position?: { index: number; total: number },
  selected?: boolean,
): EnhancedAccessibilityProps => {
  let accessibilityLabel = title;

  if (description) {
    accessibilityLabel += `, ${description}`;
  }

  if (position) {
    accessibilityLabel += `. Item ${position.index + 1} of ${position.total}`;
  }

  return {
    accessible: true,
    accessibilityRole: AccessibilityRoles.LIST_ITEM,
    accessibilityLabel,
    accessibilityHint: AccessibilityHints.DOUBLE_TAP_TO_SELECT,
    accessibilityState: {
      selected: selected || false,
    },
  };
};

/**
 * Generate accessibility props for video player controls
 */
export const createVideoControlAccessibility = (
  action: 'play' | 'pause' | 'stop' | 'next' | 'previous' | 'volume',
  state?: {
    isPlaying?: boolean;
    volume?: number;
    currentTime?: number;
    duration?: number;
  },
): EnhancedAccessibilityProps => {
  const actionLabels = {
    play: state?.isPlaying
      ? AccessibilityLabels.PAUSE
      : AccessibilityLabels.PLAY,
    pause: AccessibilityLabels.PAUSE,
    stop: AccessibilityLabels.STOP,
    next: AccessibilityLabels.NEXT,
    previous: AccessibilityLabels.PREVIOUS,
    volume: AccessibilityLabels.VOLUME,
  };

  const actionHints = {
    play: state?.isPlaying
      ? AccessibilityHints.DOUBLE_TAP_TO_PAUSE
      : AccessibilityHints.DOUBLE_TAP_TO_PLAY,
    pause: AccessibilityHints.DOUBLE_TAP_TO_PAUSE,
    stop: AccessibilityHints.DOUBLE_TAP_TO_ACTIVATE,
    next: AccessibilityHints.DOUBLE_TAP_TO_ACTIVATE,
    previous: AccessibilityHints.DOUBLE_TAP_TO_ACTIVATE,
    volume: AccessibilityHints.ADJUSTABLE,
  };

  const props: EnhancedAccessibilityProps = {
    accessible: true,
    accessibilityRole:
      action === 'volume'
        ? AccessibilityRoles.SLIDER
        : AccessibilityRoles.BUTTON,
    accessibilityLabel: actionLabels[action],
    accessibilityHint: actionHints[action],
  };

  if (action === 'volume' && state?.volume !== undefined) {
    props.accessibilityValue = {
      min: 0,
      max: 100,
      now: Math.round(state.volume * 100),
      text: `${Math.round(state.volume * 100)}%`,
    };
  }

  if (
    (action === 'play' || action === 'pause') &&
    state?.currentTime !== undefined &&
    state?.duration !== undefined
  ) {
    const currentMinutes = Math.floor(state.currentTime / 60);
    const currentSeconds = Math.floor(state.currentTime % 60);
    const durationMinutes = Math.floor(state.duration / 60);
    const durationSeconds = Math.floor(state.duration % 60);

    props.accessibilityHint += `. Current time: ${currentMinutes}:${currentSeconds
      .toString()
      .padStart(2, '0')} of ${durationMinutes}:${durationSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return props;
};

/**
 * Generate accessibility props for tab navigation
 */
export const createTabAccessibility = (
  tabName: string,
  selected?: boolean,
  index?: number,
  total?: number,
): EnhancedAccessibilityProps => {
  let accessibilityLabel = tabName;

  if (index !== undefined && total !== undefined) {
    accessibilityLabel += `. Tab ${index + 1} of ${total}`;
  }

  return {
    accessible: true,
    accessibilityRole: AccessibilityRoles.TAB,
    accessibilityLabel,
    accessibilityHint: AccessibilityHints.DOUBLE_TAP_TO_SELECT,
    accessibilityState: {
      selected: selected || false,
    },
  };
};

/**
 * Generate accessibility props for progress indicators
 */
export const createProgressAccessibility = (
  progress: number,
  label?: string,
  indeterminate?: boolean,
): EnhancedAccessibilityProps => {
  const accessibilityLabel = label || 'Progress';

  if (indeterminate) {
    return {
      accessible: true,
      accessibilityRole: AccessibilityRoles.PROGRESS_BAR,
      accessibilityLabel: `${accessibilityLabel}. Loading`,
      accessibilityState: {
        busy: true,
      },
    };
  }

  return {
    accessible: true,
    accessibilityRole: AccessibilityRoles.PROGRESS_BAR,
    accessibilityLabel,
    accessibilityValue: {
      min: 0,
      max: 100,
      now: Math.round(progress),
      text: `${Math.round(progress)}%`,
    },
  };
};

/**
 * Generate accessibility props for toggle/switch components
 */
export const createToggleAccessibility = (
  label: string,
  checked: boolean,
  hint?: string,
): EnhancedAccessibilityProps => ({
  accessible: true,
  accessibilityRole: AccessibilityRoles.SWITCH,
  accessibilityLabel: label,
  accessibilityHint: hint || AccessibilityHints.DOUBLE_TAP_TO_TOGGLE,
  accessibilityState: {
    checked,
  },
});

/**
 * Generate accessibility props for alert/notification components
 */
export const createAlertAccessibility = (
  message: string,
  type?: 'error' | 'warning' | 'info' | 'success',
): EnhancedAccessibilityProps => {
  const typePrefix = type
    ? `${type.charAt(0).toUpperCase() + type.slice(1)}: `
    : '';

  return {
    accessible: true,
    accessibilityRole: AccessibilityRoles.ALERT,
    accessibilityLabel: `${typePrefix}${message}`,
    accessibilityLiveRegion: 'polite',
  };
};

/**
 * Utility to combine multiple accessibility props
 */
export const combineAccessibilityProps = (
  ...props: (EnhancedAccessibilityProps | undefined)[]
): EnhancedAccessibilityProps => {
  return props.reduce<EnhancedAccessibilityProps>(
    (combined, current) => ({
      ...combined,
      ...current,
      accessibilityState: {
        ...combined.accessibilityState,
        ...current?.accessibilityState,
      },
    }),
    {},
  );
};

/**
 * Check if accessibility is enabled on the device
 */
export const isAccessibilityEnabled = async (): Promise<boolean> => {
  try {
    const { AccessibilityInfo } = require('react-native');
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('Unable to check accessibility status:', error);
    return false;
  }
};

/**
 * Announce message to screen reader
 */
export const announceToScreenReader = (message: string): void => {
  try {
    const { AccessibilityInfo } = require('react-native');
    AccessibilityInfo.announceForAccessibility(message);
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('Unable to announce to screen reader:', error);
  }
};

/**
 * Focus on element for accessibility
 */
export const focusOnElement = (reactTag: number): void => {
  try {
    const { AccessibilityInfo } = require('react-native');
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('Unable to set accessibility focus:', error);
  }
};

// Export types for use in components
export type { AccessibilityRole, AccessibilityState, AccessibilityProps };
