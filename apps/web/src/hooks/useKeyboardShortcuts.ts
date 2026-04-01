import { useEffect, useCallback } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

interface ShortcutOptions {
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  global?: boolean; // Listener on window instead of scope
  preventDefault?: boolean;
}

/**
 * useKeyboardShortcuts Hook
 * 
 * A unified hook for registering global and contextual keyboard handlers.
 * Supports key sequences and modifier combinations for 'Platinum Tier' navigation.
 * 
 * **Validates: Requirement 11.10 (Task 10.3)**
 */
export function useKeyboardShortcut(
  key: string,
  onPress: KeyHandler,
  options: ShortcutOptions = {}
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (isInput && !options.global) return;

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const shiftMatch = options.shift ? e.shiftKey : true;
      const ctrlMatch = options.ctrl ? e.ctrlKey : true;
      const metaMatch = options.meta ? e.metaKey : true;
      const altMatch = options.alt ? e.altKey : true;

      if (keyMatch && shiftMatch && ctrlMatch && metaMatch && altMatch) {
        if (options.preventDefault) e.preventDefault();
        onPress(e);
      }
    },
    [key, onPress, options]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * useSequenceShortcut Hook
 * 
 * Handles key sequences such as 'G' then 'D' for navigation.
 */
export function useSequenceShortcut(
  sequence: string[],
  onMatch: () => void,
  timeout = 500
) {
  useEffect(() => {
    let currentPos = 0;
    let timer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      clearTimeout(timer);

      if (e.key.toLowerCase() === sequence[currentPos].toLowerCase()) {
        currentPos++;
        if (currentPos === sequence.length) {
          onMatch();
          currentPos = 0;
        } else {
          timer = setTimeout(() => {
            currentPos = 0;
          }, timeout);
        }
      } else {
        currentPos = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [sequence, onMatch, timeout]);
}
