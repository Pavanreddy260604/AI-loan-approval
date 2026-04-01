import { useState, useEffect } from 'react';

/**
 * useMediaQuery Hook
 * 
 * Custom hook that tracks the state of a media query.
 * Useful for handling responsive logic in JavaScript.
 * 
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean - Whether the media query matches
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Define listener
    const listener = () => setMatches(media.matches);

    // Watch for changes
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
    } else {
      // Compatibility for older browsers
      media.addListener(listener);
    }

    return () => {
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', listener);
      } else {
        // Compatibility for older browsers
        media.removeListener(listener);
      }
    };
  }, [query, matches]);

  return matches;
}
