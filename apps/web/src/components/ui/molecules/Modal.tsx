import React, { useEffect, useRef, useCallback } from 'react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/design-tokens';
import { useFocusTrap } from '../../../lib/accessibility/focus-trap';

/**
 * Modal Component Props
 * 
 * Molecular modal component following the design system specification.
 * Displays content in an overlay with focus trap, close button, and size options.
 * 
 * **Validates: Requirements 3.2, 10.4, 11.6, 11.7, 11.8, 14.10**
 */
export interface ModalProps {
  /** Modal visibility state */
  open: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Modal title */
  title?: string;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Footer actions */
  footer?: React.ReactNode;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
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
 * Modal Component
 * 
 * A flexible modal dialog component with overlay backdrop, close button, focus trap,
 * and keyboard support. Includes entrance/exit animations and size options.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Modal 
 *   open={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </Modal>
 * ```
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      footer,
      size = 'md',
      closeOnOverlayClick = true,
      className = '',
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLDivElement>) || modalRef;
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Centralized Focus Trap (Task 10.1)
    useFocusTrap(combinedRef, open);

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

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
        setIsAnimating(true);
      } else {
        document.body.style.overflow = '';
        setIsAnimating(false);
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

    if (!open && !isAnimating) return null;

    // Size configurations
    const sizeConfig = {
      sm: '400px',
      md: '600px',
      lg: '800px',
      xl: '1000px',
      full: '95vw',
    };

    // Overlay styles with fade animation
    const overlayStyles: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[4],
      animation: open ? 'fadeIn 200ms ease-in-out' : 'fadeOut 200ms ease-in-out',
    };

    // Modal container styles with scale animation
    const modalStyles: React.CSSProperties = {
      backgroundColor: colors.base[950],
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.base[800]}`,
      boxShadow: shadows['2xl'],
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      width: '100%',
      maxWidth: sizeConfig[size],
      position: 'relative',
      animation: open ? 'scaleIn 200ms ease-out' : 'scaleOut 200ms ease-in',
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

    // Footer styles
    const footerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing[3],
      padding: spacing[6],
      borderTop: `1px solid ${colors.base[800]}`,
      flexShrink: 0,
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
      <>
        {/* Overlay */}
        <div
          style={overlayStyles}
          onClick={handleOverlayClick}
        >
          {/* Modal */}
          <div
            ref={combinedRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className={className}
            style={modalStyles}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || true) && (
              <div style={headerStyles}>
                {title && (
                  <h2
                    id="modal-title"
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
                  aria-label="Close modal"
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
            )}

            {/* Content */}
            <div style={contentStyles}>{children}</div>

            {/* Footer */}
            {footer && <div style={footerStyles}>{footer}</div>}
          </div>
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

            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }

            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes scaleOut {
              from {
                opacity: 1;
                transform: scale(1);
              }
              to {
                opacity: 0;
                transform: scale(0.95);
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
      </>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
