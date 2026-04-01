import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';

/**
 * Switch Component Props
 * 
 * Atomic switch (toggle) component following the design system specification.
 * Supports label, error/hint text, and disabled state.
 * 
 * **Validates: Requirements 2.11, 14.4, 14.6, 14.7, 14.10**
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label text */
  label?: string;
  
  /** Error message to display */
  error?: string;
  
  /** Helper text */
  hint?: string;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Switch Component
 * 
 * A flexible switch (toggle) component with support for labels, error/hint messages,
 * disabled state, and multiple sizes. Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Switch 
 *   label="Enable notifications" 
 *   checked={notificationsEnabled}
 *   onChange={(e) => setNotificationsEnabled(e.target.checked)}
 * />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      hint,
      size = 'md',
      className = '',
      disabled = false,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const switchId = id || React.useId();
    const errorId = `${switchId}-error`;
    const hintId = `${switchId}-hint`;

    // Track focus state for focus ring
    const [isFocused, setIsFocused] = React.useState(false);

    // Size configurations
    const sizeConfig = {
      sm: {
        track: { width: '32px', height: '18px' },
        thumb: { size: '14px', translateX: '14px' },
      },
      md: {
        track: { width: '44px', height: '24px' },
        thumb: { size: '20px', translateX: '20px' },
      },
      lg: {
        track: { width: '56px', height: '30px' },
        thumb: { size: '26px', translateX: '26px' },
      },
    };

    const config = sizeConfig[size];

    // Container styles
    const containerStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing[2],
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    };

    // Hidden native checkbox (for accessibility)
    const hiddenInputStyles = {
      position: 'absolute' as const,
      opacity: 0,
      width: 0,
      height: 0,
      pointerEvents: 'none' as const,
    };

    // Track styles
    const trackStyles = {
      width: config.track.width,
      height: config.track.height,
      minWidth: config.track.width,
      minHeight: config.track.height,
      borderRadius: borderRadius.full,
      backgroundColor: checked 
        ? (error ? colors.danger[500] : colors.primary[600])
        : colors.base[800],
      position: 'relative' as const,
      transition: `all ${transitions.base} ease-in-out`,
      flexShrink: 0,
      marginTop: '2px', // Align with first line of text
      ...(isFocused && {
        boxShadow: error
          ? `0 0 0 3px ${colors.danger[500]}20`
          : checked
          ? `0 0 0 3px ${colors.primary[600]}20`
          : `0 0 0 3px ${colors.base[700]}20`,
      }),
    };

    // Thumb styles
    const thumbStyles = {
      width: config.thumb.size,
      height: config.thumb.size,
      borderRadius: '50%',
      backgroundColor: colors.base[50],
      position: 'absolute' as const,
      top: '50%',
      left: '2px',
      transform: checked 
        ? `translate(${config.thumb.translateX}, -50%)`
        : 'translate(0, -50%)',
      transition: `transform ${transitions.base} ease-in-out`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
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
      marginLeft: `calc(${config.track.width} + ${spacing[2]})`, // Align with label text
      color: error ? colors.danger[400] : colors.base[500],
    };

    return (
      <div className={className} style={{ width: '100%' }}>
        <label htmlFor={switchId} style={containerStyles}>
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            checked={checked}
            style={hiddenInputStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-checked={checked}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />
          
          <div style={trackStyles}>
            <div style={thumbStyles} />
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

Switch.displayName = 'Switch';

export default Switch;
