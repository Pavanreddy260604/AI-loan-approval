import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';


/**
 * Input Component Props
 * Elite v2 Standardized Props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error' | 'success';
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

/**
 * Input Component (Elite v2)
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const [isFocused, setIsFocused] = useState(false);
    const effectiveVariant = error ? 'error' : variant;

    // Elite v2 Aesthetics
    const inputContainerStyles: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      transition: `all ${transitions.base}`,
    };

    // HIGH-CONTRAST COCKPIT MODE: Visible borders, glowing focus states
    const baseInputStyles: React.CSSProperties = {
      width: '100%',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: typography.fontWeights.medium,
      // High contrast: lighter background, visible border
      backgroundColor: isFocused ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(12px)',
      color: colors.base[50],
      border: '1.5px solid',
      borderColor: isFocused
        ? (effectiveVariant === 'error' ? colors.danger[400] : colors.primary[400])
        : (effectiveVariant === 'error' ? colors.danger[600] : colors.base[600]),
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[4]}`,
      paddingLeft: leftIcon ? spacing[8] : spacing[4],
      paddingRight: rightIcon ? spacing[8] : spacing[4],
      outline: 'none',
      transition: `all ${transitions.base} cubic-bezier(0.4, 0, 0.2, 1)`,
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.5 : 1,
      // PROMINENT GLOW: 2x intensity on focus for cockpit visibility
      boxShadow: isFocused
        ? `0 0 0 3px ${effectiveVariant === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 91, 255, 0.15)'}, 0 0 24px -5px ${effectiveVariant === 'error' ? colors.danger[500] : colors.primary[500]}60`
        : `0 0 0 1px rgba(255, 255, 255, 0.02)`,
    };

    return (
      <div className={`group flex flex-col gap-2 ${className}`} style={{ width: '100%' }}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-[10px] font-black uppercase tracking-[0.15em] text-base-500 ml-1 transition-colors group-focus-within:text-primary"
          >
            {label}
          </label>
        )}
        
        <div style={inputContainerStyles}>
          {leftIcon && (
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors ${isFocused ? 'text-primary' : 'text-base-600'}`}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            style={baseInputStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            {...props}
          />

          <AnimatePresence>
            {isFocused && !disabled && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r ${effectiveVariant === 'error' ? 'from-danger to-danger/40' : 'from-primary to-primary-light'}`}
              />
            )}
          </AnimatePresence>
          
          {rightIcon && (
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors ${isFocused ? 'text-primary' : 'text-base-600'}`}>
              {rightIcon}
            </div>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {error ? (
            <motion.span 
              key="error"
              id={errorId}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[10px] font-bold text-danger uppercase tracking-wider ml-1"
            >
              {error}
            </motion.span>
          ) : hint ? (
            <motion.span 
              key="hint"
              id={hintId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-medium text-base-600 italic ml-1"
            >
              {hint}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
