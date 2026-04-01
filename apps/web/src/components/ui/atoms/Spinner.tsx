import React from 'react';
import { colors } from '../../../lib/design-tokens';

/**
 * Spinner Component Props
 * 
 * Atomic spinner component for loading indicators.
 * Supports multiple sizes and color customization.
 * 
 * **Validates: Requirements 2.10, 7.2, 14.3, 14.10**
 */
export interface SpinnerProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Color customization */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'base';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * Spinner Component
 * 
 * A flexible loading indicator component with support for multiple sizes
 * and color variants. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Spinner size="md" color="primary" />
 * <Spinner size="lg" color="success" label="Loading data..." />
 * ```
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      color = 'primary',
      className = '',
      label = 'Loading...',
    },
    ref
  ) => {
    // Size mappings (in pixels)
    const sizeMap = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    };

    // Color mappings
    const colorMap = {
      primary: colors.primary[600],
      success: colors.success[500],
      warning: colors.warning[500],
      danger: colors.danger[500],
      info: colors.info[500],
      base: colors.base[400],
    };

    const spinnerSize = sizeMap[size];
    const spinnerColor = colorMap[color];

    // Container styles
    const containerStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyles}
        role="status"
        aria-label={label}
      >
        <svg
          className="animate-spin"
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            color: spinnerColor,
          }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
