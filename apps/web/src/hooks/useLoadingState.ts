import { useState, useCallback } from 'react';

/**
 * useLoadingState - Track loading state for async operations
 * Prevents duplicate submissions and provides visual feedback
 */
export function useLoadingState() {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const isLoading = useCallback((id: string) => loadingIds.has(id), [loadingIds]);

  const execute = useCallback(async <T>(
    id: string,
    operation: () => Promise<T>
  ): Promise<T | undefined> => {
    if (loadingIds.has(id)) {
      return undefined;
    }

    setLoadingIds(prev => new Set(prev).add(id));

    try {
      const result = await operation();
      return result;
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [loadingIds]);

  return { isLoading, execute, loadingIds };
}
