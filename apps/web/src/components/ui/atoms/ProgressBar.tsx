import React from 'react';
import { motion } from 'framer-motion';
import { designTokens } from '../../../lib/design-tokens';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  animate?: boolean;
}

/**
 * Elite v2 Progress Bar
 * Premium track-and-fill UI with semantic tones and organic easing.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  tone = 'primary',
  size = 'sm',
  showValue = false,
  label,
  animate = true,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  const h = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
  }[size];

  const barColor = {
    primary: designTokens.colors.primary[600],
    success: designTokens.colors.success[500],
    warning: designTokens.colors.warning[500],
    danger: designTokens.colors.danger[500],
    info: designTokens.colors.info[500],
  }[tone];

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between items-center px-0.5">
          {label && <span className="text-[10px] font-bold text-base-500 uppercase tracking-widest">{label}</span>}
          {showValue && <span className="text-[10px] font-bold text-base-300 tabular-nums">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div 
        className="w-full bg-base-950 rounded-full overflow-hidden border border-base-800/50"
        style={{ height: h }}
      >
        <motion.div
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1], // Standard "Elite" organic easing
          }}
          className="h-full relative overflow-hidden"
          style={{ backgroundColor: barColor }}
        >
          {/* Subtle Shimmer Overlay - Stripe/Linear Style */}
          <div className="absolute inset-0 z-10 opacity-15">
             <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
