import React from 'react';
import { colors, spacing, typography, borderRadius } from '../../../lib/design-tokens';

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
    // Base badge styles
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: typography.fontWeights.medium,
      borderRadius: borderRadius.md,
      border: '1px solid',
      whiteSpace: 'nowrap' as const,
      fontFamily: 'inherit',
      lineHeight: typography.lineHeights.tight,
    };

    // Tone variant styles
    const toneStyles = {
      primary: {
        backgroundColor: `${colors.primary[600]}1A`, // 10% opacity
        color: colors.primary[400],
        borderColor: `${colors.primary[600]}33`, // 20% opacity
      },
      success: {
        backgroundColor: `${colors.success[500]}1A`, // 10% opacity
        color: colors.success[400],
        borderColor: `${colors.success[500]}33`, // 20% opacity
      },
      warning: {
        backgroundColor: `${colors.warning[500]}1A`, // 10% opacity
        color: colors.warning[400],
        borderColor: `${colors.warning[500]}33`, // 20% opacity
      },
      danger: {
        backgroundColor: `${colors.danger[500]}1A`, // 10% opacity
        color: colors.danger[400],
        borderColor: `${colors.danger[500]}33`, // 20% opacity
      },
      ghost: {
        backgroundColor: colors.base[900],
        color: colors.base[400],
        borderColor: colors.base[800],
      },
      info: {
        backgroundColor: `${colors.info[500]}1A`, // 10% opacity
        color: colors.info[400],
        borderColor: `${colors.info[500]}33`, // 20% opacity
      },
    };

    // Size styles
    const sizeStyles = {
      xs: {
        padding: `${spacing[1]} ${spacing[2]}`,
        fontSize: typography.fontSizes.xs,
        height: '20px',
      },
      sm: {
        padding: `${spacing[1]} ${spacing[3]}`,
        fontSize: typography.fontSizes.sm,
        height: '24px',
      },
      md: {
        padding: `${spacing[2]} ${spacing[4]}`,
        fontSize: typography.fontSizes.base,
        height: '28px',
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
