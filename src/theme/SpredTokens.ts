/**
 * Spred Design System Tokens
 *
 * Central source of truth for all design tokens used in the Spred app.
 * This includes colors, typography, spacing, and other design primitives.
 */

// ============================================================================
// BRAND COLORS
// ============================================================================

export const SpredBrandColors = {
  // Primary Brand Colors - Spred Orange
  primary: {
    50: '#FFF4ED',
    100: '#FFE6D5',
    200: '#FECCAA',
    300: '#FDAB74',
    400: '#FB7A3C',
    500: '#F45303', // Main brand orange - Updated
    600: '#E04502',
    700: '#BE2F0C',
    800: '#972512',
    900: '#7A2012',
  },

  // Secondary Brand Colors - Deep Amber
  secondary: {
    50: '#FEF5E7',
    100: '#FDE8C3',
    200: '#FCD99B',
    300: '#FBCA73',
    400: '#EAAF4D',
    500: '#D69E2E', // Main secondary amber - Updated
    600: '#C8932A',
    700: '#B78525',
    800: '#9A6F1F',
    900: '#7D5A19',
  },

  // Accent Colors - Sophisticated Greys
  accent: {
    50: '#F5F5F5',
    100: '#E5E5E5',
    200: '#CCCCCC',
    300: '#B3B3B3',
    400: '#9A9A9A',
    500: '#8B8B8B', // Main accent grey
    600: '#6A6A6A',
    700: '#4A4A4A',
    800: '#2A2A2A',
    900: '#1A1A1A',
  },
} as const;

// ============================================================================
// SEMANTIC COLORS
// ============================================================================

export const SpredSemanticColors = {
  // Background Colors
  background: {
    primary: '#1A1A1A', // Main app background - Updated to Dark Theme
    secondary: '#2A2A2A', // Card/section backgrounds - Updated to Card Surface
    tertiary: '#3A3A3A', // Elevated surfaces
    surface: '#2A2A2A', // Component surfaces - Updated to Card Surface
  },

  // Text Colors
  text: {
    primary: '#FFFFFF', // Main text color
    secondary: '#CCCCCC', // Secondary text and labels
    tertiary: '#8B8B8B', // Disabled/placeholder text
    accent: '#D69E2E', // Highlighted/emphasized text (Deep Amber) - Updated
    brand: '#F45303', // Brand accent text (Spred Orange) - Updated
    muted: '#6A6A6A', // Very muted text
  },

  // Status Colors (using warm palette when possible)
  status: {
    success: '#D69E2E', // Deep Amber for success/completed states - Updated
    warning: '#F45303', // Spred Orange for warnings/attention - Updated
    error: '#E53E3E', // Warm red for errors
    info: '#8B8B8B', // Grey for neutral info
    active: '#F45303', // Spred Orange for active states - Updated
    inactive: '#8B8B8B', // Grey for inactive states
  },

  // Interactive Colors
  interactive: {
    primary: '#F45303', // Spred Orange - Primary buttons/CTAs - Updated
    primaryHover: '#E04502', // Primary hover state
    secondary: '#D69E2E', // Deep Amber - Secondary buttons - Updated
    secondaryHover: '#C8932A', // Secondary hover state
    tertiary: '#8B8B8B', // Tertiary/ghost buttons
    tertiaryHover: '#9A9A9A', // Tertiary hover state
    disabled: '#6A6A6A', // Disabled state
    border: '#333333', // Border color
    borderLight: '#444444', // Lighter border variant
    focus: '#F45303', // Spred Orange - Focus ring color - Updated
  },

  // Gradient Colors
  gradients: {
    primary: ['#F45303', '#D69E2E'], // Spred Orange to Deep Amber - Updated
    primaryReverse: ['#D69E2E', '#F45303'], // Deep Amber to Spred Orange - Updated
    subtle: ['#2A2A2A', '#1A1A1A'], // Card Surface to Dark Theme gradient - Updated
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC COLORS
// ============================================================================

export const SpredComponentColors = {
  // Button variants
  button: {
    primary: {
      background: '#F45303', // Spred Orange - Updated
      backgroundHover: '#E04502',
      text: '#FFFFFF',
    },
    secondary: {
      background: '#D69E2E', // Deep Amber - Updated
      backgroundHover: '#C8932A',
      text: '#FFFFFF',
    },
    outline: {
      background: 'transparent',
      backgroundHover: '#8B8B8B',
      border: '#8B8B8B',
      text: '#8B8B8B',
      textHover: '#FFFFFF',
    },
    ghost: {
      background: 'transparent',
      backgroundHover: 'rgba(139, 139, 139, 0.1)',
      text: '#8B8B8B',
      textHover: '#FFFFFF',
    },
  },

  // Avatar colors
  avatar: {
    primary: '#D69E2E',
    secondary: '#F45303',
    tertiary: '#8B8B8B',
  },

  // Badge colors
  badge: {
    primary: '#F45303',
    secondary: '#D69E2E',
    neutral: '#8B8B8B',
  },

  // Progress indicators
  progress: {
    active: '#F45303',
    completed: '#D69E2E',
    inactive: '#8B8B8B',
    background: '#444444',
  },

  // Cards and surfaces
  card: {
    background: '#2A2A2A',
    border: '#333333',
    hover: '#353535',
  },

  // Input fields
  input: {
    background: '#2A2A2A',
    border: '#333333',
    borderFocus: '#F45303',
    placeholder: '#8B8B8B',
  },

  // Navigation
  navigation: {
    active: '#F45303',
    inactive: '#8B8B8B',
    hover: '#D69E2E',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const SpredTypography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
  },

  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

export const SpredSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const SpredRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  xxxl: 20,
  round: 50,
  full: 9999,
} as const;

// ============================================================================
// SHADOWS & ELEVATIONS
// ============================================================================

export const SpredShadows = {
  none: 'none',
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

// ============================================================================
// THEME OBJECT
// ============================================================================

export const SpredTheme = {
  colors: {
    brand: SpredBrandColors,
    ...SpredSemanticColors,
    components: SpredComponentColors,
  },
  typography: SpredTypography,
  spacing: SpredSpacing,
  radius: SpredRadius,
  shadows: SpredShadows,
} as const;

export type SpredThemeType = typeof SpredTheme;

// ============================================================================
// QUICK ACCESS HELPERS
// ============================================================================

// Quick access to most commonly used colors
export const QuickColors = {
  // Brand
  primaryOrange: SpredBrandColors.primary[500],
  secondaryAmber: SpredBrandColors.secondary[500],
  accentGrey: SpredBrandColors.accent[500],

  // Backgrounds
  bgPrimary: SpredSemanticColors.background.primary,
  bgSecondary: SpredSemanticColors.background.secondary,
  bgTertiary: SpredSemanticColors.background.tertiary,

  // Text
  textPrimary: SpredSemanticColors.text.primary,
  textSecondary: SpredSemanticColors.text.secondary,
  textMuted: SpredSemanticColors.text.tertiary,

  // Interactive
  btnPrimary: SpredSemanticColors.interactive.primary,
  btnSecondary: SpredSemanticColors.interactive.secondary,
  border: SpredSemanticColors.interactive.border,
} as const;