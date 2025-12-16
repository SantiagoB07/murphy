/**
 * HIG Design System Constants
 * Centralized values for consistency across the application
 * Following Apple Human Interface Guidelines principles
 */

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

// Animation durations (HIG: responsive, natural feel)
export const DURATION = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 250,
  slower: 300,
} as const;

// Animation easings (HIG: natural, spring-like)
export const EASING = {
  default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Spacing scale (4px base grid - HIG standard)
export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// Icon sizes (standardized - HIG consistency)
export const ICON_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// Touch targets (HIG: minimum 44px for accessibility)
export const TOUCH_TARGET = {
  min: 44,
  comfortable: 48,
  large: 56,
} as const;

// Border radius scale (HIG: consistent corners)
export const RADIUS = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Z-index scale
export const Z_INDEX = {
  dropdown: 50,
  sticky: 100,
  fixed: 150,
  overlay: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
} as const;

// Typography scale (will be used with clamp() in CSS)
export const FONT_SIZE = {
  xs: { min: 11, max: 12 },
  sm: { min: 13, max: 14 },
  base: { min: 15, max: 16 },
  lg: { min: 17, max: 18 },
  xl: { min: 20, max: 22 },
  '2xl': { min: 24, max: 28 },
  '3xl': { min: 32, max: 40 },
} as const;

// Line heights (HIG: optimized for readability)
export const LINE_HEIGHT = {
  tight: 1.2,      // Headings
  snug: 1.35,      // Subheadings
  normal: 1.5,     // Body text
  relaxed: 1.6,    // Small text, captions
} as const;
