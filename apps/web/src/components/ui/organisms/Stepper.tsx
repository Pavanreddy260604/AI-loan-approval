import React from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../../lib/design-tokens';

/**
 * Step Item
 * 
 * Defines a step in the stepper component.
 */
export interface StepItem {
  /** Step label */
  label: string;
  
  /** Step description */
  description?: string;
  
  /** Step status */
  status?: 'completed' | 'current' | 'upcoming';
  
  /** Optional icon */
  icon?: React.ReactNode;
}

/**
 * Stepper Component Props
 * 
 * Organism stepper component following the design system specification.
 * Displays multi-step workflow progress showing current, completed, and upcoming steps.
 * 
 * **Validates: Requirements 4.9, 14.10**
 */
export interface StepperProps {
  /** Step items */
  steps: StepItem[];
  
  /** Current step index (0-based) */
  currentStep?: number;
  
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Allow clicking on steps */
  clickable?: boolean;
  
  /** Step click handler */
  onStepClick?: (index: number) => void;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Stepper Component
 * 
 * A comprehensive stepper component for multi-step workflows.
 * Shows current step, completed steps, and upcoming steps with clear visual indicators.
 * Supports both horizontal and vertical orientations.
 * Uses design tokens for consistent styling.
 * 
 * @example
 * ```tsx
 * <Stepper
 *   steps={[
 *     { label: 'Account Details', description: 'Enter your information' },
 *     { label: 'Verification', description: 'Verify your email' },
 *     { label: 'Complete', description: 'Finish setup' }
 *   ]}
 *   currentStep={1}
 *   clickable
 *   onStepClick={handleStepClick}
 * />
 * ```
 */
export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      currentStep = 0,
      orientation = 'horizontal',
      clickable = false,
      onStepClick,
      className = '',
    },
    ref
  ) => {
    // Determine step status based on current step
    const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
      if (steps[index].status) {
        return steps[index].status!;
      }
      if (index < currentStep) return 'completed';
      if (index === currentStep) return 'current';
      return 'upcoming';
    };

    // Container styles
    const containerStyles: React.CSSProperties = {
      width: '100%',
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
      gap: orientation === 'horizontal' ? 0 : spacing[4],
    };

    // Step container styles
    const getStepContainerStyles = (index: number): React.CSSProperties => {
      const status = getStepStatus(index);
      const isClickable = clickable && (status === 'completed' || status === 'current');

      return {
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'column' : 'row',
        alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
        flex: orientation === 'horizontal' ? 1 : 'none',
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        gap: spacing[3],
      };
    };

    // Step indicator container styles
    const stepIndicatorContainerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      width: orientation === 'horizontal' ? '100%' : 'auto',
    };

    // Step indicator styles
    const getStepIndicatorStyles = (index: number): React.CSSProperties => {
      const status = getStepStatus(index);

      const baseStyles: React.CSSProperties = {
        width: '32px',
        height: '32px',
        minWidth: '32px',
        minHeight: '32px',
        borderRadius: borderRadius.full,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: typography.fontSizes.sm,
        fontWeight: typography.fontWeights.semibold,
        transition: `all ${transitions.base}`,
        position: 'relative',
        zIndex: 2,
      };

      switch (status) {
        case 'completed':
          return {
            ...baseStyles,
            backgroundColor: colors.primary[600],
            color: colors.base[50],
          };
        case 'current':
          return {
            ...baseStyles,
            backgroundColor: colors.primary[600],
            color: colors.base[50],
            boxShadow: `0 0 0 4px ${colors.primary[600]}20`,
          };
        case 'upcoming':
          return {
            ...baseStyles,
            backgroundColor: colors.base[900],
            color: colors.base[500],
            border: `2px solid ${colors.base[800]}`,
          };
        default:
          return baseStyles;
      }
    };

    // Connector line styles
    const getConnectorStyles = (index: number): React.CSSProperties => {
      const status = getStepStatus(index);

      const baseStyles: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: status === 'completed' ? colors.primary[600] : colors.base[800],
        transition: `all ${transitions.base}`,
        zIndex: 1,
      };

      if (orientation === 'horizontal') {
        return {
          ...baseStyles,
          top: '16px',
          left: 'calc(50% + 16px)',
          right: 'calc(-50% + 16px)',
          height: '2px',
        };
      } else {
        return {
          ...baseStyles,
          left: '16px',
          top: '40px',
          bottom: '-16px',
          width: '2px',
        };
      }
    };

    // Step content styles
    const getStepContentStyles = (_index: number): React.CSSProperties => {

      return {
        textAlign: orientation === 'horizontal' ? 'center' : 'left',
        marginTop: orientation === 'horizontal' ? spacing[2] : 0,
        flex: orientation === 'vertical' ? 1 : 'none',
      };
    };

    // Step label styles
    const getStepLabelStyles = (index: number): React.CSSProperties => {
      const status = getStepStatus(index);

      return {
        fontSize: typography.fontSizes.sm,
        fontWeight: status === 'current' ? typography.fontWeights.semibold : typography.fontWeights.medium,
        color: status === 'upcoming' ? colors.base[500] : colors.base[100],
        marginBottom: spacing[1],
      };
    };

    // Step description styles
    const stepDescriptionStyles: React.CSSProperties = {
      fontSize: typography.fontSizes.xs,
      color: colors.base[500],
      lineHeight: typography.lineHeights.normal,
    };

    // Check icon for completed steps
    const CheckIcon = () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M13 4L6 11L3 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

    return (
      <div ref={ref} className={className} style={containerStyles}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;
          const isClickable = clickable && (status === 'completed' || status === 'current');

          return (
            <div
              key={index}
              style={getStepContainerStyles(index)}
              onClick={() => {
                if (isClickable && onStepClick) {
                  onStepClick(index);
                }
              }}
            >
              {/* Step Indicator */}
              <div style={stepIndicatorContainerStyles}>
                <div style={getStepIndicatorStyles(index)}>
                  {status === 'completed' ? (
                    step.icon || <CheckIcon />
                  ) : (
                    step.icon || <span>{index + 1}</span>
                  )}
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div style={getConnectorStyles(index)} />
                )}
              </div>

              {/* Step Content */}
              <div style={getStepContentStyles(index)}>
                <div style={getStepLabelStyles(index)}>
                  {step.label}
                </div>
                {step.description && (
                  <div style={stepDescriptionStyles}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';

export default Stepper;
