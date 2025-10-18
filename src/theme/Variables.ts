/**
 * This file contains the application's variables.
 *
 * Define color, sizes, etc. here instead of duplicating them throughout the components.
 * That allows to change them more easily later on.
 */

import { ThemeNavigationColors } from '../../@types/theme';
import { SpredSemanticColors, SpredBrandColors, SpredComponentColors } from './SpredTokens';

/**
 * Colors - Updated with Spred Brand System
 * Primary: Spred Orange (#F45303)
 * Secondary: Deep Amber (#D69E2E)
 * Accent: Sophisticated Grey (#8B8B8B)
 */
export const Colors = {
  // Core Colors
  transparent: 'rgba(0,0,0,0)',
  white: '#ffffff',
  black: '#000000',

  // Primary Brand Colors - Spred Orange
  primary: SpredBrandColors.primary[500], // #F45303
  primaryLight: SpredBrandColors.primary[400], // #FB7A3C
  primaryDark: SpredBrandColors.primary[600], // #E04502
  primaryLighter: SpredBrandColors.primary[300], // #FDAB74
  primaryDarker: SpredBrandColors.primary[700], // #BE2F0C

  // Secondary Brand Colors - Deep Amber
  secondary: SpredBrandColors.secondary[500], // #D69E2E
  secondaryLight: SpredBrandColors.secondary[400], // #EAAF4D
  secondaryDark: SpredBrandColors.secondary[600], // #C8932A
  secondaryLighter: SpredBrandColors.secondary[300], // #FBCA73
  secondaryDarker: SpredBrandColors.secondary[700], // #B78525

  // Accent Colors - Sophisticated Grey
  accent: SpredBrandColors.accent[500], // #8B8B8B
  accentLight: SpredBrandColors.accent[400], // #9A9A9A
  accentDark: SpredBrandColors.accent[600], // #6A6A6A
  accentLighter: SpredBrandColors.accent[300], // #B3B3B3
  accentDarker: SpredBrandColors.accent[700], // #4A4A4A

  // Background Colors
  background: SpredSemanticColors.background.primary, // #0A0A0A
  backgroundSecondary: SpredSemanticColors.background.secondary, // #1A1A1A
  backgroundTertiary: SpredSemanticColors.background.tertiary, // #2A2A2A
  surface: SpredSemanticColors.background.surface, // #2A2A2A

  // Text Colors
  textPrimary: SpredSemanticColors.text.primary, // #FFFFFF
  textSecondary: SpredSemanticColors.text.secondary, // #CCCCCC
  textTertiary: SpredSemanticColors.text.tertiary, // #8B8B8B
  textAccent: SpredSemanticColors.text.accent, // #D69E2E (amber)
  textBrand: SpredSemanticColors.text.brand, // #F45303 (orange)
  textMuted: SpredSemanticColors.text.muted, // #6A6A6A

  // Status Colors (using warm palette)
  success: SpredSemanticColors.status.success, // #D69E2E (amber)
  warning: SpredSemanticColors.status.warning, // #F45303 (orange)
  error: SpredSemanticColors.status.error, // #E53E3E (warm red)
  info: SpredSemanticColors.status.info, // #8B8B8B (grey)
  active: SpredSemanticColors.status.active, // #F45303
  inactive: SpredSemanticColors.status.inactive, // #8B8B8B

  // Interactive Colors
  interactive: SpredSemanticColors.interactive.primary, // #F45303
  interactiveHover: SpredSemanticColors.interactive.primaryHover, // #E04502
  interactiveSecondary: SpredSemanticColors.interactive.secondary, // #D69E2E
  interactiveSecondaryHover: SpredSemanticColors.interactive.secondaryHover, // #C8932A
  interactiveTertiary: SpredSemanticColors.interactive.tertiary, // #8B8B8B
  interactiveTertiaryHover: SpredSemanticColors.interactive.tertiaryHover, // #9A9A9A
  interactiveDisabled: SpredSemanticColors.interactive.disabled, // #6A6A6A
  interactiveFocus: SpredSemanticColors.interactive.focus, // #F45303
  
  // Borders
  border: SpredSemanticColors.interactive.border, // #333333
  borderLight: SpredSemanticColors.interactive.borderLight, // #444444

  // Component-Specific Colors
  button: SpredComponentColors.button,
  card: SpredComponentColors.card,
  input: SpredComponentColors.input,
  badge: SpredComponentColors.badge,
  progress: SpredComponentColors.progress,
  avatar: SpredComponentColors.avatar,
  navigation: SpredComponentColors.navigation,

  // Gradients
  gradientPrimary: SpredSemanticColors.gradients.primary, // [Orange, Amber]
  gradientPrimaryReverse: SpredSemanticColors.gradients.primaryReverse, // [Amber, Orange]
  gradientSubtle: SpredSemanticColors.gradients.subtle, // [Dark surface gradient]

  // Legacy mappings (for gradual migration)
  inputBackground: SpredSemanticColors.background.surface,
  textGray800: SpredSemanticColors.text.primary,
  textGray400: SpredSemanticColors.text.secondary,
  textGray200: SpredSemanticColors.text.tertiary,
  circleButtonBackground: SpredSemanticColors.background.tertiary,
  circleButtonColor: SpredSemanticColors.text.primary,
};

export const NavigationColors: Partial<ThemeNavigationColors> = {
  primary: Colors.primary, // Spred Orange
  background: Colors.background, // Deep black
  card: Colors.backgroundSecondary, // Dark grey
  text: Colors.textPrimary, // White
  border: Colors.border, // Border grey
  notification: Colors.primary, // Spred Orange
};

/**
 * FontSize - Using Spred Typography Scale
 */
export const FontSize = {
  tiny: 12,
  small: 14,
  regular: 16,
  medium: 18,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
};

/**
 * Metrics Sizes - 8px grid system
 */
const tiny = 4;
const small = 8;
const medium = 12;
const regular = 16;
const large = 24;
const xlarge = 32;
const xxlarge = 40;
const xxxlarge = 48;

export const MetricsSizes = {
  tiny, // 4
  small, // 8
  medium, // 12
  regular, // 16
  large, // 24
  xlarge, // 32
  xxlarge, // 40
  xxxlarge, // 48
};

/**
 * Border Radius - Consistent rounding
 */
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 50,
  full: 9999,
};

/**
 * Common Gradients - Ready-to-use gradient strings
 */
export const Gradients = {
  // Primary gradient: Orange to Amber
  primary: 'linear-gradient(135deg, #F45303 0%, #D69E2E 100%)',
  primaryHorizontal: 'linear-gradient(90deg, #F45303 0%, #D69E2E 100%)',
  primaryVertical: 'linear-gradient(180deg, #F45303 0%, #D69E2E 100%)',
  
  // Reverse gradient: Amber to Orange
  primaryReverse: 'linear-gradient(135deg, #D69E2E 0%, #F45303 100%)',
  
  // Subtle background gradients
  backgroundSubtle: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
  
  // Button gradients
  buttonPrimary: 'linear-gradient(135deg, #F45303 0%, #D69E2E 100%)',
};

/**
 * Shadow Presets - For elevation
 */
export const Shadows = {
  none: 'none',
  sm: '0px 1px 2px rgba(0, 0, 0, 0.18)',
  md: '0px 2px 4px rgba(0, 0, 0, 0.23)',
  lg: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  xl: '0px 8px 16px rgba(0, 0, 0, 0.4)',
  
  // Colored shadows for brand elements
  primaryGlow: '0px 4px 20px rgba(244, 83, 3, 0.3)',
  secondaryGlow: '0px 4px 20px rgba(214, 158, 46, 0.3)',
};

/**
 * Quick Access Helper Functions
 */
export const ColorHelpers = {
  // Get opacity variant of a color
  withOpacity: (color: string, opacity: number): string => {
    // Simple opacity wrapper for hex colors
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `${color}${alpha}`;
  },
  
  // Common opacity variants
  opacity: {
    10: 0.1,
    20: 0.2,
    30: 0.3,
    40: 0.4,
    50: 0.5,
    60: 0.6,
    70: 0.7,
    80: 0.8,
    90: 0.9,
  },
};

export default {
  Colors,
  NavigationColors,
  FontSize,
  MetricsSizes,
  BorderRadius,
  Gradients,
  Shadows,
  ColorHelpers,
};