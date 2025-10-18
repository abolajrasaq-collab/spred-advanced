import React, { useState, useEffect, createContext, useContext } from 'react';
import { SpredTheme, SpredThemeType } from './SpredTokens';
import { Colors as ThemeColors } from './Variables';

// Create Theme Context
const ThemeContext = createContext<SpredThemeType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: SpredThemeType;
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme = SpredTheme,
}) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.defaultProps = {
  theme: SpredTheme,
};

// Custom Hook to use theme
export const useTheme = (): SpredThemeType => {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return theme;
};

// Custom Hook for theme colors (includes legacy theme colors)
export const useThemeColors = () => {
  const theme = useTheme();

  return {
    // Spred Design System Colors
    ...theme.colors,

    // Legacy Theme Colors (for backward compatibility)
    legacy: ThemeColors,
  };
};

// Utility function to get theme values outside of React components
export const getThemeValue = (
  path: string,
  theme: SpredThemeType = SpredTheme,
): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme);
};

// Helper hook for responsive spacing
export const useSpacing = () => {
  const theme = useTheme();

  const getSpacing = (size: keyof typeof theme.spacing): number => {
    return theme.spacing[size];
  };

  const getMultipleSpacing = (
    size: keyof typeof theme.spacing,
    multiplier: number,
  ): number => {
    return theme.spacing[size] * multiplier;
  };

  return {
    spacing: theme.spacing,
    getSpacing,
    getMultipleSpacing,
  };
};

// Helper hook for typography
export const useTypography = () => {
  const theme = useTheme();

  const getTextStyle = (
    size: keyof typeof theme.typography.fontSizes,
    weight?: keyof typeof theme.typography.fontWeights,
  ) => {
    return {
      fontSize: theme.typography.fontSizes[size],
      fontWeight: weight
        ? theme.typography.fontWeights[weight]
        : theme.typography.fontWeights.normal,
    };
  };

  return {
    typography: theme.typography,
    getTextStyle,
  };
};

export default ThemeProvider;
