import React, { useEffect, useRef, useState, useCallback } from 'react';
import { colors, spacing, borderRadius, shadows, transitions, typography } from '../../../lib/design-tokens';

/**
 * Tooltip Placement Type
 * 
 * Defines all possible tooltip placement positions relative to the trigger element.
 */
export type TooltipPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

/**
 * Tooltip Component Props
 * 
 * Molecular tooltip component following the design system specification.
 * Displays helpful text on hover with configurable delay and placement options.
 * 
 * **Validates: Requirements 3.5, 14.10**
 */
export interface TooltipProps {
  /** Element that triggers the tooltip on hover */
  children: React.ReactNode;
  
  /** Tooltip content to display */
  content: React.ReactNode;
  
  /** Placement position relative to trigger */
  placement?: TooltipPlacement;
  
  /** Delay before showing tooltip in milliseconds */
  delay?: number;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tooltip Component
 * 
 * A flexible tooltip component that displays helpful text on hover.
 * Features configurable delay, multiple placement options, and fade-in/out animation.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Tooltip content="This is a helpful tooltip" placement="top" delay={300}>
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      placement = 'top',
      delay = 300,
      className = '',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const timeoutRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || containerRef;

    // Handle mouse enter with delay
    const handleMouseEnter = useCallback(() => {
      timeoutRef.current = setTimeout(() => {
        setShouldRender(true);
        setIsVisible(true);
      }, delay);
    }, [delay]);

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVisible(false);
      // Wait for fade-out animation before removing from DOM
      setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match transition duration
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Placement offset calculations
    const getPlacementStyles = (): React.CSSProperties => {
      const offset = spacing[2]; // 8px offset from trigger

      const placementMap: Record<TooltipPlacement, React.CSSProperties> = {
        top: {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: offset,
        },
        bottom: {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: offset,
        },
        left: {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: offset,
        },
        right: {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: offset,
        },
        'top-start': {
          bottom: '100%',
          left: 0,
          marginBottom: offset,
        },
        'top-end': {
          bottom: '100%',
          right: 0,
          marginBottom: offset,
        },
        'bottom-start': {
          top: '100%',
          left: 0,
          marginTop: offset,
        },
        'bottom-end': {
          top: '100%',
          right: 0,
          marginTop: offset,
        },
        'left-start': {
          right: '100%',
          top: 0,
          marginRight: offset,
        },
        'left-end': {
          right: '100%',
          bottom: 0,
          marginRight: offset,
        },
        'right-start': {
          left: '100%',
          top: 0,
          marginLeft: offset,
        },
        'right-end': {
          left: '100%',
          bottom: 0,
          marginLeft: offset,
        },
      };

      return placementMap[placement];
    };

    // Container styles
    const containerStyles: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
    };

    // Tooltip styles
    const tooltipStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1000,
      backgroundColor: colors.base[800],
      color: colors.base[100],
      padding: `${spacing[2]} ${spacing[3]}`,
      borderRadius: borderRadius.sm,
      fontSize: typography.fontSizes.sm,
      lineHeight: typography.lineHeights.normal,
      fontWeight: typography.fontWeights.medium,
      boxShadow: shadows.md,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      transition: `opacity ${transitions.base} ease-in-out`,
      opacity: isVisible ? 1 : 0,
      ...getPlacementStyles(),
    };

    return (
      <div
        ref={combinedRef}
        className={className}
        style={containerStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        {shouldRender && (
          <div style={tooltipStyles} role="tooltip">
            {content}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
