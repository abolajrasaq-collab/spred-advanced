import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ThemeColors {
  // Brand Colors
  primary: string; // Spred Orange
  secondary: string; // Deep Amber
  accent: string; // Sophisticated Grey
  
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textAccent: string;
  
  // Interactive
  border: string;
  borderLight: string;
  
  // Status
  error: string;
  success: string;
  warning: string;
  info: string;
  
  // States
  active: string;
  inactive: string;
  disabled: string;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fontSize: 'small' | 'medium' | 'large';
  systemMode: boolean; // Follow system theme
}

/**
 * Light Theme Colors
 * Note: Spred is primarily a dark-themed app, but this provides light mode support
 */
const lightColors: ThemeColors = {
  // Brand Colors
  primary: '#F45303', // Spred Orange
  secondary: '#D69E2E', // Deep Amber
  accent: '#8B8B8B', // Sophisticated Grey
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  surface: '#FAFAFA',
  
  // Text
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textTertiary: '#8B8B8B',
  textAccent: '#D69E2E', // Amber for highlights
  
  // Interactive
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Status (using warm palette)
  error: '#E53E3E', // Warm red
  success: '#D69E2E', // Amber for success
  warning: '#F45303', // Orange for warnings
  info: '#8B8B8B', // Grey for info
  
  // States
  active: '#F45303',
  inactive: '#CCCCCC',
  disabled: '#E0E0E0',
};

/**
 * Dark Theme Colors (Primary Spred Theme)
 * This is the main theme for the Spred app
 */
const darkColors: ThemeColors = {
  // Brand Colors
  primary: '#F45303', // Spred Orange
  secondary: '#D69E2E', // Deep Amber
  accent: '#8B8B8B', // Sophisticated Grey
  
  // Backgrounds
  background: '#0A0A0A', // Deepest black
  backgroundSecondary: '#1A1A1A', // Dark grey
  surface: '#2A2A2A', // Elevated surface
  
  // Text
  text: '#FFFFFF', // White primary text
  textSecondary: '#CCCCCC', // Light grey secondary
  textTertiary: '#8B8B8B', // Medium grey tertiary
  textAccent: '#D69E2E', // Amber for highlights
  
  // Interactive
  border: '#333333',
  borderLight: '#444444',
  
  // Status (using warm palette)
  error: '#E53E3E', // Warm red
  success: '#D69E2E', // Amber for success/completed
  warning: '#F45303', // Orange for warnings/attention
  info: '#8B8B8B', // Grey for neutral info
  
  // States
  active: '#F45303', // Orange for active
  inactive: '#8B8B8B', // Grey for inactive
  disabled: '#6A6A6A', // Darker grey for disabled
};

const initialState: ThemeState = {
  mode: 'dark', // Spred defaults to dark theme
  colors: darkColors,
  fontSize: 'medium',
  systemMode: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
      state.colors = action.payload === 'light' ? lightColors : darkColors;
      state.systemMode = false;
    },
    
    toggleTheme: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      state.colors = state.mode === 'light' ? lightColors : darkColors;
      state.systemMode = false;
    },
    
    setSystemTheme: (state, action: PayloadAction<boolean>) => {
      state.systemMode = action.payload;
    },
    
    setFontSize: (
      state,
      action: PayloadAction<'small' | 'medium' | 'large'>,
    ) => {
      state.fontSize = action.payload;
    },
    
    updateColors: (state, action: PayloadAction<Partial<ThemeColors>>) => {
      state.colors = { ...state.colors, ...action.payload };
    },
    
    setDefaultTheme: (
      state,
      action: PayloadAction<{ theme?: string; darkMode?: boolean | null }>,
    ) => {
      // Only set defaults if not already set
      if (action.payload.theme && !state.mode) {
        state.mode = action.payload.darkMode ? 'dark' : 'light';
        state.colors = action.payload.darkMode ? darkColors : lightColors;
      }
      if (
        typeof action.payload.darkMode === 'boolean' &&
        state.systemMode === undefined
      ) {
        state.systemMode = action.payload.darkMode;
      }
    },
    
    /**
     * Reset theme to default dark mode
     */
    resetTheme: state => {
      state.mode = 'dark';
      state.colors = darkColors;
      state.fontSize = 'medium';
      state.systemMode = false;
    },
    
    /**
     * Apply custom color overrides (for user customization)
     */
    applyCustomColors: (
      state,
      action: PayloadAction<{
        primary?: string;
        secondary?: string;
        accent?: string;
      }>,
    ) => {
      if (action.payload.primary) {
        state.colors.primary = action.payload.primary;
        state.colors.active = action.payload.primary;
        state.colors.warning = action.payload.primary;
      }
      if (action.payload.secondary) {
        state.colors.secondary = action.payload.secondary;
        state.colors.success = action.payload.secondary;
        state.colors.textAccent = action.payload.secondary;
      }
      if (action.payload.accent) {
        state.colors.accent = action.payload.accent;
        state.colors.textTertiary = action.payload.accent;
        state.colors.inactive = action.payload.accent;
        state.colors.info = action.payload.accent;
      }
    },
  },
});

export const {
  setThemeMode,
  toggleTheme,
  setSystemTheme,
  setFontSize,
  updateColors,
  setDefaultTheme,
  resetTheme,
  applyCustomColors,
} = themeSlice.actions;

export default themeSlice.reducer;

/**
 * Selectors for easy access to theme values
 */
export const selectThemeColors = (state: { theme: ThemeState }) => state.theme.colors;
export const selectThemeMode = (state: { theme: ThemeState }) => state.theme.mode;
export const selectFontSize = (state: { theme: ThemeState }) => state.theme.fontSize;
export const selectIsSystemMode = (state: { theme: ThemeState }) => state.theme.systemMode;

/**
 * Helper to get color with opacity
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${alpha}`;
};

/**
 * Pre-defined color combinations for common use cases
 */
export const ThemePresets = {
  dark: darkColors,
  light: lightColors,
  
  // Gradient combinations
  gradients: {
    primary: ['#F45303', '#D69E2E'], // Orange to Amber
    primaryReverse: ['#D69E2E', '#F45303'], // Amber to Orange
    background: ['#2A2A2A', '#1A1A1A'], // Subtle background
  },
  
  // Button color combinations
  buttons: {
    primary: {
      background: '#F45303',
      hover: '#E04502',
      text: '#FFFFFF',
    },
    secondary: {
      background: '#D69E2E',
      hover: '#C8932A',
      text: '#FFFFFF',
    },
    tertiary: {
      background: '#8B8B8B',
      hover: '#9A9A9A',
      text: '#FFFFFF',
    },
    outline: {
      background: 'transparent',
      border: '#8B8B8B',
      text: '#8B8B8B',
      hover: '#8B8B8B',
      textHover: '#FFFFFF',
    },
  },
};