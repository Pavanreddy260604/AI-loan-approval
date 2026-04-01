'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
  /** Dot size (default: 1.5) */
  dotSize?: number;
  /** Spacing between dots (default: 20) */
  spacing?: number;
  /** Background color (default: '#050914') */
  backgroundColor?: string;
  /** Intensity of the orbs (0-1, default: 0.5) */
  intensity?: number;
};

export function GradientDots({
  dotSize = 1.5,
  spacing = 20,
  backgroundColor = '#050914',
  intensity = 0.5,
  className,
  ...props
}: GradientDotsProps) {
  // Generate 6 large, slow-moving orbs with viewport-relative paths
  const orbs = useMemo(() => [
    { color: '#4f46e5', size: '100vw', duration: 40, delay: 0, x: ['-20%', '20%', '-10%', '-20%'], y: ['-10%', '30%', '-20%', '-10%'], left: '10%', top: '20%' },
    { color: '#7c3aed', size: '110vw', duration: 50, delay: 2, x: ['20%', '-20%', '10%', '20%'], y: ['30%', '-30%', '10%', '30%'], left: '80%', top: '70%' },
    { color: '#2563eb', size: '120vw', duration: 60, delay: 5, x: ['-30%', '30%', '-10%', '-30%'], y: ['20%', '-20%', '30%', '20%'], left: '50%', top: '50%' },
    { color: '#0ea5e9', size: '90vw', duration: 45, delay: 1, x: ['30%', '-30%', '0%', '30%'], y: ['-20%', '20%', '-10%', '-20%'], left: '30%', top: '80%' },
    { color: '#6366f1', size: '100vw', duration: 55, delay: 3, x: ['-10%', '20%', '-30%', '-10%'], y: ['-30%', '30%', '10%', '-30%'], left: '70%', top: '10%' },
    { color: '#4338ca', size: '115vw', duration: 65, delay: 4, x: ['20%', '-10%', '30%', '20%'], y: ['10%', '-20%', '40%', '10%'], left: '90%', top: '40%' },
  ], []);

  return (
    <motion.div 
      className={`absolute inset-0 overflow-hidden ${className}`} 
      style={{ backgroundColor }}
      {...props}
    >
      {/* Layer 1: Floating Colored Orbs (Gaussian Multi-Layer) */}
      <div className="absolute inset-0 blur-[140px] opacity-70">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, ${orb.color}, transparent 80%)`,
              left: orb.left,
              top: orb.top,
              translateX: '-50%',
              translateY: '-50%',
              mixBlendMode: 'screen',
            }}
            animate={{
              x: orb.x,
              y: orb.y,
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{
              duration: orb.duration,
              delay: orb.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Layer 2: Perforated Dot Grid Overlay */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          backgroundImage: `radial-gradient(circle at center, transparent ${dotSize}px, ${backgroundColor} ${dotSize}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
        }}
      />
    </motion.div>
  );
}
