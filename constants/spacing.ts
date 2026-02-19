/**
 * Spacing Constants
 * 
 * Defines a consistent spacing scale based on an 8px base unit.
 * Use these values throughout the application for consistent spacing.
 */

// Base unit: 8px
export const BASE_UNIT = 8;

// Spacing scale multipliers
export const spacing = {
  xs: BASE_UNIT * 0.5,    // 4px
  sm: BASE_UNIT,          // 8px
  md: BASE_UNIT * 2,      // 16px
  lg: BASE_UNIT * 3,      // 24px
  xl: BASE_UNIT * 4,      // 32px
  xxl: BASE_UNIT * 5,     // 40px
  xxxl: BASE_UNIT * 6,    // 48px
} as const;

// Padding values (increased by 20% from previous defaults)
export const padding = {
  card: spacing.lg,           // 24px (was ~20px)
  container: spacing.md,      // 16px (was ~13px)
  modal: spacing.xl,          // 32px (was ~27px)
  form: spacing.md,           // 16px (was ~13px)
  button: spacing.md,         // 16px (was ~13px)
  section: spacing.lg,        // 24px (was ~20px)
} as const;

// Margin values (increased by 30% from previous defaults)
export const margin = {
  section: spacing.xl,        // 32px (was ~25px)
  listItem: spacing.md,       // 16px (was ~12px)
  formField: spacing.md,      // 16px (was ~12px)
  divider: spacing.lg,        // 24px (was ~18px)
  element: spacing.sm,        // 8px (was ~6px)
} as const;

// Touch target sizes (minimum 44x44 for accessibility)
export const touchTarget = {
  minHeight: 44,
  minWidth: 44,
  iconSize: 44,
} as const;

// Line height values for improved readability
export const lineHeight = {
  body: 1.6,
  description: 1.5,
  help: 1.4,
  heading: 1.2,
  tight: 1.3,
} as const;

// Export all spacing values for convenient access
export default {
  BASE_UNIT,
  spacing,
  padding,
  margin,
  touchTarget,
  lineHeight,
};
