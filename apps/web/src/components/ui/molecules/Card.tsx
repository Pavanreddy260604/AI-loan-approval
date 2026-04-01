import React from 'react';
import { motion } from 'framer-motion';
import { colors, spacing, borderRadius, shadows } from '../../../lib/design-tokens';
import { transitions as eliteTransitions } from '../../../lib/animations/transitions';

/**
 * Card Component Props
 * 
 * Molecular card component following the design system specification.
 * Supports optional header, body, and footer sections with customizable styling options.
 * 
 * **Validates: Requirements 3.1, 14.1, 14.8, 14.10**
 */
export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  
  /** Optional header section */
  header?: React.ReactNode;
  
  /** Optional footer section */
  footer?: React.ReactNode;
  
  /** Enable hover effects */
  hoverable?: boolean;
  
  /** Apply padding */
  padded?: boolean;
  
  /** Show border */
  border?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card Component
 * 
 * A flexible card container component with optional header, body, and footer sections.
 * Supports hover effects, padding, and border options. Uses framer-motion for elite feedback.
 * 
 * Performance: Memoized to prevent unnecessary re-renders (Req 13.2, 13.4)
 */
export const Card = React.memo(React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      header,
      footer,
      hoverable = false,
      padded = true,
      border = true,
      className = '',
    },
    ref
  ) => {
    // Base card styles
    const baseStyles: React.CSSProperties = {
      backgroundColor: colors.base[950],
      borderRadius: borderRadius.lg,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative' as const,
      zIndex: 1,
      ...(border && {
        border: `1px solid ${colors.base[800]}`,
      }),
    };

    // Combine card styles
    const cardStyles: React.CSSProperties = {
      ...baseStyles,
    };

    // Header styles
    const headerStyles: React.CSSProperties = {
      padding: padded ? `${spacing[4]} ${spacing[6]}` : '0px',
      borderBottom: `1px solid ${colors.base[800]}`,
    };

    // Body styles
    const bodyStyles: React.CSSProperties = {
      padding: padded ? spacing[6] : '0px',
      flex: 1,
    };

    // Footer styles
    const footerStyles: React.CSSProperties = {
      padding: padded ? `${spacing[4]} ${spacing[6]}` : '0px',
      borderTop: `1px solid ${colors.base[800]}`,
    };

    return (
      <motion.div
        ref={ref as any}
        className={className}
        style={cardStyles}
        whileHover={hoverable ? { 
            y: -4, 
            boxShadow: shadows.xl,
            borderColor: colors.base[500],
            transition: eliteTransitions.stiff
        } : {}}
        transition={eliteTransitions.base}
      >
        {header ? <div style={headerStyles}>{header}</div> : null}
        <div style={bodyStyles}><>{children}</></div>
        {footer ? <div style={footerStyles}>{footer}</div> : null}
      </motion.div>
    );
  }
));

Card.displayName = 'Card';

export default Card;
