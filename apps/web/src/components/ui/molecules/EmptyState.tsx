import React from 'react';
import { colors, spacing, typography } from '../../../lib/design-tokens';
import { Button, ButtonProps } from '../atoms/Button';

/**
 * EmptyState Component Props
 * 
 * Molecular empty state component following the design system specification.
 * Displays helpful messages when there's no data with optional icon and action button.
 * 
 * **Validates: Requirements 3.8, 7.4, 7.5, 14.10**
 */
export interface EmptyStateProps {
  /** Title text */
  title: string;
  
  /** Description text */
  description: string;
  
  /** Optional icon (defaults to inbox icon) */
  icon?: React.ReactNode;
  
  /** Optional action button text */
  actionText?: string;
  
  /** Action button click handler */
  onAction?: () => void;
  
  /** Action button variant */
  actionVariant?: ButtonProps['variant'];
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default Inbox Icon
 * 
 * Simple inbox icon for default empty state display.
 */
const InboxIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: colors.base[600] }}
  >
    <path
      d="M3 3h18v13h-4l-2 2H9l-2-2H3V3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 10h18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * EmptyState Component
 * 
 * A flexible empty state component for displaying helpful messages when there's no data.
 * Supports custom icons, title, description, and optional action button.
 * Content is center-aligned with consistent spacing using design tokens.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No loans found"
 *   description="Get started by creating your first loan application."
 *   actionText="Create Loan"
 *   onAction={() => navigate('/loans/new')}
 * />
 * ```
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      title,
      description,
      icon,
      actionText,
      onAction,
      actionVariant = 'primary',
      className = '',
    },
    ref
  ) => {
    // Container styles - center-aligned with padding
    const containerStyles: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: `${spacing[12]} ${spacing[6]}`,
      minHeight: '300px',
    };

    // Icon container styles
    const iconContainerStyles: React.CSSProperties = {
      marginBottom: spacing[4],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Title styles
    const titleStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.xl,
      fontWeight: typography.fontWeights.semibold,
      lineHeight: typography.lineHeights.tight,
      color: colors.base[100],
      marginBottom: spacing[2],
    };

    // Description styles
    const descriptionStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.base,
      lineHeight: typography.lineHeights.normal,
      color: colors.base[400],
      maxWidth: '400px',
      marginBottom: actionText ? spacing[6] : 0,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={containerStyles}
      >
        <div style={iconContainerStyles}>
          {icon || <InboxIcon />}
        </div>
        
        <h3 style={titleStyles}>{title}</h3>
        
        <p style={descriptionStyles}>{description}</p>
        
        {actionText && onAction && (
          <Button
            variant={actionVariant}
            size="md"
            onClick={onAction}
          >
            {actionText}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
