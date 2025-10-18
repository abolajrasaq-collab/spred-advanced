import { SpredTheme } from './SpredTokens';
import { Colors } from './Variables';

/**
 * Style utility functions for easy theme integration
 */

// Common background styles
export const createBackgroundStyles = (theme = SpredTheme) => ({
  primary: {
    backgroundColor: theme.colors.background.primary,
  },
  secondary: {
    backgroundColor: theme.colors.background.secondary,
  },
  surface: {
    backgroundColor: theme.colors.background.surface,
  },
  card: {
    backgroundColor: theme.colors.background.tertiary,
  },
});

// Common text styles
export const createTextStyles = (theme = SpredTheme) => ({
  primary: {
    color: theme.colors.text.primary,
  },
  secondary: {
    color: theme.colors.text.secondary,
  },
  accent: {
    color: theme.colors.text.accent,
  },
  muted: {
    color: theme.colors.text.muted,
  },
});

// Common button styles
export const createButtonStyles = (theme = SpredTheme) => ({
  primary: {
    backgroundColor: theme.colors.interactive.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  secondary: {
    backgroundColor: theme.colors.interactive.secondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  disabled: {
    backgroundColor: theme.colors.interactive.disabled,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    opacity: 0.6,
  },
});

// Common spacing utilities
export const createSpacingStyles = (theme = SpredTheme) => ({
  marginXs: { margin: theme.spacing.xs },
  marginSm: { margin: theme.spacing.sm },
  marginMd: { margin: theme.spacing.md },
  marginLg: { margin: theme.spacing.lg },
  marginXl: { margin: theme.spacing.xl },

  paddingXs: { padding: theme.spacing.xs },
  paddingSm: { padding: theme.spacing.sm },
  paddingMd: { padding: theme.spacing.md },
  paddingLg: { padding: theme.spacing.lg },
  paddingXl: { padding: theme.spacing.xl },

  // Specific direction spacing
  marginTopSm: { marginTop: theme.spacing.sm },
  marginTopMd: { marginTop: theme.spacing.md },
  marginTopLg: { marginTop: theme.spacing.lg },

  paddingHorizontalMd: { paddingHorizontal: theme.spacing.md },
  paddingHorizontalLg: { paddingHorizontal: theme.spacing.lg },
  paddingVerticalMd: { paddingVertical: theme.spacing.md },
  paddingVerticalLg: { paddingVertical: theme.spacing.lg },
});

// Common border styles
export const createBorderStyles = (theme = SpredTheme) => ({
  default: {
    borderWidth: 1,
    borderColor: theme.colors.interactive.border,
  },
  primary: {
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary,
  },
  rounded: {
    borderRadius: theme.radius.md,
  },
  roundedLg: {
    borderRadius: theme.radius.lg,
  },
  circle: {
    borderRadius: theme.radius.full,
  },
});

// Container styles (commonly used combinations)
export const createContainerStyles = (theme = SpredTheme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
});

// Legacy color mappings for gradual migration
export const LegacyColors = {
  background: Colors.background, // '#000000'
  surface: Colors.surface, // '#353535'
  primary: Colors.primary, // '#F45303'
  textPrimary: Colors.textPrimary, // '#FFFFFF'
  textSecondary: Colors.textSecondary, // '#E0E0E0'
  success: Colors.success, // '#4CAF50'
  error: Colors.error, // '#FF4444'
  warning: Colors.warning, // '#FF9800'
  border: Colors.border, // '#3F3F3F'
  disabled: Colors.interactiveDisabled, // '#6A6A6A'
};
