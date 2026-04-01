import React from 'react';
import { motion } from 'framer-motion';
import { designTokens } from '../../../lib/design-tokens';

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Elite v2 Skeleton Loader
 * High-performance shimmering placeholder for loading states.
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangle',
  width,
  height,
  animate = true,
  className = '',
  style,
  ...props
}) => {
  const isCircle = variant === 'circle';
  const isText = variant === 'text';

  // Default dimensions based on variant if not provided
  const defaultHeight = isText ? '1em' : isCircle ? '40px' : '100px';
  const defaultWidth = isCircle ? '40px' : '100%';

  const baseStyles = {
    backgroundColor: designTokens.colors.base[900],
    borderRadius: isCircle ? designTokens.borderRadius.full : designTokens.borderRadius.md,
    width: width ?? defaultWidth,
    height: height ?? defaultHeight,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...style,
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      style={baseStyles}
      {...props}
    >
      {animate && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent)`,
          }}
        />
      )}
      {/* Visual content for screen readers */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};
