/**
 * Accessibility Focus Trap Utility
 * 
 * Traps keyboard focus within a container element for Modals and Drawers.
 * Handles cyclical tabbing (Shift+Tab from first -> last, Tab from last -> first).
 */

export function createFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Initial focus
  if (firstElement) firstElement.focus();

  return {
    destroy: () => {
      container.removeEventListener('keydown', handleKeyDown);
    }
  };
}

/**
 * React Hook for Focus Trapping
 */
import { useEffect, RefObject } from 'react';

export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const trap = createFocusTrap(ref.current);
    return () => trap.destroy();
  }, [active, ref]);
}
