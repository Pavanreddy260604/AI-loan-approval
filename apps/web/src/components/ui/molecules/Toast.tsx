import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { colors, spacing, borderRadius, shadows, transitions, typography } from '../../../lib/design-tokens';

/**
 * Toast Type
 * 
 * Defines the visual variant of the toast notification.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast Position
 * 
 * Defines where toasts appear on screen.
 */
export type ToastPosition = 'top' | 'bottom';

/**
 * Toast Data Interface
 * 
 * Internal representation of a toast notification.
 */
export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  closable: boolean;
}

/**
 * Toast Component Props
 * 
 * Molecular toast component following the design system specification.
 * Displays temporary notification messages with auto-dismiss and manual close options.
 * 
 * **Validates: Requirements 3.6, 9.1, 9.2, 9.5, 9.6, 9.7, 10.5, 14.10**
 */
export interface ToastProps {
  /** Toast message */
  message: string;
  
  /** Toast type */
  type?: ToastType;
  
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  
  /** Close handler */
  onClose: () => void;
  
  /** Show close button */
  closable?: boolean;
  
  /** Position on screen */
  position?: ToastPosition;
}

/**
 * Toast Manager Interface
 * 
 * API for triggering toast notifications from anywhere in the app.
 * 
 * **Validates: Requirements 3.6, 9.1**
 */
export interface ToastManager {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

/**
 * Toast Context
 * 
 * Provides toast management functionality throughout the component tree.
 */
const ToastContext = createContext<ToastManager | null>(null);

/**
 * useToast Hook
 * 
 * Custom hook for accessing toast notification functionality.
 * 
 * @example
 * ```tsx
 * const toast = useToast();
 * toast.success('Changes saved successfully');
 * toast.error('Failed to save changes');
 * ```
 */
export const useToast = (): ToastManager => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Toast Component
 * 
 * Individual toast notification with slide-in animation, auto-dismiss, and manual close.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Toast 
 *   message="Operation completed successfully" 
 *   type="success"
 *   duration={5000}
 *   onClose={() => console.log('closed')}
 *   closable
 * />
 * ```
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      type = 'info',
      duration = 5000,
      onClose,
      closable = true,
      position = 'top',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Slide in on mount
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }, []);

    // Auto-dismiss after duration
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration]);

    // Handle close with slide-out animation
    const handleClose = useCallback(() => {
      setIsExiting(true);
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 200); // Match transition duration
    }, [onClose]);

    // Type-specific colors
    const typeColors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
      success: {
        bg: colors.success[900],
        border: colors.success[500],
        text: colors.success[50],
        icon: colors.success[500],
      },
      error: {
        bg: colors.danger[900],
        border: colors.danger[500],
        text: colors.danger[50],
        icon: colors.danger[500],
      },
      warning: {
        bg: colors.warning[900],
        border: colors.warning[500],
        text: colors.warning[50],
        icon: colors.warning[500],
      },
      info: {
        bg: colors.info[900],
        border: colors.info[500],
        text: colors.info[50],
        icon: colors.info[500],
      },
    };

    const colorScheme = typeColors[type];

    // Toast container styles with slide animation
    const toastStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[4]}`,
      backgroundColor: colorScheme.bg,
      border: `1px solid ${colorScheme.border}`,
      borderRadius: borderRadius.md,
      boxShadow: shadows.lg,
      minWidth: '300px',
      maxWidth: '500px',
      color: colorScheme.text,
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      lineHeight: typography.lineHeights.normal,
      transition: `all ${transitions.base} ease-in-out`,
      transform: isVisible 
        ? 'translateY(0)' 
        : position === 'top' 
          ? 'translateY(-100%)' 
          : 'translateY(100%)',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isExiting ? 'none' : 'auto',
    };

    // Icon styles
    const iconStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: '20px',
      height: '20px',
      color: colorScheme.icon,
    };

    // Message styles
    const messageStyles: React.CSSProperties = {
      flex: 1,
    };

    // Close button styles
    const closeButtonStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      width: '20px',
      height: '20px',
      padding: 0,
      border: 'none',
      background: 'none',
      color: colorScheme.text,
      cursor: 'pointer',
      opacity: 0.7,
      transition: `opacity ${transitions.fast} ease-in-out`,
      fontSize: '18px',
      lineHeight: 1,
    };

    // Type icons (using simple text symbols for now)
    const typeIcons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    return (
      <div
        ref={ref}
        style={toastStyles}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <div style={iconStyles}>
          {typeIcons[type]}
        </div>
        <div style={messageStyles}>
          {message}
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
            aria-label="Close notification"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * ToastProvider Props
 */
export interface ToastProviderProps {
  /** Child components */
  children: React.ReactNode;
  
  /** Toast position on screen */
  position?: ToastPosition;
  
  /** Maximum number of toasts to display */
  maxToasts?: number;
}

/**
 * ToastProvider Component
 * 
 * Context provider for global toast management.
 * Handles toast stacking, auto-dismiss, and provides the useToast hook API.
 * 
 * **Validates: Requirements 3.6, 9.7, 14.10**
 * 
 * @example
 * ```tsx
 * <ToastProvider position="top" maxToasts={5}>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Add a new toast
  const addToast = useCallback(
    (message: string, type: ToastType, duration: number = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = {
        id,
        message,
        type,
        duration,
        closable: true,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit to maxToasts
        if (updated.length > maxToasts) {
          return updated.slice(updated.length - maxToasts);
        }
        return updated;
      });
    },
    [maxToasts]
  );

  // Remove a toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Toast manager API
  const toastManager: ToastManager = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };

  // Container styles for toast stacking
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    ...(position === 'top' ? { top: spacing[4] } : { bottom: spacing[4] }),
    right: spacing[4],
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    pointerEvents: 'none',
  };

  // Individual toast wrapper for pointer events
  const toastWrapperStyles: React.CSSProperties = {
    pointerEvents: 'auto',
  };

  return (
    <ToastContext.Provider value={toastManager}>
      {children}
      <div style={containerStyles}>
        {toasts.map((toast) => (
          <div key={toast.id} style={toastWrapperStyles}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
              closable={toast.closable}
              position={position}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default Toast;
