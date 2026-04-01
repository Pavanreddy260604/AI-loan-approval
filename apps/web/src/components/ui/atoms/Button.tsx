import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, spacing, typography, borderRadius } from '../../../lib/design-tokens';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { transitions as eliteTransitions } from '../../../lib/animations/transitions';

/**
 * Button feedback state for async operations
 */
type ButtonFeedbackState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Button Component Props
 * 
 * Atomic button component following the design system specification.
 * Supports multiple variants, sizes, states, and icon positioning.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  
  /** 
   * Size variant
   * Supports a single size or a responsive size object.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', 'xs' | 'sm' | 'md' | 'lg' | 'xl'>>;
  
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Async click handler - automatically manages loading state */
  onAsyncClick?: () => Promise<void>;
  
  /** Duration to display success/error feedback in milliseconds (default: 2000ms) */
  feedbackDuration?: number;
  
  /** Icon to display on success */
  successIcon?: React.ReactNode;
  
  /** Icon to display on error */
  errorIcon?: React.ReactNode;
}

/**
 * Loading Spinner Component
 * 
 * Simple animated spinner for loading states.
 */
const Spinner: React.FC<{ size: number }> = ({ size }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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
);

/**
 * Button Component
 * 
 * A flexible button component with support for multiple variants, sizes,
 * loading states, and icon positioning. Uses framer-motion for elite feedback.
 * 
 * Performance: Memoized to prevent unnecessary re-renders (Req 13.2, 13.4)
 */
export const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled = false,
      children,
      onAsyncClick,
      feedbackDuration = 2000,
      successIcon,
      errorIcon,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isSm, isMd, isLg, isXl, is2Xl } = useBreakpoint();
    
    // Internal state machine for async operations
    const [feedbackState, setFeedbackState] = React.useState<ButtonFeedbackState>('idle');
    const feedbackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
      };
    }, []);
    
    // Handle async click operations
    const handleAsyncClick = React.useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!onAsyncClick) {
        onClick?.(event);
        return;
      }
      
      // Clear any existing feedback timeout
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      
      // Transition to loading state
      setFeedbackState('loading');
      
      try {
        await onAsyncClick();
        
        // Transition to success state
        setFeedbackState('success');
        
        // Return to idle after feedback duration
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedbackState('idle');
        }, feedbackDuration);
      } catch (error) {
        // Transition to error state
        setFeedbackState('error');
        
        // Return to idle after feedback duration
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedbackState('idle');
        }, feedbackDuration);
      }
    }, [onAsyncClick, onClick, feedbackDuration]);
    
    // Determine if button is in loading state (external or internal)
    const isLoading = loading || feedbackState === 'loading';
    
    // Resolve responsive size
    const resolveSize = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
      if (typeof size === 'string') return size as any;
      
      const config = size as Record<string, any>;
      if (is2Xl && config['2xl']) return config['2xl'];
      if (isXl && config.xl) return config.xl;
      if (isLg && config.lg) return config.lg;
      if (isMd && config.md) return config.md;
      if (isSm && config.sm) return config.sm;
      return config.base || 'md';
    };

    const activeSize = resolveSize();
    const isDisabled = disabled || isLoading;

    // Base styles
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      fontWeight: typography.fontWeights.medium,
      borderRadius: borderRadius.md,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.6 : 1,
      border: '1px solid transparent',
      outline: 'none',
      fontFamily: 'inherit',
      lineHeight: typography.lineHeights.normal,
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary[600],
        color: '#ffffff',
        borderColor: colors.primary[600],
      },
      secondary: {
        backgroundColor: colors.base[900],
        color: colors.base[100],
        borderColor: colors.base[800],
      },
      ghost: {
        backgroundColor: 'transparent',
        color: colors.base[400],
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.danger[600],
        color: '#ffffff',
        borderColor: colors.danger[600],
      },
      outline: {
        backgroundColor: 'transparent',
        color: colors.base[300],
        borderColor: colors.base[800],
      },
    };

    // Size styles
    const sizeStyles = {
      xs: {
        padding: `${spacing[1]} ${spacing[2]}`,
        fontSize: typography.fontSizes.xs,
        height: '28px',
      },
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSizes.sm,
        height: '32px',
      },
      md: {
        padding: `${spacing[2]} ${spacing[4]}`,
        fontSize: typography.fontSizes.base,
        height: '40px',
      },
      lg: {
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSizes.lg,
        height: '48px',
      },
      xl: {
        padding: `${spacing[4]} ${spacing[8]}`,
        fontSize: typography.fontSizes.xl,
        height: '56px',
      },
    };

    // Spinner sizes based on button size
    const spinnerSizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };

    // Combine styles
    const finalStyles = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[activeSize as keyof typeof sizeStyles],
    };

    // Elite hover/active states via Framer Motion
    const getHoverStyles = () => {
        if (isDisabled) return {};
        switch (variant) {
            case 'primary': return { backgroundColor: colors.primary[700] };
            case 'secondary': return { backgroundColor: colors.base[800] };
            case 'ghost': return { backgroundColor: colors.base[900] };
            case 'danger': return { backgroundColor: colors.danger[700] };
            case 'outline': return { backgroundColor: colors.base[900] };
            default: return {};
        }
    };

    return (
      <motion.button
        ref={ref as any}
        disabled={isDisabled}
        className={className}
        style={finalStyles}
        whileHover={!isDisabled ? { ...getHoverStyles(), scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        transition={eliteTransitions.stiff}
        aria-busy={isLoading}
        aria-live={isLoading ? 'polite' : 'off'}
        onClick={handleAsyncClick}
        {...(props as any)}
      >
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={eliteTransitions.stiff}
                >
                    <Spinner size={spinnerSizes[activeSize]} />
                </motion.div>
            ) : feedbackState === 'success' && successIcon ? (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={eliteTransitions.stiff}
                    className="flex items-center gap-2"
                >
                    <span className="flex items-center shrink-0" aria-hidden="true">{successIcon}</span>
                    {children ? <span className="truncate">{children}</span> : null}
                </motion.div>
            ) : feedbackState === 'error' && errorIcon ? (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={eliteTransitions.stiff}
                    className="flex items-center gap-2"
                >
                    <span className="flex items-center shrink-0" aria-hidden="true">{errorIcon}</span>
                    {children ? <span className="truncate">{children}</span> : null}
                </motion.div>
            ) : (
                <motion.span 
                    key="content"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={eliteTransitions.stiff}
                >
                    {leftIcon ? <span className="flex items-center shrink-0" aria-hidden="true">{leftIcon}</span> : null}
                    {children ? <span className="truncate">{children}</span> : null}
                    {rightIcon ? <span className="flex items-center shrink-0" aria-hidden="true">{rightIcon}</span> : null}
                </motion.span>
            )}
        </AnimatePresence>
      </motion.button>
    );
  }
));

Button.displayName = 'Button';

export default Button;
