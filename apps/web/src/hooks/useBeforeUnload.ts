import { useEffect } from 'react';

/**
 * useBeforeUnload - Warn users about unsaved changes when navigating away
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param message - Optional custom message (note: modern browsers show generic message)
 */
export function useBeforeUnload(hasUnsavedChanges: boolean, message?: string) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Standard pattern for beforeunload
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = message || '';
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
}
