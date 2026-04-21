import React, { useEffect, useRef, useCallback } from 'react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/design-tokens';
import { Portal } from '../atoms/Portal';

/**
 * Drawer Component Props
 * 
 * Molecular drawer component following the design system specification.
 * Slides in from any edge of the screen with overlay, close button, and focus trap.
 * 
 * **Validates: Requirements 3.3, 11.6, 11.7, 11.8, 14.10**
 */
export interface DrawerProps {
  /** Drawer visibility state */
  open: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Direction from which drawer slides in */
  direction?: 'left' | 'right' | 'top' | 'bottom';
  
  /** Drawer content */
  children: React.ReactNode;
  
  /** Optional drawer title */
  title?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'full';
  
  /** Prevent closing on overlay click */
  closeOnOverlayClick?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Close Icon Component
 * 
 * Simple X icon for the close button.
 */
const CloseIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Custom hook for focus trap functionality
 * 
 * Traps keyboard focus within the drawer when open and returns focus
 * to the trigger element when closed.
 */
const useFocusTrap = (
  isOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the first focusable element in the drawer
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      // Return focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, containerRef]);
};

/**
 * Drawer Component
 * 
 * A flexible drawer component that slides in from any edge of the screen.
 * Includes overlay backdrop, close button, focus trap, and keyboard support.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Drawer 
 *   open={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   direction="right"
 *   title="Settings"
 *   size="md"
 * >
 *   <p>Drawer content here</p>
 * </Drawer>
 * ```
 */
export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      open,
      onClose,
      direction = 'right',
      children,
      title,
      size = 'md',
      closeOnOverlayClick = true,
      className = '',
    },
    ref
  ) => {
    const drawerRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || drawerRef;

    // Focus trap functionality
    useFocusTrap(open, combinedRef);

    // Handle Escape key
    useEffect(() => {
      if (!open) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    // Handle overlay click
    const handleOverlayClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    if (!open) return null;

    // Size configurations
    const sizeConfig = {
      sm: {
        horizontal: '320px',
        vertical: '40%',
      },
      md: {
        horizontal: '480px',
        vertical: '60%',
      },
      lg: {
        horizontal: '640px',
        vertical: '80%',
      },
      full: {
        horizontal: '100%',
        vertical: '100%',
      },
    };

    // Direction-specific styles
    const isHorizontal = direction === 'left' || direction === 'right';
    const drawerSize = isHorizontal
      ? sizeConfig[size].horizontal
      : sizeConfig[size].vertical;

    const directionStyles: Record<string, React.CSSProperties> = {
      left: {
        left: 0,
        top: 0,
        bottom: 0,
        width: drawerSize,
        height: '100%',
      },
      right: {
        right: 0,
        top: 0,
        bottom: 0,
        width: drawerSize,
        height: '100%',
      },
      top: {
        top: 0,
        left: 0,
        right: 0,
        height: drawerSize,
        width: '100%',
      },
      bottom: {
        bottom: 0,
        left: 0,
        right: 0,
        height: drawerSize,
        width: '100%',
      },
    };

    // Overlay styles
    const overlayStyles: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: direction === 'top' ? 'flex-start' : direction === 'bottom' ? 'flex-end' : 'center',
      justifyContent: direction === 'left' ? 'flex-start' : direction === 'right' ? 'flex-end' : 'center',
      animation: 'fadeIn 200ms ease-in-out',
    };

    // Drawer container styles
    const drawerStyles: React.CSSProperties = {
      position: 'fixed',
      backgroundColor: colors.base[950],
      boxShadow: shadows['2xl'],
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001,
      ...directionStyles[direction],
      animation: `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)} ${transitions.base} ease-out`,
    };

    // Header styles
    const headerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing[6],
      borderBottom: `1px solid ${colors.base[800]}`,
      flexShrink: 0,
    };

    // Content styles
    const contentStyles: React.CSSProperties = {
      flex: 1,
      padding: spacing[6],
      overflowY: 'auto',
      overflowX: 'hidden',
    };

    // Close button styles
    const closeButtonStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      padding: 0,
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: borderRadius.md,
      color: colors.base[400],
      cursor: 'pointer',
      transition: `all ${transitions.fast} ease-in-out`,
    };

    return (
      <Portal>
        {/* Overlay */}
        <div
          style={overlayStyles}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={combinedRef}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Drawer'}
          className={className}
          style={drawerStyles}
        >
          {/* Header */}
          <div style={headerStyles}>
            {title && (
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: colors.base[100],
                }}
              >
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              style={closeButtonStyles}
              aria-label="Close drawer"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.base[900];
                e.currentTarget.style.color = colors.base[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.base[400];
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div style={contentStyles}>{children}</div>
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideInLeft {
              from {
                transform: translateX(-100%);
              }
              to {
                transform: translateX(0);
              }
            }

            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }

            @keyframes slideInTop {
              from {
                transform: translateY(-100%);
              }
              to {
                transform: translateY(0);
              }
            }

            @keyframes slideInBottom {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `}
        </style>
      </Portal>
    );
  }
);

Drawer.displayName = 'Drawer';

export default Drawer;
