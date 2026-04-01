import React from 'react';
import { colors, spacing, typography, transitions } from '../../../lib/design-tokens';

/**
 * Radio Component Props
 * 
 * Atomic radio button component following the design system specification.
 * Supports label, error/hint text, and disabled state.
 * 
 * **Validates: Requirements 2.11, 14.4, 14.6, 14.7, 14.10**
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Helper text */
  hint?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Radio Component
 * 
 * A flexible radio button component with support for labels, error/hint messages,
 * and disabled state. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Radio 
 *   label="Option A" 
 *   name="choice"
 *   value="a"
 *   checked={selected === 'a'}
 *   onChange={(e) => setSelected(e.target.value)}
 * />
 * ```
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      error,
      hint,
      className = '',
      disabled = false,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const radioId = id || React.useId();
    const errorId = `${radioId}-error`;
    const hintId = `${radioId}-hint`;

    // Track focus state for focus ring
    const [isFocused, setIsFocused] = React.useState(false);

    // Container styles
    const containerStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing[2],
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    };

    // Hidden native radio (for accessibility)
    const hiddenRadioStyles = {
      position: 'absolute' as const,
      opacity: 0,
      width: 0,
      height: 0,
      pointerEvents: 'none' as const,
    };

    // Custom radio styles
    const customRadioStyles = {
      width: '20px',
      height: '20px',
      minWidth: '20px',
      minHeight: '20px',
      border: '2px solid',
      borderColor: error ? colors.danger[500] : colors.base[700],
      borderRadius: '50%',
      backgroundColor: colors.base[950],
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

    // Inner dot styles
    const innerDotStyles = {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: error ? colors.danger[500] : colors.primary[600],
      transform: checked ? 'scale(1)' : 'scale(0)',
      transition: `transform ${transitions.fast} ease-in-out`,
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
      marginLeft: '28px', // Align with label text (20px radio + 8px gap)
      color: error ? colors.danger[400] : colors.base[500],
    };

    return (
      <div className={className} style={{ width: '100%' }}>
        <label htmlFor={radioId} style={containerStyles}>
          <input
            ref={ref}
            id={radioId}
            type="radio"
            disabled={disabled}
            checked={checked}
            style={hiddenRadioStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />
          
          <div style={customRadioStyles}>
            <div style={innerDotStyles} />
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

Radio.displayName = 'Radio';

export default Radio;
