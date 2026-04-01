import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';

/**
 * Checkbox Component Props
 * 
 * Atomic checkbox component following the design system specification.
 * Supports label, error/hint text, disabled state, and indeterminate state.
 * 
 * **Validates: Requirements 2.11, 14.4, 14.6, 14.7, 14.10**
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Helper text */
  hint?: string;
  
  /** Indeterminate state (for partial selection) */
  indeterminate?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Checkbox Component
 * 
 * A flexible checkbox component with support for labels, error/hint messages,
 * disabled state, and indeterminate state. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Checkbox 
 *   label="Accept terms and conditions" 
 *   error={errors.terms}
 *   checked={accepted}
 *   onChange={(e) => setAccepted(e.target.checked)}
 * />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      hint,
      indeterminate = false,
      className = '',
      disabled = false,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const checkboxId = id || React.useId();
    const errorId = `${checkboxId}-error`;
    const hintId = `${checkboxId}-hint`;

    // Internal ref for indeterminate state
    const internalRef = React.useRef<HTMLInputElement | null>(null);

    // Track focus state for focus ring
    const [isFocused, setIsFocused] = React.useState(false);

    // Set indeterminate property
    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Container styles
    const containerStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing[2],
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    };

    // Hidden native checkbox (for accessibility)
    const hiddenCheckboxStyles = {
      position: 'absolute' as const,
      opacity: 0,
      width: 0,
      height: 0,
      pointerEvents: 'none' as const,
    };

    // Custom checkbox styles
    const customCheckboxStyles = {
      width: '20px',
      height: '20px',
      minWidth: '20px',
      minHeight: '20px',
      border: '2px solid',
      borderColor: error ? colors.danger[500] : colors.base[700],
      borderRadius: borderRadius.sm,
      backgroundColor: checked || indeterminate ? (error ? colors.danger[500] : colors.primary[600]) : colors.base[950],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `all ${transitions.base} ease-in-out`,
      flexShrink: 0,
      marginTop: '2px', // Align with first line of text
      ...(isFocused && {
        boxShadow: error
          ? `0 0 0 3px ${colors.danger[500]}20`
          : `0 0 0 3px ${colors.primary[600]}20`,
      }),
    };

    // Label text styles
    const labelTextStyles = {
      fontSize: typography.fontSizes.base,
      lineHeight: typography.lineHeights.normal,
      color: colors.base[100],
      userSelect: 'none' as const,
    };

    // Helper text styles
    const helperTextStyles = {
      display: 'block',
      fontSize: typography.fontSizes.sm,
      marginTop: spacing[1],
      marginLeft: '28px', // Align with label text (20px checkbox + 8px gap)
      color: error ? colors.danger[400] : colors.base[500],
    };

    // Check icon SVG
    const CheckIcon = () => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: colors.base[50] }}
      >
        <path
          d="M10 3L4.5 8.5L2 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    // Indeterminate icon SVG
    const IndeterminateIcon = () => (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: colors.base[50] }}
      >
        <path
          d="M2 6H10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );

    return (
      <div className={className} style={{ width: '100%' }}>
        <label htmlFor={checkboxId} style={containerStyles}>
          <input
            ref={setRefs}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            style={hiddenCheckboxStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />
          
          <div style={customCheckboxStyles}>
            {indeterminate ? <IndeterminateIcon /> : checked ? <CheckIcon /> : null}
          </div>
          
          {label && (
            <span style={labelTextStyles}>
              {label}
            </span>
          )}
        </label>
        
        {error && (
          <span id={errorId} role="alert" style={helperTextStyles}>
            {error}
          </span>
        )}
        
        {!error && hint && (
          <span id={hintId} style={helperTextStyles}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
