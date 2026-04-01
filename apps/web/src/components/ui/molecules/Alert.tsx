import React, { useState } from 'react';
import { colors, spacing, borderRadius, typography, transitions } from '../../../lib/design-tokens';

/**
 * Alert Variant Type
 * 
 * Defines the semantic color variant of the alert.
 */
export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

/**
 * Alert Component Props
 * 
 * Molecular alert component following the design system specification.
 * Displays important messages with semantic color variants and optional close button.
 * 
 * **Validates: Requirements 3.7, 8.1, 8.2, 14.2, 14.10**
 */
export interface AlertProps {
  /** Alert message or content */
  children: React.ReactNode;
  
  /** Semantic color variant */
  variant?: AlertVariant;
  
  /** Optional title */
  title?: string;
  
  /** Show close button */
  closable?: boolean;
  
  /** Close handler */
  onClose?: () => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Alert Component
 * 
 * A flexible alert component for displaying important messages with semantic colors.
 * Supports success, warning, error, and info variants with appropriate icons.
 * Includes optional close button and title support.
 * 
 * @example
 * ```tsx
 * <Alert variant="success" title="Success" closable onClose={() => console.log('closed')}>
 *   Your changes have been saved successfully.
 * </Alert>
 * ```
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      children,
      variant = 'info',
      title,
      closable = false,
      onClose,
      className = '',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    // Handle close with callback
    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    // Don't render if closed
    if (!isVisible) {
      return null;
    }

    // Variant-specific colors and icons
    const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
      success: {
        bg: colors.success[900],
        border: colors.success[500],
        text: colors.success[50],
        icon: '✓',
      },
      warning: {
        bg: colors.warning[900],
        border: colors.warning[500],
        text: colors.warning[50],
        icon: '⚠',
      },
      error: {
        bg: colors.danger[900],
        border: colors.danger[500],
        text: colors.danger[50],
        icon: '✕',
      },
      info: {
        bg: colors.info[900],
        border: colors.info[500],
        text: colors.info[50],
        icon: 'ℹ',
      },
    };

    const config = variantConfig[variant];

    // Alert container styles
    const alertStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing[3],
      padding: spacing[4],
      backgroundColor: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: borderRadius.md,
      color: config.text,
      fontSize: typography.fontSizes.sm,
      lineHeight: typography.lineHeights.normal,
    };

    // Icon container styles
    const iconStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      flexShrink: 0,
      width: '20px',
      height: '20px',
      fontSize: '16px',
      fontWeight: typography.fontWeights.bold,
      marginTop: '2px',
    };

    // Content container styles
    const contentStyles: React.CSSProperties = {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[1],
    };

    // Title styles
    const titleStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.base,
      fontWeight: typography.fontWeights.semibold,
      lineHeight: typography.lineHeights.tight,
    };

    // Message styles
    const messageStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.sm,
      lineHeight: typography.lineHeights.normal,
      opacity: 0.9,
    };

    // Close button styles
    const closeButtonStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      flexShrink: 0,
      width: '20px',
      height: '20px',
      padding: 0,
      border: 'none',
      background: 'none',
      color: config.text,
      cursor: 'pointer',
      opacity: 0.7,
      transition: `opacity ${transitions.fast} ease-in-out`,
      fontSize: '18px',
      lineHeight: 1,
      marginTop: '2px',
    };

    return (
      <div
        ref={ref}
        className={className}
        style={alertStyles}
        role="alert"
      >
        <div style={iconStyles}>
          {config.icon}
        </div>
        <div style={contentStyles}>
          {title && <div style={titleStyles}>{title}</div>}
          <div style={messageStyles}>{children}</div>
        </div>
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            style={closeButtonStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            aria-label="Close alert"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
