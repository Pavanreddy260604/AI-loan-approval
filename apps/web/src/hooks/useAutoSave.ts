import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  interval?: number;
  enabled?: boolean;
  onRestore?: (data: T) => void;
}

interface SavedState<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * useAutoSave - Auto-save data to localStorage at intervals
 * Also handles restoration of saved data on mount
 */
export function useAutoSave<T>(options: UseAutoSaveOptions<T>) {
  const { key, data, interval = 5000, enabled = true, onRestore } = options;
  const lastSavedRef = useRef<number>(0);
  const dataRef = useRef(data);

  // Keep ref up to date
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Restore on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = localStorage.getItem(`autosave:${key}`);
      if (saved) {
        const parsed: SavedState<T> = JSON.parse(saved);
        // Only restore if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          onRestore?.(parsed.data);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [key, enabled, onRestore]);

  // Auto-save at intervals
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      const now = Date.now();
      // Only save if data has changed (simple stringify comparison)
      const currentData = JSON.stringify(dataRef.current);
      
      try {
        const saved = localStorage.getItem(`autosave:${key}`);
        const savedData = saved ? JSON.parse(saved).data : null;
        
        if (JSON.stringify(savedData) !== currentData) {
          const state: SavedState<T> = {
            data: dataRef.current,
            timestamp: now,
            key,
          };
          localStorage.setItem(`autosave:${key}`, JSON.stringify(state));
          lastSavedRef.current = now;
        }
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    }, interval);

    return () => clearInterval(timer);
  }, [key, interval, enabled]);

  // Clear saved data
  const clearSaved = () => {
    localStorage.removeItem(`autosave:${key}`);
  };

  return { clearSaved, lastSaved: lastSavedRef.current };
}
