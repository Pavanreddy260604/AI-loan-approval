/**
 * Elite v2 Animation System
 * 
 * Centralized motion definitions using Framer Motion.
 * Standardizes physics (springs) and common transition variants.
 */

import { Variants } from 'framer-motion';

/**
 * Platinum Spring Physics
 * Moving away from linear CSS to organic, high-fidelity motion.
 */
export const transitions = {
  /** High energy, instant response (Button clicks, toggles) */
  stiff: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 1
  },
  /** Narrative, standard transitions (Modals, cards) */
  base: {
    type: 'spring',
    stiffness: 400,
    damping: 40,
    mass: 0.8
  },
  /** Soft, atmospheric entries (Page content, toasts) */
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1.2
  }
} as const;

/**
 * Standard Platform Variants
 */
export const variants: Record<string, Variants> = {
  /** Vertical content entry - reduced motion for less jarring page transitions */
  fadeInUp: {
    initial: { opacity: 0, y: 8, transition: { type: 'tween', duration: 0.15, ease: 'easeOut' } },
    animate: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.15, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { type: 'tween', duration: 0.15, ease: 'easeOut' } }
  },
  /** Component expansion or pop (Modals) */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: transitions.stiff
  },
  /** Side drawer movements */
  slideInRight: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: transitions.base
  }
};

/**
 * Reduced Motion Guard
 * Returns simplified transitions if the user prefers reduced motion.
 */
export const getSafeTransition = (type: keyof typeof transitions = 'base') => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { type: 'tween', duration: 0.2 };
  }
  return transitions[type];
};
