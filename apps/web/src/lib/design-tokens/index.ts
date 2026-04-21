/**
 * Design Tokens
 * 
 * Centralized design token system for the AI Loan Intelligence Platform.
 * These tokens define the visual language of the application including colors,
 * spacing, typography, shadows, border radius, and transitions.
 * 
 * @module design-tokens
 */

/**
 * Color Palette
 * 
 * Complete color system with semantic naming following the design specification.
 * All colors include a 50-900 scale for tonal variations.
 */
export const colors = {
  // Primary brand color (Deep Navy - distinctive, human-crafted)
  primary: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581', // Brand primary
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',
    DEFAULT: '#486581'
  },
  
  // Neutral scale (Cool Slate - distinctive, not zinc)
  base: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  
  // Semantic colors (muted, sophisticated tones)
  success: {
    50: '#f4f7f4',
    100: '#e3ebe3',
    200: '#c7d8c7',
    300: '#a6c2a6',
    400: '#7da57d',
    500: '#5a855a',
    600: '#4a6b4a',
    700: '#3d553d',
    800: '#304530',
    900: '#263826',
    DEFAULT: '#5a855a'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    DEFAULT: '#f59e0b'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    DEFAULT: '#ef4444'
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    DEFAULT: '#3b82f6'
  }
} as const;

/**
 * Spacing System
 * 
 * Consistent spacing scale based on a 4px base unit.
 * Used for margins, padding, gaps, and other spatial relationships.
 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px'
} as const;

/**
 * Typography System
 * 
 * Defines font sizes, line heights, and font weights for consistent text styling.
 */
export const typography = {
  /**
   * Font size scale
   */
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    h1: '2.5rem',     // 40px
    h2: '2rem',       // 32px
    h3: '1.5rem',     // 24px
    h4: '1.25rem',    // 20px
    h5: '1.125rem',   // 18px
    h6: '1rem'        // 16px
  },
  
  /**
   * Line height scale
   */
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  },
  
  /**
   * Font weight scale
   */
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
} as const;

/**
 * Shadow System
 * 
 * Elevation shadows for creating depth hierarchy.
 * Optimized for dark mode with increased opacity for better visibility.
 * 
 * **Validates: Requirement 15.8 - Adjust shadow values for visibility in dark mode**
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
} as const;

/**
 * Border Radius System
 * 
 * Consistent corner rounding values.
 */
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px'
} as const;

/**
 * Transition System
 * 
 * Standard animation durations for consistent motion.
 */
export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms'
} as const;

/**
 * Complete Design Token Collection
 * 
 * Aggregates all design tokens into a single exportable object.
 */
export const designTokens = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions
} as const;

/**
 * TypeScript Types
 */

export type Colors = typeof colors;
export type ColorScale = keyof typeof colors;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 'DEFAULT';

export type Spacing = typeof spacing;
export type SpacingValue = keyof typeof spacing;

export type Typography = typeof typography;
export type FontSize = keyof typeof typography.fontSizes;
export type LineHeight = keyof typeof typography.lineHeights;
export type FontWeight = keyof typeof typography.fontWeights;

export type Shadows = typeof shadows;
export type ShadowValue = keyof typeof shadows;

export type BorderRadius = typeof borderRadius;
export type BorderRadiusValue = keyof typeof borderRadius;

export type Transitions = typeof transitions;
export type TransitionValue = keyof typeof transitions;

export type DesignTokens = typeof designTokens;

/**
 * Responsive Breakpoints
 * 
 * Standard breakpoints for responsive design.
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Component Variant Maps
 * 
 * Centralized variant definitions for consistency across components.
 */
export const componentVariants = {
  button: {
    primary: 'bg-primary text-white hover:bg-primary/90 border-primary',
    secondary: 'bg-base-900 text-base-100 hover:bg-base-800 border-base-800',
    danger: 'bg-danger text-white hover:bg-danger/90 border-danger/20',
    ghost: 'bg-transparent text-base-400 hover:bg-base-900 border-none',
    outline: 'bg-transparent border border-base-800 text-base-300 hover:bg-base-900'
  },
  badge: {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    ghost: 'bg-base-900 text-base-400 border-base-800',
    info: 'bg-info/10 text-info border-info/20'
  },
  input: {
    default: 'border-base-800 focus:border-primary focus:ring-primary/20',
    error: 'border-danger focus:border-danger focus:ring-danger/20',
    success: 'border-success focus:border-success focus:ring-success/20'
  }
} as const;

export type ComponentVariants = typeof componentVariants;
export type ButtonVariant = keyof typeof componentVariants.button;
export type BadgeVariant = keyof typeof componentVariants.badge;
export type InputVariant = keyof typeof componentVariants.input;

/**
 * Theme Configuration
 * 
 * Complete theme configuration for the application.
 */
export interface ThemeConfig {
  mode: 'dark'; // Only dark mode supported
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  borderRadius: typeof borderRadius;
  transitions: typeof transitions;
}

export const themeConfig: ThemeConfig = {
  mode: 'dark',
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions
};
