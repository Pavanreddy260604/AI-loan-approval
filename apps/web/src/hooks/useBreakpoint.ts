import { useMediaQuery } from './useMediaQuery';
import { breakpoints } from '../lib/design-tokens';

/**
 * useBreakpoint Hook
 * 
 * High-level responsive hook using the design system's breakpoints.
 * Tracks current viewport boundaries for dynamic logic.
 */
export function useBreakpoint() {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2Xl = useMediaQuery(`(min-width: ${breakpoints.xl})`); // xl is used for 2xl in breakpoints? Wait, 2xl is 1536px in index.ts

  // Derived states
  const isMobile = !isLg;
  const isTablet = isMd && !isLg;
  const isDesktop = isLg;

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    // Return the active breakpoint string
    active: is2Xl ? '2xl' : isXl ? 'xl' : isLg ? 'lg' : isMd ? 'md' : isSm ? 'sm' : 'base'
  };
}
