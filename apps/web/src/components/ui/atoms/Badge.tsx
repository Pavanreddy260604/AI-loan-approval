import React from 'react';
import { colors } from '../../../lib/design-tokens';

/**
 * Badge Component Props
 * 
 * Atomic badge component following the design system specification.
 * Supports multiple tone variants and size options.
 * 
 * **Validates: Requirements 2.8, 14.2, 14.3, 14.10**
 */
export interface BadgeProps {
  /** Content to display */
  children?: React.ReactNode;
  
  /** Color tone */
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost' | 'info';
  
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge Component
 * 
 * A flexible badge component for displaying status indicators, labels, and tags.
 * Uses design tokens for consistent styling across tone variants and sizes.
 * 
 * @example
 * ```tsx
 * <Badge tone="success" size="sm">Active</Badge>
 * <Badge tone="warning" size="md">Pending</Badge>
 * <Badge tone="danger" size="xs">Error</Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      tone = 'ghost',
      size = 'sm',
      className = '',
      children,
    },
    ref
  ) => {
    // Base badge styles - simpler
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 500,
      borderRadius: '4px',
      border: '1px solid',
      whiteSpace: 'nowrap' as const,
      fontFamily: 'inherit',
      lineHeight: 1,
    };

    // Tone variant styles - solid, simple colors
    const toneStyles = {
      primary: {
        backgroundColor: colors.primary[600],
        color: '#ffffff',
        borderColor: colors.primary[600],
      },
      success: {
        backgroundColor: colors.success[500],
        color: '#ffffff',
        borderColor: colors.success[500],
      },
      warning: {
        backgroundColor: colors.warning[500],
        color: '#0f172a',
        borderColor: colors.warning[500],
      },
      danger: {
        backgroundColor: colors.danger[500],
        color: '#ffffff',
        borderColor: colors.danger[500],
      },
      ghost: {
        backgroundColor: 'rgb(var(--tw-base-800))',
        color: 'rgb(var(--tw-base-300))',
        borderColor: 'rgb(var(--tw-base-700))',
      },
      info: {
        backgroundColor: colors.info[500],
        color: '#ffffff',
        borderColor: colors.info[500],
      },
    };

    // Size styles - simpler, no fixed heights
    const sizeStyles = {
      xs: {
        padding: '2px 8px',
        fontSize: '11px',
      },
      sm: {
        padding: '4px 10px',
        fontSize: '12px',
      },
      md: {
        padding: '6px 12px',
        fontSize: '13px',
      },
    };

    // Combine styles
    const combinedStyles = {
      ...baseStyles,
      ...toneStyles[tone],
      ...sizeStyles[size],
    };

    return (
      <span
        ref={ref}
        className={className}
        style={combinedStyles}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
