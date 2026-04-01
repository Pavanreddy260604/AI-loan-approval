import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';

/**
 * Textarea Component Props
 * 
 * Atomic textarea component following the design system specification.
 * Supports auto-resize, multiple variants, label, error/hint text, and character count.
 * 
 * **Validates: Requirements 2.7, 14.6, 14.7, 14.10**
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visual variant */
  variant?: 'default' | 'error' | 'success';
  
  /** Label text */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Helper text */
  hint?: string;
  
  /** Enable auto-resize functionality */
  autoResize?: boolean;
  
  /** Maximum character count */
  maxLength?: number;
  
  /** Show character count */
  showCharacterCount?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Textarea Component
 * 
 * A flexible textarea component with support for auto-resize, multiple variants, labels,
 * error/hint messages, and character count display. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Textarea 
 *   label="Description" 
 *   error={errors.description} 
 *   autoResize
 *   maxLength={500}
 *   showCharacterCount
 *   placeholder="Enter description..."
 * />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      label,
      error,
      hint,
      autoResize = false,
      maxLength,
      showCharacterCount = false,
      className = '',
      disabled = false,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const textareaId = id || React.useId();
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    // Track focus state for focus ring
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Internal ref for auto-resize functionality
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Character count state
    const [charCount, setCharCount] = React.useState(0);

    // Determine effective variant (error overrides default)
    const effectiveVariant = error ? 'error' : variant;

    // Auto-resize function
    const adjustHeight = React.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);

    // Handle value changes
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        
        // Update character count
        setCharCount(newValue.length);
        
        // Adjust height if auto-resize is enabled
        if (autoResize) {
          adjustHeight();
        }
        
        // Call parent onChange handler
        if (onChange) {
          onChange(e);
        }
      },
      [onChange, autoResize, adjustHeight]
    );

    // Initialize character count and height on mount and value changes
    React.useEffect(() => {
      const currentValue = value?.toString() || '';
      setCharCount(currentValue.length);
      
      if (autoResize) {
        adjustHeight();
      }
    }, [value, autoResize, adjustHeight]);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Base textarea styles
    const baseTextareaStyles = {
      width: '100%',
      fontFamily: 'inherit',
      fontSize: typography.fontSizes.base,
      lineHeight: typography.lineHeights.normal,
      fontWeight: typography.fontWeights.normal,
      backgroundColor: colors.base[950],
      color: colors.base[100],
      border: '1px solid',
      borderRadius: borderRadius.md,
      padding: `${spacing[2]} ${spacing[3]}`,
      outline: 'none',
      transition: `all ${transitions.base} ease-in-out`,
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.6 : 1,
      resize: autoResize ? ('none' as const) : ('vertical' as const),
      minHeight: '80px',
    };

    // Variant styles
    const variantStyles = {
      default: {
        borderColor: colors.base[800],
        ...(isFocused && {
          borderColor: colors.primary[600],
          boxShadow: `0 0 0 3px ${colors.primary[600]}20`,
        }),
      },
      error: {
        borderColor: colors.danger[500],
        ...(isFocused && {
          borderColor: colors.danger[500],
          boxShadow: `0 0 0 3px ${colors.danger[500]}20`,
        }),
      },
      success: {
        borderColor: colors.success[500],
        ...(isFocused && {
          borderColor: colors.success[500],
          boxShadow: `0 0 0 3px ${colors.success[500]}20`,
        }),
      },
    };

    // Combine textarea styles
    const textareaStyles = {
      ...baseTextareaStyles,
      ...variantStyles[effectiveVariant],
    };

    // Label styles
    const labelStyles = {
      display: 'block',
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      color: colors.base[300],
      marginBottom: spacing[2],
    };

    // Error/hint text styles
    const helperTextStyles = {
      display: 'block',
      fontSize: typography.fontSizes.sm,
      marginTop: spacing[2],
      color: error ? colors.danger[400] : colors.base[500],
    };

    // Character count styles
    const charCountStyles = {
      fontSize: typography.fontSizes.xs,
      color: maxLength && charCount > maxLength ? colors.danger[400] : colors.base[500],
      marginTop: spacing[1],
      textAlign: 'right' as const,
    };

    // Footer container styles (for hint and character count)
    const footerStyles = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: spacing[2],
    };

    return (
      <div className={className} style={{ width: '100%' }}>
        {label && (
          <label htmlFor={textareaId} style={labelStyles}>
            {label}
          </label>
        )}
        
        <textarea
          ref={setRefs}
          id={textareaId}
          disabled={disabled}
          style={textareaStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          {...props}
        />
        
        {error && (
          <span id={errorId} role="alert" style={helperTextStyles}>
            {error}
          </span>
        )}
        
        {!error && (hint || showCharacterCount) && (
          <div style={footerStyles}>
            {hint && (
              <span id={hintId} style={{ ...helperTextStyles, marginTop: 0 }}>
                {hint}
              </span>
            )}
            {showCharacterCount && (
              <span style={charCountStyles}>
                {charCount}{maxLength ? `/${maxLength}` : ''}
              </span>
            )}
          </div>
        )}
        
        {error && showCharacterCount && (
          <div style={{ textAlign: 'right' }}>
            <span style={charCountStyles}>
              {charCount}{maxLength ? `/${maxLength}` : ''}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
