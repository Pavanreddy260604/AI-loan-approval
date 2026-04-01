import React, { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcut, useSequenceShortcut } from '../../hooks/useKeyboardShortcuts';
import { ShortcutOverlay } from '../../components/ui/molecules/ShortcutOverlay';

interface AccessibilityContextType {
  toggleShortcuts: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  // const { undo } = useUndo(); // If undo is available in undo-provider

  const toggleShortcuts = () => setShowShortcuts((prev) => !prev);

  // Global Shortcuts (Task 10.3)
  
  // '?' - Show Shortcut Overlay
  useKeyboardShortcut('?', () => toggleShortcuts(), { preventDefault: true });

  // '/' - Focus Search (Dispatched via event or similar, for now just a placeholder)
  useKeyboardShortcut('/', () => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) searchInput.focus();
  }, { preventDefault: true });

  // 'Ctrl/Cmd + Z' - Undo last action
  useKeyboardShortcut('z', (_e: KeyboardEvent) => {
    // Integrating with undo-provider (Legacy requirement 10.10)
    console.log('Undo triggered');
  }, { ctrl: true, meta: true, preventDefault: true });

  // Sequences (G + ...)
  useSequenceShortcut(['g', 'd'], () => navigate('/dashboard'));
  useSequenceShortcut(['g', 'a'], () => navigate('/admin'));
  useSequenceShortcut(['g', 'b'], () => navigate('/billing'));

  return (
    <AccessibilityContext.Provider value={{ toggleShortcuts }}>
      {children}
      <ShortcutOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}
